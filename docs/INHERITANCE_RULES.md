# FormFamily Inheritance Rules

## Overview

FormFamily implements a sophisticated form inheritance system that allows companies to create form families with parent-child relationships. This system enables organizations to:

- Create reusable form templates
- Customize inherited forms for specific needs
- Maintain consistency across related forms
- Show impact of changes across form families

## Core Inheritance Concepts

### Form Family Structure

A form family is a tree structure where:

- **Root Form**: The base form with no parent
- **Child Forms**: Forms that inherit from a parent form
- **Maximum Depth**: 5 levels (root = level 1, child of root = level 2, etc.)
- **Single Parent**: Each form has at most one parent
- **No Multiple Inheritance**: A form cannot inherit from multiple parents

### Key Rules

#### 1. Tree Structure

```
Root Form (level 1)
├── Child Form 1 (level 2)
│   ├── Grandchild Form 1 (level 3)
│   │   └── Great-grandchild (level 4)
│   └── Grandchild Form 2 (level 3)
├── Child Form 2 (level 2)
    └── Grandchild Form 3 (level 3)
```

#### 2. Store Differences, Not Copies

Each form stores only its own contribution (custom fields, overrides, settings, locks). The final resolved form is computed by merging from root to leaf.

#### 3. Downward Propagation Only

- Editing a parent changes all descendants
- Editing a child never changes its parent or siblings
- Example: Changing Backend updates DevOps but not Frontend

#### 4. Child Capabilities

A child can:

- **Change labels, text and settings**: logo, company name, about
- **Add its own fields**: New fields specific to this child
- **Reposition inherited fields/elements**: Change where inherited items appear in the child form (position override); the item identity/key stays the same
- **Hide inherited fields**: Make inherited fields invisible
- **Mark inherited fields as optional**: Change required status of inherited fields

#### 5. Child Limitations

A child cannot:

- **Remove inherited fields**: Can only hide them
- **Change locked field identity/key**: Field key (GHL/canonical identity) is immutable
- **Change locked fields**: Locked fields are immutable in descendants (label/placeholder/help text/required/hidden/position overrides are blocked)

#### 6. Lock Propagation

A parent can lock a field (e.g., legal consent checkbox). Locked fields:

- Cannot be edited in descendants
- Cannot be hidden in descendants
- Cannot be made optional in descendants
- Locks propagate down the entire subtree

#### 7. Published Versions Only

A child resolves against its ancestors' published versions, never their drafts. Each form has one draft and a list of published versions.

#### 8. Impact Preview

Before publishing a parent change, show which forms are affected:

```
This change affects 6 forms:
- Form A (Hiring)
- Form B (Hiring/Backend)
- Form C (Hiring/Backend/DevOps)
- Form D (Hiring/Backend/DevOps/Tester)
- Form E (Hiring/Tester)
- Form F (Hiring/Tester/QA)
```

#### 9. Key Conflicts

If a parent adds a field whose key a child already added:

- **Warn the user** and offer to merge
- **On merge**: The child's own copy is replaced by the inherited field
- **Child's custom label**: Can be kept as an override

#### 10. Delete/Detach Operations

**Detach from family**:

- Copy (snapshot) the inherited fields into the form
- Remove its parent link
- Make it the root of its own family
- Show a warning popup

**Delete a form that has children**:

- Ask what to do with the children:
  - Make them standalone (snapshot inherited fields, each becomes its own root)
  - Move them under the deleted form's parent (reparent), if one exists
  - Offer to keep the fields they inherited from the deleted form as their own fields

## Technical Implementation

### Form Content Structure

Each form stores its own contribution in a `FormContent` object:

```typescript
interface FormContent {
  settings: Partial<FormSettings>;
  ownFields: OwnField[];
  elements: LayoutElement[];
  overrides: Record<string, FieldOverride>;
  locks: string[];
  /** Child position overrides for inherited item ids/keys; absent = inherit position. */
  positionOverrides?: Record<string, string | null>;
  /** Child prop overrides for inherited layout elements, keyed by element id. */
  elementOverrides?: Record<string, { props?: Record<string, unknown> }>;
}
```

