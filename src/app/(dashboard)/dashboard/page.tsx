'use client';

import Link from 'next/link';
import { format, subDays, isAfter } from 'date-fns';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapApp } from '@/store/bootstrap';
import { ErrorState } from '@/components/shared/ScreenStates';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const forms = useAppSelector((s) => s.forms.items);
  const submissions = useAppSelector((s) => s.submissions.items);
  const ghl = useAppSelector((s) => s.ghl);
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);

  const familyCount = useMemoFamilies(forms);
  const weekAgo = subDays(new Date(), 7);
  const submissionsThisWeek = submissions.filter((s) =>
    isAfter(new Date(s.createdAt), weekAgo),
  ).length;
  const failedSyncs = submissions.filter(
    (s) => s.ghlSyncStatus === 'failed',
  ).length;
  const recent = [...submissions]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  const needsAttention: { label: string; href: string; detail: string }[] = [];
  for (const f of forms) {
    if (f.draft) {
      needsAttention.push({
        label: f.name,
        href: `/forms/${f.id}/edit`,
        detail: 'Unpublished changes',
      });
    }
  }
  const failed = submissions.filter((s) => s.ghlSyncStatus === 'failed');
  if (failed.length > 0) {
    needsAttention.push({
      label: 'Submissions',
      href: '/submissions',
      detail: `${failed.length} failed sync${failed.length > 1 ? 's' : ''}`,
    });
  }
  const unmapped = ghl.mappings.filter((m) => m.status !== 'mapped');
  if (unmapped.length > 0) {
    needsAttention.push({
      label: 'GHL mappings',
      href: '/integrations/ghl',
      detail: `${unmapped.length} unmapped/suggested field${unmapped.length > 1 ? 's' : ''}`,
    });
  }

  const formsById = new Map(forms.map((f) => [f.id, f]));

  if (!initialized && !error) {
    return (
      <div className="space-y-6" aria-busy="true">
        <PageHeader title="Dashboard" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <ErrorState
          title="Could not load dashboard"
          message={error}
          onRetry={() => void dispatch(bootstrapApp())}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{forms.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Families</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{familyCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Submissions this week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{submissionsThisWeek}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed syncs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{failedSyncs}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No submissions yet.
              </p>
            ) : (
              recent.map((s) => {
                const form = formsById.get(s.formId);
                const ans = s.answers as Record<string, unknown>;
                const name = [ans.first_name, ans.last_name]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {name || String(ans.email ?? 'Applicant')}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {form?.name ?? s.formId} •{' '}
                        {format(new Date(s.createdAt), 'MMM d, HH:mm')}
                      </div>
                    </div>
                    <Badge
                      variant={
                        s.ghlSyncStatus === 'synced'
                          ? 'default'
                          : s.ghlSyncStatus === 'pending'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {s.ghlSyncStatus}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Needs attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {needsAttention.length === 0 ? (
              <p className="text-muted-foreground text-sm">All clear.</p>
            ) : (
              needsAttention.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="hover:bg-accent/40 flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-muted-foreground text-xs">
                      {item.detail}
                    </div>
                  </div>
                  <Badge variant="outline">View</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function useMemoFamilies(forms: { id: string; parentFormId: string | null }[]) {
  // compute number of families (distinct roots)
  const roots = new Set<string>();
  const byId = new Map(forms.map((f) => [f.id, f]));
  for (const f of forms) {
    let cur = f;
    const seen = new Set<string>();
    while (
      cur.parentFormId &&
      byId.has(cur.parentFormId) &&
      !seen.has(cur.id)
    ) {
      seen.add(cur.id);
      cur = byId.get(cur.parentFormId)!;
    }
    roots.add(cur.id);
  }
  return roots.size;
}
