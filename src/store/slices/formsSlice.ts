import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { FormContent, FormRecord } from '@/types';
import { formsRepository } from '@/services';

interface FormsState {
  items: FormRecord[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  initialized: boolean;
}

const initialState: FormsState = {
  items: [],
  status: 'idle',
  error: null,
  initialized: false,
};

export const fetchForms = createAsyncThunk('forms/fetchAll', async () => {
  return formsRepository.list();
});

export const createForm = createAsyncThunk(
  'forms/create',
  async (input: {
    name: string;
    slug: string;
    parentFormId?: string | null;
    content?: FormContent;
  }) => {
    return formsRepository.create(input);
  },
);

export const updateFormDraft = createAsyncThunk(
  'forms/updateDraft',
  async ({ formId, draft }: { formId: string; draft: FormContent }) => {
    return formsRepository.updateDraft(formId, draft);
  },
);

export const publishFormRecord = createAsyncThunk(
  'forms/publish',
  async ({ formId }: { formId: string }) => {
    return formsRepository.publish(formId);
  },
);

export const detachFormRecord = createAsyncThunk(
  'forms/detach',
  async ({ formId }: { formId: string }) => {
    return formsRepository.detach(formId);
  },
);

export const deleteFormRecord = createAsyncThunk(
  'forms/delete',
  async ({ formId }: { formId: string }) => {
    await formsRepository.delete(formId);
    return formId;
  },
);

export const seedForms = createAsyncThunk(
  'forms/seed',
  async (forms: FormRecord[]) => {
    await formsRepository.seed(forms);
    return forms;
  },
);

const formsSlice = createSlice({
  name: 'forms',
  initialState,
  reducers: {
    setForms(state, action: PayloadAction<FormRecord[]>) {
      state.items = action.payload;
      state.status = 'succeeded';
      state.initialized = true;
      state.error = null;
    },
    upsertForm(state, action: PayloadAction<FormRecord>) {
      const idx = state.items.findIndex((f) => f.id === action.payload.id);
      if (idx === -1) state.items.push(action.payload);
      else state.items[idx] = action.payload;
    },
    removeForm(state, action: PayloadAction<string>) {
      state.items = state.items.filter((f) => f.id !== action.payload);
    },
    resetFormsState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchForms.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchForms.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.initialized = true;
      })
      .addCase(fetchForms.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load forms';
      })
      .addCase(createForm.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateFormDraft.fulfilled, (state, action) => {
        const idx = state.items.findIndex((f) => f.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(publishFormRecord.fulfilled, (state, action) => {
        const idx = state.items.findIndex((f) => f.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(detachFormRecord.fulfilled, (state, action) => {
        const idx = state.items.findIndex((f) => f.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteFormRecord.fulfilled, (state, action) => {
        state.items = state.items.filter((f) => f.id !== action.payload);
      })
      .addCase(seedForms.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'succeeded';
        state.initialized = true;
      });
  },
});

export const { setForms, upsertForm, removeForm, resetFormsState } =
  formsSlice.actions;
export default formsSlice.reducer;
