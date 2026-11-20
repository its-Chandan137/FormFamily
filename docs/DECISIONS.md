# FormFamily Development Decisions

This document records the key architectural and technical decisions made during the development of FormFamily, along with the rationale behind each decision.

## Project Structure Decisions

### 1. Use Next.js App Router

**Decision:** Use Next.js App Router instead of Pages Router

**Rationale:**

- App Router provides better performance with Server Components
- Simpler routing and file-based API routes
- Better TypeScript integration
- Modern development experience
- Better support for complex applications

**Trade-offs:**

- Learning curve for developers familiar with Pages Router
- Some breaking changes in API (e.g., `getStaticProps`, `getServerSideProps`)
- Need to adapt existing patterns

**Impact:**

- Cleaner codebase
- Better performance
- Modern development experience
- Easier to maintain and extend

### 2. Choose Redux Toolkit Over Zustand

**Decision:** Use Redux Toolkit with RTK Query instead of Zustand for state management

**Rationale:**

- Redux Toolkit provides better developer tools and debugging
- RTK Query for data fetching and caching
- Better TypeScript support
- Scalable for complex applications
- Industry standard for enterprise applications

**Trade-offs:**

- More boilerplate code
- Steeper learning curve
- More complex setup

**Impact:**

- Better developer experience
- More robust state management
- Better testability
- Easier team collaboration

### 3. Use Prisma as Primary Database Access

**Decision:** Use Prisma ORM as the primary database access layer

**Rationale:**

- TypeScript-first approach
- Database-as-code philosophy
- Excellent developer experience
- Automatic type generation
- Active community and support

**Trade-offs:**

- Potential performance overhead
- Learning curve for SQL
- Dependency on Prisma ecosystem

**Impact:**

- Type safety throughout
- Reduced boilerplate
- Easier database migrations
- Better maintainability

### 4. Choose Tailwind CSS with shadcn/ui

**Decision:** Use Tailwind CSS with shadcn/ui components

**Rationale:**

- Consistent, professional UI
- Rapid UI development
- Excellent accessibility
- Dark mode support
- Community-driven component library

**Trade-offs:**

- Learning curve for Tailwind utilities
- Component customization requires understanding of Tailwind
- Potential design consistency issues

**Impact:**

- Modern, professional appearance
- Faster development
- Better user experience
- Consistent design system

## Architecture Decisions

### 1. Pure Functions in `src/lib/forms/`

**Decision:** Place business logic in pure functions rather than React components

**Rationale:**

- Testability: Pure functions are easier to unit test
- Reusability: Can be used in different contexts (client, server)
- Maintainability: Clear separation of concerns
- Performance: No React overhead for logic

**Trade-offs:**

- More upfront development
- Requires careful API design
- Need to think about both client and server usage

**Impact:**

- High-quality, maintainable code
- Excellent test coverage
- Flexible architecture
- Better performance

### 2. Separation of Concerns

**Decision:** Separate API layer, business logic, and presentation layers

**Rationale:**

- Clear responsibilities
- Easier to test and maintain
- Better performance optimization
- Team collaboration
- Scalability

**Trade-offs:**

- More files to manage
- Requires more planning
- Potentially more complex setup

**Impact:**

- Clean, maintainable architecture
- Better test coverage
- Easier to scale
- Better team collaboration

### 3. Comprehensive Documentation

**Decision:** Create extensive documentation for all components

**Rationale:**

- Knowledge transfer
- Onboarding new team members
- Long-term maintainability
- Better decision making
- Reduced technical debt

**Trade-offs:**

- Time investment upfront
- Maintenance burden
- Risk of documentation becoming outdated

**Impact:**

- Better team productivity
- Easier maintenance
- Better knowledge sharing
- Reduced technical debt

## Technical Decisions

### 1. JSONB for Flexible Data Storage

**Decision:** Use PostgreSQL JSONB for flexible data storage

**Rationale:**

- Schema evolution without database migrations
- Fast querying for nested data
- Built-in indexing support
- Good performance for semi-structured data

**Trade-offs:**

- Can be slower for some queries
- Need to use proper indexing
- Complexity in data validation

**Impact:**

- Flexible data model
- Easy schema evolution
- Good performance for typical use cases

### 2. Anchor-Based Form Ordering

**Decision:** Use anchor-based ordering for form items

**Rationale:**

- Intuitive for users
- Flexible positioning
- Supports complex layouts
- Easy to understand

**Trade-offs:**

- More complex implementation
- Need for fallback logic
- Can be difficult to reason about

