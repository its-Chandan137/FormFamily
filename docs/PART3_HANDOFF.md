# Part 3 Handoff — FormFamily (from Part 2b mock-first frontend)

This document describes how to migrate the current **Part 2b mock-first** implementation to Part 3 (real backend, auth, persistence, RTK Query, and GHL integration). It is based on the current repository state in `formfamily/` as of Part 2b completion.

## Scope and invariants carried forward

- **No rule/data-shape regressions without recording:** inheritance, propagation, publish/conflict, delete/detach/reparent, anchors (`START_ANCHOR` / `insertAfter: null`), version snapshots, and locked/override semantics remain governed by `docs/INHERITANCE_RULES.md` and existing pure logic in `src/lib/forms/*` unless explicitly changed and recorded in `docs/DECISIONS.md`.
- **Part 2 frontend behavior is the UX baseline:** builder DnD, impact/conflict dialogs, version history/preview, public submit/version pinning, GHL mapping review flow, and screen states/a11y/responsive behavior should be preserved while swapping data sources.
- **Mock-only concerns to remove in Part 3:** in-memory repositories, localStorage bootstrap/persistence, simulated delays, debug autosave failure flag, and placeholder auth.

## Current mock-first architecture (what exists now)

- **UI/data flow:** React/Next.js App Router pages and components → Redux Toolkit store (`src/store/*`) → async thunks → in-memory repositories (`src/services/*Repository.ts`, singletons in `src/services/index.ts`) seeded from `src/data/mock/*` or hydrated from localStorage.
- **Bootstrap/persistence:** `StoreProvider` dispatches `bootstrapApp()` once on mount and subscribes to store changes to debounce-persist demo state to localStorage (`PERSISTENCE_KEY`). `resetDemoData()` clears persisted state and reseeds.
- **Domain logic (keep/reuse):** pure functions in `src/lib/forms/*` (resolve, anchors, chain/tree, diff/impact, conflicts, publish/propagation helpers, snapshot, zod schema builder, validation helpers) with unit tests in `src/lib/forms/__tests__` and `src/lib/__tests__`.
- **Current API routes:** stubs under `src/app/api/**/route.ts` (health/forms/fields/ghl/public submit) — not used by the Part 2 UI; replace with real handlers in Part 3.

## Service → API mapping (HTTP + Zod I/O)

Define request/response Zod schemas in a shared server/client-safe module (e.g. `src/lib/api/contracts/*` or `src/types/api/*`) and validate on both boundaries. All routes must be **org-scoped** and authenticated (derive `orgId` from session; never trust client `orgId` except where explicitly safe for platform-level reads).

> IDs/timestamps/content shapes below follow current types in `src/types/*` and repository behavior. Adjust only with documented decisions.

### Forms (`src/services/formsRepository.ts` → `/api/forms`)

