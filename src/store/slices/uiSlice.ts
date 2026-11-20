import { createSlice } from '@reduxjs/toolkit';
import { bootstrapApp, resetDemoData } from '../bootstrap';

interface UiState {
  initialized: boolean;
  error: string | null;
}

const initialState: UiState = {
  initialized: false,
  error: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setInitialized(state, action: { payload: boolean }) {
      state.initialized = action.payload;
      if (action.payload) state.error = null;
    },
    setUiError(state, action: { payload: string | null }) {
      state.error = action.payload;
    },
    resetUiState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapApp.pending, (state) => {
        state.error = null;
      })
      .addCase(bootstrapApp.fulfilled, (state) => {
        state.initialized = true;
        state.error = null;
      })
      .addCase(bootstrapApp.rejected, (state, action) => {
        state.initialized = false;
        state.error = action.error.message ?? 'Failed to load demo data';
      })
      .addCase(resetDemoData.pending, (state) => {
        state.error = null;
      })
      .addCase(resetDemoData.fulfilled, (state) => {
        state.initialized = true;
        state.error = null;
      })
      .addCase(resetDemoData.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to reset demo data';
      });
  },
});

export const { setInitialized, setUiError, resetUiState } = uiSlice.actions;
export default uiSlice.reducer;
