export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file';

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  maxFileSizeMb?: number;
  allowedFileTypes?: string[];
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
  required: boolean;
  hidden: boolean;
  insertAfter: string | null;
}

export interface FieldOverride {
  label?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  hidden?: boolean;
}

export interface ResolvedField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  required: boolean;
  hidden: boolean;
  origin: 'inherited' | 'own';
  sourceFormId: string;
  locked: boolean;
  lockedByFormId?: string;
}
