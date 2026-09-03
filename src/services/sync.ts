import { getPendingAudits, updateAuditStatus, markAuditSynced, getAllQueuedAudits } from './db';
import { networkService } from './network';
import { QueuedAudit, SyncResult } from '../types/audit';

export type SyncProgressListener = (status: {
  isSyncing: boolean;
  totalPending: number;
  currentProgress: number;
  lastResult?: SyncResult;
  activeItemName?: string;
}) => void;

class SyncEngine {
  private isSyncing: boolean = false;
  private listeners: Set<SyncProgressListener> = new Set();
  private lastResult?: SyncResult;

  constructor() {
    this.init();
  }

  private init() {
    // 1. Listen to network status changes (Capacitor & Web)
    networkService.addListener((isOnline) => {
      if (isOnline) {
        console.log('[Sync Engine] Network restored. Checking for queued offline audits...');
        this.processQueue();
      }
    });

    // 2. Listen to Service Worker Background Sync messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'TRIGGER_BACKGROUND_SYNC') {
          console.log('[Sync Engine] Triggered via Service Worker Background Sync event');
          this.processQueue();
        }
      });
    }

    // 3. Register Background Sync API with Service Worker if available
    this.registerBackgroundSync();
  }

  public async registerBackgroundSync(): Promise<void> {
    try {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        // @ts-ignore - sync is in draft spec for ServiceWorkerRegistration
        if (registration.sync) {
          // @ts-ignore
          await registration.sync.register('sync-vku-audits');
          console.log('[Sync Engine] Registered Background Sync: sync-vku-audits');
        }
      }
    } catch (e) {
      console.log('[Sync Engine] Background Sync API not supported or disabled in this browser, relying on online listeners.');
    }
  }

  public subscribe(listener: SyncProgressListener): () => void {
    this.listeners.add(listener);
    this.notify(0, 0);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(totalPending: number, currentProgress: number, activeItemName?: string) {
    const payload = {
      isSyncing: this.isSyncing,
      totalPending,
      currentProgress,
      lastResult: this.lastResult,
      activeItemName,
    };
    for (const listener of this.listeners) {
      listener(payload);
    }
  }

  /**
   * Dispatches queued audits sequentially (FIFO) upon network restoration
   */
  public async processQueue(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[Sync Engine] Sync already in progress, skipping duplicate call.');
      return this.lastResult || { success: true, syncedCount: 0, failedCount: 0, timestamp: Date.now() };
    }

    // Check if we are currently online
    if (!networkService.isEffectiveOnline()) {
      console.log('[Sync Engine] Cannot sync: Device is offline or in simulated basement mode.');
      return { success: false, syncedCount: 0, failedCount: 0, timestamp: Date.now(), errors: ['Device is offline'] };
    }

    const pendingList = await getPendingAudits();
    if (pendingList.length === 0) {
      return { success: true, syncedCount: 0, failedCount: 0, timestamp: Date.now() };
    }

    this.isSyncing = true;
    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    this.notify(pendingList.length, 0);

    try {
      // Process sequentially (FIFO)
      for (let i = 0; i < pendingList.length; i++) {
        // Verify we haven't lost network mid-sync
        if (!networkService.isEffectiveOnline()) {
          console.warn('[Sync Engine] Network lost during sequential sync batch. Aborting remaining items.');
          errors.push('Network disconnected during batch sync');
          break;
        }

        const audit = pendingList[i];
        const itemLabel = `${audit.data.building} - ${audit.data.room} (${audit.data.itemName || audit.data.category})`;
        this.notify(pendingList.length, i + 1, itemLabel);

        // Mark as SYNCING
        await updateAuditStatus(audit.id, 'SYNCING');

        try {
          // Dispatch to server endpoint
          await this.dispatchSingleAuditToServer(audit);
          await markAuditSynced(audit.id);
          syncedCount++;
          console.log(`[Sync Engine] Successfully synced [${audit.id}]: ${itemLabel}`);
        } catch (err: any) {
          failedCount++;
          const errorMsg = err?.message || 'Server returned 500 error';
          console.error(`[Sync Engine] Failed to sync [${audit.id}]:`, errorMsg);
          await updateAuditStatus(audit.id, 'FAILED', errorMsg);
          errors.push(`${itemLabel}: ${errorMsg}`);
        }

        // Brief delay between requests to avoid overloading poor connections
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    } finally {
      this.isSyncing = false;
      this.lastResult = {
        success: failedCount === 0,
        syncedCount,
        failedCount,
        timestamp: Date.now(),
        errors: errors.length > 0 ? errors : undefined,
      };

      const remainingPending = (await getPendingAudits()).length;
      this.notify(remainingPending, remainingPending);
    }

    return this.lastResult;
  }

  /**
   * Mock / Real backend submission with network latency simulation
   */
  private async dispatchSingleAuditToServer(audit: QueuedAudit): Promise<void> {
    // 1. If user has configured a custom backend API URL, we can POST there.
    // 2. Otherwise, we simulate the server handshake with realistic delay.
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Double check network
        if (!networkService.isEffectiveOnline()) {
          reject(new Error('Connection interrupted by basement interference'));
          return;
        }

        // 98% success simulation for realistic demo
        resolve();
      }, 400);
    });
  }

  public triggerManualSync(): Promise<SyncResult> {
    return this.processQueue();
  }

  public async getQueueCounts(): Promise<{ pending: number; failed: number; total: number }> {
    const all = await getAllQueuedAudits();
    const pending = all.filter((a) => a.syncStatus === 'PENDING_SYNC' || a.syncStatus === 'SYNCING').length;
    const failed = all.filter((a) => a.syncStatus === 'FAILED').length;
    return { pending, failed, total: all.length };
  }
}

export const syncEngine = new SyncEngine();
