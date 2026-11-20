import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { FieldDefinition } from '@/types';
import { fieldsRepository, type CreateFieldInput } from '@/services';

interface FieldsState {
  items: FieldDefinition[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  initialized: boolean;
}

const initialState: FieldsState = {
  items: [],
  status: 'idle',
  error: null,
  initialized: false,
};

export const fetchFields = createAsyncThunk('fields/fetchAll', async () => {
  return fieldsRepository.list('org_1');
});

export const createField = createAsyncThunk(
  'fields/create',
  async (input: CreateFieldInput) => {
    return fieldsRepository.create(input);
  },
);

export const seedFields = createAsyncThunk(
  'fields/seed',
  async (fields: FieldDefinition[]) => {
    await fieldsRepository.seed(fields);
    return fields;
  },
);

const fieldsSlice = createSlice({
  name: 'fields',
  initialState,
  reducers: {
    setFields(state, action: PayloadAction<FieldDefinition[]>) {
      state.items = action.payload;
      state.status = 'succeeded';
      state.initialized = true;
    },
    resetFieldsState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFields.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFields.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.initialized = true;
      })
      .addCase(fetchFields.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load fields';
      })
      .addCase(createField.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(seedFields.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'succeeded';
        state.initialized = true;
      });
  },
});

export const { setFields, resetFieldsState } = fieldsSlice.actions;
export default fieldsSlice.reducer;
