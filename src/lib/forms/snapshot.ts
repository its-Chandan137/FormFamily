import { START_ANCHOR } from '@/lib/constants';
import type { FormContent, LayoutElement, OwnField } from '@/types';
import { resolveForm } from './resolve';

/**
 * Copies the resolved (including inherited) items of a form into that form's
 * own content so it becomes standalone. The returned content, when resolved as a
 * single root (`resolveForm([snapshot], [leafFormId])`), resolves identically to
 * the original resolved chain.
 *
 * - All resolved fields become own fields with their effective properties.
 * - All resolved elements become own elements.
 * - Items are ordered linearly with anchors preserved via an explicit chain
 *   (`START_ANCHOR` for the first item, then each after the previous).
 * - Overrides and ancestor locks are cleared.
 *
 * @param chain   Content chain from root to leaf (published ancestors + leaf).
 * @param formIds Matching form ids from root to leaf.
 */
export function snapshotInherited(
  chain: FormContent[],
  formIds: string[],
): FormContent {
  const resolved = resolveForm(chain, formIds);

  const ownFields: OwnField[] = [];
  const elements: LayoutElement[] = [];

  let prevId: string | null = START_ANCHOR;

  for (const item of resolved.items) {
    if (item.kind === 'field') {
      const f = item.field;
      const own: OwnField = {
        key: f.key,
        label: f.label,
        type: f.type,
        placeholder: f.placeholder,
        helpText: f.helpText,
        options: f.options ? [...f.options] : undefined,
        validation: f.validation ? { ...f.validation } : undefined,
        required: f.required,
        hidden: f.hidden,
        insertAfter: prevId,
      };
      ownFields.push(own);
      prevId = f.key;
    } else {
      const el = item.element;
      const ownEl: LayoutElement = {
        id: el.id,
        type: el.type,
        props: { ...(el.props ?? {}) },
        insertAfter: prevId,
      };
      elements.push(ownEl);
      prevId = el.id;
    }
  }

  return {
    settings: { ...(resolved.settings ?? {}) },
    ownFields,
    elements,
    overrides: {},
    locks: [],
  };
}
