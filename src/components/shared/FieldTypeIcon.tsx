import {
  Type,
  Mail,
  Phone,
  Hash,
  Calendar,
  AlignLeft,
  ChevronDownCircle,
  CircleDot,
  CheckSquare,
  Upload,
  BadgeDollarSign,
  Link2,
  type LucideIcon,
} from 'lucide-react';
import type { FieldType } from '@/types';
import { cn } from '@/lib/utils';

const map: Record<string, LucideIcon> = {
  text: Type,
  email: Mail,
  phone: Phone,
  number: Hash,
  date: Calendar,
  textarea: AlignLeft,
  select: ChevronDownCircle,
  radio: CircleDot,
  checkbox: CheckSquare,
  file: Upload,
  currency: BadgeDollarSign,
  url: Link2,
};

export function FieldTypeIcon({
  type,
  className,
}: {
  type: FieldType | string;
  className?: string;
}) {
  const Icon = map[type] ?? Type;
  return (
    <Icon
      className={cn('text-muted-foreground size-4', className)}
      aria-hidden
    />
  );
}
