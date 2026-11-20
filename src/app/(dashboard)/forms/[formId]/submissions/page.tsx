'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import type { ResolvedForm, SyncStatus } from '@/types';
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

export default function FormSubmissionsPage() {
  const params = useParams<{ formId: string }>();
  const formId = params?.formId;
  const dispatch = useAppDispatch();
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);
  const forms = useAppSelector((s) => s.forms.items);
  const submissions = useAppSelector((s) => s.submissions.items).filter(
    (s) => s.formId === formId,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const form = forms.find((f) => f.id === formId);

  const selected = selectedId
    ? (submissions.find((s) => s.id === selectedId) ?? null)
    : null;
  const selectedVersion =
    form?.versions.find((v) => v.id === selected?.formVersionId) ?? null;
  const selectedSnapshot =
    (selectedVersion?.resolvedSnapshot as ResolvedForm | null) ?? null;

  const answerRows = (() => {
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
  })();

  const onRetry = async (id: string) => {
    await dispatch(retrySubmissionSync({ id }));
    toast.success('Sync retried (mock)');
  };

  if (!initialized && !error) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={form ? `${form.name} submissions` : 'Form submissions'}
        />
        <ErrorState
          title="Could not load submissions"
          message={error}
          onRetry={() => void dispatch(bootstrapApp())}
        />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="space-y-6">
        <PageHeader title="Form submissions" />
        <ErrorState
          title="Form not found"
          message="The requested form could not be found."
          onRetry={() => void dispatch(bootstrapApp())}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`${form.name} submissions`} />
      {submissions.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          description="Submissions for this form will appear here after applicants submit it."
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-6">
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
                {submissions.map((s) => {
                  const v = form?.versions.find(
                    (ver) => ver.id === s.formVersionId,
                  );
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
                  {form?.name} •{' '}
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
