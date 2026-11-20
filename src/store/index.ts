import { configureStore } from '@reduxjs/toolkit';
import builderReducer from './slices/builderSlice';
import formsReducer from './slices/formsSlice';
import familyReducer from './slices/familySlice';
import uiReducer from './slices/uiSlice';
import fieldsReducer from './slices/fieldsSlice';
import submissionsReducer from './slices/submissionsSlice';
import ghlReducer from './slices/ghlSlice';

export const makeStore = () =>
  configureStore({
    reducer: {
      builder: builderReducer,
      forms: formsReducer,
      family: familyReducer,
      ui: uiReducer,
      fields: fieldsReducer,
      submissions: submissionsReducer,
      ghl: ghlReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const selectBuilderState = (state: RootState) => state.builder;
export const selectFormsState = (state: RootState) => state.forms;
export const selectFamilyState = (state: RootState) => state.family;
export const selectUiState = (state: RootState) => state.ui;
export const selectFieldsState = (state: RootState) => state.fields;
export const selectSubmissionsState = (state: RootState) => state.submissions;
export const selectGhlState = (state: RootState) => state.ghl;

export default makeStore;
