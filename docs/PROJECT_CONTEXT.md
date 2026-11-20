# FormFamily Project Context

## Overview

FormFamily is a multi-tenant web platform where companies create dynamic forms with a drag-and-drop builder and connect them to GoHighLevel (GHL), a CRM. Think WordPress-style flexibility with a much cleaner, professional, uncluttered UI.

## Main Example

**Hiring**: A company builds an application form for a Frontend Developer role with a logo, company name, first name, last name, about text, resume upload, current company, experience and current CTC. They publish it, share the link with applicants, and each submission lands in the platform and in GHL as a contact. A dashboard shows all forms and, for each form, the candidates who applied.

## Key Features

- **Drag-and-drop form builder** with a searchable field palette
- **Form inheritance** system for creating form families
- **Multi-tenant architecture** supporting multiple companies
- **GHL integration** for CRM synchronization
- **Version control** with published and draft versions
- **Impact preview** showing which forms are affected by parent changes
- **Responsive preview** for desktop and mobile viewing
- **Real-time autosave** to prevent data loss

## Technology Stack

- **Framework**: Next.js (App Router) with React and TypeScript
- **State Management**: Redux Toolkit with RTK Query
- **Drag-and-drop**: @dnd-kit/core, @dnd-kit/sortable
- **Graph Visualization**: @xyflow/react and @dagrejs/dagre
- **Rich Text**: @tiptap/react with @tiptap/starter-kit
- **Styling**: Tailwind CSS with shadcn/ui
- **Form Validation**: Zod with react-hook-form
- **Database**: Prisma with PostgreSQL
- **Testing**: Vitest with @testing-library/react

## Architecture

The platform is structured around three main parts:

1. **Part 1 (This)**: Project setup, types, configuration, stubs, and documentation
2. **Part 2**: Complete frontend with static data and interactive components
3. **Part 3**: Real backend, authentication, and GHL integration

## Folder Structure

```
src/
├── app/                    # Next.js pages (App Router)
├── components/             # UI components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components (Sidebar, Topbar)
│   ├── builder/           # Form builder components
│   ├── renderer/          # Form rendering components
│   ├── family/            # Family graph components
│   └── ...               # Other component categories
├── store/                  # Redux store and slices
├── lib/                    # Business logic and utilities
│   ├── forms/            # Form resolution, inheritance, validation
│   ├── ghl/              # GHL integration modules
│   ├── db/               # Database utilities
│   └── ...               # Other libraries
├── types/                  # TypeScript type definitions
├── data/                   # Mock data (for Part 2)
├── hooks/                  # Custom React hooks
└── ...
```

## Inheritance Rules

FormFamily uses a sophisticated inheritance system:

1. **Tree Structure**: One parent per form, many children, no multiple inheritance. Maximum depth is 5 levels.
2. **Store Differences**: Forms store only their own contribution; final form is computed by merging from root to leaf.
3. **Downward Propagation Only**: Editing a parent changes all descendants; editing a child never changes its parent or siblings.
4. **What a Child Can Do**:
   - Change labels, text and settings (logo, company name, about)
   - Add its own fields and elements
   - Hide an inherited field
   - Mark an inherited field as optional (not required)
5. **What a Child Cannot Do**:
   - Remove an inherited field (can only hide it)
   - Change a locked field
6. **Locked Fields**: A parent can lock a field (for example a legal consent checkbox). A locked field cannot be edited, hidden or made optional in any descendant. Locks propagate down the subtree.
7. **Published Versions Only**: A child resolves against its ancestors' published versions, never their drafts.
8. **Impact Preview**: Before publishing a parent change, show which forms are affected.

## GHL Integration

FormFamily integrates with GoHighLevel (GHL) CRM:

- **Form Builder**: Forms are built and hosted in our app. GHL does not store or display the form layout.
- **Contact Data**: Each submission creates or updates a GHL contact, with answers going into mapped custom fields.
- **Field Mapping**: We keep one canonical field dictionary (the field library) and a mapping table from field key to GHL custom field ID, per organization.
- **Sync Status**: Submissions have sync status (synced, pending, failed) with retry logic.
- **File Storage**: Resumes and other files are stored in our own file storage and sent to GHL as a link in a custom field.

## Multi-tenancy

The platform supports multiple companies:

- **Organization Model**: Each company is an organization with its own forms, users, and settings
- **Data Isolation**: Every query is scoped by orgId to ensure data isolation
- **Roles**: Users have roles (owner, admin, editor) within organizations
- **Field Library**: Fields can be platform-wide (orgId null) or organization-specific

## Testing

The project uses Vitest for testing:

- **Unit Tests**: Pure functions in src/lib/forms/ are thoroughly tested
- **Component Tests**: React components are tested with @testing-library/react
- **Integration Tests**: API routes and business logic are tested end-to-end

## Deployment

The platform can be deployed to various platforms:

- **Vercel**: Recommended for Next.js applications
- **AWS**: Can be deployed to EC2 with a reverse proxy
- **Azure**: Can be deployed to App Service or Azure Container Instances

## Future Work (Part 2 & 3)

**Part 2**: Implement the complete frontend with static data and mock APIs
**Part 3**: Implement real backend, authentication, and full GHL integration

## API Documentation

The API follows RESTful conventions:

- **GET** /api/health - Health check endpoint
- **GET** /api/forms - List forms with pagination
- **POST** /api/forms - Create new form
- **GET** /api/forms/{id} - Get form by ID
- **PUT** /api/forms/{id} - Update form
- **DELETE** /api/forms/{id} - Delete form
- **POST** /api/forms/{id}/publish - Publish form
- **POST** /api/forms/{id}/detach - Detach form from family
- **GET** /api/fields - Get field library
- **POST** /api/fields - Create new field
- **POST** /api/public/forms/{slug}/submit - Submit form
- **POST** /api/ghl/connect - Connect GHL account
- **GET** /api/ghl/fields - Get GHL custom fields
- **POST** /api/ghl/mappings - Create field mapping
