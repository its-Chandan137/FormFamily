export * from './organizations';
export * from './fields';
export * from './forms';
export * from './submissions';
export * from './ghl';

import { mockFields } from './fields';
import { mockForms } from './forms';
import { mockSubmissions } from './submissions';
import { mockGhlConnection, mockGhlCustomFields, mockGhlMappings } from './ghl';

export function getInitialDemoState() {
  return {
    fields: mockFields,
    forms: mockForms,
    submissions: mockSubmissions,
    ghl: {
      connection: mockGhlConnection,
      customFields: mockGhlCustomFields,
      mappings: mockGhlMappings,
    },
  };
}
