'use client';

import { useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { RotateCcw, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapApp } from '@/store/bootstrap';
import { retrySubmissionSync } from '@/store/slices/submissionsSlice';
import { EmptyState, ErrorState } from '@/components/shared/ScreenStates';
import { Avatar } from '@/components/shared/Avatar';
import type { ResolvedForm, Submission, SyncStatus } from '@/types';
import { toast } from 'sonner';

function SyncBadge({ status }: { status: SyncStatus }) {
  const variant =
    status === 'synced'
      ? 'synced'
      : status === 'pending'
        ? 'pending'
        : 'failed';
  const label =
    status === 'synced'
      ? 'Synced'
      : status === 'pending'
        ? 'Pending'
        : 'Failed';
  return <Badge variant={variant}>{label}</Badge>;
}

export default function SubmissionsPage() {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);
  const forms = useAppSelector((s) => s.forms.items);
  const submissions = useAppSelector((s) => s.submissions.items);
  const [formFilter, setFormFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const formsById = useMemo(
    () => new Map(forms.map((f) => [f.id, f])),
    [forms],
  );

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (formFilter !== 'all' && s.formId !== formFilter) return false;
      if (statusFilter !== 'all' && s.ghlSyncStatus !== statusFilter)
        return false;
      if (query) {
        const q = query.toLowerCase();
        const formName = (formsById.get(s.formId)?.name ?? '').toLowerCase();
        const answersStr = JSON.stringify(s.answers).toLowerCase();
        if (!formName.includes(q) && !answersStr.includes(q)) return false;
      }
      return true;
    });
  }, [submissions, formFilter, statusFilter, query, formsById]);

  const selected = selectedId
    ? (submissions.find((s) => s.id === selectedId) ?? null)
    : null;
  const selectedForm = selected ? formsById.get(selected.formId) : null;
  const selectedVersion =
    selectedForm?.versions.find((v) => v.id === selected?.formVersionId) ??
    null;
  const selectedSnapshot =
    (selectedVersion?.resolvedSnapshot as ResolvedForm | null) ?? null;

  const answerRows = useMemo(() => {
    if (!selected)
      return [] as { key: string; label: string; value: unknown }[];
    const answers = selected.answers as Record<string, unknown>;
    if (selectedSnapshot) {
      const fieldItems = selectedSnapshot.items
        .filter((i) => i.kind === 'field')
        .map((i) => i.field);
      return fieldItems.map((f) => ({
        key: f.key,
        label: f.label,
        value: answers[f.key],
      }));
    }
    return Object.entries(answers).map(([k, v]) => ({
      key: k,
      label: k,
      value: v,
    }));
  }, [selected, selectedSnapshot]);

  const grouped = useMemo(() => {
    const byForm = new Map<string, Submission[]>();
    for (const s of filtered) {
      const arr = byForm.get(s.formId) ?? [];
      arr.push(s);
      byForm.set(s.formId, arr);
    }
    return Array.from(byForm.entries()).map(([formId, items]) => ({
      formId,
      formName: formsById.get(formId)?.name ?? formId,
      items: items.sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      ),
    }));
  }, [filtered, formsById]);

  const onRetry = async (id: string) => {
    await dispatch(retrySubmissionSync({ id }));
    toast.success('Sync retried (mock)');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submissions"
        description="Review applicant responses and sync status."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            placeholder="Search submissions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Form</span>
          <Select
            value={formFilter}
            onValueChange={(v) => setFormFilter(v ?? 'all')}
          >
            <SelectTrigger className="w-[220px]" aria-label="Form filter">
              <SelectValue placeholder="All forms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All forms</SelectItem>
              {forms.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Sync</span>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v ?? 'all')}
          >
            <SelectTrigger
              className="w-[170px]"
              aria-label="Sync status filter"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="synced">Synced</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!initialized && !error ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load submissions"
          message={error}
          onRetry={() => void dispatch(bootstrapApp())}
        />
      ) : grouped.length === 0 ? (
        <EmptyState
          title="No submissions found"
          description={
            submissions.length === 0
              ? 'Submissions will appear here after applicants submit published forms.'
              : 'Try adjusting your filters or search.'
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <Card key={group.formId} className="overflow-hidden p-0">
              <CardHeader className="border-border flex-row items-center justify-between border-b px-5 py-4">
                <CardTitle className="text-base">{group.formName}</CardTitle>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {group.items.length} submission
                  {group.items.length === 1 ? '' : 's'}
                </span>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Applicant</TableHead>
                        <TableHead>Form</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Sync status</TableHead>
                        <TableHead className="w-28">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((s) => {
                        const v = formsById
                          .get(s.formId)
                          ?.versions.find((ver) => ver.id === s.formVersionId);
                        const email = String(
                          (s.answers as Record<string, unknown>).email ?? '',
                        );
                        const name =
                          [
                            s.answers && (s.answers as any).first_name,
                            s.answers && (s.answers as any).last_name,
                          ]
                            .filter(Boolean)
                            .join('') ||
                          String((s.answers as any).first_name ?? '') +
                            ' ' +
                            String((s.answers as any).last_name ?? '');
                        const displayName =
                          [
                            (s.answers as any).first_name,
                            (s.answers as any).last_name,
                          ]
                            .filter(Boolean)
                            .join(' ') ||
                          email ||
                          'Applicant';
                        return (
                          <TableRow
                            key={s.id}
                            className="cursor-pointer"
                            onClick={() => setSelectedId(s.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar name={displayName} size="sm" />
                                <div className="min-w-0">
                                  <div className="truncate font-medium">
                                    {displayName}
                                  </div>
                                  <div className="text-muted-foreground truncate text-xs">
                                    {email || '—'}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" dot={false}>
                                {group.formName}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-xs">
                              {v ? `v${v.versionNumber}` : s.formVersionId}
                            </TableCell>
                            <TableCell
                              className="text-muted-foreground"
                              title={format(new Date(s.createdAt), 'PPpp')}
                            >
                              {formatDistanceToNow(new Date(s.createdAt), {
                                addSuffix: true,
                              })}
                            </TableCell>
                            <TableCell>
                              <SyncBadge status={s.ghlSyncStatus} />
                            </TableCell>
                            <TableCell
                              className="text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {s.ghlSyncStatus === 'failed' ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => void onRetry(s.id)}
                                >
                                  <RotateCcw className="size-3.5" aria-hidden />{' '}
                                  Retry
                                </Button>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-xl"
        >
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>Submission details</SheetTitle>
                <SheetDescription>
                  {selectedForm?.name ?? selected.formId} •{' '}
                  {selectedVersion
                    ? `v${selectedVersion.versionNumber}`
                    : selected.formVersionId}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4 p-4 pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <SyncBadge status={selected.ghlSyncStatus} />
                  {selected.ghlSyncError ? (
                    <span className="text-destructive text-sm">
                      {selected.ghlSyncError}
                    </span>
                  ) : null}
                </div>
                <div className="text-muted-foreground text-sm">
                  Submitted {format(new Date(selected.createdAt), 'PPpp')}
                </div>
                <div className="space-y-3">
                  {answerRows.map((row) => (
                    <div
                      key={row.key}
                      className="border-border rounded-lg border p-3"
                    >
                      <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {row.label}
                      </div>
                      <div className="text-foreground mt-1 text-sm break-words">
                        {typeof row.value === 'boolean'
                          ? row.value
                            ? 'Yes'
                            : 'No'
                          : row.value &&
                              typeof row.value === 'object' &&
                              'name' in (row.value as any)
                            ? `${(row.value as any).name} (${Math.round(((row.value as any).size ?? 0) / 1024)} KB)`
                            : row.value == null || row.value === ''
                              ? '—'
                              : String(row.value)}
                      </div>
                    </div>
                  ))}
                </div>
                {selected.ghlSyncStatus === 'failed' ? (
                  <Button
                    onClick={() => void onRetry(selected.id)}
                    variant="secondary"
                  >
                    <RotateCcw className="size-4" aria-hidden /> Retry sync
                    (mock)
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
