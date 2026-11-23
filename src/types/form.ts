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
  /** Per-form layout only; not inherited by children. */
  layoutColumns?: 1 | 2 | 3;
}

export interface FormContent {
  settings: Partial<FormSettings>;
  ownFields: OwnField[];
  elements: LayoutElement[];
  overrides: Record<string, FieldOverride>;
  locks: string[];
  /**
   * Child position overrides for inherited items (field key or element id).
   * When present, the inherited item is repositioned at this anchor during
   * resolution for this form level. Absent = keep inherited position.
   */
  positionOverrides?: Record<string, string | null>;
  /** Child prop overrides for inherited layout elements, keyed by element id. */
  elementOverrides?: Record<string, { props?: Record<string, unknown> }>;
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
  /**
   * Pinned ancestor published versions for stable inheritance resolution.
   * Existing children keep their pins; new children get pins at creation time.
   */
  ancestorVersionPins?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