**Impact:**

- Powerful form layout capabilities
- User-friendly positioning
- Support for complex scenarios

### 3. Impact Preview Feature

**Decision:** Implement impact preview for parent form changes

**Rationale:**

- Prevents accidental data loss
- Better user experience
- Clear communication of effects
- Encourages careful changes

**Trade-offs:**

- More complex implementation
- Performance impact for large families
- UI complexity

**Impact:**

- Safer form management
- Better user experience
- Reduced accidental changes
- Clear communication

### 4. Encrypted Credential Storage

**Decision:** Encrypt GHL credentials at rest

**Rationale:**

- Security best practice
- Compliance requirements
- Prevention of credential leaks
- Future-proofing

**Trade-offs:**

- Requires encryption key management
- Slight performance overhead
- Complexity in authentication flow

**Impact:**

- Better security
- Compliance
- Peace of mind
- Future-proofing

## Development Process Decisions

### 1. Parallel Development

**Decision:** Develop different components in parallel

**Rationale:**

- Faster delivery
- Independent progress
- Better resource utilization
- Risk mitigation

**Trade-offs:**

- Requires careful coordination
- Integration challenges
- Need for clear interfaces

**Impact:**

- Faster delivery
- Independent progress
- Better risk management
- Efficient resource use

### 2. Comprehensive Testing

**Decision:** Write extensive tests for all components

**Rationale:**

- Quality assurance
- Reduced technical debt
- Better maintainability
- Developer confidence

**Trade-offs:**

- Time investment
- Maintenance burden
- Focus on test quality over quantity

**Impact:**

- High-quality code
- Reduced bugs
- Better maintainability
- Developer confidence

## Future-Proofing Decisions

### 1. Modular Architecture

**Decision:** Design modular, extensible architecture

**Rationale:**

- Easy to add new features
- Reduced technical debt
- Better testability
- Easier scaling

**Trade-offs:**

- More upfront design
- Potential over-engineering
- Need for clear interfaces

**Impact:**

- Easy to extend
- Reduced technical debt
- Better long-term maintainability
- Easier to scale

### 2. Comprehensive Documentation

**Decision:** Document all decisions and rationale

**Rationale:**

- Knowledge transfer
- Better decision making
- Reduced regret
- Team alignment

**Trade-offs:**

- Time investment
- Maintenance burden
- Risk of becoming outdated

**Impact:**

- Better team alignment
- Better decision making
- Reduced regret
- Long-term benefits

## Technology Stack Decisions

### 1. TypeScript Strict

**Decision:** Use TypeScript strict mode

**Rationale:**

- Catch errors early
- Better developer experience
- Improved maintainability
- Better IDE support

**Trade-offs:**

- More strictness
- Need to fix type errors
- Learning curve for some developers

**Impact:**

- Fewer runtime errors
- Better developer experience
- Improved maintainability
- Better code quality

### 2. ESLint and Prettier

**Decision:** Use ESLint and Prettier for code quality

**Rationale:**

- Consistent code style
- Early error detection
- Better team collaboration
- Professional appearance

**Trade-offs:**

- Configuration overhead
- Need to fix linting errors
- Potential over-constraint

**Impact:**

- Consistent code style
- Early error detection
- Better collaboration
- Professional appearance

### 3. Vitest for Testing

**Decision:** Use Vitest for testing

**Rationale:**:

- Fast test execution
- Excellent TypeScript integration
- Modern testing approach
- Good documentation

**Trade-offs:**:

- Different API than Jest
- Younger ecosystem
- Need to learn new patterns

**Impact:**:

- Fast tests
- Good integration
- Modern approach
- Good documentation

## Implementation Decisions

### 1. Stub Implementation for Part 1

**Decision:** Implement stubs and placeholders for Part 1

**Rationale:**:

- Meet acceptance criteria
- Provide foundation for Part 2
- Allow for iterative development
- Manage complexity

**Trade-offs:**:

- Need to fill in later
- Potential technical debt
- Need to maintain consistency

**Impact:**:

- Met acceptance criteria
- Provides foundation
- Allows iterative development
- Manages complexity

### 2. Mock Data for Testing

**Decision:** Use mock data for development and testing

**Rationale:**:

- Faster development
- Better control over test scenarios
- No external dependencies
- Reproducible tests

**Trade-offs:**:

- Not testing real data scenarios
- Need to maintain mock data
- Potential data inconsistency

**Impact:**:

- Faster development
- Better control
- No external dependencies
- Reproducible tests

## Security Decisions

