export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'currency'
  | 'date'
  | 'time'
  | 'datetime'
  | 'daterange'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'checkbox_group'
  | 'toggle'
  | 'rating'
  | 'slider'
  | 'likert'
  | 'file'
  | 'file_multiple'
  | 'signature'
  | 'address_group'
  | 'name_group'
  | 'repeater'
  | 'hidden';

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  maxFileSizeMb?: number;
  allowedFileTypes?: string[];
}

export interface VisibilityCondition {
  fieldKey: string;
  operator: 'equals' | 'not_equals';
  value: string;
}

export interface FieldDefinition {
  id: string;
  orgId: string | null;
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  validation?: FieldValidation;
}

export interface OwnField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  optionLayout?: 'vertical' | 'horizontal';
  /** Validation rules used by schema building and renderer constraints. */
  validation?: FieldValidation;
  required: boolean;
  hidden: boolean;
  /** `null` = end of form, `START_ANCHOR` ('__start__') = top */
  insertAfter: string | null;
  visibilityCondition?: VisibilityCondition;
}

export interface FieldOverride {
  label?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  hidden?: boolean;
  optionLayout?: 'vertical' | 'horizontal';
  visibilityCondition?: VisibilityCondition | null;
}

export interface ResolvedField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  optionLayout?: 'vertical' | 'horizontal';
  validation?: FieldValidation;
  required: boolean;
  hidden: boolean;
  origin: 'inherited' | 'own';
  sourceFormId: string;
  locked: boolean;
  lockedByFormId?: string;
  visibilityCondition?: VisibilityCondition;
}
