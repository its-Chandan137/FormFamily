import type {
  GhlConnectionState,
  GhlCustomField,
  GhlFieldMappingRecord,
} from '@/services/ghlRepository';

export const mockGhlConnection: GhlConnectionState = {
  connected: true,
  locationId: 'loc_northwind_hq',
  locationName: 'Northwind Labs HQ',
  lastSyncedAt: '2026-11-19T09:00:00Z',
};

export const mockGhlCustomFields: GhlCustomField[] = [
  { id: 'ghl_cf_first_name', name: 'First Name', key: 'first_name' },
  { id: 'ghl_cf_last_name', name: 'Last Name', key: 'last_name' },
  { id: 'ghl_cf_email', name: 'Email', key: 'email' },
  { id: 'ghl_cf_phone', name: 'Phone', key: 'phone' },
  { id: 'ghl_cf_resume', name: 'Resume Link', key: 'resume_link' },
  {
    id: 'ghl_cf_current_company',
    name: 'Current Company',
    key: 'current_company',
  },
  { id: 'ghl_cf_experience', name: 'Experience (Years)', key: 'experience' },
  { id: 'ghl_cf_current_ctc', name: 'Current CTC', key: 'current_ctc' },
  { id: 'ghl_cf_expected_ctc', name: 'Expected CTC', key: 'expected_ctc' },
  {
    id: 'ghl_cf_expected_salary',
    name: 'Expected Salary',
    key: 'expected_salary',
  },
  { id: 'ghl_cf_notice_period', name: 'Notice Period', key: 'notice_period' },
  {
    id: 'ghl_cf_current_location',
    name: 'Current Location',
    key: 'current_location',
  },
  { id: 'ghl_cf_portfolio', name: 'Portfolio URL', key: 'portfolio_url' },
  { id: 'ghl_cf_consent', name: 'Data Consent', key: 'data_consent' },
];

export const mockGhlMappings: GhlFieldMappingRecord[] = [
  {
    orgId: 'org_1',
    fieldKey: 'first_name',
    ghlCustomFieldId: 'ghl_cf_first_name',
    status: 'mapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'last_name',
    ghlCustomFieldId: 'ghl_cf_last_name',
    status: 'mapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'email',
    ghlCustomFieldId: 'ghl_cf_email',
    status: 'mapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'phone',
    ghlCustomFieldId: 'ghl_cf_phone',
    status: 'mapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'resume',
    ghlCustomFieldId: 'ghl_cf_resume',
    status: 'mapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'current_company',
    ghlCustomFieldId: 'ghl_cf_current_company',
    status: 'mapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'experience',
    ghlCustomFieldId: 'ghl_cf_experience',
    status: 'mapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'current_ctc',
    ghlCustomFieldId: 'ghl_cf_current_ctc',
    status: 'mapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'expected_ctc',
    ghlCustomFieldId: 'ghl_cf_expected_ctc',
    status: 'mapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'notice_period',
    ghlCustomFieldId: 'ghl_cf_notice_period',
    status: 'mapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'current_location',
    ghlCustomFieldId: 'ghl_cf_current_location',
    status: 'mapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'data_consent',
    ghlCustomFieldId: 'ghl_cf_consent',
    status: 'mapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'portfolio_url',
    ghlCustomFieldId: 'ghl_cf_portfolio',
    status: 'mapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'github_url',
    ghlCustomFieldId: null,
    status: 'suggested',
    suggestion: {
      ghlCustomFieldId: 'ghl_cf_github',
      ghlFieldName: 'GitHub Profile',
    },
  },
  {
    orgId: 'org_1',
    fieldKey: 'tech_stack',
    ghlCustomFieldId: null,
    status: 'unmapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'cloud_platforms',
    ghlCustomFieldId: null,
    status: 'unmapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'oncall_comfort',
    ghlCustomFieldId: null,
    status: 'unmapped',
  },
  {
    orgId: 'org_1',
    fieldKey: 'testing_tools',
    ghlCustomFieldId: null,
    status: 'unmapped',
  },
];
