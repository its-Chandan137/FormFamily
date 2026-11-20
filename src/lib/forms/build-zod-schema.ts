import { z, type ZodTypeAny } from 'zod';
import type { FieldValidation, ResolvedField, ResolvedForm } from '@/types';

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
    case 'file':
      return fileSchema(field, required);
    case 'text':
    case 'textarea':
    case 'phone':
    case 'date':
    case 'select':
    case 'radio':
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
 * Ignores hidden fields and applies required, email, number range and file rules.
 */
export function buildZodSchema(resolved: ResolvedForm): ZodTypeAny {
  const shape: Record<string, ZodTypeAny> = {};

  for (const item of resolved.items) {
    if (item.kind !== 'field') continue;
    const field = item.field;
    if (field.hidden) continue;
    shape[field.key] = schemaForField(field);
  }

  return z.object(shape);
}