### 1. Input Validation

**Decision:** Validate all inputs with Zod

**Rationale:**:

- Security by default
- Early error detection
- Consistent validation
- Type safety

**Trade-offs:**:

- Need to define schemas
- Validation overhead
- Maintenance burden

**Impact:**:

- Better security
- Early error detection
- Consistent validation
- Type safety

### 2. Rate Limiting

**Decision:** Implement rate limiting for API endpoints

**Rationale:**:

- Prevent abuse
- Protect resources
- Maintain service quality
- Industry standard

**Trade-offs:**:

- Implementation complexity
- Configuration overhead
- Need for monitoring

**Impact:**:

- Better security
- Resource protection
- Quality maintenance
- Industry compliance

### 3. Audit Logging

**Decision:** Implement comprehensive audit logging

**Rationale:**:

- Compliance
- Debugging
- Accountability
- Future requirements

**Trade-offs:**:

- Performance overhead
- Storage requirements
- Implementation complexity

**Impact:**:

- Better compliance
- Easier debugging
- Accountability
- Future-proofing

## Performance Decisions

### 1. Caching Strategy

**Decision:** Implement caching for frequently accessed data

**Rationale:**:

- Better performance
- Reduced database load
- Faster response times
- Scalability

**Trade-offs:**:

- Cache invalidation complexity
- Consistency vs performance
- Implementation complexity

**Impact:**:

- Better performance
- Reduced database load
- Faster responses
- Better scalability

### 2. Database Indexing

**Decision:** Create comprehensive database indexes

**Rationale:**:

- Fast query performance
- Efficient data access
- Scalability
- Better user experience

**Trade-offs:**:

- Storage overhead
- Maintenance overhead
- Index management complexity

**Impact:**:

- Fast queries
- Efficient access
- Better scalability
- Better user experience

## Documentation Decisions

### 1. Live Documentation

**Decision:** Keep documentation live and up-to-date

**Rationale:**:

- Knowledge base
- Team alignment
- Better decision making
- Reduced onboarding time

**Trade-offs:**:

- Maintenance overhead
- Risk of becoming outdated
- Need for updates

**Impact:**:

- Knowledge base
- Team alignment
- Better decisions
- Better onboarding

### 2. Example Documentation

**Decision:** Include examples in all documentation

**Rationale:**:

- Better understanding
- Easier implementation
- Reduced ambiguity
- Faster development

**Trade-offs:**:

- Maintenance overhead
- Risk of becoming outdated
- Need for regular updates

**Impact:**:

- Better understanding
- Easier implementation
- Reduced ambiguity
- Faster development

## Part 2 Decisions / Adjustments

- **Mock-first architecture**: introduced `src/services/*` repository interfaces + in-memory async implementations (300–600ms delay) and a Redux client store with thunks/selectors as the data source for the UI. This keeps Part 3 swap (API/RTK Query/Prisma/GHL) localized to services/thunks.
- **Persistence**: added a single `src/lib/persistence.ts` helper and versioned localStorage key (`PERSISTENCE_KEY`) to persist demo state across refresh; added Reset demo data (topbar + settings).
- **Anchor semantics**: added `START_ANCHOR = '__start__'` constant (`insertAfter: null` = end, `START_ANCHOR` = top) and documented it; root items persist anchors for a uniform model.
- **Type additions (Part 2)**: added `FormRecord` for in-memory form state (versions + draft), propagated `validation` to `OwnField`/`ResolvedField` for schema/renderer support, and added optional `ghlSyncError` on submissions for mocked failure messages.
- **Pure logic API notes**: `snapshotInherited` implemented as `snapshotInherited(chain, formIds)` (takes resolved chain context) to produce a standalone snapshot; added chain/publish helpers and diff helper under `src/lib/forms`. All `src/lib/forms` tests are real and passing.
- **UI/primitives**: followed generated shadcn/ui base-ui component APIs (e.g. no Radix `asChild` assumptions) and kept business logic in `src/lib`/store/services.
- **Scope**: no database, auth, queues, file/object storage, or GHL network calls added; Part 1 API route stubs left in place.

## Part 2b Decisions / Adjustments

