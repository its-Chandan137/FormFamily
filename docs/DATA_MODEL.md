# FormFamily Data Model

## Overview

This document describes the complete data model for FormFamily, including all database tables, relationships, and constraints. The data model supports multi-tenancy, form inheritance, GHL integration, and comprehensive audit logging.

## Database Schema

The application uses PostgreSQL with Prisma ORM for data management. All tables are designed with proper indexing and constraints for optimal performance.

### Core Entities

#### 1. Organizations

Represents companies using the platform.

```prisma
model Organization {
  id          String         @id @default(cuid())
  name        String
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @default(now()) @updatedAt

  // Relations
  users       User[]
  forms       Form[]
  ghlConnections GhlConnection[]
  fieldMappings GhlFieldMapping[]
  memberships Membership[]

  @@map("organizations")
}
```

**Fields:**

- `id`: Unique identifier
- `name`: Organization name
- `createdAt`: When the organization was created
- `updatedAt`: When the organization was last updated

**Relations:**

- `users`: Users belonging to this organization
- `forms`: Forms owned by this organization
- `ghlConnections`: GHL CRM connections for this organization
- `fieldMappings`: Field mappings for this organization
- `memberships`: Membership relationships

#### 2. Users & Memberships

**User Model:**

```prisma
model User {
  id            String        @id @default(cuid())
  email         String        @unique
  name          String
  role          String        // 'owner', 'admin', 'editor'
  orgId         String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @default(now()) @updatedAt

  // Relations
  org           Organization  @relation(fields: [orgId], references: [id])
  memberships   Membership[]
  auditLogs     AuditLog[]

  @@map("users")
}
```

**Membership Model:**

```prisma
model Membership {
  id        String       @id @default(cuid())
  userId    String
  orgId     String
  role      String       // 'owner', 'admin', 'editor'
  createdAt DateTime     @default(now())
  updatedAt DateTime     @default(now()) @updatedAt

  // Relations
  user      User         @relation(fields: [userId], references: [id])
  org       Organization  @relation(fields: [orgId], references: [id])

  @@unique([userId, orgId])
  @@map("memberships")
}
```

**Purpose:**

- `User`: Platform users who can access organizations
- `Membership`: Many-to-many relationship between users and organizations with roles

**Constraints:**

- A user can belong to multiple organizations
- A user can have different roles in different organizations
- Enforces organizational access control

#### 3. Field Definitions

Represents the field library (platform-wide and organization-specific).

```prisma
model FieldDefinition {
  id           String           @id @default(cuid())
  orgId        String?          // null for platform-wide fields
  key          String           // canonical key, e.g. 'expected_ctc'
  label        String           // default label
  type         String           // 'text', 'textarea', etc.
  options      String[]?
  validation   Json?            // JSON for field validation rules
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @default(now()) @updatedAt

  // Relations
  org          Organization?    @relation(fields: [orgId], references: [id])
  forms        Form[]           // reverse relation for inheritance tracking

  @@unique([orgId, key])
  @@map("field_definitions")
}
```

**Fields:**

- `id`: Unique identifier
- `orgId`: Organization ID (null for platform-wide fields)
- `key`: Canonical key (e.g., 'expected_ctc')
- `label`: Default label
- `type`: Field type (text, email, number, etc.)
- `options`: For select/radio fields
- `validation`: JSON validation rules
- `createdAt`: When created
- `updatedAt`: When last updated

**Constraints:**

- Unique constraint on (orgId, key) prevents duplicates
- Platform-wide fields have orgId = null
- Organization-specific fields have orgId set

#### 4. Forms

Represents individual forms that can have inheritance relationships.

```prisma
model Form {
  id                  String        @id @default(cuid())
  orgId               String
  parentFormId        String?      // null for root forms
  name                String
  slug                String       // unique, for public access
  publishedVersionId  String?      // points to latest published version
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @default(now()) @updatedAt

  // Relations
  org                 Organization  @relation(fields: [orgId], references: [id])
  parent              Form?         @relation(name: "FormToChild", fields: [parentFormId], references: [id])
  children            Form[]        @relation(name: "FormToChild")
  publishedVersion    FormVersion?  @relation(name: "FormToPublishedVersion", fields: [publishedVersionId], references: [id])
  versions            FormVersion[]
  ghlMappings         GhlFieldMapping[]
  submissions         Submission[]

  @@index([orgId, parentFormId])
  @@unique([orgId, slug])
  @@map("forms")
}
```

**Fields:**

- `id`: Unique identifier
- `orgId`: Owning organization
- `parentFormId`: Parent form ID (null for root forms)
- `name`: Form display name
- `slug`: URL-friendly identifier (unique per org)
- `publishedVersionId`: ID of latest published version
- `createdAt`: When created
- `updatedAt`: When last updated

