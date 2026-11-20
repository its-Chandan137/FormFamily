export type GhlAuthType = 'token' | 'oauth';

export interface GhlConnection {
  id: string;
  orgId: string;
  locationId: string;
  authType: GhlAuthType;
  lastSyncedAt: Date | string | null;
}

export interface GhlFieldMapping {
  id: string;
  orgId: string;
  fieldKey: string;
  ghlCustomFieldId: string;
  status: 'active' | 'inactive';
}
