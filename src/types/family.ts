import type { VersionStatus } from './form';

export interface FamilyNode {
  formId: string;
  name: string;
  status: VersionStatus;
  parentFormId: string | null;
  childCount: number;
  inheritedFieldCount: number;
}
