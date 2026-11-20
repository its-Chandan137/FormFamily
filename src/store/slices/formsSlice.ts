import { createSlice } from '@reduxjs/toolkit';

interface FormsState {
  initialized: boolean;
}

const initialState: FormsState = {
  initialized: false,
};

const formsSlice = createSlice({
  name: 'forms',
  initialState,
  reducers: {},
});

export default formsSlice.reducer;
