import type { FieldDefinition } from '@/types';
import { delay } from './delay';

export interface CreateFieldInput {
  orgId: string | null;
  key: string;
  label: string;
  type: FieldDefinition['type'];
  options?: string[];
  validation?: FieldDefinition['validation'];
}

export interface FieldsRepository {
  list(orgId?: string | null): Promise<FieldDefinition[]>;
  create(input: CreateFieldInput): Promise<FieldDefinition>;
  seed(fields: FieldDefinition[]): Promise<void>;
  reset(): Promise<void>;
}

let store: FieldDefinition[] = [];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createInMemoryFieldsRepository(
  initial: FieldDefinition[] = [],
): FieldsRepository {
  store = clone(initial);
  return {
    async list(orgId) {
      await delay();
      const all = clone(store);
      if (orgId === undefined) return all;
      return all.filter((f) => f.orgId === null || f.orgId === orgId);
    },
    async create(input) {
      await delay();
      const field: FieldDefinition = {
        id: `field_${input.key}_${Date.now()}`,
        orgId: input.orgId,
        key: input.key,
        label: input.label,
        type: input.type,
        options: input.options,
        validation: input.validation,
      };
      store = [...store, field];
      return clone(field);
    },
    async seed(fields) {
      await delay();
      store = clone(fields);
    },
    async reset() {
      await delay();
      store = [];
    },
  };
}
