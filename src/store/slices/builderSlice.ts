import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { FormContent } from '@/types';

const HISTORY_LIMIT = 50;
const COALESCE_WINDOW_MS = 800;

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface BuilderState {
  selectedFormId: string | null;
  selectedItemId: string | null;
  previewMode: 'desktop' | 'mobile';
  isPreviewOpen: boolean;
  past: FormContent[];
  present: FormContent | null;
  future: FormContent[];
  lastEditAt: number | null;
  lastEditKey: string | null;
  autosaveStatus: AutosaveStatus;
  lastSavedAt: string | null;
  autosaveError: string | null;
  initializedFormId: string | null;
}

const initialState: BuilderState = {
  selectedFormId: null,
  selectedItemId: null,
  previewMode: 'desktop',
  isPreviewOpen: false,
  past: [],
  present: null,
  future: [],
  lastEditAt: null,
  lastEditKey: null,
  autosaveStatus: 'idle',
  lastSavedAt: null,
  autosaveError: null,
  initializedFormId: null,
};

function cloneContent(content: FormContent): FormContent {
  return JSON.parse(JSON.stringify(content)) as FormContent;
}

function pushHistory(
  state: BuilderState,
  next: FormContent,
  coalesceKey?: string,
) {
  if (!state.present) {
    state.present = cloneContent(next);
    state.past = [];
    state.future = [];
    state.lastEditAt = Date.now();
    state.lastEditKey = coalesceKey ?? null;
    return;
  }

  const now = Date.now();
  const canCoalesce =
    !!coalesceKey &&
    state.lastEditKey === coalesceKey &&
    state.lastEditAt !== null &&
    now - state.lastEditAt <= COALESCE_WINDOW_MS &&
    state.past.length > 0;

  if (canCoalesce) {
    // replace present without adding a new past step (coalesce rapid edits)
    state.present = cloneContent(next);
  } else {
    state.past = [...state.past, cloneContent(state.present)].slice(
      -HISTORY_LIMIT,
    );
    state.present = cloneContent(next);
  }
  // Keep redo stack for unrelated edits; caller can explicitly reset on publish
  // (requirement: "Publishing does not clear the redo stack of unrelated edits but resets history to the published state")
  state.future = [];
  state.lastEditAt = now;
  state.lastEditKey = coalesceKey ?? null;
}

const builderSlice = createSlice({
  name: 'builder',
  initialState,
  reducers: {
    initBuilder(
      state,
      action: PayloadAction<{
        formId: string;
        draft: FormContent;
        resetHistory?: boolean;
      }>,
    ) {
      const { formId, draft, resetHistory } = action.payload;
      state.selectedFormId = formId;
      if (resetHistory || state.initializedFormId !== formId) {
        state.selectedItemId = null;
        state.past = [];
        state.present = cloneContent(draft);
        state.future = [];
        state.lastEditAt = null;
        state.lastEditKey = null;
        state.autosaveStatus = 'idle';
        state.autosaveError = null;
        state.initializedFormId = formId;
      } else if (state.present == null) {
        state.present = cloneContent(draft);
      }
    },
    applyDraftEdit(
      state,
      action: PayloadAction<{ draft: FormContent; coalesceKey?: string }>,
    ) {
      pushHistory(state, action.payload.draft, action.payload.coalesceKey);
    },
    setPresentDraft(state, action: PayloadAction<FormContent>) {
      state.present = cloneContent(action.payload);
    },
    undo(state) {
      if (!state.present || state.past.length === 0) return;
      const previous = state.past[state.past.length - 1];
      state.past = state.past.slice(0, -1);
      state.future = [cloneContent(state.present), ...state.future].slice(
        0,
        HISTORY_LIMIT,
      );
      state.present = cloneContent(previous);
      state.lastEditAt = null;
      state.lastEditKey = null;
    },
    redo(state) {
      if (!state.present || state.future.length === 0) return;
      const next = state.future[0];
      state.future = state.future.slice(1);
      state.past = [...state.past, cloneContent(state.present)].slice(
        -HISTORY_LIMIT,
      );
      state.present = cloneContent(next);
      state.lastEditAt = null;
      state.lastEditKey = null;
    },
    resetHistoryTo(state, action: PayloadAction<FormContent>) {
      state.past = [];
      state.present = cloneContent(action.payload);
      state.future = [];
      state.lastEditAt = null;
      state.lastEditKey = null;
    },
    clearBuilderForFormSwitch(state) {
      state.selectedItemId = null;
      state.past = [];
      state.present = null;
      state.future = [];
      state.lastEditAt = null;
      state.lastEditKey = null;
      state.autosaveStatus = 'idle';
      state.autosaveError = null;
      state.initializedFormId = null;
    },
    setSelectedForm(state, action: PayloadAction<string | null>) {
      state.selectedFormId = action.payload;
    },
    setSelectedItem(state, action: PayloadAction<string | null>) {
      state.selectedItemId = action.payload;
    },
    setPreviewMode(state, action: PayloadAction<BuilderState['previewMode']>) {
      state.previewMode = action.payload;
    },
    setPreviewOpen(state, action: PayloadAction<boolean>) {
      state.isPreviewOpen = action.payload;
    },
    setAutosaveStatus(
      state,
      action: PayloadAction<{
        status: AutosaveStatus;
        error?: string | null;
        savedAt?: string | null;
      }>,
    ) {
      state.autosaveStatus = action.payload.status;
      if (action.payload.status === 'error') {
        state.autosaveError = action.payload.error ?? 'Failed to save';
      } else if (action.payload.status === 'saving') {
        state.autosaveError = null;
      } else if (action.payload.status === 'saved') {
        state.autosaveError = null;
        state.lastSavedAt = action.payload.savedAt ?? new Date().toISOString();
      }
    },
    resetBuilderState() {
      return initialState;
    },
  },
});

export const {
  initBuilder,
  applyDraftEdit,
  setPresentDraft,
  undo,
  redo,
  resetHistoryTo,
  clearBuilderForFormSwitch,
  setSelectedForm,
  setSelectedItem,
  setPreviewMode,
  setPreviewOpen,
  setAutosaveStatus,
  resetBuilderState,
} = builderSlice.actions;
export default builderSlice.reducer;
