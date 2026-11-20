# FormFamily AGENTS.md

## Overview

This document describes the conventions, patterns, and development workflow for the FormFamily project. It serves as a comprehensive guide for AI agents and developers working on this codebase.

## Project Structure

### Directory Layout

```
formfamily/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (dashboard)/        # Dashboard pages
│   │   └── ...                 # Other page groups
│   ├── components/            # UI components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── layout/           # Layout components
│   │   ├── builder/          # Form builder components
│   │   ├── renderer/         # Form rendering components
│   │   └── ...               # Other component categories
│   ├── store/                 # Redux store
│   │   ├── slices/            # Redux slices
│   │   ├── api/               # RTK Query endpoints
│   │   └── ...                # Store configuration
│   ├── lib/                   # Business logic and utilities
│   │   ├── forms/            # Form resolution and validation
│   │   ├── ghl/              # GHL integration
│   │   ├── db/               # Database utilities
│   │   └── ...               # Other libraries
│   ├── types/                 # TypeScript type definitions
│   ├── data/                  # Mock data
│   ├── config/                # Project configuration
│   └── hooks/                 # Custom React hooks
├── prisma/                     # Database schema
│   ├── schema.prisma         # Prisma data model
│   └── seed.ts               # Seed data
├── docs/                      # Documentation
│   ├── PROJECT_CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── INHERITANCE_RULES.md
│   ├── DATA_MODEL.md
│   ├── GHL_INTEGRATION.md
│   ├── DECISIONS.md
│   └── PARTS.md
├── .gitignore
├── package.json
├── README.md
└── ...                        # Other config files
```

## Project docs (source of truth)

- `docs/PROJECT_CONTEXT.md` — product overview, builder, dashboard, multi-tenancy, and GHL integration context.
- `docs/INHERITANCE_RULES.md` — form family/inheritance rules (tree, propagation, locks, anchors, conflicts, versioning, delete/detach/reparent).
- `docs/DATA_MODEL.md` — core TypeScript types and Prisma schema.
- `docs/GHL_INTEGRATION.md` — GHL mapping/sync design and auth abstraction (design only in Part 1).
- `docs/ARCHITECTURE.md` — stack, folder structure, conventions, and data flow.
- `docs/PARTS.md` — scope of Part 1/2/3.
- `docs/DECISIONS.md` — decisions made and items deliberately deferred.

## Conventions

### 1. TypeScript Strict Mode

All TypeScript code uses strict mode:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    // ... other strict options
  }
}
```

**Rules:**

- No `any` type usage
- No implicit any
- No implicit this
- Proper null checking
- Enums over unions where appropriate

### 2. Absolute Imports with @/

All imports use absolute paths with the `@/` alias:

```typescript
// Instead of:
import { Button } from '@/components/ui/button';

// Use:
import { Button } from '@/components/ui/button';
```

### 3. Server Components by Default

Next.js uses Server Components by default:

```typescript
// Server Component (default)
export default function Layout({ children }) {
  return <div>{children}</div>;
}

// Client Component (needs 'use client')
'use client';
export default function ClientComponent() {
  return <div>Client side code</div>;
}
```

**Rules:**

- Only mark components as client-side when necessary
- Business logic lives in `src/lib`, not components
- Keep components thin and focused on presentation

### 4. Component Naming Convention

Component files are named by what they export:

```typescript
// File: src/components/ui/button.tsx
// Exports: Button (default export)

// File: src/components/builder/BuilderShell.tsx
// Exports: BuilderShell (named export)

// File: src/lib/forms/resolve.ts
// Exports: resolveForm (named export)
```

### 5. Business Logic in Libraries

All business logic lives in `src/lib`:

```typescript
// ❌ Wrong - Business logic in component
src / components / forms / FormLogic.tsx;

// ✅ Right - Business logic in lib
src / lib / forms / resolve.ts;
```

### 6. Validation with Zod

All boundary validation uses Zod:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const config = envSchema.parse(process.env);
```

### 7. Organization-Scoped Queries

All database queries are scoped by orgId:

```typescript
// ❌ Wrong - No org scoping
const forms = await prisma.form.findMany();

// ✅ Right - Org scoped query
const forms = await prisma.form.findMany({
  where: { orgId: request.orgId },
});
```

### 8. No Default Exports (Except Next.js)

Avoid default exports in non-Next.js files:

```typescript
// ❌ Wrong
export default function Component() { ... }

// ✅ Right
export function Component() { ... }
```

### 9. Accessibility Standards

- Keyboard-operable drag and drop (dnd-kit keyboard sensor)
- Visible focus indicators
- Labelled inputs with proper aria attributes
- Screen reader support

### 10. Design Principles

#### Color Scheme

- Clean and professional
- Neutral grey palette with one accent color
- Light theme first with dark-mode tokens ready
- Consistent with brand guidelines

#### Spacing Scale

- Generous spacing throughout
- Consistent margin and padding
- Responsive spacing for different screen sizes

#### Typography

- Inter font via next/font
- Clear hierarchy
- Good readability

## File Structure Guidelines

### Component Files

#### UI Components (`src/components/ui/`)

- Atomic design system components
- Based on shadcn/ui
- Accessible and customizable
- TypeScript strict

#### Layout Components (`src/components/layout/`)

- Sidebar, Topbar, PageHeader
- Responsive design
- Accessibility compliant

#### Builder Components (`src/components/builder/`)

- Palette, Canvas, PropertiesPanel
- Drag and drop interactions
- State management via Redux

#### Renderer Components (`src/components/renderer/`)

