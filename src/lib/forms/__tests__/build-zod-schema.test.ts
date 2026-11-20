import { describe, expect, it } from 'vitest';
import type { ResolvedForm } from '@/types';
import { buildZodSchema } from '../build-zod-schema';

function form(items: ResolvedForm['items']): ResolvedForm {
  return { formId: 'f', settings: {}, items };
}

describe('buildZodSchema', () => {
  it('16. ignores hidden fields and enforces required, email, number range and file rules', () => {
    const schema = buildZodSchema(
      form([
        {
          kind: 'field',
          field: {
            key: 'visible',
            label: 'Visible',
            type: 'text',
            required: true,
            hidden: false,
            origin: 'own',
            sourceFormId: 'f',
            locked: false,
          },
        },
        {
          kind: 'field',
          field: {
            key: 'secret',
            label: 'Secret',
            type: 'text',
            required: true,
            hidden: true,
            origin: 'own',
            sourceFormId: 'f',
            locked: false,
          },
        },
        {
          kind: 'field',
          field: {
            key: 'email',
            label: 'Email',
            type: 'email',
            required: true,
            hidden: false,
            origin: 'own',
            sourceFormId: 'f',
            locked: false,
          },
        },
        {
          kind: 'field',
          field: {
            key: 'age',
            label: 'Age',
            type: 'number',
            required: true,
            hidden: false,
            validation: { min: 18, max: 65 },
            origin: 'own',
            sourceFormId: 'f',
            locked: false,
          },
        },
        {
          kind: 'field',
          field: {
            key: 'resume',
            label: 'Resume',
            type: 'file',
            required: true,
            hidden: false,
            validation: { maxFileSizeMb: 1, allowedFileTypes: ['pdf'] },
            origin: 'own',
            sourceFormId: 'f',
            locked: false,
          },
        },
        {
          kind: 'field',
          field: {
            key: 'notes',
            label: 'Notes',
            type: 'text',
            required: false,
            hidden: false,
            origin: 'own',
            sourceFormId: 'f',
            locked: false,
          },
        },
      ]),
    );

    // Hidden required field ignored, so missing it is fine
    const ok = schema.safeParse({
      visible: 'hi',
      email: 'a@b.com',
      age: 30,
      resume: { name: 'cv.pdf', size: 1000, type: 'application/pdf' },
    });
    expect(ok.success).toBe(true);

    // Required text
    expect(
      schema.safeParse({
        email: 'a@b.com',
        age: 30,
        resume: { name: 'cv.pdf', size: 1 },
      }).success,
    ).toBe(false);
    // Email format
    expect(
      schema.safeParse({
        visible: 'x',
        email: 'nope',
        age: 30,
        resume: { name: 'cv.pdf', size: 1 },
      }).success,
    ).toBe(false);
    // Number range
    expect(
      schema.safeParse({
        visible: 'x',
        email: 'a@b.com',
        age: 17,
        resume: { name: 'cv.pdf', size: 1 },
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        visible: 'x',
        email: 'a@b.com',
        age: 66,
        resume: { name: 'cv.pdf', size: 1 },
      }).success,
    ).toBe(false);
    // File rules
    expect(
      schema.safeParse({
        visible: 'x',
        email: 'a@b.com',
        age: 30,
        resume: { name: 'cv.png', size: 1, type: 'image/png' },
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        visible: 'x',
        email: 'a@b.com',
        age: 30,
        resume: {
          name: 'cv.pdf',
          size: 2 * 1024 * 1024,
          type: 'application/pdf',
        },
      }).success,
    ).toBe(false);
    // Optional can be omitted/empty
    const okOptional = schema.safeParse({
      visible: 'hi',
      email: 'a@b.com',
      age: 30,
      resume: { name: 'cv.pdf', size: 1000 },
      notes: '',
    });
    expect(okOptional.success).toBe(true);
  });
});
