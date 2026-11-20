import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { Submission, SyncStatus } from '@/types';
import { submissionsRepository, type CreateSubmissionInput } from '@/services';

interface SubmissionsState {
  items: Submission[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  initialized: boolean;
}

const initialState: SubmissionsState = {
  items: [],
  status: 'idle',
  error: null,
  initialized: false,
};

export const fetchSubmissions = createAsyncThunk(
  'submissions/fetchAll',
  async () => {
    return submissionsRepository.list();
  },
);

export const createSubmission = createAsyncThunk(
  'submissions/create',
  async (input: CreateSubmissionInput) => {
    return submissionsRepository.create(input);
  },
);

export const retrySubmissionSync = createAsyncThunk(
  'submissions/retrySync',
  async ({ id }: { id: string }) => {
    // mock retry: set pending then synced
    await submissionsRepository.updateSyncStatus(id, 'pending');
    return submissionsRepository.updateSyncStatus(id, 'synced');
  },
);

export const seedSubmissions = createAsyncThunk(
  'submissions/seed',
  async (subs: Submission[]) => {
    await submissionsRepository.seed(subs);
    return subs;
  },
);

const submissionsSlice = createSlice({
  name: 'submissions',
  initialState,
  reducers: {
    setSubmissions(state, action: PayloadAction<Submission[]>) {
      state.items = action.payload;
      state.status = 'succeeded';
      state.initialized = true;
    },
    resetSubmissionsState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubmissions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.initialized = true;
      })
      .addCase(fetchSubmissions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load submissions';
      })
      .addCase(createSubmission.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(retrySubmissionSync.fulfilled, (state, action) => {
        if (!action.payload) return;
        const idx = state.items.findIndex((s) => s.id === action.payload!.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(seedSubmissions.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'succeeded';
        state.initialized = true;
      });
  },
});

export const { setSubmissions, resetSubmissionsState } =
  submissionsSlice.actions;
export default submissionsSlice.reducer;
