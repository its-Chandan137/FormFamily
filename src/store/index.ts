// Redux store configuration
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

// Import slices (to be created later)
import builderSlice from './slices/builderSlice';
import formsSlice from './slices/formsSlice';
import familySlice from './slices/familySlice';
import uiSlice from './slices/uiSlice';

// Create the Redux store
export const makeStore = () => {
  return configureStore({
    reducer: {
      builder: builderSlice,
      forms: formsSlice,
      family: familySlice,
      ui: uiSlice,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore non-serializable values in state for now
          // TODO: Implement proper serialization checks
          ignoredActions: ['your/action/here'],
          ignoredPaths: ['some.nested.path'],
        },
      }),
  });
};

// Define TypeScript types for the store
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

// Typed hooks for use throughout the app
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
