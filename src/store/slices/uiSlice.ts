import { createSlice } from '@reduxjs/toolkit';

interface UiState {
  initialized: boolean;
}

const initialState: UiState = {
  initialized: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {},
});

export default uiSlice.reducer;