**Relations:**

- `org`: The organization that owns this form
- `parent`: Parent form (if any)
- `children`: Child forms
- `publishedVersion`: Currently published version
- `versions`: All versions of this form
- `ghlMappings`: GHL field mappings for this form
- `submissions`: Submissions for this form

**Constraints:**

- Index on (orgId, parentFormId) for efficient tree queries
- Unique slug per organization for public URLs

#### 5. Form Versions

Represents a specific version of a form (draft or published).

```prisma
model FormVersion {
  id               String       @id @default(cuid())
  formId           String
  versionNumber    Int
  status           String       // 'draft' or 'published'
  content          Json         // JSON serialization of FormContent
  resolvedSnapshot Json?       // JSON serialization of ResolvedForm (computed)
  publishedAt      DateTime?   // null for drafts
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @default(now()) @updatedAt

  // Relations
  form             Form         @relation(fields: [formId], references: [id])

  @@unique([formId, versionNumber])
  @@map("form_versions")
}
```

**Fields:**

- `id`: Unique identifier
- `formId`: ID of the form this version belongs to
- `versionNumber`: Sequential version number
- `status`: 'draft' or 'published'
- `content`: Serialized FormContent
- `resolvedSnapshot`: Pre-computed resolved form (for public viewing)
- `publishedAt`: When published (null for drafts)
- `createdAt`: When created
- `updatedAt`: When last updated

**Constraints:**

- Unique version numbers per form
- Published versions have publishedAt timestamp

#### 6. GHL Connections

Stores connections to GoHighLevel CRM.

```prisma
model GhlConnection {
  id                  String       @id @default(cuid())
  orgId               String
  locationId          String       // GHL location ID
  authType            String       // 'token' or 'oauth'
  encryptedCredentials String      // encrypted API token/credentials
  lastSyncedAt        DateTime?   // null if never synced
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @default(now()) @updatedAt

  // Relations
  org                 Organization  @relation(fields: [orgId], references: [id])

  @@index([orgId, locationId])
  @@map("ghl_connections")
}
```

**Fields:**

- `id`: Unique identifier
- `orgId`: Organization this connection belongs to
- `locationId`: GHL location ID
- `authType`: 'token' or 'oauth'
- `encryptedCredentials`: Encrypted API credentials
- `lastSyncedAt`: Last successful sync time
- `createdAt`: When created
- `updatedAt`: When last updated

**Security:**

- Credentials encrypted at rest
- Never returned in API responses
- Access controlled by organization membership

#### 7. GHL Field Mappings

Maps library field keys to GHL custom field IDs.

```prisma
model GhlFieldMapping {
  id                String       @id @default(cuid())
  orgId             String
  fieldKey          String       // from FieldDefinition.key
  ghlCustomFieldId  String       // GHL custom field ID
  status            String       // 'active' or 'inactive'
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @default(now()) @updatedAt

  // Relations
  org               Organization  @relation(fields: [orgId], references: [id])
  form              Form?        @relation(fields: [formId], references: [id])

  @@unique([orgId, fieldKey])
  @@map("ghl_field_mappings")
}
```

**Fields:**

- `id`: Unique identifier
- `orgId`: Organization this mapping belongs to
- `fieldKey`: Library field key (e.g., 'expected_ctc')
- `ghlCustomFieldId`: GHL custom field ID
- `status`: 'active' or 'inactive'
- `createdAt`: When created
- `updatedAt`: When last updated

**Constraints:**

- Unique per organization and field key
- Enables mapping of library fields to GHL custom fields

#### 8. Submissions

Stores form submission data.

```prisma
model Submission {
  id                String       @id @default(cuid())
  orgId             String
  formId            String
  formVersionId     String
  answers           Json         // JSON serialization of submission answers
  ghlSyncStatus     String       // 'synced', 'pending', 'failed'
  ghlContactId      String?      // GHL contact ID (null if not created/synced)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @default(now()) @updatedAt

  // Relations
  org               Organization  @relation(fields: [orgId], references: [id])
  form              Form         @relation(fields: [formId], references: [id])
  version           FormVersion   @relation(fields: [formVersionId], references: [id])

  @@index([orgId, formId, createdAt])
  @@map("submissions")
}
```

**Fields:**

- `id`: Unique identifier
- `orgId`: Organization this submission belongs to
- `formId`: Form that was submitted
- `formVersionId`: Version of the form at submission time
- `answers`: Serialized submission answers
- `ghlSyncStatus`: Sync status with GHL
- `ghlContactId`: GHL contact ID (if created)
- `createdAt`: When submitted
- `updatedAt`: When last updated

**Constraints:**

- Index for efficient querying by org, form, and date
- Answers stored as JSONB for schema flexibility