### Resolution Process

1. **Traverse Tree**: Start from the form and traverse up to the root
2. **Collect Ancestors**: Gather all ancestor form IDs
3. **Merge Settings**: Merge settings with child overriding parent
4. **Collect Fields**: Process fields and elements from all ancestors
5. **Apply Overrides**: Apply field-specific overrides
6. **Apply Locks**: Apply locks from ancestors
7. **Order Items**: Use anchor-based ordering for final arrangement

### Anchor-Based Ordering

Ordering uses anchors, not absolute positions.

- The root defines the base order. **In the root form, every item is own. Persist anchors there too, so the model is uniform.**
- Every item a descendant adds stores `insertAfter` (the key of a field or the id of an element).
- `insertAfter: null` means the end of the form.
- `START_ANCHOR` (`'__start__'`, exported as a constant in code) means the very top of the form.
- If the parent adds an item in the middle, it appears there, and the child's own items stay after their anchors.
- Hidden fields keep their position, so unhiding restores the layout.
- If an anchor is deleted by the parent, the child's item falls back to the end of its section.
- Items sharing an anchor keep their relative order.
- A child may store `positionOverrides` for inherited items (field keys or element ids) to reposition them at a different anchor. Locked inherited fields cannot be repositioned. The item's identity/key remains unchanged.

Example:

```
Root: [field1, field2, field3]
Child: [field4] (insertAfter: 'field2')

Result: [field1, field2, field4, field3]
```

## API Operations

### Create Child Form

```http
POST /api/forms
{
  "name": "Backend Developer Application",
  "slug": "backend-dev-app",
  "orgId": "org123",
  "parentFormId": "frontend-dev-app",
  "settings": {
    "companyName": "Tech Corp"
  }
}
```

### Detach Form

```http
POST /api/forms/{formId}/detach
{
  "userId": "user123"
}
```

### Delete Form with Children

```http
DELETE /api/forms/{formId}
{
  "action": "detach_children",
  "userId": "user123"
}
```

## Validation Rules

### Cycle Detection

The system must detect and prevent cycles:

```typescript
function wouldCreateCycle(forms, formId, newParentId): boolean {
  // Cannot be parent of itself
  if (formId === newParentId) return true;

  // Check if newParentId is already a descendant
  const descendants = getDescendants(formId, forms);
  if (descendants.includes(newParentId)) return true;

  // Check if formId is already a descendant of newParentId
  const ancestors = getAncestors(formId, forms);
  if (ancestors.includes(newParentId)) return true;

  return false;
}
```

### Depth Validation

```typescript
function exceedsMaxDepth(forms, formId, newParentId, maxDepth = 5): boolean {
  const parentDepth = getDepth(newParentId, forms);
  const childDepth = getDepth(formId, forms);

  // Effective depth calculation
  const effectiveChildDepth = childDepth > 0 ? childDepth : 1;

  return parentDepth + 1 > maxDepth;
}
```

### Key Conflict Detection

```typescript
function findKeyConflicts(parentContent, descendantContents): Conflict[] {
  const conflicts: Conflict[] = [];
  const parentKeys = parentContent.ownFields.map((f) => f.key);

  for (const descendantContent of descendantContents) {
    for (const field of descendantContent.ownFields) {
      if (parentKeys.includes(field.key)) {
        conflicts.push({
          parentKey: field.key,
          descendantKey: field.key,
          descendantFormId: 'unknown',
        });
      }
    }
  }

  return conflicts;
}
```

## Impact Calculation

### Compute Impact

```typescript
function computeImpact(forms, formId): Impact {
  const affectedFormIds: string[] = [];

  // Add the form itself
  affectedFormIds.push(formId);

  // Add all descendants
  function findDescendants(currentId: string) {
    const children = Object.values(forms).filter(
      (f) => f.parentFormId === currentId,
    );
    for (const child of children) {
      affectedFormIds.push(child.id);
      findDescendants(child.id);
    }
  }

  findDescendants(formId);

  return {
    affectedFormIds,
    impactDetails: affectedFormIds.map((formId) => ({
      formId,
      impact: 'high', // or 'medium', 'low'
    })),
  };
}
```

