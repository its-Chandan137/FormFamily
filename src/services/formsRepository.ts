import type {
  FormContent,
  FormRecord,
  FormVersion,
  ResolvedForm,
} from '@/types';
import { delay } from './delay';

function getAncestorIds(forms: FormRecord[], formId: string): string[] {
  const out: string[] = [];
  let current = forms.find((f) => f.id === formId);
  while (current?.parentFormId) {
    const parent = forms.find((f) => f.id === current!.parentFormId);
    if (!parent || out.includes(parent.id)) break;
    out.push(parent.id);
    current = parent;
  }
  return out;
}

export interface CreateFormInput {
  name: string;
  slug: string;
  parentFormId?: string | null;
  content?: FormContent;
  /** If true, start from hiring template defaults (handled by caller/seed helper). */
}

export interface DeleteFormOptions {
  /** When form has children: 'standalone' or 'reparent' */
  childrenStrategy?: 'standalone' | 'reparent';
  /** Keep fields inherited from deleted form as children's own fields */
  keepInheritedAsOwn?: boolean;
}

export interface FormsRepository {
  list(): Promise<FormRecord[]>;
  getById(id: string): Promise<FormRecord | null>;
  getBySlug(slug: string): Promise<FormRecord | null>;
  create(input: CreateFormInput): Promise<FormRecord>;
  updateDraft(formId: string, draft: FormContent): Promise<FormRecord>;
  save(form: FormRecord): Promise<FormRecord>;
  saveMany(forms: FormRecord[]): Promise<FormRecord[]>;
  publish(
    formId: string,
    options?: { resolvedSnapshot?: ResolvedForm },
  ): Promise<FormRecord>;
  detach(formId: string): Promise<FormRecord>;
  delete(formId: string, options?: DeleteFormOptions): Promise<void>;
  reset(): Promise<void>;
  /** Replace all forms (used by persistence/reset). */
  seed(forms: FormRecord[]): Promise<void>;
  /** Debug helper: when enabled, the next updateDraft call fails once. */
  setDebugFailNextDraftSave(enabled: boolean): void;
}

let store: FormRecord[] = [];
let failNextDraftSave = false;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function withDelay<T>(fn: () => T): Promise<T> {
  await delay();
  return fn();
}

export function createInMemoryFormsRepository(
  initial: FormRecord[] = [],
): FormsRepository {
  store = clone(initial);

  return {
    setDebugFailNextDraftSave(enabled: boolean) {
      failNextDraftSave = enabled;
    },
    async list() {
      return withDelay(() => clone(store));
    },
    async getById(id) {
      return withDelay(() => clone(store.find((f) => f.id === id) ?? null));
    },
    async getBySlug(slug) {
      return withDelay(() => clone(store.find((f) => f.slug === slug) ?? null));
    },
    async create(input) {
      return withDelay(() => {
        const now = new Date().toISOString();
        const ancestorVersionPins: Record<string, string> = {};
        if (input.parentFormId) {
          const ancestorIds = [
            input.parentFormId,
            ...getAncestorIds(store, input.parentFormId),
          ];
          for (const ancestorId of ancestorIds) {
            const ancestor = store.find((f) => f.id === ancestorId);
            if (ancestor?.publishedVersionId) {
              ancestorVersionPins[ancestorId] = ancestor.publishedVersionId;
            }
          }
        }
        const form: FormRecord = {
          id: input.slug
            ? `form_${input.slug.replace(/[^a-z0-9]+/gi, '_')}_${Date.now()}`
            : `form_${Date.now()}`,
          orgId: 'org_1',
          parentFormId: input.parentFormId ?? null,
          name: input.name,
          slug: input.slug,
          publishedVersionId: null,
          versions: [],
          draft: input.content ?? {
            settings: {},
            ownFields: [],
            elements: [],
            overrides: {},
            locks: [],
          },
          ...(Object.keys(ancestorVersionPins).length > 0
            ? { ancestorVersionPins }
            : {}),
          createdAt: now,
          updatedAt: now,
        };
        store = [...store, form];
        return clone(form);
      });
    },
    async updateDraft(formId, draft) {
      return withDelay(() => {
        if (failNextDraftSave) {
          failNextDraftSave = false;
          throw new Error('Simulated autosave failure (debug flag)');
        }
        const idx = store.findIndex((f) => f.id === formId);
        if (idx === -1) throw new Error('Form not found');
        const updated: FormRecord = {
          ...store[idx],
          draft: clone(draft),
          updatedAt: new Date().toISOString(),
        };
        store = store.map((f) => (f.id === formId ? updated : f));
        return clone(updated);
      });
    },
    async save(form) {
      return withDelay(() => {
        const idx = store.findIndex((f) => f.id === form.id);
        if (idx === -1) store = [...store, clone(form)];
        else store = store.map((f) => (f.id === form.id ? clone(form) : f));
        return clone(form);
      });
    },
    async saveMany(forms) {
      return withDelay(() => {
        const map = new Map(store.map((f) => [f.id, f]));
        for (const form of forms) map.set(form.id, clone(form));
        store = Array.from(map.values());
        return clone(forms);
      });
    },
    async publish(formId, options) {
      return withDelay(() => {
        const idx = store.findIndex((f) => f.id === formId);
        if (idx === -1) throw new Error('Form not found');
        const form = store[idx];
        const content = form.draft ?? form.versions.at(-1)?.content;
        if (!content) throw new Error('Nothing to publish');
        const versionNumber = (form.versions.at(-1)?.versionNumber ?? 0) + 1;
        const version: FormVersion = {
          id: `ver_${formId}_${versionNumber}`,
          formId,
          versionNumber,
          status: 'published',
          content: clone(content),
          resolvedSnapshot: options?.resolvedSnapshot
            ? clone(options.resolvedSnapshot)
            : null,
          publishedAt: new Date().toISOString(),
        };
        const updated: FormRecord = {
          ...form,
          versions: [...form.versions, version],
          publishedVersionId: version.id,
          draft: null,
          updatedAt: new Date().toISOString(),
        };
        store = store.map((f) => (f.id === formId ? updated : f));
        return clone(updated);
      });
    },
    async detach(formId) {
      return withDelay(() => {
        const idx = store.findIndex((f) => f.id === formId);
        if (idx === -1) throw new Error('Form not found');
        const updated: FormRecord = {
          ...store[idx],
          parentFormId: null,
          updatedAt: new Date().toISOString(),
        };
        store = store.map((f) => (f.id === formId ? updated : f));
        return clone(updated);
      });
    },
    async delete(formId, _options) {
      await withDelay(() => {
        store = store.filter((f) => f.id !== formId);
      });
    },
    async reset() {
      await withDelay(() => {
        store = [];
      });
    },
    async seed(forms) {
      await withDelay(() => {
        store = clone(forms);
      });
    },
  };
}
