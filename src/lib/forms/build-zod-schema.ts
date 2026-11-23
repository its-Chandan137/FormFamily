import { z, type ZodTypeAny } from 'zod';
import type {
  FieldValidation,
  ResolvedField,
  ResolvedForm,
  VisibilityCondition,
} from '@/types';

function applyStringRules(
  schema: z.ZodString,
  field: ResolvedField,
): z.ZodTypeAny {
  let s: z.ZodTypeAny = schema;
  if (field.type === 'email') {
    s = (s as z.ZodString).email();
  }
  const v = field.validation;
  if (v?.pattern) {
    try {
      s = (s as z.ZodString).regex(new RegExp(v.pattern));
    } catch {
      // ignore invalid pattern
    }
  }
  if (
    v?.min !== undefined &&
    (field.type === 'text' ||
      field.type === 'textarea' ||
      field.type === 'phone')
  ) {
    s = (s as z.ZodString).min(v.min);
  }
  if (
    v?.max !== undefined &&
    (field.type === 'text' ||
      field.type === 'textarea' ||
      field.type === 'phone')
  ) {
    s = (s as z.ZodString).max(v.max);
  }
  return s;
}

function numberSchema(field: ResolvedField): ZodTypeAny {
  const v = field.validation;
  let n: z.ZodTypeAny = z.coerce.number({
    invalid_type_error: 'Must be a number',
  });
  if (v?.min !== undefined) n = (n as z.ZodNumber).min(v.min);
  if (v?.max !== undefined) n = (n as z.ZodNumber).max(v.max);
  return n;
}

export function isVisibilityConditionMet(
  condition: VisibilityCondition | undefined,
  values: Record<string, unknown>,
): boolean {
  if (!condition) return true;
  const raw = values[condition.fieldKey];
  const actual =
    typeof raw === 'boolean' ? String(raw) : raw == null ? '' : String(raw);
  if (condition.operator === 'equals') return actual === condition.value;
  if (condition.operator === 'not_equals') return actual !== condition.value;
  return true;
}

function fileSchema(field: ResolvedField, required: boolean): ZodTypeAny {
  const v: FieldValidation | undefined = field.validation;
  const base = z.any().superRefine((val, ctx) => {
    if (val == null || val === '' || val === false) {
      if (required) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Required' });
      }
      return;
    }

    const fileLike = val as { size?: number; name?: string; type?: string };
    const size = typeof fileLike.size === 'number' ? fileLike.size : undefined;
    const name = typeof fileLike.name === 'string' ? fileLike.name : undefined;
    const type = typeof fileLike.type === 'string' ? fileLike.type : undefined;

    if (v?.maxFileSizeMb !== undefined && size !== undefined) {
      const maxBytes = v.maxFileSizeMb * 1024 * 1024;
      if (size > maxBytes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `File must be at most ${v.maxFileSizeMb} MB`,
        });
      }
    }

    if (v?.allowedFileTypes && v.allowedFileTypes.length > 0) {
      const allowed = v.allowedFileTypes.map((t) =>
        t.toLowerCase().replace(/^\./, ''),
      );
      const ext = name?.split('.').pop()?.toLowerCase();
      const mimeSubtype = type?.split('/').pop()?.toLowerCase();
      const mimeFull = type?.toLowerCase();
      const ok =
        (ext && allowed.includes(ext)) ||
        (mimeSubtype && allowed.includes(mimeSubtype)) ||
        (mimeFull && allowed.includes(mimeFull));
      if (!ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'File type not allowed',
        });
      }
    }
  });

  return required ? base : base.optional();
}

function schemaForField(field: ResolvedField): ZodTypeAny {
  const required = field.required;

  switch (field.type) {
    case 'email': {
      let s = applyStringRules(z.string(), field);
      if (!required) s = z.union([s, z.literal('')]).optional();
      else s = (s as z.ZodString).min(1, 'Required');
      return s;
    }
    case 'number':
    case 'currency': {
      const n = numberSchema(field);
      if (required) return n;
      return z.preprocess(
        (val) =>
          val === '' || val === null || val === undefined ? undefined : val,
        n.optional(),
      );
    }
    case 'checkbox': {
      if (required) {
        return z
          .union([z.literal(true), z.array(z.string()).nonempty()])
          .or(z.boolean().refine((v) => v === true, 'Required'));
      }
      return z
        .union([z.boolean(), z.array(z.string()), z.undefined(), z.null()])
        .optional();
    }
    case 'checkbox_group': {
      const arr = z.array(z.string());
      if (required) return arr.min(1, 'Required');
      return arr.optional();
    }
    case 'file':
      return fileSchema(field, required);
    case 'file_multiple': {
      const arr = z.array(z.any());
      if (required) return arr.min(1, 'Required');
      return arr.optional();
    }
    case 'multiselect': {
      const arr = z.array(z.string());
      if (required) return arr.min(1, 'Required');
      return arr.optional();
    }
    case 'toggle': {
      if (required) return z.boolean().refine((v) => v === true, 'Required');
      return z.boolean().optional();
    }
    case 'rating':
    case 'slider': {
      const n = numberSchema(field);
      if (required) return n;
      return z.preprocess(
        (val) =>
          val === '' || val === null || val === undefined ? undefined : val,
        n.optional(),
      );
    }
    case 'daterange': {
      const obj = z.object({
        start: z.string().optional(),
        end: z.string().optional(),
      });
      if (required) {
        return obj.refine((v) => !!v.start && !!v.end, 'Required');
      }
      return obj.optional();
    }
    case 'address_group': {
      const obj = z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
      });
      if (required) {
        return obj.refine(
          (v) => !!v.street && !!v.city && !!v.country,
          'Required',
        );
      }
      return obj.optional();
    }
    case 'name_group': {
      const obj = z.object({
        first: z.string().optional(),
        middle: z.string().optional(),
        last: z.string().optional(),
      });
      if (required) {
        return obj.refine((v) => !!v.first && !!v.last, 'Required');
      }
      return obj.optional();
    }
    case 'repeater': {
      const arr = z.array(z.record(z.string(), z.any()));
      if (required) return arr.min(1, 'Required');
      return arr.optional();
    }
    case 'signature': {
      let s = z.string();
      if (required) s = s.min(1, 'Required');
      else return z.union([s, z.literal('')]).optional();
      return s;
    }
    case 'hidden': {
      return z.any().optional();
    }
    case 'text':
    case 'textarea':
    case 'phone':
    case 'date':
    case 'time':
    case 'datetime':
    case 'select':
    case 'radio':
    case 'likert':
    default: {
      let s = applyStringRules(z.string(), field);
      if (required) {
        s = (s as z.ZodString).min(1, 'Required');
      } else {
        s = z.union([s as z.ZodString, z.literal('')]).optional();
      }
      return s;
    }
  }
}

/**
 * Builds a Zod schema from a resolved form for submission validation.
 * Ignores hidden fields and conditionally hidden fields (when values are provided),
 * and applies required, email, number range and file rules.
 */
export function buildZodSchema(
  resolved: ResolvedForm,
  values?: Record<string, unknown>,
): ZodTypeAny {
  const shape: Record<string, ZodTypeAny> = {};

  for (const item of resolved.items) {
    if (item.kind !== 'field') continue;
    const field = item.field;
    if (field.hidden) continue;
    if (values && !isVisibilityConditionMet(field.visibilityCondition, values))
      continue;
    shape[field.key] = schemaForField(field);
  }

  return z.object(shape);
}