#### 9. Audit Log

Tracks all important changes for compliance and debugging.

```prisma
model AuditLog {
  id          String       @id @default(cuid())
  orgId       String
  userId      String
  action      String       // e.g., 'form_created', 'form_published', 'field_added'
  entityType  String       // e.g., 'form', 'submission', 'field_mapping'
  entityId    String       // ID of the affected entity
  meta        Json         // additional context for the action
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @default(now()) @updatedAt

  // Relations
  org         Organization  @relation(fields: [orgId], references: [id])
  user        User         @relation(fields: [userId], references: [id])

  @@index([orgId, createdAt])
  @@map("audit_logs")
}
```

**Fields:**

- `id`: Unique identifier
- `orgId`: Organization this action belongs to
- `userId`: User who performed the action
- `action`: Type of action performed
- `entityType`: Type of entity affected
- `entityId`: ID of the affected entity
- `meta`: Additional context
- `createdAt`: When action was performed
- `updatedAt`: When last updated

**Purpose:**

- Compliance and audit trails
- Debugging and troubleshooting
- Understanding user behavior
- Change tracking and version control

## Data Relationships

### Form Inheritance

```
Form (root)
├── Form (child1)
│   ├── Form (child1a)
│   └── Form (child1b)
├── Form (child2)
└── Form (child3)
    └── Form (child3a)
```

### GHL Integration Flow

```
1. User connects GHL account (GhlConnection)
2. User maps library fields to GHL custom fields (GhlFieldMapping)
3. User submits form (Submission)
4. System syncs submission to GHL (GhlSyncJob)
5. GHL contact created/updated with submission data
```

### Form Versioning

```
Form
├── FormVersion (draft)
└── FormVersion (published)
    ├── FormVersion (published)
    └── FormVersion (published)
```

### Organization Access

```
Organization
├── User (via Membership)
│   ├── Form
│   ├── FormVersion
│   └── Submission
├── FieldDefinition
├── GhlConnection
└── GhlFieldMapping
```

## Indexes and Performance

### Critical Indexes

1. **Organization Forms**

   ```sql
   CREATE INDEX idx_forms_org_parent ON forms(org_id, parent_form_id);
   ```

2. **Organization Submissions**

   ```sql
   CREATE INDEX idx_submissions_org_form_date ON submissions(org_id, form_id, created_at);
   ```

3. **Organization Audit Logs**

   ```sql
   CREATE INDEX idx_audit_logs_org_date ON audit_logs(org_id, created_at);
   ```

4. **Field Definitions**

   ```sql
   CREATE INDEX idx_field_definitions_org_key ON field_definitions(org_id, key);
   CREATE INDEX idx_field_definitions_platform ON field_definitions(org_id) WHERE org_id IS NULL;
   ```

5. **GHL Connections**

   ```sql
   CREATE INDEX idx_ghl_connections_org_location ON ghl_connections(org_id, location_id);
   ```

6. **Form Versions**
   ```sql
   CREATE INDEX idx_form_versions_form_number ON form_versions(form_id, version_number);
   ```

### Covering Indexes

1. **Form lookup by org and slug**

   ```sql
   CREATE UNIQUE INDEX idx_forms_org_slug ON forms(org_id, slug);
   ```

2. **Field mapping lookup**

   ```sql
   CREATE UNIQUE INDEX idx_ghl_mappings_org_field ON ghl_field_mappings(org_id, field_key);
   ```

3. **User membership lookup**
   ```sql
   CREATE INDEX idx_memberships_user_org ON memberships(user_id, org_id);
   ```

## JSONB Usage

### FormContent Storage

Form content is stored as JSONB in `FormVersion.content`:

```json
{
  "settings": {
    "companyName": "Acme Corp",
    "logoUrl": "https://example.com/logo.png"
  },
  "ownFields": [
    {
      "key": "first_name",
      "label": "First Name",
      "type": "text",
      "required": true,
      "hidden": false,
      "insertAfter": null
    }
  ],
  "elements": [],
  "overrides": {},
  "locks": []
}
```

### ResolvedForm Storage

Resolved forms are stored as JSONB in `FormVersion.resolvedSnapshot`:

```json
{
  "formId": "form123",
  "settings": {
    "companyName": "Acme Corp",
    "logoUrl": "https://example.com/logo.png"
  },
  "items": [
    {
      "kind": "field",
      "field": {
        "key": "first_name",
        "label": "First Name",
        "type": "text",
        "required": true,
        "hidden": false,
        "origin": "own",
        "sourceFormId": "form123",
        "locked": false
      }
    }
  ]
}
```

### Submission Answers Storage

