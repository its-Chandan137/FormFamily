import { createSlice } from '@reduxjs/toolkit';

interface FamilyState {
  initialized: boolean;
}

const initialState: FamilyState = {
  initialized: false,
};

const familySlice = createSlice({
  name: 'family',
  initialState,
  reducers: {},
});

export default familySlice.reducer;
