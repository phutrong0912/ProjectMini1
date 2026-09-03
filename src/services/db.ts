import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { InspectionData, InspectionDraft, QueuedAudit, SyncStatus } from '../types/audit';

const DB_NAME = 'VKU_FACILITY_AUDIT_DB';
const DB_VERSION = 1;

interface VKUAuditDBSchema extends DBSchema {
  active_draft: {
    key: string;
    value: InspectionDraft;
  };
  audit_queue: {
    key: string;
    value: QueuedAudit;
    indexes: {
      'by-syncStatus': SyncStatus;
      'by-createdAt': string;
    };
  };
  synced_audits: {
    key: string;
    value: QueuedAudit;
    indexes: {
      'by-createdAt': string;
    };
  };
  app_settings: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<VKUAuditDBSchema>> | null = null;

export async function getDb(): Promise<IDBPDatabase<VKUAuditDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<VKUAuditDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`[IndexedDB] Upgrading schema from ${oldVersion} to ${newVersion}`);
        
        // Draft store
        if (!db.objectStoreNames.contains('active_draft')) {
          db.createObjectStore('active_draft');
        }

        // Queue store
        if (!db.objectStoreNames.contains('audit_queue')) {
          const queueStore = db.createObjectStore('audit_queue', { keyPath: 'id' });
          queueStore.createIndex('by-syncStatus', 'syncStatus');
          queueStore.createIndex('by-createdAt', 'createdAt');
        }

        // Synced audits history store
        if (!db.objectStoreNames.contains('synced_audits')) {
          const syncedStore = db.createObjectStore('synced_audits', { keyPath: 'id' });
          syncedStore.createIndex('by-createdAt', 'createdAt');
        }

        // App settings
        if (!db.objectStoreNames.contains('app_settings')) {
          db.createObjectStore('app_settings');
        }
      },
    });
  }
  return dbPromise;
}

// ----------------------------------------------------
// Draft Management (Real-time IndexedDB persistence)
// ----------------------------------------------------

const DRAFT_KEY = 'current_draft';

export async function saveDraft(draft: InspectionDraft): Promise<void> {
  try {
    const db = await getDb();
    await db.put('active_draft', {
      ...draft,
      lastSavedAt: Date.now(),
    }, DRAFT_KEY);
  } catch (err) {
    console.error('[IndexedDB] Error saving draft:', err);
  }
}

export async function getDraft(): Promise<InspectionDraft | undefined> {
  try {
    const db = await getDb();
    return await db.get('active_draft', DRAFT_KEY);
  } catch (err) {
    console.error('[IndexedDB] Error getting draft:', err);
    return undefined;
  }
}

export async function clearDraft(): Promise<void> {
  try {
    const db = await getDb();
    await db.delete('active_draft', DRAFT_KEY);
  } catch (err) {
    console.error('[IndexedDB] Error clearing draft:', err);
  }
}

// ----------------------------------------------------
// Offline Queue Management (FIFO Sync Queue)
// ----------------------------------------------------

export async function enqueueAudit(data: InspectionData): Promise<QueuedAudit> {
  const db = await getDb();
  const queuedAudit: QueuedAudit = {
    id: crypto.randomUUID ? crypto.randomUUID() : `vku-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    syncStatus: 'PENDING_SYNC',
    retryCount: 0,
    data,
  };

  await db.put('audit_queue', queuedAudit);
  console.log('[IndexedDB] Audit enqueued safely with ID:', queuedAudit.id);
  return queuedAudit;
}

export async function getPendingAudits(): Promise<QueuedAudit[]> {
  try {
    const db = await getDb();
    const all = await db.getAll('audit_queue');
    return all.filter((item) => item.syncStatus === 'PENDING_SYNC' || item.syncStatus === 'FAILED');
  } catch (err) {
    console.error('[IndexedDB] Error reading pending queue:', err);
    return [];
  }
}

export async function getAllQueuedAudits(): Promise<QueuedAudit[]> {
  try {
    const db = await getDb();
    return await db.getAll('audit_queue');
  } catch (err) {
    console.error('[IndexedDB] Error reading queue:', err);
    return [];
  }
}

export async function updateAuditStatus(
  id: string,
  syncStatus: SyncStatus,
  errorLog?: string
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('audit_queue', 'readwrite');
  const store = tx.objectStore('audit_queue');
  const record = await store.get(id);

  if (record) {
    record.syncStatus = syncStatus;
    record.lastAttemptAt = new Date().toISOString();
    if (syncStatus === 'FAILED') {
      record.retryCount += 1;
      record.errorLog = errorLog || 'Sync failed due to network or server error.';
    } else if (syncStatus === 'SYNCED') {
      record.errorLog = undefined;
    }
    await store.put(record);
  }
  await tx.done;
}

export async function markAuditSynced(id: string): Promise<void> {
  const db = await getDb();
  const item = await db.get('audit_queue', id);
  if (item) {
    item.syncStatus = 'SYNCED';
    item.lastAttemptAt = new Date().toISOString();
    
    // Save to synced_audits history
    await db.put('synced_audits', item);
    // Remove or keep marked in queue
    await db.put('audit_queue', item);
  }
}

export async function deleteQueuedAudit(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('audit_queue', id);
}

export async function getAllSyncedAudits(): Promise<QueuedAudit[]> {
  try {
    const db = await getDb();
    return await db.getAll('synced_audits');
  } catch (err) {
    console.error('[IndexedDB] Error getting synced history:', err);
    return [];
  }
}

// ----------------------------------------------------
// App Settings & Preferences
// ----------------------------------------------------

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDb();
    const val = await db.get('app_settings', key);
    return val !== undefined ? val : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDb();
    await db.put('app_settings', value, key);
  } catch (err) {
    console.error('[IndexedDB] Error setting preference:', err);
  }
}
