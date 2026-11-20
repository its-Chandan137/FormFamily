'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { format, formatDistanceToNow, subDays, isAfter } from 'date-fns';
import {
  FileText,
  GitBranch,
  Inbox,
  AlertTriangle,
  Plus,
  ArrowRight,
  CheckCircle2,
  Plug,
  Share2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapApp } from '@/store/bootstrap';
import { ErrorState, EmptyState } from '@/components/shared/ScreenStates';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Avatar } from '@/components/shared/Avatar';
import { getFormStatus } from '@/lib/forms';

function computeFamilyCount(
  forms: { id: string; parentFormId: string | null }[],
) {
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

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const forms = useAppSelector((s) => s.forms.items);
  const submissions = useAppSelector((s) => s.submissions.items);
  const ghl = useAppSelector((s) => s.ghl);
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);

  const familyCount = useMemo(() => computeFamilyCount(forms), [forms]);
  const weekAgo = subDays(new Date(), 7);
  const submissionsThisWeek = submissions.filter((s) =>
    isAfter(new Date(s.createdAt), weekAgo),
  ).length;
  const failedSyncs = submissions.filter((s) => s.ghlSyncStatus === 'failed');
  const recent = useMemo(
    () =>
      [...submissions]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 5),
    [submissions],
  );

  const needsAttention = useMemo(() => {
    const items: {
      label: string;
      detail: string;
      href: string;
      action: string;
      severity: 'warning' | 'danger' | 'info';
    }[] = [];
    for (const f of forms) {
      if (getFormStatus(f) === 'unpublished_changes') {
        items.push({
          label: f.name,
          detail: 'Has unpublished changes ready to review',
          href: `/forms/${f.id}/edit`,
          action: 'Review and publish',
          severity: 'warning',
        });
      }
    }
    if (failedSyncs.length > 0) {
      items.push({
        label: 'Submissions',
        detail: `${failedSyncs.length} submission${failedSyncs.length > 1 ? 's' : ''} failed to sync to GHL`,
        href: '/submissions',
        action: `Retry ${failedSyncs.length} failed sync${failedSyncs.length > 1 ? 's' : ''}`,
        severity: 'danger',
      });
    }
    const unmapped = ghl.mappings.filter((m) => m.status !== 'mapped');
    if (unmapped.length > 0) {
      items.push({
        label: 'GHL field mappings',
        detail: `${unmapped.length} field${unmapped.length > 1 ? 's' : ''} need review or mapping`,
        href: '/integrations/ghl',
        action: `Map ${unmapped.length} field${unmapped.length > 1 ? 's' : ''}`,
        severity: 'info',
      });
    }
    return items;
  }, [forms, failedSyncs.length, ghl.mappings]);

  const formsById = new Map(forms.map((f) => [f.id, f]));

  if (!initialized && !error) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
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

  const today = format(new Date(), 'EEEE, MMMM d');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good morning, Alex"
        description={today}
        actions={
          <Link
            href="/forms/new"
            className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium shadow-xs transition-colors hover:bg-[#4338CA] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:hover:bg-[#5558E3]"
          >
            <Plus className="size-4" aria-hidden />
            New form
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/forms"
          className="focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
        >
          <StatCard
            label="Forms"
            value={forms.length}
            icon={<FileText className="size-4" />}
          />
        </Link>
        <Link
          href="/families"
          className="focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
        >
          <StatCard
            label="Families"
            value={familyCount}
            icon={<GitBranch className="size-4" />}
          />
        </Link>
        <Link
          href="/submissions"
          className="focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
        >
          <StatCard
            label="Submissions this week"
            value={submissionsThisWeek}
            icon={<Inbox className="size-4" />}
          />
        </Link>
        <Link
          href="/submissions"
          className="focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
        >
          <StatCard
            label="Failed syncs"
            value={failedSyncs.length}
            icon={<AlertTriangle className="size-4" />}
          />
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card className="min-w-0">
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Needs attention</CardTitle>
            {needsAttention.length > 0 ? (
              <span className="text-muted-foreground text-xs font-medium tabular-nums">
                {needsAttention.length} item
                {needsAttention.length > 1 ? 's' : ''}
              </span>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {needsAttention.length === 0 ? (
              <div className="border-border flex items-start gap-3 rounded-lg border border-dashed p-4">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#ECFDF3] text-[#039855] dark:bg-[rgba(50,213,131,0.12)] dark:text-[#32D583]">
                  <CheckCircle2 className="size-4" aria-hidden />
                </span>
                <div>
                  <div className="text-sm font-medium">All clear</div>
                  <p className="text-muted-foreground text-sm">
                    No unpublished changes, failed syncs, or mapping issues
                    right now.
                  </p>
                </div>
              </div>
            ) : (
              needsAttention.map((item, i) => (
                <div
                  key={i}
                  className="border-border flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={
                        item.severity === 'danger'
                          ? 'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FEF3F2] text-[#D92D20] dark:bg-[rgba(249,112,102,0.12)] dark:text-[#F97066]'
                          : item.severity === 'warning'
                            ? 'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FFFAEB] text-[#DC6803] dark:bg-[rgba(253,176,34,0.12)] dark:text-[#FDB022]'
                            : 'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EFF8FF] text-[#1570EF] dark:bg-[rgba(83,177,253,0.12)] dark:text-[#53B1FD]'
                      }
                    >
                      <AlertTriangle className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="text-foreground truncate text-sm font-medium">
                        {item.label}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {item.detail}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={item.href}
                    className="border-border bg-surface text-foreground hover:bg-surface-muted focus-visible:ring-ring inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border px-3 text-[13px] font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {item.action}
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Recent submissions</CardTitle>
            <Link
              href="/submissions"
              className="text-muted-foreground hover:bg-surface-muted hover:text-foreground focus-visible:ring-ring inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              View all <ArrowRight className="size-4" aria-hidden />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {recent.length === 0 ? (
              <EmptyState
                title="No submissions yet"
                description="Share a published form link to start receiving responses."
                className="border-0 p-0 shadow-none"
              />
            ) : (
              recent.map((s) => {
                const form = formsById.get(s.formId);
                const ans = s.answers as Record<string, unknown>;
                const name =
                  [ans.first_name, ans.last_name].filter(Boolean).join(' ') ||
                  String(ans.email ?? 'Applicant');
                const syncVariant =
                  s.ghlSyncStatus === 'synced'
                    ? 'synced'
                    : s.ghlSyncStatus === 'pending'
                      ? 'pending'
                      : 'failed';
                const syncLabel =
                  s.ghlSyncStatus === 'synced'
                    ? 'Synced'
                    : s.ghlSyncStatus === 'pending'
                      ? 'Pending'
                      : 'Failed';
                return (
                  <div
                    key={s.id}
                    className="hover:bg-surface-muted/60 flex items-center gap-3 rounded-lg px-2 py-2"
                  >
                    <Avatar name={name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-foreground truncate text-sm font-medium">
                        {name}
                      </div>
                      <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                        <span className="truncate">
                          {form?.name ?? s.formId}
                        </span>
                        <span aria-hidden>·</span>
                        <span title={format(new Date(s.createdAt), 'PPpp')}>
                          {formatDistanceToNow(new Date(s.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0">
                      <StatusBadgeLike
                        variant={syncVariant}
                        label={syncLabel}
                      />
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBadgeLike({
  variant,
  label,
}: {
  variant: 'synced' | 'pending' | 'failed';
  label: string;
}) {
  const cls =
    variant === 'synced'
      ? 'bg-[#ECFDF3] text-[#027A48] dark:bg-[rgba(50,213,131,0.12)] dark:text-[#32D583]'
      : variant === 'pending'
        ? 'bg-[#EFF8FF] text-[#175CD3] dark:bg-[rgba(83,177,253,0.12)] dark:text-[#53B1FD]'
        : 'bg-[#FEF3F2] text-[#B42318] dark:bg-[rgba(249,112,102,0.12)] dark:text-[#F97066]';
  const dot =
    variant === 'synced'
      ? 'bg-[#039855] dark:bg-[#32D583]'
      : variant === 'pending'
        ? 'bg-[#1570EF] dark:bg-[#53B1FD]'
        : 'bg-[#D92D20] dark:bg-[#F97066]';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}