- FormRenderer, FieldRenderer
- Public form viewing
- Responsive design

### Library Files

#### Form Logic (`src/lib/forms/`)

- Pure functions only
- No React dependencies
- Unit tested
- Reusable across contexts

#### GHL Integration (`src/lib/ghl/`)

- Authentication
- API client
- Field mapping
- Type definitions

#### Database (`src/lib/db/`)

- Prisma client singleton
- Database utilities
- Connection management

### Store Files

#### Slices (`src/store/slices/`)

- Individual Redux slice files
- Typed state and actions
- Reducers with TypeScript

#### API (`src/store/api/`)

- RTK Query endpoints
- Placeholder for Part 3
- Typed responses

## Development Workflow

### 1. Testing Strategy

#### Unit Tests

- Location: `src/lib/forms/__tests__/`
- Pure functions only
- Vitest with @testing-library/react
- All tests must pass

#### Component Tests

- Location: `src/components/`
- Integration tests
- Accessibility testing
- Interactive testing

#### Integration Tests

- Location: `e2e/`
- User workflow testing
- API integration testing
- End-to-end scenarios

### 2. Development Process

#### Feature Implementation

1. **Plan** - Document requirements and design
2. **Implement** - Build in small, testable increments
3. **Test** - Write comprehensive tests
4. **Validate** - Ensure all acceptance criteria met
5. **Document** - Update relevant documentation

#### Code Review

1. **Type Check** - Run `pnpm typecheck`
2. **Lint** - Run `pnpm lint`
3. **Test** - Run `pnpm test`
4. **Peer Review** - Code review with team
5. **Merge** - Integrate changes

### 3. Testing Commands

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Unit tests
pnpm test

# Component tests
pnpm test:components

# End-to-end tests
pnpm test:e2e
```

## API Design

### REST API Principles

1. **Resource URLs**
   - `/api/forms` - Collection resource
   - `/api/forms/{id}` - Single resource
   - `/api/forms/{id}/publish` - Action resource

2. **HTTP Methods**
   - `GET` - Read operations
   - `POST` - Create operations
   - `PUT` - Update operations
   - `DELETE` - Delete operations

3. **Request/Response**
   - Request: JSON body with validation
   - Response: JSON with status code
   - Error: Descriptive error messages

### Error Handling

#### Success Responses

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

#### Error Responses

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human readable error message",
  "details": { ... }
}
```

### Rate Limiting

```typescript
// Rate limit headers
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## Performance Optimization

### 1. Database Optimization

#### Indexing

- Create indexes for frequently queried fields
- Use composite indexes for compound queries
- Avoid N+1 queries

#### Query Optimization

- Use select statements with specific fields
- Implement caching for frequent queries
- Use efficient JOINs

### 2. Application Performance

#### Caching Strategy

- Cache frequently accessed data
- Use Redis for session management
- Implement CDN for static assets

#### Image Optimization

- Compress images
- Use responsive image techniques
- Lazy load images

### 3. Build Optimization

#### Code Splitting

- Split code by route
- Lazy load components
- Optimize bundle size

#### Tree Shaking

- Remove unused exports
- Minimize bundle size
- Optimize dependency tree

## Security

### 1. Input Validation

#### All Inputs

- Validate all API inputs with Zod
- Sanitize user inputs
- Use parameterized queries
- Implement CSRF protection

### 2. Authentication

#### JWT Tokens

- Secure token storage
- Token expiration
- Refresh tokens
- Token validation

### 3. Authorization

#### Role-Based Access

- Implement RBAC
- Check permissions before operations
- Use middleware for protected routes

## Deployment

### 1. Environment Configuration

#### Environment Variables

```bash
# .env.example
DATABASE_URL=postgresql://user:pass@localhost:5432/formfamily
NEXT_PUBLIC_APP_URL=https://app.formfamily.com
ENCRYPTION_KEY=your-32-char-encryption-key
GHL_API_BASE_URL=https://api.gohighlevel.com/v1
```

#### Environment Validation

```typescript
// src/lib/env.ts
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  ENCRYPTION_KEY: z.string().min(32),
  GHL_API_BASE_URL: z.string().url().optional(),
});
```

### 2. Production Optimization

#### Static Assets

- Compress static files
- Use gzip compression
- Set cache headers
- Minify CSS/JS

#### Database Optimization

- Optimize queries
- Use connection pooling
- Monitor performance
- Set up alerts

### 3. Monitoring

#### Health Checks

```http
GET /api/health
Response: { "status": "ok", "timestamp": "2024-01-01T00:00:00Z" }
```

#### Metrics

- Response times
- Error rates
- Database performance
- Application metrics

## Future Extensibility

### 1. API Evolution

- Use version prefixes for API changes
- Maintain backward compatibility
- Deprecate old endpoints gracefully
- Document API changes

### 2. Database Evolution

- Use migrations for schema changes
- Implement backward compatibility
- Consider denormalization for performance
- Plan for scale

### 3. Code Evolution

- Use feature flags for new features
- Implement gradual rollout
- Monitor adoption metrics
- Plan for deprecation

## Conclusion

This AGENTS.md provides comprehensive guidelines for developing the FormFamily application. It ensures:

1. **Consistency** - All code follows the same patterns
2. **Quality** - High standards for code quality and testing
3. **Maintainability** - Easy to understand and modify
4. **Scalability** - Architecture supports growth
5. **Security** - Security considerations built in
6. **Performance** - Optimized for good user experience

Following these guidelines ensures the FormFamily application is built to high standards and can be maintained and extended effectively.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
