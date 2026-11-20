import { Badge } from '@/components/ui/badge';
import {
  getFormStatus,
  getFormStatusLabel,
  type FormStatus,
} from '@/lib/forms';
import type { FormRecord } from '@/types';

const variantByStatus: Record<
  FormStatus,
  'published' | 'draft' | 'unpublished'
> = {
  published: 'published',
  draft: 'draft',
  unpublished_changes: 'unpublished',
};

export function StatusBadge({
  form,
  status,
  className,
}: {
  form?: Pick<FormRecord, 'draft' | 'publishedVersionId'>;
  status?: FormStatus;
  className?: string;
}) {
  const resolved = status ?? (form ? getFormStatus(form) : 'draft');
  const label = getFormStatusLabel(resolved);
  return (
    <Badge variant={variantByStatus[resolved]} className={className}>
      {label}
    </Badge>
  );
}
