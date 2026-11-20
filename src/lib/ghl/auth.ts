export type GhlAuthType = 'token' | 'oauth';

export interface GhlAuthConfig {
  authType: GhlAuthType;
  token?: string;
  locationId?: string;
}
