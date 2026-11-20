export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface Submission {
  id: string;
  orgId: string;
  formId: string;
  formVersionId: string;
  answers: Record<string, unknown>;
  ghlSyncStatus: SyncStatus;
  ghlContactId: string | null;
  createdAt: Date | string;
}