Submission answers are stored as JSONB in `Submission.answers`:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "current_company": "Tech Corp",
  "experience": 5,
  "current_ctc": 100000,
  "expected_ctc": 120000,
  "notice_period": 30,
  "resume": {
    "url": "https://storage.example.com/resumes/john.pdf",
    "filename": "john-resume.pdf",
    "size": 2048000
  }
}
```

## Data Validation

### Integrity Constraints

1. **Form Parent-Child Consistency**
   - Ensure parent forms exist
   - Prevent cycles in form tree
   - Enforce maximum depth (5 levels)

2. **Version Consistency**
   - Published forms must have a published version
   - Draft forms must have at least one draft version
   - Version numbers must be sequential

3. **GHL Integration**
   - Mappings must reference valid field definitions
   - Connections must have valid credentials
   - Sync jobs must reference valid submissions

4. **Access Control**
   - Users must belong to organizations for data access
   - Users must have appropriate roles for operations
   - Sensitive data must be encrypted

### Application-Level Validation

1. **Form Validation**
   - Required fields must be present
   - File uploads must meet size/type constraints
   - Email addresses must be valid
   - Phone numbers must match pattern

2. **Inheritance Validation**
   - No cycles in form tree
   - Maximum depth not exceeded
   - Locked fields respected
   - Key conflicts resolved

3. **GHL Validation**
   - API credentials valid
   - Field mappings exist
   - Rate limits respected
   - File uploads supported

## Migration Strategies

### From Legacy Systems

1. **Data Extraction**
   - Export existing form definitions
   - Map legacy field keys to new format
   - Preserve historical data

2. **Schema Migration**
   - Create new database schema
   - Migrate data incrementally
   - Test thoroughly

3. **Application Migration**
   - Deploy new application
   - Gradual rollout to users
   - Monitor for issues

### Organizational Migration

1. **Per-Organization Migration**
   - Start with small organizations
   - Test thoroughly before scaling
   - Maintain data consistency

2. **Phased Rollout**
   - Migrate forms one by one
   - Test each family independently
   - Ensure no data loss

## Backup and Recovery

### Backup Strategy

1. **Database Backups**
   - Daily full backups
   - Hourly transaction logs
   - Weekly backup verification

2. **File Storage Backups**
   - Resume files
   - Uploaded documents
   - Temporary files

3. **Application State**
   - Configuration files
   - Session data
   - Cache contents

### Recovery Procedures

1. **Database Recovery**
   - Restore from latest backup
   - Replay transaction logs
   - Verify data consistency

2. **File Recovery**
   - Restore from object storage
   - Validate file integrity
   - Update references

3. **Application Recovery**
   - Rebuild application
   - Restore configuration
   - Test functionality

## Monitoring and Observability

### Database Performance

1. **Slow Query Detection**
   - Monitor query execution times
   - Set up alerts for long-running queries
   - Optimize critical queries

2. **Index Usage**
   - Monitor index hit ratios
   - Identify missing indexes
   - Regularly rebuild indexes

3. **Connection Management**
   - Monitor connection pool usage
   - Set connection limits
   - Implement connection pooling

### Application Metrics

1. **Database Metrics**
   - Query performance
   - Lock contention
   - Deadlock detection

2. **Application Metrics**
   - Request latency
   - Error rates
   - Resource usage

3. **Business Metrics**
   - Form creation rates
   - Submission volumes
   - GHL sync success rates

## Security Considerations

### Data Protection

1. **Encryption**
   - AES-256 encryption for sensitive data
   - TLS 1.3 for all network communications
   - Encrypted backups

2. **Access Control**
   - Role-based access control
   - Principle of least privilege
   - Regular access reviews

3. **Audit Logging**
   - Comprehensive audit trails
   - Secure log storage
   - Log rotation and retention

### Compliance

1. **GDPR**
   - User data privacy
   - Data retention policies
   - User rights implementation

2. **SOC 2**
   - Security controls
   - Availability requirements
   - Confidentiality commitments

3. **HIPAA** (if applicable)
   - Healthcare data protection
   - Patient privacy
   - Secure transmission

## Future Extensibility

### New Entity Types

1. **Template Management**
   - Form templates for common use cases
   - Template customization
   - Template distribution

2. **Analytics**
   - Submission analytics
   - Form performance metrics
   - User behavior analysis

3. **Workflow Automation**
   - Automated form routing
   - Notification workflows
   - Integration triggers

### API Extensibility

1. **GraphQL Support**
   - GraphQL API for flexible queries
   - Reduced over-fetching
   - Better developer experience

2. **WebSocket Support**
   - Real-time form updates
   - Live collaboration
   - Instant notifications

This data model provides a comprehensive foundation for FormFamily while maintaining flexibility for future enhancements. The separation of concerns and proper indexing ensure good performance and maintainability.
