export * from './delay';
export * from './formsRepository';
export * from './fieldsRepository';
export * from './submissionsRepository';
export * from './ghlRepository';

import { createInMemoryFormsRepository } from './formsRepository';
import { createInMemoryFieldsRepository } from './fieldsRepository';
import { createInMemorySubmissionsRepository } from './submissionsRepository';
import { createInMemoryGhlRepository } from './ghlRepository';

export const formsRepository = createInMemoryFormsRepository();
export const fieldsRepository = createInMemoryFieldsRepository();
export const submissionsRepository = createInMemorySubmissionsRepository();
export const ghlRepository = createInMemoryGhlRepository();