## Impact Preview

### Before Publishing

When a user attempts to publish a form change, show the impact preview:

```typescript
function showImpactPreview(formId: string): void {
  const impact = computeImpact(forms, formId);

  if (impact.affectedFormIds.length > 1) {
    alert(`This change affects ${impact.affectedFormIds.length} forms:
    - ${impact.affectedFormIds.join('\n    - ')}
    
    Do you want to continue?`);
  }
}
```

## Field Library Integration

### Platform vs Organization Fields

```typescript
interface FieldDefinition {
  id: string;
  orgId: string | null; // null = platform-wide
  key: string; // canonical key
  label: string; // default label
  type: FieldType;
  options?: string[];
  validation?: FieldValidation;
}
```

### Field Resolution

1. Start with root form's fields
2. Add child's own fields (overrides/append)
3. Hide fields marked as hidden
4. Apply field-specific overrides (label, required, etc.)

## Practical Example

### Hiring Form Family

```
Root: Frontend Developer Application
├── Child: Backend Developer Application
│   ├── Child: DevOps Engineer Application
│   └── Child: QA Tester Application
└── Child: Tester Application
    └── Child: Manual Tester Application
```

**Rules Applied**:

1. Changing "Company Logo" in root affects all children
2. Backend can add "AWS Experience" field (unique to it)
3. DevOps can hide "Current CTC" field (inherited from backend)
4. QA can change "Years of Experience" from required to optional
5. All descendants inherit from their immediate parent only

```
Example: Changing Backend's "Company Logo" affects:
- Backend (direct child)
- DevOps (descendant of Backend)
- QA (descendant of Backend/DevOps)

But does NOT affect:
- Frontend (sibling, not descendant)
- Tester (different branch)
```

## Error Handling

### Validation Errors

- "Cannot hide a locked field: consent_checkbox"
- "Cannot make a locked field optional: legal_agreement"
- "Field references non-existent anchor: section2"
- "Duplicate field key in the same form: email"

### User-Friendly Messages

- "This change will affect 3 forms. Continue?"
- "Field 'salary' already exists in child form. Merge or keep both?"
- "Cannot detach root form. Create a copy first."
- "This form has 2 child forms. What would you like to do?"

## Testing

### Unit Tests

- Form resolution tests
- Anchor ordering tests
- Lock propagation tests
- Conflict detection tests
- Impact calculation tests

### Integration Tests

- Create form family
- Add child forms
- Apply overrides
- Test detach operations
- Verify published versions

### End-to-End Tests

- User creates form family
- User adds child forms
- User modifies parent and verifies impact
- User detaches form and verifies independence

## Migration Considerations

### From Monolithic Forms

When migrating from individual forms to form families:

1. **Identify commonalities**: Find forms that share similar structure
2. **Create root form**: Build the most common version
3. **Create children**: Make specific versions as children
4. **Test thoroughly**: Ensure all functionality works as expected
5. **Gradual rollout**: Gradually migrate users and forms

### Backward Compatibility

- Existing forms remain root forms by default
- No breaking changes to public form URLs
- Existing form data preserved
- Gradual migration path for organizations

## Performance Considerations

### Form Resolution

- **Cache resolved forms**: Cache computed resolved forms for 5-10 minutes
- **Lazy loading**: Load form content on-demand
- **Index properly**: Index forms by orgId and parentFormId

### Impact Calculation

- **Pre-compute**: Cache impact calculations for frequently changed forms
- **Efficient traversal**: Use optimized tree traversal algorithms
- **Batch operations**: Process multiple impact calculations together

### Database Optimization

- **JSONB queries**: Use PostgreSQL JSONB operators for fast field access
- **Partial indexes**: Create indexes on (orgId, parentFormId) for tree queries
- **Materialized views**: Consider materialized views for frequently accessed data

This inheritance system provides a powerful way to create reusable form templates while maintaining flexibility for specific needs. The rules ensure predictable behavior and prevent common pitfalls when working with form inheritance.
