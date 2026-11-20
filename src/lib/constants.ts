// Application constants

export const APP_NAME = 'FormFamily';

export const MAX_FAMILY_DEPTH = 5;

export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  forms: '/forms',
  formsNew: '/forms/new',
  formEdit: (formId: string) => `/forms/${formId}/edit`,
  formSubmissions: (formId: string) => `/forms/${formId}/submissions`,
  families: '/families',
  submissions: '/submissions',
  fieldLibrary: '/field-library',
  ghlIntegration: '/integrations/ghl',
  settings: '/settings',
  publicForm: (slug: string) => `/${slug}`, // /f/[slug]/page.tsx
} as const;

export const FIELD_TYPES = [
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'currency',
  'date',
  'select',
  'radio',
  'checkbox',
  'file',
] as const;

export const ELEMENT_TYPES = [
  'logo',
  'heading',
  'richtext',
  'divider',
  'section',
] as const;

export const VERSION_STATUSES = ['draft', 'published'] as const;

export const SYNC_STATUSES = ['synced', 'pending', 'failed'] as const;

export const USER_ROLES = ['owner', 'admin', 'editor'] as const;

export const AUTH_TYPES = ['token', 'oauth'] as const;

export const GHLMAPPING_STATUSES = ['active', 'inactive'] as const;

export const API_ENDPOINTS = {
  health: '/api/health',
  forms: '/api/forms',
  form: (id: string) => `/api/forms/${id}`,
  formPublish: (id: string) => `/api/forms/${id}/publish`,
  formDetach: (id: string) => `/api/forms/${id}/detach`,
  fields: '/api/fields',
  publicFormSubmit: (slug: string) => `/api/public/forms/${slug}/submit`,
  ghlConnect: '/api/ghl/connect',
  ghlFields: '/api/ghl/fields',
  ghlMappings: '/api/ghl/mappings',
} as const;

export const FILE_VALIDATION = {
  maxSizeMb: 10,
  allowedTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'jpeg', 'gif'],
} as const;

export const PLACEHOLDER_IMAGES = {
  logo: '/placeholder-logo.png',
  avatar: '/placeholder-avatar.png',
} as const;