| Current repo method                  | HTTP endpoint                               | Request (Zod intent)                                                                                                                                | Response (Zod intent)                                                                               | Notes                                                                                                                                                                                                                       |
| ------------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list()`                             | `GET /api/forms`                            | query: optional filters later (`q`, `status`, `family`) — none required now                                                                         | `{ forms: FormRecord[] }`                                                                           | Org-scoped list; include versions + draft metadata needed by UI.                                                                                                                                                            |
| `getById(id)`                        | `GET /api/forms/:formId`                    | params `{ formId }`                                                                                                                                 | `{ form: FormRecord }` or 404                                                                       | Used by builder/submission views.                                                                                                                                                                                           |
| `getBySlug(slug)`                    | `GET /api/public/forms/:slug` (public)      | params `{ slug }`                                                                                                                                   | `{ form: PublicFormPayload }` (published version snapshot/content metadata only) or 404/unavailable | Public route must not expose drafts/private data; return published snapshot + display settings needed by renderer.                                                                                                          |
| `create(input)`                      | `POST /api/forms`                           | body `{ name, slug, parentFormId?: string                                                                                                           | null, content?: FormContent }`                                                                      | `{ form: FormRecord }` (201)                                                                                                                                                                                                | Server enforces slug uniqueness (org), parent validity, depth/cycle rules as applicable.                                                                           |
| `updateDraft(formId, draft)`         | `PATCH /api/forms/:formId/draft` (or `PUT`) | params `{ formId }`, body `{ draft: FormContent }`                                                                                                  | `{ form: FormRecord }`                                                                              | Autosave endpoint; idempotent for same draft; optimistic UI in client.                                                                                                                                                      |
| `save(form)` / `saveMany(forms)`     | **No direct public 1:1 API**                | —                                                                                                                                                   | —                                                                                                   | Replace with specific mutation endpoints (publish, detach, delete strategy application, conflict merge application) executed in server transactions. `saveMany` is a mock persistence convenience.                          |
| `publish(formId, options?)`          | `POST /api/forms/:formId/publish`           | params `{ formId }`, body `{ content?: FormContent, conflictResolutions?: ConflictMergePlan }` (server should prefer canonical draft/conflict plan) | `{ form: FormRecord, affectedForms?: FormRecord[], publishedVersion: FormVersion }`                 | **Transactional:** validate draft, detect conflicts (or apply agreed merges), create new version/snapshot, propagate descendant snapshot recomputation, clear draft. Use `src/lib/forms/publish-flow.ts` logic server-side. |
| `detach(formId)`                     | `POST /api/forms/:formId/detach`            | params `{ formId }`                                                                                                                                 | `{ form: FormRecord }`                                                                              | **Transactional:** snapshot inherited into own content as per rules, set `parentFormId=null`; keep children attached to detached form.                                                                                      |
| `delete(formId, options?)`           | `DELETE /api/forms/:formId`                 | params `{ formId }`, body/query `{ childrenStrategy: 'standalone'                                                                                   | 'reparent', keepInheritedAsOwn?: boolean, confirmName: string }`                                    | `{ deletedFormId: string, updatedChildren?: FormRecord[] }`                                                                                                                                                                 | **Transactional:** validate name confirmation and strategy constraints (cycle/depth/reparent target), transform children, delete form, cascade/cleanup as defined. |
| `reset()` / `seed(forms)`            | **dev/test only** (do not expose in prod)   | —                                                                                                                                                   | —                                                                                                   | Replace with seed scripts/fixtures.                                                                                                                                                                                         |
| `setDebugFailNextDraftSave(enabled)` | **remove**                                  | —                                                                                                                                                   | —                                                                                                   | Test/dev harness only; use network mocking or test flags instead.                                                                                                                                                           |

### Fields / Field library (`src/services/fieldsRepository.ts`)

| Current repo method | HTTP endpoint      | Request (Zod intent)                                       | Response (Zod intent)              | Notes                                                                              |
| ------------------- | ------------------ | ---------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| `list(orgId?)`      | `GET /api/fields`  | query optional `{ scope?: 'platform'                       | 'org'                              | 'all' }`                                                                           | `{ fields: FieldDefinition[] }` | Return platform + org-scoped fields visible to user. |
| `create(input)`     | `POST /api/fields` | body `{ orgId?, key, label, type, options?, validation? }` | `{ field: FieldDefinition }` (201) | Validate key format/uniqueness within scope; server sets canonical ids/timestamps. |
| `seed/reset`        | dev/test only      | —                                                          | —                                  | Remove from runtime.                                                               |

### Submissions (`src/services/submissionsRepository.ts`)

| Current repo method           | HTTP endpoint                                                                                        | Request (Zod intent)                                                                                         | Response (Zod intent)                                       | Notes                                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list()`                      | `GET /api/submissions`                                                                               | query filters `{ formId?, syncStatus?, q?, from?, to? }`                                                     | `{ submissions: Submission[] }` (paginated in prod)         | Org-scoped; consider pagination/cursor.                                                                                                             |
| `listByForm(formId)`          | `GET /api/forms/:formId/submissions` (or query on list)                                              | params `{ formId }`                                                                                          | `{ submissions: Submission[] }`                             | Per-form submissions view.                                                                                                                          |
| `create(input)`               | `POST /api/public/forms/:slug/submit` (public) and/or internal create                                | body `{ answers, versionId/token? }` validated against resolved published snapshot schema (`buildZodSchema`) | `{ submission: Submission, successMessage?: string }` (201) | **Server must pin to published version/snapshot at submit time**, store answers + `formVersionId`, enqueue GHL sync job; return sync-pending state. |
| `updateSyncStatus(id,status)` | internal/job endpoint or `POST /api/submissions/:id/retry-sync` (user action) + webhook/job callback | params/body as needed                                                                                        | `{ submission: Submission }`                                | Public/user-facing "retry" should enqueue job, not directly force synced except in mock/dev.                                                        |
| `seed/reset`                  | dev/test only                                                                                        | —                                                                                                            | —                                                           | Remove from runtime.                                                                                                                                |

### GHL integration (`src/services/ghlRepository.ts`)

