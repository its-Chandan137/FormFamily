# FormFamily Architecture

## Overview

FormFamily is built with a clean, modular architecture that supports complex form inheritance and GHL integration while maintaining separation of concerns.

## Technical Architecture

### Frontend Architecture

**Next.js App Router**

- Server Components by default for better performance
- TypeScript strict mode with ESLint and Prettier
- Tailwind CSS with shadcn/ui for consistent UI
- Redux Toolkit for state management with RTK Query for data fetching

**Component Structure**

- **Components/ui**: Base shadcn/ui components
- **Components/layout**: Sidebar, Topbar, PageHeader
- **Components/builder**: Form builder interface (Palette, Canvas, PropertiesPanel)
- **Components/renderer**: Form rendering for public views
- **Components/family**: Family graph and inheritance management
- **Components/forms**: Forms table and family grouping
- **Components/submissions**: Submissions management
- **Components/field-library**: Field library screen
- **Components/ghl**: GHL connection and mapping screens

### State Management

**Redux Store**

- Centralized state management using Redux Toolkit
- Four main slices:
  - `builderSlice`: Form builder UI state
  - `formsSlice`: Form management state
  - `familySlice`: Family tree and graph state
  - `uiSlice`: UI-related state (toasts, modals, theme)

**State Flows**

1. **Builder Actions**: User interactions in the builder affect `builderSlice`
2. **Form Actions**: Form operations affect `formsSlice`
3. **Family Actions**: Inheritance and graph operations affect `familySlice`
4. **UI Actions**: UI state changes affect `uiSlice`

### Business Logic

**Pure Functions in `src/lib/forms/`**

- `resolve.ts`: Form resolution and inheritance logic
- `anchors.ts`: Item ordering and anchor-based positioning
- `family-tree.ts`: Family tree operations and validation
- `snapshot.ts`: Form snapshot and detach operations
- `validate.ts`: Form validation and schema building
- `build-zod-schema.ts`: Dynamic Zod schema generation

**GHL Integration in `src/lib/ghl/`**

- `auth.ts`: Authentication and credential management
- `client.ts`: GHL API client with error handling
- `mapping.ts`: Field mapping management
- `types.ts`: Type definitions for GHL integration
- `index.ts`: Main integration class

**Database Layer in `src/lib/db/`**

- `prisma.ts`: Prisma client singleton with type safety

### API Layer

**Route Structure**

```
api/
├── health/                    # Health check endpoint
├── forms/                     # Form management
│   ├── (create) GET, POST
│   └── [formId]/               # Form by ID
│       ├── GET, PUT, DELETE
│       ├── publish/            # Publish form
│       └── detach/             # Detach from family
├── fields/                    # Field library
├── public/                    # Public form operations
│   └── forms/                 # Public form submission
│       └── [slug]/submit/      # Submit form
├── ghl/                       # GHL integration
│   ├── connect/               # Connect GHL account
│   ├── fields/                # Get GHL custom fields
│   └── mappings/              # Field mappings
```

**API Design Principles**

- RESTful conventions with consistent error handling
- Input validation with Zod for all endpoints
- Rate limiting and authentication for protected routes
- Comprehensive error responses with detailed messages
- Audit logging for all data modifications

## Data Model

### Database Schema

The database schema is defined in `prisma/schema.prisma` and includes:

**Organizations**

- Companies using the platform
- Each org has its own forms, users, and field definitions

**Users & Memberships**

- Platform users who can access organizations
- Role-based access control (owner, admin, editor)
- Many-to-many relationship between users and organizations

**Field Definitions**

- Platform-wide and organization-specific field definitions
- Each field has a canonical key (e.g., 'expected_ctc')
- Unique constraint on (orgId, key) to prevent duplicates

**Forms & FormVersions**

- Forms can inherit from parent forms (tree structure)
- Each form has draft and published versions
- Published versions store resolved snapshots for public viewing

**GHL Integration**

- GHL connections with encrypted credentials
- Field mappings between library fields and GHL custom fields
- Sync jobs to track submission status in GHL

**Submissions**

- Form submission answers stored as JSONB for schema flexibility
- GHL sync status tracking
- File uploads stored separately and linked via custom fields

## Form Inheritance Implementation

### Resolution Process

