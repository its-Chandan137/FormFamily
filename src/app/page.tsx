import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">FormFamily</h1>
        <p className="text-muted-foreground text-sm">
          Create dynamic form families with inheritance, publish changes safely,
          and collect submissions.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/dashboard" className={cn(buttonVariants())}>
            Open dashboard
          </Link>
          <Link
            href="/forms"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            View forms
          </Link>
        </div>
      </div>
    </main>
  );
}
