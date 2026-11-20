'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
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
import type { ResolvedForm, Submission, SyncStatus } from '@/types';
import { toast } from 'sonner';

function SyncBadge({ status }: { status: SyncStatus }) {
  const variant =
    status === 'synced'
      ? 'default'
      : status === 'pending'
        ? 'secondary'
        : 'destructive';
  return <Badge variant={variant}>{status}</Badge>;
}

function getVersionSnapshot(
  forms: ReturnType<typeof useAppSelector> extends (...args: never[]) => infer R
    ? any
    : never,
  submission: Submission,
): { resolved: ResolvedForm | null; versionNumber?: number } {
  // not used; helper below instead
  return { resolved: null };
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
      items,
    }));
  }, [filtered, formsById]);

  const onRetry = async (id: string) => {
    await dispatch(retrySubmissionSync({ id }));
    toast.success('Sync retried (mock)');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Submissions" />
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          placeholder="Search submissions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:max-w-sm"
        />
        <Select
          value={formFilter}
          onValueChange={(v) => setFormFilter(v ?? 'all')}
        >
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Filter by form" />
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
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v ?? 'all')}
        >
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="synced">Synced</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!initialized && !error ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
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
            <Card key={group.formId}>
              <CardHeader>
                <CardTitle className="text-base">{group.formName}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead></TableHead>
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
                      const name = [
                        s.answers && (s.answers as any).first_name,
                        s.answers && (s.answers as any).last_name,
                      ]
                        .filter(Boolean)
                        .join(' ');
                      return (
                        <TableRow
                          key={s.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedId(s.id)}
                        >
                          <TableCell>
                            {format(new Date(s.createdAt), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            {v ? `v${v.versionNumber}` : s.formVersionId}
                          </TableCell>
                          <TableCell>
                            <SyncBadge status={s.ghlSyncStatus} />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{name || '—'}</div>
                            <div className="text-muted-foreground text-xs">
                              {email || '—'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {s.ghlSyncStatus === 'failed' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void onRetry(s.id);
                                }}
                              >
                                Retry sync
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
                <div className="flex items-center gap-2">
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
                    <div key={row.key} className="rounded-md border p-3">
                      <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {row.label}
                      </div>
                      <div className="mt-1 text-sm break-words">
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
                    variant="outline"
                  >
                    Retry sync (mock)
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