| Current repo method         | HTTP endpoint                          | Request (Zod intent)                                        | Response (Zod intent)                   | Notes                                                                                                                         |
| --------------------------- | -------------------------------------- | ----------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `getConnection()`           | `GET /api/ghl/connection`              | —                                                           | `{ connection: GhlConnectionState }`    | Never return raw tokens/secrets.                                                                                              |
| `validateConnection(input)` | `POST /api/ghl/connect` or `/validate` | body `{ token, locationId }` (token write-only)             | `{ connection: GhlConnectionState }`    | Encrypt/store credentials server-side; perform real validation call; abstract auth/provider as per `docs/GHL_INTEGRATION.md`. |
| `listCustomFields()`        | `GET /api/ghl/fields`                  | —                                                           | `{ customFields: GhlCustomField[] }`    | Fetch/cache from GHL API server-side.                                                                                         |
| `getMappings()`             | `GET /api/ghl/mappings`                | —                                                           | `{ mappings: GhlFieldMappingRecord[] }` | Org-scoped mappings.                                                                                                          |
| `saveMappings(next)`        | `PUT /api/ghl/mappings`                | body `{ mappings: GhlFieldMappingRecord[] }` (or patch ops) | `{ mappings: GhlFieldMappingRecord[] }` | Persist reviewed mappings; support suggested/unmapped states server-side if needed.                                           |
| `seed/reset`                | dev/test only                          | —                                                           | —                                       | Remove from runtime.                                                                                                          |

### Zod and error contract recommendations

- Use shared Zod schemas for `FormContent`, `OwnField`, `LayoutElement`, overrides/locks/settings, `Submission`, mapping records, and API envelopes.
- Standard error shape: `{ error: { code: string, message: string, details?: unknown } }` with 4xx validation/conflict/depth/cycle/slug errors and 5xx for unexpected failures.
- Preserve `Simulated autosave failure` behavior only in tests; real autosave should surface retryable errors.

## Thunks → RTK Query / optimistic updates

Current slices use `createAsyncThunk` wrappers around repositories (`formsSlice`, `fieldsSlice`, `submissionsSlice`, `ghlSlice`) and app-level `bootstrapApp/resetDemoData` thunks in `src/store/bootstrap.ts`.

### Migration approach

1. **Introduce RTK Query API slices** in `src/store/api/*` (or per-domain APIs) using `createApi`/`fetchBaseQuery` (or custom base query with auth/CSRF handling).
2. **Replace data-fetch thunks/selectors** with generated hooks (`useListFormsQuery`, `useUpdateDraftMutation`, etc.). Keep UI-level derived selectors where useful.
3. **Remove bootstrap hydration/reset thunks** once server is source of truth (except dev/demo tooling if retained behind flags).
4. **Colocate invalidation tags:** e.g. `Forms`, `Form(id)`, `Submissions`, `Submissions(formId)`, `Fields`, `GhlConnection`, `GhlMappings`, `GhlFields`.

### Suggested endpoint/query mapping

