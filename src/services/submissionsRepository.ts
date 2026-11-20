import type { Submission, SyncStatus } from '@/types';
import { delay } from './delay';

export interface CreateSubmissionInput {
  orgId: string;
  formId: string;
  formVersionId: string;
  answers: Record<string, unknown>;
  ghlSyncStatus?: SyncStatus;
  ghlContactId?: string | null;
}

export interface SubmissionsRepository {
  list(): Promise<Submission[]>;
  listByForm(formId: string): Promise<Submission[]>;
  create(input: CreateSubmissionInput): Promise<Submission>;
  updateSyncStatus(id: string, status: SyncStatus): Promise<Submission | null>;
  seed(submissions: Submission[]): Promise<void>;
  reset(): Promise<void>;
}

let store: Submission[] = [];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createInMemorySubmissionsRepository(
  initial: Submission[] = [],
): SubmissionsRepository {
  store = clone(initial);
  return {
    async list() {
      await delay();
      return clone(store);
    },
    async listByForm(formId) {
      await delay();
      return clone(store.filter((s) => s.formId === formId));
    },
    async create(input) {
      await delay();
      const submission: Submission = {
        id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        orgId: input.orgId,
        formId: input.formId,
        formVersionId: input.formVersionId,
        answers: clone(input.answers),
        ghlSyncStatus: input.ghlSyncStatus ?? 'pending',
        ghlContactId: input.ghlContactId ?? null,
        createdAt: new Date().toISOString(),
      };
      store = [submission, ...store];
      return clone(submission);
    },
    async updateSyncStatus(id, status) {
      await delay();
      let updated: Submission | null = null;
      store = store.map((s) => {
        if (s.id !== id) return s;
        updated = { ...s, ghlSyncStatus: status };
        return updated;
      });
      return clone(updated);
    },
    async seed(submissions) {
      await delay();
      store = clone(submissions);
    },
    async reset() {
      await delay();
      store = [];
    },
  };
}
