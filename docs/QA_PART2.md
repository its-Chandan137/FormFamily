# QA Checklist — Part 2 / 2b (Frontend with Mock Data)

This checklist records the Part 2/2b demo verification for the mock-first frontend. Run from `formfamily/` with `npm run dev` and use **Reset demo data** (topbar menu or Settings) before manual exploration if state was modified.

## Verification summary

- **Automated gates (verified):** `npm run build` ✅, `npm run typecheck` ✅, `npm run lint` ✅ (0 errors; warnings remain), `npm run test` ✅ (45/45), `npm run e2e` ✅ (4/4 Playwright scenarios).
- **E2E-covered key flows:** palette→canvas drag with real pointer events; Frontend draft publish with impact preview + key-conflict merge flowing to Backend/DevOps/QA; detach child form; public submit creates submission with correct version.
- **QA walkthrough method:** remaining checklist items were walked item-by-item against the implemented UI/components, domain logic, and deterministic mock dataset; fixes applied during Part 2b to bring all items to pass. Any implementation-level verification notes are included inline where relevant.

## Preconditions

- [x] `npm run build`, `npm run typecheck`, `npm run lint`, and `npm run test` pass.
- [x] No `it.todo` remains in `src/lib/forms`.
- [x] App bootstraps deterministic mock data (Northwind Labs). Demo state persists after refresh via localStorage; Reset demo data restores the original dataset.

## Dashboard (`/dashboard`)

- [x] Stat cards show forms, families, submissions this week, failed syncs.
- [x] Recent submissions list renders.
- [x] "Needs attention" shows unpublished changes (e.g. Frontend draft v3), failed syncs, and unmapped/suggested GHL fields.
- [x] Loading skeleton, empty/relevant states, and error-with-retry state implemented.

## Forms & navigation

- [x] `/forms` groups forms by family and supports search/status filter and table/card views.
- [x] Row actions work: open builder, copy public link, open public form, create child, detach (when applicable), delete.
- [x] Sidebar/topbar navigation reaches dashboard sections (dashboard, forms, create form, families, submissions, field library, integrations, settings).
- [x] Loading skeleton, empty state, and error-with-retry state implemented; table overflow handled responsively.

## Create form (`/forms/new`)

- [x] Can create blank form, from hiring template, or as child of an existing form.
- [x] Parent picker disables choices that would exceed max depth (5). Name/slug entry works and opens builder.
- [x] Loading and error-with-retry states implemented.

## Builder (`/forms/[formId]/edit`) — core demos

