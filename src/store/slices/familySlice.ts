import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface FamilyState {
  selectedFormId: string | null;
  layoutDirection: 'LR' | 'TB';
  filterFamilyRootId: string | 'all';
}

const initialState: FamilyState = {
  selectedFormId: null,
  layoutDirection: 'LR',
  filterFamilyRootId: 'all',
};

const familySlice = createSlice({
  name: 'family',
  initialState,
  reducers: {
    setSelectedFamilyNode(state, action: PayloadAction<string | null>) {
      state.selectedFormId = action.payload;
    },
    setFamilyLayoutDirection(state, action: PayloadAction<'LR' | 'TB'>) {
      state.layoutDirection = action.payload;
    },
    setFamilyFilter(state, action: PayloadAction<string | 'all'>) {
      state.filterFamilyRootId = action.payload;
    },
    resetFamilyState() {
      return initialState;
    },
  },
});

export const {
  setSelectedFamilyNode,
  setFamilyLayoutDirection,
  setFamilyFilter,
  resetFamilyState,
} = familySlice.actions;
export default familySlice.reducer;
