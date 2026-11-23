import type {
  FormContent,
  FormSettings,
  LayoutElement,
  OwnField,
  ResolvedField,
  ResolvedForm,
  ResolvedItem,
} from '@/types';
import { insertAnchoredItems } from './anchors';

type ResolvedNode =
  | { kind: 'field'; id: string; field: ResolvedField }
  | {
      kind: 'element';
      id: string;
      element: LayoutElement;
      origin: 'inherited' | 'own';
      sourceFormId: string;
    };

function nodeToItem(node: ResolvedNode): ResolvedItem {
  if (node.kind === 'field') {
    return { kind: 'field', field: node.field };
  }
  return {
    kind: 'element',
    element: node.element,
    origin: node.origin,
    sourceFormId: node.sourceFormId,
  };
}

function applyOverridesAndLocks(
  nodes: ResolvedNode[],
  content: FormContent,
  formId: string,
): void {
  const overrides = content.overrides ?? {};
  const elementOverrides = content.elementOverrides ?? {};
  const locks = new Set(content.locks ?? []);

  for (const node of nodes) {
    if (node.kind === 'element') {
      const override = elementOverrides[node.id];
      if (override?.props) {
        node.element = {
          ...node.element,
          props: { ...(node.element.props ?? {}), ...override.props },
        };
      }
      continue;
    }

    const field = node.field;

    // Apply overrides only to unlocked fields. Locked fields ignore all
    // overrides (label, placeholder, help text, required, hidden).
    if (!field.locked) {
      const override = overrides[field.key];
      if (override) {
        if (override.label !== undefined) field.label = override.label;
        if (override.placeholder !== undefined)
          field.placeholder = override.placeholder;
        if (override.helpText !== undefined) field.helpText = override.helpText;
        if (override.required !== undefined) field.required = override.required;
        if (override.hidden !== undefined) field.hidden = override.hidden;
      }
    }

    // Accumulate locks down the subtree.
    if (locks.has(field.key) && !field.locked) {
      field.locked = true;
      field.lockedByFormId = formId;
    } else if (locks.has(field.key) && field.locked && !field.lockedByFormId) {
      field.lockedByFormId = formId;
    }
  }
}

function ownFieldToResolved(
  field: OwnField,
  formId: string,
  locked: boolean,
): ResolvedField {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    placeholder: field.placeholder,
    helpText: field.helpText,
    options: field.options ? [...field.options] : undefined,
    validation: field.validation ? { ...field.validation } : undefined,
    required: field.required,
    hidden: field.hidden,
    origin: 'own',
    sourceFormId: formId,
    locked,
    lockedByFormId: locked ? formId : undefined,
  };
}

function buildOwnNodes(content: FormContent, formId: string): ResolvedNode[] {
  const lockSet = new Set(content.locks ?? []);
  const elementNodes: ResolvedNode[] = (content.elements ?? []).map((el) => ({
    kind: 'element',
    id: el.id,
    element: { ...el, props: { ...(el.props ?? {}) } },
    origin: 'own' as const,
    sourceFormId: formId,
  }));

  const fieldNodes: ResolvedNode[] = (content.ownFields ?? []).map((f) => {
    const locked = lockSet.has(f.key);
    return {
      kind: 'field' as const,
      id: f.key,
      field: ownFieldToResolved(f, formId, locked),
    };
  });

  // Elements first, then fields. Within each category, original array order is
  // preserved so items sharing an anchor keep their relative order.
  return [...elementNodes, ...fieldNodes];
}

function getInsertAfterForOwn(
  content: FormContent,
  node: ResolvedNode,
): string | null {
  if (node.kind === 'element') {
    const el = content.elements.find((e) => e.id === node.id);
    return el?.insertAfter ?? null;
  }
  const f = content.ownFields.find((x) => x.key === node.id);
  return f?.insertAfter ?? null;
}

/**
 * Merges form content from root to leaf into a final resolved form for the leaf.
 * - Applies overrides unless the field is locked.
 * - Inserts own items after their anchors (anchor-based ordering).
 * - Accumulates locks down the chain.
 * - Resolves against the published ancestor content provided by the caller.
 */
export function resolveForm(
  chain: FormContent[],
  formIds: string[],
): ResolvedForm {
  if (chain.length === 0) {
    return {
      formId: formIds[formIds.length - 1] ?? '',
      settings: {},
      items: [],
    };
  }

  let nodes: ResolvedNode[] = [];
  let settings: FormSettings = {};

  for (let i = 0; i < chain.length; i++) {
    const content = chain[i];
    const formId = formIds[i] ?? `form-${i}`;

    settings = { ...settings, ...(content.settings ?? {}) };

    if (i > 0) {
      // Descendant levels: apply overrides/locks to inherited (existing) items.
      applyOverridesAndLocks(nodes, content, formId);
    } else {
      // Root: locks apply to its own fields as well.
      applyOverridesAndLocks(nodes, content, formId);
    }

    const positionOverrides = content.positionOverrides ?? {};
    if (i > 0 && Object.keys(positionOverrides).length > 0) {
      const movedIds = new Set(
        Object.keys(positionOverrides).filter((id) => {
          const node = nodes.find((n) => n.id === id);
          if (!node) return false;
          if (node.kind === 'field' && node.field.locked) return false;
          return true;
        }),
      );
      if (movedIds.size > 0) {
        const base: ResolvedNode[] = [];
        const moved: ResolvedNode[] = [];
        for (const n of nodes) {
          if (movedIds.has(n.id)) moved.push(n);
          else base.push(n);
        }
        nodes = insertAnchoredItems(
          base,
          moved,
          (n) => n.id,
          (n) => positionOverrides[n.id] ?? null,
        );
      }
    }

    const ownNodes = buildOwnNodes(content, formId);
    nodes = insertAnchoredItems(
      nodes,
      ownNodes,
      (n) => n.id,
      (n) => getInsertAfterForOwn(content, n),
    );

    // If root introduced locks, ensure they are marked (applyOverridesAndLocks
    // ran before insertion; handle locks on just-inserted own fields too).
    if (i === 0) {
      applyOverridesAndLocks(nodes, content, formId);
    }
  }

  const leafFormId = formIds[formIds.length - 1] ?? '';

  // Origin is relative to the resolved (leaf) form: items introduced by the
  // leaf are 'own', items introduced by any ancestor are 'inherited'.
  for (const node of nodes) {
    if (node.kind === 'field') {
      node.field.origin =
        node.field.sourceFormId === leafFormId ? 'own' : 'inherited';
    } else {
      node.origin = node.sourceFormId === leafFormId ? 'own' : 'inherited';
    }
  }

  return {
    formId: leafFormId,
    settings,
    items: nodes.map(nodeToItem),
  };
}
