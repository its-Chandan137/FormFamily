import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[var(--success-muted,#ECFDF3)] text-[#027A48] dark:text-[var(--success)]',
        secondary: 'border-transparent bg-surface-muted text-muted-foreground',
        destructive:
          'border-transparent bg-[#FEF3F2] text-[#B42318] dark:bg-[rgba(249,112,102,0.12)] dark:text-[#F97066]',
        outline: 'border-border bg-surface text-muted-foreground',
        ghost:
          'border-transparent text-muted-foreground hover:bg-surface-muted',
        link: 'border-transparent text-primary underline-offset-4 hover:underline',
        published:
          'border-transparent bg-[#ECFDF3] text-[#027A48] dark:bg-[rgba(50,213,131,0.12)] dark:text-[#32D583]',
        draft:
          'border-transparent bg-surface-muted text-[#475467] dark:text-[#98A2B3]',
        unpublished:
          'border-transparent bg-[#FFFAEB] text-[#B54708] dark:bg-[rgba(253,176,34,0.12)] dark:text-[#FDB022]',
        failed:
          'border-transparent bg-[#FEF3F2] text-[#B42318] dark:bg-[rgba(249,112,102,0.12)] dark:text-[#F97066]',
        pending:
          'border-transparent bg-[#EFF8FF] text-[#175CD3] dark:bg-[rgba(83,177,253,0.12)] dark:text-[#53B1FD]',
        synced:
          'border-transparent bg-[#ECFDF3] text-[#027A48] dark:bg-[rgba(50,213,131,0.12)] dark:text-[#32D583]',
        inherit:
          'border-transparent bg-[var(--inherit-muted)] text-[var(--inherit)]',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  },
);

const dotColor: Record<string, string> = {
  default: 'bg-[#039855] dark:bg-[#32D583]',
  published: 'bg-[#039855] dark:bg-[#32D583]',
  synced: 'bg-[#039855] dark:bg-[#32D583]',
  secondary: 'bg-[#98A2B3]',
  draft: 'bg-[#98A2B3]',
  outline: 'bg-[#98A2B3]',
  destructive: 'bg-[#D92D20] dark:bg-[#F97066]',
  failed: 'bg-[#D92D20] dark:bg-[#F97066]',
  unpublished: 'bg-[#DC6803] dark:bg-[#FDB022]',
  pending: 'bg-[#1570EF] dark:bg-[#53B1FD]',
  inherit: 'bg-[var(--inherit)]',
  ghost: 'bg-[#98A2B3]',
  link: 'bg-primary',
};

const statusDotVariants = new Set([
  'published',
  'draft',
  'unpublished',
  'failed',
  'pending',
  'synced',
  'inherit',
  'default',
  'destructive',
]);

type BadgeProps = useRender.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    dot?: boolean;
  };

function Badge({
  className,
  variant = 'secondary',
  dot,
  render,
  children,
  ...props
}: BadgeProps) {
  const showDot = dot ?? statusDotVariants.has(variant ?? '');
  const content = (
    <>
      {showDot ? (
        <span
          aria-hidden
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            dotColor[variant ?? 'secondary'] ?? 'bg-current',
          )}
        />
      ) : null}
      {children}
    </>
  );

  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ variant }), className),
        children: content,
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  });
}

export { Badge, badgeVariants };
