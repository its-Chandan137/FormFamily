import Link from 'next/link';
import { ArrowRight, GitBranch, Database, Users } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function ProductPreview() {
  return (
    <div className="border-border bg-surface relative mx-auto w-full max-w-[560px] rounded-2xl border p-4 shadow-lg">
      <div className="border-border mb-3 flex items-center gap-2 border-b pb-3">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#E4E7EC]" />
          <span className="size-2.5 rounded-full bg-[#E4E7EC]" />
          <span className="size-2.5 rounded-full bg-[#E4E7EC]" />
        </div>
        <div className="bg-surface-muted ml-2 h-5 flex-1 rounded" />
      </div>
      <div className="grid grid-cols-[160px_1fr] gap-3">
        <div className="border-border bg-surface-muted/40 space-y-2 rounded-lg border p-2">
          <div className="bg-accent/60 h-6 rounded" />
          <div className="bg-surface h-5 rounded" />
          <div className="bg-surface h-5 rounded" />
          <div className="bg-surface h-5 rounded" />
        </div>
        <div className="border-border space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div className="bg-surface-muted h-4 w-32 rounded" />
            <div className="h-5 w-16 rounded-full bg-[#ECFDF3]" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="border-border bg-surface h-9 rounded-md border" />
            <div className="h-9 rounded-md border border-[#99F6E0] bg-[#F0FDF9]" />
            <div className="border-border bg-surface h-9 rounded-md border" />
            <div className="border-border bg-surface h-9 rounded-md border border-dashed opacity-70" />
          </div>
        </div>
      </div>
      <div className="border-border bg-surface pointer-events-none absolute -right-6 -bottom-6 hidden w-40 rounded-xl border p-3 shadow-md sm:block">
        <div className="text-muted-foreground mb-2 text-[11px] font-medium">
          Family graph
        </div>
        <svg viewBox="0 0 120 70" className="h-auto w-full">
          <line
            x1="20"
            y1="18"
            x2="60"
            y2="35"
            stroke="#D0D5DD"
            strokeWidth="1.5"
          />
          <line
            x1="100"
            y1="18"
            x2="60"
            y2="35"
            stroke="#D0D5DD"
            strokeWidth="1.5"
          />
          <rect
            x="6"
            y="6"
            width="28"
            height="16"
            rx="4"
            fill="#EEF2FF"
            stroke="#C7D2FE"
          />
          <rect
            x="86"
            y="6"
            width="28"
            height="16"
            rx="4"
            fill="#F0FDF9"
            stroke="#99F6E0"
          />
          <rect
            x="46"
            y="30"
            width="28"
            height="16"
            rx="4"
            fill="#ECFDF3"
            stroke="#A6F4C5"
          />
          <rect
            x="46"
            y="52"
            width="28"
            height="14"
            rx="4"
            fill="#F2F4F7"
            stroke="#E4E7EC"
          />
          <line
            x1="60"
            y1="46"
            x2="60"
            y2="52"
            stroke="#D0D5DD"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
              <circle cx="6" cy="6" r="2.5" className="fill-primary" />
              <circle
                cx="18"
                cy="6"
                r="2.5"
                className="fill-[var(--inherit)]"
              />
              <circle cx="12" cy="18" r="2.5" className="fill-primary/70" />
              <path
                d="M8 7.5L10.5 15M16 7.5L13.5 15M8.5 6h7"
                className="stroke-border-strong"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-sm font-semibold tracking-[-0.01em]">
              FormFamily
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ size: 'sm' }))}
            >
              Open demo
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-16">
          <div className="max-w-xl space-y-6">
            <div className="border-border bg-surface text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-xs">
              <span className="size-1.5 rounded-full bg-[var(--inherit)]" />
              Forms with inheritance
            </div>
            <h1 className="text-foreground text-[40px] leading-[48px] font-semibold tracking-[-0.02em] sm:text-[48px] sm:leading-[56px]">
              Build once. Inherit everywhere.
            </h1>
            <p className="text-muted-foreground max-w-lg text-base leading-7 sm:text-lg">
              FormFamily lets hiring teams create form families that share
              structure, stay in sync, and publish changes safely across every
              child form.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}
              >
                Open demo <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: 'secondary', size: 'lg' }),
                )}
              >
                Sign in
              </Link>
            </div>
          </div>
          <div className="relative">
            <ProductPreview />
          </div>
        </section>

        <section className="border-border grid gap-4 border-t py-10 sm:grid-cols-3">
          <div className="border-border bg-surface rounded-xl border p-5">
            <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-[#F0FDF9] text-[var(--inherit)]">
              <GitBranch className="size-4" aria-hidden />
            </div>
            <h2 className="text-foreground text-base font-semibold">
              Forms that inherit
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Model hiring forms as families. Children inherit fields and
              updates while keeping local overrides.
            </p>
          </div>
          <div className="border-border bg-surface rounded-xl border p-5">
            <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-[#EFF8FF] text-[#1570EF]">
              <Database className="size-4" aria-hidden />
            </div>
            <h2 className="text-foreground text-base font-semibold">
              Clean CRM data
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Consistent field keys and mappings keep submissions structured and
              ready for GHL sync.
            </p>
          </div>
          <div className="border-border bg-surface rounded-xl border p-5">
            <div className="bg-accent text-accent-foreground mb-3 flex size-9 items-center justify-center rounded-lg">
              <Users className="size-4" aria-hidden />
            </div>
            <h2 className="text-foreground text-base font-semibold">
              Built for hiring teams
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Ship role-specific applications quickly without duplicating forms
              or losing control.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
