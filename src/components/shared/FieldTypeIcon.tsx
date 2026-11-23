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
  ListChecks,
  EyeOff,
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
  checkbox_group: CheckSquare,
  toggle: CheckSquare,
  rating: CircleDot,
  slider: CircleDot,
  likert: CircleDot,
  time: Type,
  datetime: Type,
  daterange: Type,
  multiselect: ListChecks,
  file: Upload,
  file_multiple: Upload,
  signature: Type,
  address_group: ListChecks,
  name_group: Type,
  repeater: ListChecks,
  hidden: EyeOff,
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
