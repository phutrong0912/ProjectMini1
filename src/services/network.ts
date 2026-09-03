import { Network, ConnectionStatus } from '@capacitor/network';
import { getSetting, setSetting } from './db';

export type NetworkListener = (isOnline: boolean, statusDetail: string) => void;

class NetworkService {
  private isOnlineState: boolean = navigator.onLine;
  private isSimulatedBasementMode: boolean = false;
  private listeners: Set<NetworkListener> = new Set();
  private isCapacitorAvailable: boolean = false;

  constructor() {
    this.init();
  }

  private async init() {
    // Load persisted simulated offline state
    this.isSimulatedBasementMode = await getSetting('vku_simulated_offline', false);

    // Check if running in Capacitor Native
    try {
      const status = await Network.getStatus();
      this.isCapacitorAvailable = true;
      this.isOnlineState = status.connected;

      Network.addListener('networkStatusChange', (nativeStatus: ConnectionStatus) => {
        console.log('[Network] Native status change:', nativeStatus);
        this.updateState(nativeStatus.connected, nativeStatus.connectionType);
      });
    } catch {
      // Running on standard browser / PWA
      this.isCapacitorAvailable = false;
      this.isOnlineState = navigator.onLine;
    }

    // Web listeners
    window.addEventListener('online', () => {
      console.log('[Network] Web online event detected');
      this.updateState(true, 'wifi');
    });

    window.addEventListener('offline', () => {
      console.log('[Network] Web offline event detected');
      this.updateState(false, 'none');
    });
  }

  private updateState(realOnline: boolean, connectionType: string = 'unknown') {
    this.isOnlineState = realOnline;
    this.notify();
  }

  private notify() {
    const effectiveOnline = this.isEffectiveOnline();
    const detail = this.isSimulatedBasementMode
      ? 'Basement Simulated Offline (No RF Signal)'
      : effectiveOnline
      ? 'Online (VKU Connected)'
      : 'Offline (No Connection)';

    for (const listener of this.listeners) {
      listener(effectiveOnline, detail);
    }
  }

  public isEffectiveOnline(): boolean {
    if (this.isSimulatedBasementMode) {
      return false; // Force offline for testing basement conditions
    }
    return this.isOnlineState;
  }

  public getSimulatedBasementMode(): boolean {
    return this.isSimulatedBasementMode;
  }

  public async setSimulatedBasementMode(enabled: boolean): Promise<void> {
    this.isSimulatedBasementMode = enabled;
    await setSetting('vku_simulated_offline', enabled);
    console.log('[Network] Simulated basement offline mode set to:', enabled);
    this.notify();
  }

  public addListener(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    // Immediate callback with current state
    listener(
      this.isEffectiveOnline(),
      this.isSimulatedBasementMode ? 'Basement Simulated Offline' : (this.isOnlineState ? 'Online' : 'Offline')
    );

    return () => {
      this.listeners.delete(listener);
    };
  }

  public async checkCurrentStatus(): Promise<boolean> {
    if (this.isSimulatedBasementMode) return false;
    if (this.isCapacitorAvailable) {
      try {
        const status = await Network.getStatus();
        return status.connected;
      } catch {
        return navigator.onLine;
      }
    }
    return navigator.onLine;
  }
}

export const networkService = new NetworkService();
