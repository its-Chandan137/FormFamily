import { createSlice } from '@reduxjs/toolkit';

interface BuilderState {
  initialized: boolean;
}

const initialState: BuilderState = {
  initialized: false,
};

const builderSlice = createSlice({
  name: 'builder',
  initialState,
  reducers: {},
});

export default builderSlice.reducer;
