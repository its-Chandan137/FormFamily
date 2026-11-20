import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  ghlRepository,
  type GhlConnectionState,
  type GhlCustomField,
  type GhlFieldMappingRecord,
} from '@/services';

interface GhlState {
  connection: GhlConnectionState;
  customFields: GhlCustomField[];
  mappings: GhlFieldMappingRecord[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  initialized: boolean;
}

const initialState: GhlState = {
  connection: {
    connected: false,
    locationId: null,
    locationName: null,
    lastSyncedAt: null,
  },
  customFields: [],
  mappings: [],
  status: 'idle',
  error: null,
  initialized: false,
};

export const fetchGhlState = createAsyncThunk('ghl/fetch', async () => {
  const [connection, customFields, mappings] = await Promise.all([
    ghlRepository.getConnection(),
    ghlRepository.listCustomFields(),
    ghlRepository.getMappings(),
  ]);
  return { connection, customFields, mappings };
});

export const validateGhlConnection = createAsyncThunk(
  'ghl/validate',
  async (input: { token: string; locationId: string }) => {
    return ghlRepository.validateConnection(input);
  },
);

export const saveGhlMappings = createAsyncThunk(
  'ghl/saveMappings',
  async (mappings: GhlFieldMappingRecord[]) => {
    return ghlRepository.saveMappings(mappings);
  },
);

export const seedGhl = createAsyncThunk(
  'ghl/seed',
  async (data: {
    connection: GhlConnectionState;
    customFields: GhlCustomField[];
    mappings: GhlFieldMappingRecord[];
  }) => {
    await ghlRepository.seed(data);
    return data;
  },
);

const ghlSlice = createSlice({
  name: 'ghl',
  initialState,
  reducers: {
    setGhlState(
      state,
      action: PayloadAction<Omit<GhlState, 'status' | 'error' | 'initialized'>>,
    ) {
      state.connection = action.payload.connection;
      state.customFields = action.payload.customFields;
      state.mappings = action.payload.mappings;
      state.status = 'succeeded';
      state.initialized = true;
    },
    resetGhlState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGhlState.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchGhlState.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.initialized = true;
        state.connection = action.payload.connection;
        state.customFields = action.payload.customFields;
        state.mappings = action.payload.mappings;
      })
      .addCase(fetchGhlState.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load GHL state';
      })
      .addCase(validateGhlConnection.fulfilled, (state, action) => {
        state.connection = action.payload;
      })
      .addCase(saveGhlMappings.fulfilled, (state, action) => {
        state.mappings = action.payload;
      })
      .addCase(seedGhl.fulfilled, (state, action) => {
        state.connection = action.payload.connection;
        state.customFields = action.payload.customFields;
        state.mappings = action.payload.mappings;
        state.status = 'succeeded';
        state.initialized = true;
      });
  },
});

export const { setGhlState, resetGhlState } = ghlSlice.actions;
export default ghlSlice.reducer;