- **Builder architecture:** refactored builder into modular components with `builderSlice` owning draft history (`past/present/future`, capped/coalesced edits, reset on form switch/publish) and UI state (selection, preview mode, autosave status/error). DnD implemented with `@dnd-kit` sensors/collision/overlay and explicit slot-based insertion (`START_ANCHOR`/`insertAfter`) to preserve anchor semantics.
- **Rich text and sanitization:** adopted Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`) for builder about/richtext editing and added `sanitizeHtml` (`isomorphic-dompurify`) for safe public/applicant rendering of settings/about and richtext HTML; unit-tested script/inline-handler stripping.
- **Versioning/publish behavior:** extended diff/chain/publish helpers to support described impact and version-history comparisons and deterministic version identifiers in mock publish flow; conflict merge/publish orchestration remains mock-first via repositories + Redux while preserving documented inheritance rules.
- **Quality/tooling:** restored stricter linting in targeted core paths (including `@typescript-eslint/no-explicit-any` enforcement in core library/store/service/type areas) and fixed hook-related issues; added Playwright (`@playwright/test`, Chromium) e2e suite for required demo flows. Remaining lint warnings (outside strict-failure scope) were not mass-suppressed.
- **Screen states and resilience:** standardized loading/empty/error-with-retry UI patterns (shared components) across app screens and added bootstrap load-error handling/retry in UI state/store flow; mock autosave supports a debug failure flag to exercise retry UX.
- **No rule changes:** `docs/INHERITANCE_RULES.md` and core inheritance/publish/versioning semantics were not changed; implementation choices align existing rules with Part 2b UX requirements.

## Part 2.5 Decisions / Adjustments (Design System and Demo Polish)

- **Design tokens and theme:** replaced global styles with spec-aligned CSS variables mapped into Tailwind/shadcn tokens (light/dark neutrals, indigo accent, semantic and inheritance/teal tokens, radii, shadows, focus ring, motion/reduced-motion). Integrated `next-themes` (`ThemeProvider`, light default, system enabled) and added Inter + JetBrains Mono via `next/font`; set `next.config.ts` `devIndicators: false` for demo recordings.
- **Shared status semantics:** added `src/lib/forms/status.ts` (`getFormStatus`, `getFormStatusLabel`, `isNeverPublished`) so forms with no `publishedVersionId` resolve to **Draft** (not unpublished changes). Applied consistently in dashboard/forms/families/builder displays and related filtering/attention logic.
- **Graph edge visibility:** fixed family graph edge rendering by synchronizing node handle positions in both node data and React Flow node positions, syncing layouted nodes/edges via `useEffect`, and rendering `smoothstep` edges with explicit stroke/marker styling.
- **UI primitives and shared components:** restyled core shadcn/base-ui primitives (button, badge, card, input, select, table, dropdown imports) toward token-based design. Added shared components including `StatusBadge`, `StatCard`, `Callout`, `Avatar`, `Kbd`, `Stepper`, `SegmentedControl`, `FieldTypeIcon`, `InheritanceLegend`, and upgraded `PageHeader`/`ScreenStates` (empty/error/skeleton patterns).
- **App shell and navigation:** redesigned dashboard layout with icon sidebar/rail, org switcher, grouped workspace/setup navigation, bottom settings/user menu, breadcrumbs, search affordance opening command palette (`cmdk`, Cmd+K), notifications popover, theme toggle, mobile sheet navigation, and confirmation for demo reset actions. "Create form" removed from primary nav (route preserved) and emphasized as action.
- **Screen redesigns (implemented/polished):** updated dashboard, forms list (hierarchy/indentation cues, labeled filters, list/cards view, improved empty states), create form flow, family graph presentation/drawer, public form wrapper/success states, auth and landing pages, settings, submissions, field library, and GHL integration screens for visual consistency and clearer hierarchy. Builder/public behavior and e2e-critical flows/selectors were preserved where possible (including e2e reset helper adaptation for confirmation dialog).
- **Demo/data/docs:** confirmed no junk form named exactly `Name` in mock dataset; retained deterministic Part 2 scenarios. Added `docs/DEMO_SCRIPT.md` and screenshot directories (`docs/screenshots/before`, `docs/screenshots/after`). No `accentColor` field was added to form settings/types in this pass (noted for follow-up if desired). No `recharts` or `@axe-core/playwright` packages were added.
- **Constraints preserved:** no backend/auth/queues/storage/GHL network calls; `src/lib/forms` inheritance/publish/versioning logic and `docs/INHERITANCE_RULES.md` unchanged except shared status presentation helper usage; mock-first repository/Redux architecture retained.

## Summary

These decisions reflect a balance between technical excellence, practical considerations, and future requirements. Part 2/2b/2.5 deliver a demo-ready mock-first frontend with pure, testable domain logic, stronger builder UX, and a substantially polished design system and demo experience, with a clear path to Part 3 backend/GHL integration.
