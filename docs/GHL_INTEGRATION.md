# FormFamily GHL Integration

## Overview

FormFamily provides seamless integration with GoHighLevel (GHL) CRM, allowing users to connect their GHL accounts, map form fields to GHL custom fields, and automatically sync form submissions as contacts in GHL.

## Integration Overview

### Key Features

1. **Connection Management**
   - Token-based authentication
   - OAuth2 support (future enhancement)
   - Encrypted credential storage
   - Connection health monitoring

2. **Field Mapping**
   - Bidirectional mapping between library fields and GHL custom fields
   - Automatic field type conversion
   - Conflict detection and resolution
   - Mapping reuse across organizations

3. **Submission Sync**
   - Real-time sync of form submissions
   - Retry logic for failed syncs
   - Sync status tracking
   - File upload integration

4. **Data Synchronization**
   - Bidirectional sync support (future enhancement)
   - Conflict resolution for conflicting data
   - Change tracking and delta sync

## Integration Architecture

### Components

#### 1. GHL Auth Module (`src/lib/ghl/auth.ts`)

Manages GHL authentication and credential storage:

```typescript
interface GhlAuth {
  type: 'token' | 'oauth';
  token?: string;
  locationId?: string;
  encryptedCredentials?: string;
}

interface GhlConnection {
  locationId: string;
  authType: 'token' | 'oauth';
  encryptedCredentials: string;
  lastSyncedAt?: Date;
}
```

**Key Responsibilities:**

- Encrypt/decrypt credentials using AES-256-CBC
- Validate API tokens against GHL API
- Create GHL auth objects from stored connections
- Create connections from auth data

#### 2. GHL API Client (`src/lib/ghl/client.ts`)

Core API client for GHL communications:

```typescript
class GhlApiClient {
  private apiToken?: string;
  private baseUrl: string;
  private locationId?: string;

  configure(apiToken: string, locationId?: string): void;
  request<T>(
    method: string,
    endpoint: string,
    body?: any,
    headers?: any,
  ): Promise<T>;
  getCustomFields(): Promise<GhlCustomField[]>;
  getContact(
    identifier: string,
    field?: 'email' | 'phone',
  ): Promise<GhlContact | null>;
  upsertContact(contact: Partial<GhlContact>): Promise<GhlContact>;
  uploadFile(
    file: Buffer,
    filename: string,
    contentType: string,
  ): Promise<{ id: string }>;
  validateConnection(): Promise<boolean>;
}
```

**Key Features:**

- Automatic token management
- Rate limiting awareness
- Comprehensive error handling
- File upload support
- Retry logic for transient failures

#### 3. GHL Mapping Manager (`src/lib/ghl/mapping.ts`)

Manages field mappings between library and GHL:

```typescript
class GhlMappingManager {
  getMappings(orgId: string): Promise<GhlFieldMapping[]>;
  upsertMapping(
    orgId: string,
    fieldKey: string,
    ghlCustomFieldId: string,
  ): Promise<GhlFieldMapping>;
  removeMapping(orgId: string, fieldKey: string): Promise<void>;
  getMappedFieldId(orgId: string, fieldKey: string): Promise<string | null>;
  getAllMappingsForOrg(orgId: string): Promise<Record<string, string>>;
  suggestMappings(
    orgId: string,
    libraryFieldKey: string,
    ghlCustomFields: any[],
  ): Promise<FieldMatchResult[]>;
}
```

**Key Features:**

- Fuzzy matching for field suggestions
- Conflict detection
- Duplicate prevention
- Mapping validation

#### 4. GHL Integration Main Class (`src/lib/ghl/index.ts`)

Main integration coordinator:

```typescript
class GhlIntegration {
  private authManager: GhlAuthManager;
  private apiClient: GhlApiClient;
  private mappingManager: GhlMappingManager;

  configureGhl(auth: GhlAuth, locationId: string): void;
  connectOrganization(
    orgId: string,
    auth: GhlAuth,
    locationId: string,
  ): Promise<void>;
  getMappings(orgId: string): Promise<GhlFieldMapping[]>;
  mapField(
    orgId: string,
    libraryFieldKey: string,
    ghlCustomFieldId: string,
  ): Promise<GhlFieldMapping>;
  getMappedFieldId(orgId: string, fieldKey: string): Promise<string | null>;
  syncSubmission(submission: any): Promise<void>;
}
```

## API Endpoints

### Connection Management

#### Connect GHL Account