| Current thunk/action                                                                           | RTK Query endpoint                                                             | Type           | Optimistic/invalidation notes                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrapApp` / `fetch*` initial loads                                                        | `getForms`, `getFields`, `getSubmissions`, `getGhlState` (or split queries)    | query          | Run in parallel per route; show existing skeleton/error states. Remove localStorage merge.                                                                                                                                          |
| `createForm`                                                                                   | `createForm`                                                                   | mutation       | Invalidate `Forms`; navigate to builder on success.                                                                                                                                                                                 |
| `updateFormDraft` / builder autosave `formsRepository.updateDraft`                             | `updateDraft`                                                                  | mutation       | **Optimistic update** of cached form draft and builder state; rollback on error; keep autosave status UI (`saving/saved/error` with retry). Debounce/coalesce on client as today.                                                   |
| builder-local publish orchestration (`publishFormWithPropagation` + `saveMany` + `upsertForm`) | `publishForm`                                                                  | mutation       | Server performs transaction/propagation; on success update/invalidate affected `Form(id)` caches and `Forms` list. Client may optimistically mark publish-in-flight but must reconcile with server result (version ids, snapshots). |
| conflict merge pre-publish application (currently `applyConflictMerges` + saveMany)            | include in `publishForm` request or dedicated `applyPublishConflicts` mutation | mutation       | Prefer single transactional publish endpoint accepting merge plan to avoid partial client/server divergence.                                                                                                                        |
| `detach` dialog flow (`formsRepository.save` + `upsertForm`)                                   | `detachForm`                                                                   | mutation       | Optimistic optional; invalidate form, descendants/family graph queries.                                                                                                                                                             |
| delete dialog flow (`formsRepository.saveMany` children + `delete`)                            | `deleteForm`                                                                   | mutation       | Server transaction; invalidate `Forms` and affected child form caches.                                                                                                                                                              |
| `createSubmission` (public + store append)                                                     | `submitPublicForm`                                                             | mutation       | No optimistic cross-session cache needed; on success show success state; invalidate submissions lists for admin views/tags.                                                                                                         |
| `retrySubmissionSync` (currently sets pending then synced in mock)                             | `retrySubmissionSync`                                                          | mutation       | Enqueue real retry job; optimistically set status `pending`, reconcile from server/job result; invalidate submission caches.                                                                                                        |
| `createField`                                                                                  | `createField`                                                                  | mutation       | Invalidate `Fields`; keep fuzzy-duplicate UI checks client-side/server-validated.                                                                                                                                                   |
| `validateGhlConnection`                                                                        | `validateGhlConnection`                                                        | mutation       | Update connection cache; handle async validation states/errors.                                                                                                                                                                     |
| `saveGhlMappings`                                                                              | `saveGhlMappings`                                                              | mutation       | Optimistic update with rollback; invalidate mappings/related form mapping summaries.                                                                                                                                                |
| `resetDemoData`                                                                                | remove or dev-only endpoint                                                    | mutation/query | Not for production.                                                                                                                                                                                                                 |

### Client state to keep vs move

- **Keep in Redux/client state:** builder UI/editor state (`builderSlice`: history past/present/future, selection, preview mode, autosave status, initialized form id) — but draft source of truth becomes server + optimistic cache; graph UI filters/layout/selection can remain local; ephemeral dialog/UI state remains local/component state.
- **Move to server/RTK Query cache:** canonical forms/versions/drafts (as persisted), submissions, fields, GHL connection/custom fields/mappings.

## Server transaction boundaries and rules

Implement server-side mutations as transactions where invariants span multiple records/versions. Reuse `src/lib/forms/*` pure logic for computation/validation inside services.

1. **Publish form (highest priority, transactional):**
   - Inputs: `formId`, acting org/user, optional client draft/version etag/hash, optional accepted conflict merge plan.
   - Steps (single transaction): load form + ancestors/descendants as needed; validate unpublished changes exist; compute/validate conflicts against latest server state (not stale client state); apply merges if provided and valid; create immutable published `FormVersion` with resolved snapshot; update form `publishedVersionId`, clear draft; recompute and persist descendant resolved snapshots/propagation effects per current rules; emit audit/events if applicable.
   - Must be idempotency-aware where possible (double-submit protection).

2. **Detach form (transactional):**
   - Snapshot inherited items into detached form per `docs/INHERITANCE_RULES.md`; sever parent link; preserve children relationships; persist updated form (and any required child metadata) atomically.

3. **Delete form with children strategy (transactional):**
   - Validate confirmation name, chosen strategy, reparent target existence, cycle/depth constraints (`wouldCreateCycle`, depth limits), and inherited-keep option behavior.
   - Apply child transformations (standalone snapshot or reparent) and delete target atomically.

4. **Create child form (transactional/validated):**
   - Validate parent exists in org, depth limit, slug uniqueness; initialize draft/content consistently.

5. **Public submission create (transactional + async side effects):**
   - Resolve published form/version snapshot at request time; validate answers with server-built schema; persist submission with `formVersionId`, answers, initial sync status; enqueue GHL sync outbox/job after commit (or transactional outbox pattern).

6. **GHL mapping save / connection updates:**
   - Transactional within local DB; external GHL calls should be retriable and not block local consistency except explicit validation endpoints.

7. **Concurrency/conflict control:**
   - Use optimistic concurrency (row version/`updatedAt`/etag) for draft saves and structural mutations; reject stale publishes/deletes with clear conflict responses for UI retry/refresh.

## Stored vs computed (Part 3 model guidance)

### Store (canonical, persisted)

- Org/user/auth records (beyond Part 2 scope), permissions/roles.
- `Form` records: identity (`id`, `orgId`, `slug`, `name`, `parentFormId`), timestamps, `publishedVersionId`, current draft content (if editing model keeps server drafts), lock/override/content fields as per finalized schema.
- `FormVersion` records: immutable `versionNumber`, `content`, `resolvedSnapshot` (recommended to store for public/audit/submission reproducibility), publish metadata/timestamps.
- Field library definitions (platform/org).
- Submissions: `formId`, `formVersionId`, answers payload, submit metadata, GHL sync status/contact/error metadata.
- GHL connection metadata (encrypted secrets stored separately), custom field cache if desired, field mappings and mapping statuses.

### Compute on demand (or derive/cache, but not manually edited)

- Resolved form for a draft against ancestor published chain (`resolveWithContent` / chain helpers).
- Impact analysis diffs and described changes (`computeImpact`, diff/describe helpers).
- Key conflict detection for a proposed publish (`findPublishKeyConflicts`) and merge previews.
- Family graph layout/derived counts/badges in UI (source data stored; layout computed client-side as today).
- Validation schemas from resolved forms (`buildZodSchema`) — compute server-side for submit validation and client-side for UX parity.
- "Used in N forms" counts can be queried/aggregated server-side; avoid storing duplicated counters unless needed for performance.

### Snapshots and history

- Keep published version content + resolved snapshot immutable once published (except explicit migration). Version history drawer should read from stored versions/snapshots, not recompute historical truth from mutable drafts.

## Client-only Redux / demo-only concerns to remove or isolate post-Part 3

- **Remove:** `src/store/bootstrap.ts` runtime responsibilities for seeding/hydrating demo data in production; `selectPersistedDemoData` persistence contract for prod; `resetDemoData` UI/actions in production builds (or gate behind dev/demo flag).
- **Remove:** in-memory singleton repositories in `src/services/index.ts` and their `seed/reset`/debug methods from production paths.
- **Refactor:** slices currently holding canonical server entities as manually seeded arrays (`forms`, `fields`, `submissions`, `ghl`) should become RTK Query cache consumers (or thin adapters) rather than primary sources of truth.
- **Keep (UI-only):** `builderSlice` editor/history/selection/preview/autosave UI state; local graph interaction state; dialog open/close and transient form UI state; toasts/view preferences as appropriate.
- **Auth placeholder screens/routes:** replace demo login/signup/root/dashboard gating behavior with real auth/session handling.

## localStorage persistence read/write locations to remove

All demo persistence is keyed by `PERSISTENCE_KEY = 'formfamily-demo-state-v1'` (defined in `src/lib/constants.ts`) and implemented in `src/lib/persistence.ts`.

### Direct persistence helper implementations (remove/replace for prod)

- `src/lib/persistence.ts`: `loadPersistedState` reads `window.localStorage.getItem(PERSISTENCE_KEY)`; `savePersistedState` writes `window.localStorage.setItem(PERSISTENCE_KEY, ...)`; `clearPersistedState` removes `window.localStorage.removeItem(PERSISTENCE_KEY)`.

### Runtime read/write call sites (remove/gate)

- `src/store/bootstrap.ts`: imports `clearPersistedState, loadPersistedState, savePersistedState`; `bootstrapApp` calls `loadPersistedState<PersistedDemoData>()` and `savePersistedState(data)` when seeding initial demo state; `resetDemoData` calls `clearPersistedState()` and `savePersistedState(data)`.
- `src/store/StoreProvider.tsx`: imports `savePersistedState`; subscribes to store and debounced-calls `savePersistedState(selectPersistedDemoData(state))` after `ui.initialized`.

### UI copy referencing localStorage/demo reset (update for prod)

- `src/app/(dashboard)/settings/page.tsx`: settings copy/button describe resetting "in-memory mock store and localStorage" / demo data — replace with production-appropriate settings.

### Related demo constants/state contract (remove or repurpose)

- `src/lib/constants.ts`: `PERSISTENCE_KEY` export (demo-only).
- `src/store/bootstrap.ts`: `PersistedDemoData` interface and `selectPersistedDemoData` selector exist solely for localStorage demo hydration/persistence.

## Additional Part 3 notes from Part 2b

- **Autosave:** current builder autosaves draft via repository update + debug fail flag; in Part 3 wire to `PATCH/PUT draft` with retry/backoff UX and server-side conflict/version checks.
- **Publish/conflict UI:** `ImpactPreviewDialog` and `KeyConflictDialog` already collect user intent; send merge decisions to server as explicit payload rather than relying on client-only pre-mutation of descendant drafts where possible.
- **Public rendering:** public form currently reads published snapshot from client-loaded mock state; in Part 3 fetch from public API endpoint by slug and submit to server with version binding.
- **Rich text:** sanitize on render (`sanitizeHtml`) remains required; consider server-side sanitization/storage policy for submitted/rendered HTML.
- **File uploads:** currently mocked client-side file metadata in answers; Part 3 needs real upload/storage, signed URLs, validation, and GHL attachment strategy if applicable.
- **GHL:** all GHL calls/syncs are mocked; implement server-side integration, credential encryption, mapping persistence, and async submission sync jobs per `docs/GHL_INTEGRATION.md`.
- **Quality gates:** keep `build`, `typecheck`, `lint`, `test`, and Playwright e2e green through migration; update/add e2e to cover API-backed flows and error states.
