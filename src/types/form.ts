import type { FieldOverride, OwnField, ResolvedField } from './field';

export type ElementType =
  'logo' | 'heading' | 'richtext' | 'divider' | 'section';

export interface LayoutElement {
  id: string;
  type: ElementType;
  props: Record<string, unknown>;
  /** `null` = end of form, `START_ANCHOR` ('__start__') = top */
  insertAfter: string | null;
}

export interface FormSettings {
  logoUrl?: string;
  companyName?: string;
  title?: string;
  about?: string;
  submitLabel?: string;
  successMessage?: string;
}

export interface FormContent {
  settings: Partial<FormSettings>;
  ownFields: OwnField[];
  elements: LayoutElement[];
  overrides: Record<string, FieldOverride>;
  locks: string[];
}

export type VersionStatus = 'draft' | 'published';

export type ResolvedItem =
  | { kind: 'field'; field: ResolvedField }
  | {
      kind: 'element';
      element: LayoutElement;
      origin: 'inherited' | 'own';
      sourceFormId: string;
    };

export interface ResolvedForm {
  formId: string;
  settings: FormSettings;
  items: ResolvedItem[];
}

export interface Form {
  id: string;
  orgId: string;
  parentFormId: string | null;
  name: string;
  slug: string;
  publishedVersionId: string | null;
}

export interface FormVersion {
  id: string;
  formId: string;
  versionNumber: number;
  status: VersionStatus;
  content: FormContent;
  resolvedSnapshot: ResolvedForm | null;
  publishedAt: Date | string | null;
}

/** Part 2 in-memory/store form record. */
export interface FormRecord extends Form {
  versions: FormVersion[];
  /** Current editable draft content (unpublished changes). */
  draft: FormContent | null;
  createdAt: string;
  updatedAt: string;
}
