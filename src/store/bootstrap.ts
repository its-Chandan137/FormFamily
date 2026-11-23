import { createAsyncThunk } from '@reduxjs/toolkit';
import { getInitialDemoState } from '@/data/mock';
import {
  clearPersistedState,
  loadPersistedState,
  savePersistedState,
} from '@/lib/persistence';
import {
  fieldsRepository,
  formsRepository,
  ghlRepository,
  submissionsRepository,
} from '@/services';
import type { AppDispatch, RootState } from './index';
import { setFields } from './slices/fieldsSlice';
import { setForms } from './slices/formsSlice';
import { setGhlState } from './slices/ghlSlice';
import { setSubmissions } from './slices/submissionsSlice';

export interface PersistedDemoData {
  forms: RootState['forms']['items'];
  fields: RootState['fields']['items'];
  submissions: RootState['submissions']['items'];
  ghl: {
    connection: RootState['ghl']['connection'];
    customFields: RootState['ghl']['customFields'];
    mappings: RootState['ghl']['mappings'];
  };
}

function normalizeFormPins(forms: PersistedDemoData['forms']) {
  const byId = new Map(forms.map((f) => [f.id, f]));
  return forms.map((form) => {
    if (!form.parentFormId || form.ancestorVersionPins) return form;
    const pins: Record<string, string> = {};
    let current = form;
    const seen = new Set<string>();
    while (current.parentFormId && !seen.has(current.parentFormId)) {
      seen.add(current.parentFormId);
      const parent = byId.get(current.parentFormId);
      if (!parent) break;
      if (parent.publishedVersionId)
        pins[parent.id] = parent.publishedVersionId;
      current = parent;
    }
    return Object.keys(pins).length > 0
      ? { ...form, ancestorVersionPins: pins }
      : form;
  });
}

export function selectPersistedDemoData(state: RootState): PersistedDemoData {
  return {
    forms: state.forms.items,
    fields: state.fields.items,
    submissions: state.submissions.items,
    ghl: {
      connection: state.ghl.connection,
      customFields: state.ghl.customFields,
      mappings: state.ghl.mappings,
    },
  };
}

export async function applyDemoData(
  data: PersistedDemoData,
  dispatch: AppDispatch,
) {
  await Promise.all([
    formsRepository.seed(data.forms),
    fieldsRepository.seed(data.fields),
    submissionsRepository.seed(data.submissions),
    ghlRepository.seed(data.ghl),
  ]);
  dispatch(setForms(data.forms));
  dispatch(setFields(data.fields));
  dispatch(setSubmissions(data.submissions));
  dispatch(setGhlState(data.ghl));
}

export const bootstrapApp = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>('app/bootstrap', async (_, { dispatch }) => {
  const persisted = loadPersistedState<PersistedDemoData>();
  if (persisted && persisted.forms && persisted.fields) {
    const normalized: PersistedDemoData = {
      ...persisted,
      forms: normalizeFormPins(persisted.forms),
    };
    await applyDemoData(normalized, dispatch);
    savePersistedState(normalized);
    return;
  }

  const initial = getInitialDemoState();
  const data: PersistedDemoData = {
    forms: normalizeFormPins(initial.forms),
    fields: initial.fields,
    submissions: initial.submissions,
    ghl: initial.ghl,
  };
  await applyDemoData(data, dispatch);
  savePersistedState(data);
});

export const resetDemoData = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>('app/resetDemoData', async (_, { dispatch }) => {
  clearPersistedState();
  const initial = getInitialDemoState();
  const data: PersistedDemoData = {
    forms: normalizeFormPins(initial.forms),
    fields: initial.fields,
    submissions: initial.submissions,
    ghl: initial.ghl,
  };
  await applyDemoData(data, dispatch);
  savePersistedState(data);
});
