import { cn } from '@/lib/utils';

const palette = [
  'bg-[#E0E7FF] text-[#4338CA]',
  'bg-[#D1FADF] text-[#027A48]',
  'bg-[#FEF0C7] text-[#B54708]',
  'bg-[#D1E9FF] text-[#175CD3]',
  'bg-[#FCE7F6] text-[#C11574]',
  'bg-[#CCFBF1] text-[#107569]',
];

function hashName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
  const color = palette[hashName(name) % palette.length];
  const sizeCls =
    size === 'sm'
      ? 'size-6 text-[10px]'
      : size === 'lg'
        ? 'size-10 text-sm'
        : 'size-8 text-xs';
  return (
    <span
      aria-label={name}
      title={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium',
        color,
        sizeCls,
        className,
      )}
    >
      {initials || '?'}
    </span>
  );
}
