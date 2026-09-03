export type EquipmentCategory = 
  | 'Hardware' 
  | 'Projector' 
  | 'AC' 
  | 'Electrical' 
  | 'Furniture';

export type DefectUrgency = 'low' | 'medium' | 'high' | 'critical';

export type SyncStatus = 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface AuditPhoto {
  id: string;
  dataUrl: string; // Base64 data URL
  timestamp: number;
  label?: string;
}

export interface InspectionData {
  // Step 1: Location
  building: string;
  floor: string;
  room: string;

  // Step 2: Equipment
  category: EquipmentCategory;
  itemName: string;
  assetTag: string;
  serialNumber: string;

  // Step 3: Assessment
  rating: number; // 1 to 5
  defectTags: string[];
  urgency: DefectUrgency;
  defectNotes: string;

  // Step 4: Evidence
  photos: AuditPhoto[];

  // Step 5: Sign-off & Metadata
  inspectorName: string;
  inspectorId: string;
  gpsCoords?: { latitude: number; longitude: number; accuracy?: number };
  completedAt?: string;
}

export interface InspectionDraft extends InspectionData {
  currentStep: number;
  lastSavedAt: number;
}

export interface QueuedAudit {
  id: string; // UUID
  createdAt: string; // ISO 8601
  syncStatus: SyncStatus;
  retryCount: number;
  lastAttemptAt?: string;
  errorLog?: string;
  data: InspectionData;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  timestamp: number;
  errors?: string[];
}
