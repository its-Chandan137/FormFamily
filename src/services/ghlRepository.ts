import { delay } from './delay';

export interface GhlCustomField {
  id: string;
  name: string;
  key?: string;
}

export type MappingStatus = 'mapped' | 'suggested' | 'unmapped';

export interface GhlFieldMappingRecord {
  orgId: string;
  fieldKey: string;
  ghlCustomFieldId: string | null;
  status: MappingStatus;
  suggestion?: { ghlCustomFieldId: string; ghlFieldName: string } | null;
}

export interface GhlConnectionState {
  connected: boolean;
  locationId: string | null;
  locationName: string | null;
  lastSyncedAt: string | null;
}

export interface GhlRepository {
  getConnection(): Promise<GhlConnectionState>;
  validateConnection(input: {
    token: string;
    locationId: string;
  }): Promise<GhlConnectionState>;
  listCustomFields(): Promise<GhlCustomField[]>;
  getMappings(): Promise<GhlFieldMappingRecord[]>;
  saveMappings(
    mappings: GhlFieldMappingRecord[],
  ): Promise<GhlFieldMappingRecord[]>;
  seed(data: {
    connection: GhlConnectionState;
    customFields: GhlCustomField[];
    mappings: GhlFieldMappingRecord[];
  }): Promise<void>;
  reset(): Promise<void>;
}

let connection: GhlConnectionState = {
  connected: false,
  locationId: null,
  locationName: null,
  lastSyncedAt: null,
};
let customFields: GhlCustomField[] = [];
let mappings: GhlFieldMappingRecord[] = [];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createInMemoryGhlRepository(initial?: {
  connection: GhlConnectionState;
  customFields: GhlCustomField[];
  mappings: GhlFieldMappingRecord[];
}): GhlRepository {
  if (initial) {
    connection = clone(initial.connection);
    customFields = clone(initial.customFields);
    mappings = clone(initial.mappings);
  }
  return {
    async getConnection() {
      await delay();
      return clone(connection);
    },
    async validateConnection(input) {
      await delay();
      connection = {
        connected: true,
        locationId: input.locationId,
        locationName:
          input.locationId === 'loc_northwind_hq'
            ? 'Northwind Labs HQ'
            : 'Connected Location',
        lastSyncedAt: new Date().toISOString(),
      };
      return clone(connection);
    },
    async listCustomFields() {
      await delay();
      return clone(customFields);
    },
    async getMappings() {
      await delay();
      return clone(mappings);
    },
    async saveMappings(next) {
      await delay();
      mappings = clone(next);
      return clone(mappings);
    },
    async seed(data) {
      await delay();
      connection = clone(data.connection);
      customFields = clone(data.customFields);
      mappings = clone(data.mappings);
    },
    async reset() {
      await delay();
      connection = {
        connected: false,
        locationId: null,
        locationName: null,
        lastSyncedAt: null,
      };
      customFields = [];
      mappings = [];
    },
  };
}
