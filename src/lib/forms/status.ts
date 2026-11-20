import type { FormRecord } from '@/types';

export type FormStatus = 'draft' | 'published' | 'unpublished_changes';

export function getFormStatus(
  form: Pick<FormRecord, 'draft' | 'publishedVersionId'>,
): FormStatus {
  if (form.publishedVersionId) {
    return form.draft ? 'unpublished_changes' : 'published';
  }
  return 'draft';
}

export function getFormStatusLabel(status: FormStatus): string {
  switch (status) {
    case 'published':
      return 'Published';
    case 'unpublished_changes':
      return 'Unpublished changes';
    case 'draft':
    default:
      return 'Draft';
  }
}

export function isNeverPublished(
  form: Pick<FormRecord, 'publishedVersionId'>,
): boolean {
  return !form.publishedVersionId;
}