```http
POST /api/ghl/connect
{
  "orgId": "org123",
  "locationId": "ghl_loc_456",
  "authType": "token",
  "token": "ghl_api_token_789",
  "userId": "user123"
}
```

**Response:**

```json
{
  "success": true,
  "connectionId": "conn_123",
  "message": "GHL connection established successfully"
}
```

#### Get Connection Status

```http
GET /api/ghl/connect?orgId=org123
```

#### Disconnect GHL

```http
DELETE /api/ghl/connect?orgId=org123&connectionId=conn_123
```

### Field Management

#### Get GHL Custom Fields

```http
GET /api/ghl/fields?orgId=org123
```

**Response:**

```json
[
  {
    "id": "ghl_field_1",
    "name": "Expected Salary",
    "key": "expected_salary",
    "type": "currency",
    "required": true,
    "description": "The expected annual salary",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Create Field Mapping

```http
POST /api/ghl/fields
{
  "orgId": "org123",
  "fieldKey": "expected_ctc",
  "ghlCustomFieldId": "ghl_field_1",
  "review": false
}
```

**Response:**

```json
{
  "id": "mapping_123",
  "orgId": "org123",
  "fieldKey": "expected_ctc",
  "ghlCustomFieldId": "ghl_field_1",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Field Mapping Management

#### Get All Mappings

```http
GET /api/ghl/mappings?orgId=org123
```

#### Update Mapping

```http
PUT /api/ghl/mappings
{
  "orgId": "org123",
  "fieldKey": "expected_ctc",
  "ghlCustomFieldId": "ghl_field_2",
  "status": "active"
}
```

#### Delete Mapping

```http
DELETE /api/ghl/mappings?orgId=org123&fieldKey=expected_ctc
```

### Form Submission Sync

#### Submit Form

```http
POST /api/public/forms/{slug}/submit
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "current_ctc": "100000",
  "expected_ctc": "120000"
}
```

**Response:**

```json
{
  "success": true,
  "submissionId": "sub_123",
  "message": "Application submitted successfully"
}
```

## Field Mapping Process

### 1. Field Discovery

When a GHL connection is established:

1. Retrieve all custom fields for the location
2. Match library fields with GHL custom fields using fuzzy matching
3. Display mapping suggestions to the user
4. Allow manual review and confirmation

### 2. Mapping Creation

```typescript
async function createMapping(
  orgId: string,
  fieldKey: string,
  ghlCustomFieldId: string,
): Promise<GhlFieldMapping> {
  // Validate mapping
  if (!orgId || !fieldKey || !ghlCustomFieldId) {
    throw new Error('Missing required fields');
  }

  // Check for conflicts
  const existing = await getExistingMapping(orgId, fieldKey);
  if (existing) {
    throw new Error('Field already mapped to a different GHL field');
  }

  // Create mapping
  const mapping = await prisma.ghlFieldMapping.create({
    data: {
      orgId,
      fieldKey,
      ghlCustomFieldId,
      status: 'active',
    },
  });

  return mapping;
}
```

### 3. Submission Transformation

Transform form submission to GHL contact format:

```typescript
function transformSubmissionToContact(
  submission: any,
  mappings: GhlFieldMapping[],
  form: Form,
): Partial<GhlContact> {
  const contact: Partial<GhlContact> = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    customFields: {},
  };

  for (const [fieldKey, value] of Object.entries(submission.answers)) {
    const mapping = mappings.find((m) => m.fieldKey === fieldKey);

    if (mapping) {
      // Map library field to GHL custom field
      contact.customFields![mapping.ghlCustomFieldId] = value;

      // Set standard fields based on field key
      if (fieldKey === 'first_name') {
        contact.firstName = value as string;
      } else if (fieldKey === 'last_name') {
        contact.lastName = value as string;
      } else if (fieldKey === 'email') {
        contact.email = value as string;
      } else if (fieldKey === 'phone') {
        contact.phone = value as string;
      }
    } else {
      // No mapping - store under a generic key
      contact.customFields![`unmapped_${fieldKey}`] = value;
    }
  }

  return contact;
}
```

## Data Flow

### 1. Form Submission

```
Client (Browser)
    ↓
Public API (/api/public/forms/{slug}/submit)
    ↓
Validation & Transformation
    ↓
Database (Submission creation)
    ↓
GHL Integration Service
    ↓
GHL API Client
    ↓
GHL CRM (Contact upsert)
```

### 2. GHL Sync Job

```
Database Change (Submission created)
    ↓
GHL Integration Service
    ↓
Queue System (Redis/RabbitMQ)
    ↓
GHL API Client
    ↓
GHL CRM
    ↓
Database Update (Submission sync status)
```

## Error Handling

### API Error Responses

1. **Connection Errors**
   - `401 Unauthorized`: Invalid GHL credentials
   - `403 Forbidden`: Insufficient permissions
   - `502 Bad Gateway`: GHL API unavailable
   - `503 Service Unavailable`: Rate limit exceeded

2. **Validation Errors**
   - `400 Bad Request`: Invalid field mapping
   - `422 Unprocessable Entity`: Validation failed
   - `409 Conflict`: Duplicate mapping

3. **Sync Errors**
   - `202 Accepted`: Submission queued for sync
   - `500 Internal Server Error`: Sync failed
   - `429 Too Many Requests`: Rate limit exceeded

### Retry Logic

```typescript
async function syncSubmission(submissionId: string): Promise<void> {
  const submission = await getSubmission(submissionId);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await ghlClient.upsertContact(transformSubmission(submission));

      // Update submission status
      await updateSubmissionSyncStatus(submissionId, 'synced');
      return;
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        // Mark as failed
        await updateSubmissionSyncStatus(submissionId, 'failed');
        throw error;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
      await sleep(delay);
    }
  }
}
```

## Monitoring and Observability

### Metrics

1. **Connection Metrics**
   - Active connections per organization
   - Connection health status
   - Auth failures

2. **Sync Metrics**
   - Submission sync success rate
   - Average sync time
   - Queue depth

3. **Mapping Metrics**
   - Number of field mappings
   - Mapping conflicts
   - Field usage statistics

### Alerts

1. **Connection Issues**
   - GHL API unreachable
   - Invalid credentials
   - Rate limit exceeded

2. **Sync Issues**
   - High sync failure rate
   - Long sync times
   - Queue buildup

3. **Configuration Issues**
   - Orphaned mappings
   - Missing required mappings
   - Conflict detected

## Security

### Credential Storage

```typescript
class GhlAuthManager {
  private encryptionKey: string;

  encrypt(credentials: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(credentials, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encrypted: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

### Access Control

1. **Organization-Level Access**
   - Users can only access their own organization's data
   - GHL connections scoped to organizations
   - Field mappings restricted to organizations

2. **Role-Based Access**
   - `owner`: Full access to all GHL operations
   - `admin`: Can manage connections and mappings
   - `editor`: Can view and use mappings

3. **API Key Authentication**
   - Each GHL connection has unique API keys
   - Rate limiting per organization
   - Audit logging for all operations

## Testing

### Unit Tests

1. **GHL Client Tests**
   - API request/response validation
   - Error handling
   - Retry logic

2. **Mapping Tests**
   - Field matching algorithms
   - Conflict detection
   - Mapping validation

3. **Integration Tests**
   - End-to-end sync scenarios
   - Error recovery
   - Performance benchmarks

### Integration Tests

1. **Connection Testing**
   - Valid credentials
   - Invalid credentials
   - Rate limiting

2. **Sync Testing**
   - Successful sync
   - Sync failure
   - Network issues

3. **Field Mapping Testing**
   - Mapping creation
   - Mapping updates
   - Mapping deletion

## Future Enhancements

### 1. OAuth2 Support

```typescript
interface GhlAuth {
  type: 'token' | 'oauth';
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  locationId?: string;
}
```

### 2. Bidirectional Sync

```typescript
// Sync from GHL to form
interface GhlWebhookPayload {
  event: 'contact.created' | 'contact.updated' | 'custom_field.updated';
  timestamp: number;
  data: any;
}
```

### 3. Advanced Field Mapping

```typescript
interface AdvancedFieldMapping {
  fieldKey: string;
  ghlCustomFieldId: string;
  transformation: {
    sourceType: string;
    targetType: string;
    format?: string;
  };
  validation: {
    required: boolean;
    regex?: string;
    maxLength?: number;
  };
}
```

### 4. Webhook Support

```typescript
// Webhook configuration
interface GhlWebhookConfig {
  url: string;
  secret: string;
  events: string[];
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
}
```

## Conclusion

The GHL integration provides a robust, secure, and scalable way to connect FormFamily with GoHighLevel CRM. The integration handles authentication, field mapping, submission sync, and provides comprehensive error handling and monitoring. The architecture is designed for future extensibility while maintaining security and reliability.

This integration enables organizations to seamlessly capture candidate data in FormFamily and have it automatically synchronized with their GHL CRM, creating a unified candidate management workflow.
