# FormFamily Demo Script (5 minutes)

This script walks through the core FormFamily story: create a hiring form, brand it, build a child form with inheritance, visualize the family, publish a parent change with impact/conflict handling, submit the public form, and review submissions and GHL mapping.

**Prerequisites**

- App running locally (`npm run dev`) or production build.
- Start from a clean demo state: open **Settings → Demo data → Reset demo data** (confirm) or use avatar menu **Reset demo data**.
- Use light theme for the primary recording unless noted.

## 1. Dashboard (30s)

1. Open **Dashboard** (`/dashboard`).
2. Point out the KPI cards: **Forms**, **Families**, **Submissions this week**, **Failed syncs**.
3. Highlight **Needs attention** (e.g. Frontend Developer has unpublished changes; failed syncs/mapping issues if present) and **Recent submissions**.
4. Note the primary action: **New form**.

**Talk track:** "FormFamily gives hiring teams one place to manage form families, publishing, and submission health."

## 2. Create and build a hiring form (75s)

1. Click **New form**.
2. On **Create form**, choose **Hiring template** (or **Blank form**), enter:
   - **Name:** `Product Designer` (or any clear name)
   - **Slug:** auto-generated (e.g. `product-designer`)
3. Click **Create and open builder**.
4. In the builder, show the layout: palette (left), canvas (center), properties (right), top bar with status/autosave/preview/publish.
5. **Drag and drop:** drag a field from the palette (e.g. **Email** or **Portfolio URL**) onto the canvas drop zone / between fields. Confirm it appears in the canvas.
6. Click the form/header area or Form settings and update branding:
   - **Company name:** `Northwind Labs`
   - **Title:** `Product Designer Application`
   - **About:** add a short role description (rich text)
   - **Submit label / Success message:** adjust as desired
7. Toggle **Edit / Preview** (and desktop/mobile preview if available) to show the candidate view.

**Talk track:** "Teams can compose forms quickly with drag-and-drop, branding, and live preview."

## 3. Create a child form, hide and override (45s)

1. From the builder (or Forms list), click **Create child** for the form you just created.
2. Name it (e.g. `Senior Product Designer`) and create/open it.
3. In the child builder, point out **inherited** fields/elements (teal inheritance markers, source/locked indicators as applicable).
4. **Hide** an inherited optional field (e.g. Portfolio URL) using field controls/properties.
5. **Override** an inherited field property (e.g. change label/help text/required state where allowed) and note the override/reset affordance.
6. Save/autosave completes; observe "Unpublished changes" status when draft differs.

**Talk track:** "Children inherit by default, but teams can hide or override specific fields without forking everything."

## 4. View the family graph (30s)

1. Open **Family graph** (`/families`).
2. Select the relevant family if needed; show **Left to right** layout.
3. Point out nodes and **edges** representing inheritance, status badges/bars, and counts (inherited/own/locks/children).
4. Click a node to open the **details drawer** (overview/fields/actions as available).
5. Hover nodes to highlight the path to root/descendants.

**Talk track:** "The graph makes inheritance structure and status visible at a glance."

## 5. Edit parent, publish with impact/conflict, preview propagation (60s)

1. Open **Frontend Developer** in the builder (`/forms` → Frontend Developer → Open builder). It should show **Unpublished changes** in the clean demo state.
2. Click **Publish**.
3. In **Publish impact preview**, show affected descendants (Backend Developer, DevOps Engineer, QA Engineer). Click **Continue**.
4. In **Key conflicts detected**, explain the conflict (e.g. `github_url`) and affected descendant(s). Click **Merge conflicts** (or follow the presented resolution flow).
5. Confirm publish completes (e.g. `Published v3` toast / up-to-date state).
6. Return to **Family graph** and, if available, use **Preview change propagation** / impact view to pulse/highlight descendants and demonstrate how a parent edit flows down.

**Talk track:** "Publishing is impact-aware: you see who is affected, resolve conflicts explicitly, and propagate safely."

## 6. Submit the public form and review submission + mapping (60s)

1. Open the public form: **Frontend Developer** at `/f/frontend-developer`.
2. Fill required fields (example values):
   - First Name: `Casey`, Last Name: `Candidate`
   - Email: `casey@example.com`, Phone: `555-0100`
   - Resume: upload a small file
   - Current Company: `Example Co`, Experience: `5`
   - Current CTC / Expected CTC: `100` / `120`
   - Notice Period: `30 days`
   - Current Location: `Remote`, Portfolio URL: `https://example.com`
   - Check consent: **I agree to the processing of my data**
3. Click **Submit** and confirm the success screen/message.
4. Go to **Submissions** (global or **Frontend Developer → Submissions**) and open the new submission; verify it is recorded against the correct published version (v2 in the deterministic pre-publish scenario; version reflects the published snapshot used).
5. Open **Integrations → GHL** (`/integrations/ghl`) to show connection status and **field mapping** (mapped/suggested/unmapped, duplicate warning, review-before-save flow).

**Talk track:** "Candidates get a clean public experience, submissions are versioned, and field mappings keep CRM sync consistent."

## Reset

- Use **Settings → Demo data → Reset demo data** (confirm) to restore the original deterministic dataset before the next run.