- [x] **Build a form by drag and drop / add items:** palette→canvas DnD with `@dnd-kit` (real pointer events, e2e-verified), drop targets/indicators/overlay, empty-canvas target, correct insertion/`START_ANCHOR` behavior, click-to-add retained, "Added" fields disabled, own-item reorder, inherited items pinned. Draft autosaves with status UI and retry.
- [x] **Keyboard DnD & announcements:** keyboard sensor support, `aria-live` announcements for pickup/move/drop/cancel including position context, and drag cancel handling (including Escape via sensor behavior) implemented.
- [x] **Inherited/locked indicators:** child forms show inherited/locked badges and prevent inherited items from being treated as own removable canvas items.
- [x] **Hide and override an inherited field:** properties panel supports label/placeholder/help-text overrides and hidden/optional toggles for non-locked inherited fields; resolved preview reflects changes.
- [x] **Try to edit a locked field and see it blocked:** locked inherited fields (e.g. `data_consent`) display lock state and have override/edit controls disabled.
- [x] **Rich text, undo/redo, version history, preview:**
  - [x] Tiptap rich text editing for form about/richtext content; public/applicant render sanitizes HTML (`sanitizeHtml`, strips `<script>`/inline handlers; unit-tested).
  - [x] Undo/redo history in builder state (toolbar + Ctrl+Z/Ctrl+Shift+Z, coalesced text edits, capped history, cleared on form switch; publish resets to published state).
  - [x] Version history drawer lists versions with read-only snapshot view, diff vs draft, and restore-as-draft (with confirmation, undoable).
  - [x] Desktop/mobile live preview toggle and full-screen preview route `/forms/[formId]/preview` (draft resolved against ancestors' published content, disabled submissions banner, back link).
- [x] **Edit Frontend draft and publish (impact + key conflict):** (e2e-verified flow)
  - [x] **Frontend Developer** draft v3 adds `github_url` (after `portfolio_url`) and edits about text.
  - [x] **Publish** shows impact preview with affected descendant forms (Backend, DevOps, QA).
  - [x] Key conflict dialog appears for `github_url` owned by Backend; **Merge conflicts** replaces child own copy with inherited field while preserving child label as override when applicable.
  - [x] Publish succeeds (new version), draft cleared / form up to date.
  - [x] Changes propagate/resolve correctly into Backend, DevOps, and QA (builder/resolved state verified in e2e).
- [x] Loading skeleton, not-found/error-with-retry states implemented for builder/edit and preview; builder shows "use a larger screen" guidance below 1024px while remaining screens are responsive.

## Dialogs & family operations

- [x] **Create a child:** available from forms list, builder, and family graph; depth cap enforced/explained.
- [x] **Detach a form:** warning/confirmation shown, inherited items copied as own, parent link removed, children remain attached. (e2e-verified)
- [x] **Delete a form with children (both options):** supports **make children standalone** (optionally keep inherited fields as own) and **move children under deleted form's parent** (when available) with cycle/depth validation and name confirmation.
- [x] Impact preview and key conflict dialogs present detailed per-form/conflict information and behave as specified during publish.

## Family graph (`/families`)

- [x] Graph renders nodes/edges for form families (React Flow + dagre) with layout toggle, controls/fit, and minimap.
- [x] Hover highlights path to root and descendants while dimming others; legend/status badges visible.
- [x] Family filter works; selecting a node opens details drawer with chain/counts/actions (open builder, create child, detach, delete).
- [x] Hover/focus create-child affordance and keyboard-accessible node interactions/details supported.
- [x] Loading skeleton, empty state, and error-with-retry state implemented.

## Public form & submissions

- [x] **Submit the public form and see the submission appear with the right version:** (e2e-verified for Frontend form)
  - [x] Published form at `/f/[slug]` (e.g. `/f/frontend-developer`) renders resolved snapshot, validates required/email/rules, supports mocked file upload metadata.
  - [x] Submit shows success message and creates submission with correct published form version and pending sync state.
  - [x] Submission appears in `/submissions` and per-form submissions with correct version badge and submitted data.
- [x] Unpublished/unknown slug shows friendly "not available" state.
- [x] Submissions list supports filters/grouping/search; drawer shows details and **Retry sync (mock)** for failed items.
- [x] Loading skeletons, empty states, and error-with-retry states implemented for submissions views and public form loading/error cases.

## Field library (`/field-library`)

- [x] Lists platform and organisation fields with search and "used in N forms" indicators.
- [x] Add custom field dialog enforces key rules (lowercase snake_case) and provides fuzzy-match suggestions before saving.
- [x] Loading skeleton, empty state, and error-with-retry state implemented.

## GHL integration (`/integrations/ghl`) — mocked

- [x] Connection card shows token/location form (masked) and **Validate** succeeds (mocked delay).
- [x] Existing GHL custom fields listed.
- [x] Mapping table shows mapped/suggested/unmapped states, suggestions, review-before-save flow, and duplicate-warning handling.
- [x] Mapping can be changed/accepted and saved (mocked).
- [x] Sync status summary per form displayed.
- [x] Loading skeleton and error-with-retry state implemented.

## Settings (`/settings`)

- [x] Organisation name and members/roles shown.
- [x] **Reset demo data** restores original deterministic dataset and clears persisted localStorage state.
- [x] Loading skeleton and error-with-retry state implemented.

## Screen states, a11y, and responsiveness (cross-cutting)

- [x] **Screen states (loading skeleton / empty / error-with-retry):** implemented and verified across dashboard, forms list, create form, family graph, submissions (all), form submissions (per-form), field library, GHL integration, settings, builder/edit, full-screen preview, public form, and basic auth/root pages (appropriate to each screen's data/load model).
- [x] **Accessibility pass (targeted):** labelled inputs and controls, dialog semantics/trap/return-focus via UI primitives, keyboard-operable builder/graph interactions and `aria-live` announcements, inline form error alerts/associations in renderer, focus-visible styles from component system, and builder small-screen alternative messaging. (Reduced-motion/contrast rely on underlying design tokens/components and were reviewed for regressions during implementation.)
- [x] **Responsive pass:** dashboard/list/detail/public screens usable at 375px width with overflow handling (tables/containers); builder editing gated below 1024px with explicit "use a larger screen" guidance and full-screen preview available.

## Notes

- Part 2/2b remains mock-only: no database, auth, queues, storage, or GHL network calls. Part 1 API stubs remain unchanged.
- `docs/INHERITANCE_RULES.md` was not modified.
- See `docs/PART3_HANDOFF.md` for service→API migration, RTK Query/transaction boundaries, stored-vs-computed guidance, and localStorage removal locations.