1. **Tree Traversal**: Start from the form and traverse up to the root
2. **Settings Merge**: Settings are merged with child overriding parent
3. **Field Collection**: Collect all fields from ancestors and current form
4. **Override Application**: Apply field-specific overrides (label, required, hidden)
5. **Lock Propagation**: Apply locks from ancestors
6. **Anchor-Based Ordering**: Arrange items according to anchor positions

### Conflict Resolution

**Key Conflicts**

- When a parent adds a field whose key a child already added
- Warn the user and offer to merge
- On merge, the child's own copy is replaced by the inherited field
- Child's custom label can be kept as an override

**Delete/Detach Operations**

- Detach: Copy inherited fields into the form as own fields, remove parent link
- Delete with children: Offer to make children standalone or reparent them
- Every reparent must check for cycles and depth cap

## Deployment Architecture

### Development Stack

- **Framework**: Next.js 16.4.6 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Queue System**: Redis for background jobs (Part 3)
- **Storage**: File system for document uploads (Part 3)
- **Authentication**: JWT-based auth with encrypted credentials (Part 3)

### Production Considerations

- **Caching**: Redis for API responses and session management
- **Load Balancing**: Nginx or reverse proxy for traffic distribution
- **Monitoring**: Application insights and health checks
- **Security**: HTTPS, rate limiting, input validation
- **Backup**: Automated database backups

## Technology Decisions

### Why These Technologies?

**Next.js App Router**

- Superior to Pages Router for complex applications
- Better performance with Server Components
- Built-in routing and file-based API routes

**Redux Toolkit**

- Better developer experience than Zustand
- RTK Query for data fetching
- DevTools for debugging

**@dnd-kit**

- Better TypeScript support than React DnD
- More flexible drag-and-drop capabilities
- Follows modern web component patterns

**@xyflow/react**

- Professional graph visualization library
- Built-in interaction handlers
- Customizable appearance and behavior

**Prisma**

- Type-safe database access
- Excellent TypeScript integration
- Database-as-code approach

**Zod**

- Runtime type validation
- Excellent error messages
- Perfect for form validation

## Scaling Considerations

### Multi-tenancy Scaling

- **Database Sharding**: Shard organizations across databases
- **Read Replicas**: Use read replicas for high-read workloads
- **Cache Strategy**: Cache frequently accessed data by orgId

### Form Family Scaling

- **Lazy Loading**: Load form families on-demand
- **Pagination**: Use cursor-based pagination for large families
- **Index Optimization**: Ensure proper indexing on orgId and parentFormId

### GHL Integration Scaling

- **Rate Limiting**: Implement rate limiting for API calls
- **Batch Operations**: Use batch operations where possible
- **Retry Logic**: Implement exponential backoff for failed requests

## Monitoring & Observability

### Logging

- **Structured Logging**: JSON logs with correlation IDs
- **Audit Trail**: Log all data modifications
- **Performance Metrics**: Track API response times

### Metrics

- **Business Metrics**: Form creation, submissions, sync status
- **Technical Metrics**: API latency, error rates, database performance
- **User Metrics**: Session duration, feature usage

### Alerting

- **Error Alerts**: Automated alerts for system failures
- **Performance Alerts**: Warnings for slow operations
- **Usage Alerts**: Notifications for unusual activity

## Future Evolution (Part 2 & 3)

### Part 2 Enhancements

- Implement real drag-and-drop builder with smooth animations
- Build family graph visualization with zoom and pan
- Create responsive preview panels for desktop/mobile
- Implement form field library with search and filtering
- Add real-time collaboration features

### Part 3 Enhancements

- Implement real backend with authentication
- Add queue system for GHL sync jobs
- Integrate file storage system
- Implement OAuth2 flow for GHL connections
- Add advanced analytics and reporting

## Security Considerations

### Data Protection

- **Encryption**: All sensitive data encrypted at rest
- **Transport**: HTTPS for all API communications
- **Validation**: Input validation for all endpoints

### Access Control

- **RBAC**: Role-based access control at organization level
- **API Keys**: Rate limiting and API key authentication
- **Session Management**: Secure session handling with refresh tokens

### Compliance

- **GDPR**: User data privacy controls
- **SOC 2**: Security controls for financial services
- **HIPAA**: Healthcare data protection (if applicable)

This architecture provides a solid foundation for building a complex form management platform while maintaining clean separation of concerns and excellent developer experience.
