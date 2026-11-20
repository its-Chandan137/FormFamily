'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapApp } from '@/store/bootstrap';
import {
  saveGhlMappings,
  validateGhlConnection,
} from '@/store/slices/ghlSlice';
import type { GhlFieldMappingRecord } from '@/services/ghlRepository';
import { ErrorState } from '@/components/shared/ScreenStates';
import { toast } from 'sonner';

function statusBadge(status: GhlFieldMappingRecord['status']) {
  if (status === 'mapped') return <Badge>mapped</Badge>;
  if (status === 'suggested')
    return <Badge variant="secondary">suggested</Badge>;
  return <Badge variant="outline">unmapped</Badge>;
}

export default function GhlIntegrationPage() {
  const dispatch = useAppDispatch();
  const fields = useAppSelector((s) => s.fields.items);
  const forms = useAppSelector((s) => s.forms.items);
  const submissions = useAppSelector((s) => s.submissions.items);
  const ghl = useAppSelector((s) => s.ghl);
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);
  const [token, setToken] = useState('••••••••••••••••');
  const [locationId, setLocationId] = useState(
    ghl.connection.locationId ?? 'loc_northwind_hq',
  );
  const [draftMappings, setDraftMappings] = useState<
    GhlFieldMappingRecord[] | null
  >(null);
  const [review, setReview] = useState(false);
  const [saving, setSaving] = useState(false);

  const mappings = draftMappings ?? ghl.mappings;
  const customFieldsById = useMemo(
    () => new Map(ghl.customFields.map((f) => [f.id, f])),
    [ghl.customFields],
  );

  const syncSummary = useMemo(() => {
    return forms.map((form) => {
      const subs = submissions.filter((s) => s.formId === form.id);
      return {
        formId: form.id,
        name: form.name,
        synced: subs.filter((s) => s.ghlSyncStatus === 'synced').length,
        pending: subs.filter((s) => s.ghlSyncStatus === 'pending').length,
        failed: subs.filter((s) => s.ghlSyncStatus === 'failed').length,
        total: subs.length,
      };
    });
  }, [forms, submissions]);

  const updateMapping = (fieldKey: string, ghlCustomFieldId: string | null) => {
    setDraftMappings((prev) => {
      const base = prev ?? ghl.mappings.map((m) => ({ ...m }));
      return base.map((m) =>
        m.fieldKey === fieldKey
          ? {
              ...m,
              ghlCustomFieldId,
              status: ghlCustomFieldId ? 'mapped' : 'unmapped',
              suggestion: undefined,
            }
          : m,
      );
    });
    setReview(false);
  };

  const acceptSuggestion = (fieldKey: string) => {
    setDraftMappings((prev) => {
      const base = prev ?? ghl.mappings.map((m) => ({ ...m }));
      return base.map((m) => {
        if (m.fieldKey !== fieldKey || !m.suggestion) return m;
        return {
          ...m,
          ghlCustomFieldId: m.suggestion.ghlCustomFieldId,
          status: 'mapped',
          suggestion: m.suggestion,
        };
      });
    });
    setReview(false);
  };

  const onValidate = async () => {
    await dispatch(validateGhlConnection({ token, locationId }));
    toast.success('Connection validated (mock)');
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await dispatch(saveGhlMappings(mappings)).unwrap();
      setDraftMappings(null);
      setReview(false);
      toast.success('Mappings saved');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsaved = !!draftMappings;

  if (!initialized && !error) {
    return (
      <div className="space-y-6" aria-busy="true">
        <PageHeader title="GHL integration" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="GHL integration" />
        <ErrorState
          title="Could not load GHL integration"
          message={error}
          onRetry={() => void dispatch(bootstrapApp())}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="GHL integration" />

      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
          <CardDescription>
            POC uses pasted credentials (token + location ID), stored encrypted
            in real implementation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ghl-token">API token</Label>
              <Input
                id="ghl-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ghl-location">Location ID</Label>
              <Input
                id="ghl-location"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onValidate}>
              Validate
            </Button>
            {ghl.connection.connected ? (
              <div className="text-sm">
                <Badge>Connected</Badge>{' '}
                <span className="text-muted-foreground ml-2">
                  {ghl.connection.locationName} ({ghl.connection.locationId})
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">
                Not connected
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing GHL custom fields</CardTitle>
          <CardDescription>
            Fields pulled from the connected sub-account (mocked).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ghl.customFields.map((f) => (
              <div key={f.id} className="rounded-md border p-2 text-sm">
                <div className="font-medium">{f.name}</div>
                <div className="text-muted-foreground font-mono text-xs">
                  {f.id}
                  {f.key ? ` • ${f.key}` : ''}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field mapping</CardTitle>
          <CardDescription>
            Map library fields to GHL custom fields. Review changes before
            saving.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Possible duplicate warning: similar GHL fields detected —{' '}
            <strong>Expected CTC</strong> and <strong>Expected Salary</strong>.
            Prefer reusing the existing mapped field to avoid duplicates.
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Library field</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>GHL custom field</TableHead>
                  <TableHead>Suggestion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((m) => {
                  const field = fields.find((f) => f.key === m.fieldKey);
                  return (
                    <TableRow key={m.fieldKey}>
                      <TableCell>
                        <div className="font-medium">
                          {field?.label ?? m.fieldKey}
                        </div>
                        <div className="text-muted-foreground font-mono text-xs">
                          {m.fieldKey}
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(m.status)}</TableCell>
                      <TableCell className="min-w-[240px]">
                        <Select
                          value={m.ghlCustomFieldId ?? '__none__'}
                          onValueChange={(v) =>
                            updateMapping(
                              m.fieldKey,
                              !v || v === '__none__' ? null : v,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unmapped" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Unmapped</SelectItem>
                            {ghl.customFields.map((cf) => (
                              <SelectItem key={cf.id} value={cf.id}>
                                {cf.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {m.suggestion ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {m.suggestion.ghlFieldName}
                            </span>
                            {m.ghlCustomFieldId !==
                            m.suggestion.ghlCustomFieldId ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => acceptSuggestion(m.fieldKey)}
                              >
                                Accept
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                (accepted)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setReview(true)}
              disabled={!hasUnsaved}
            >
              Review changes
            </Button>
            <Button
              onClick={onSave}
              disabled={!hasUnsaved || (!review && hasUnsaved) || saving}
            >
              {saving ? 'Saving…' : 'Save mappings'}
            </Button>
            {hasUnsaved && !review ? (
              <span className="text-muted-foreground text-sm">
                Review required before saving.
              </span>
            ) : null}
            {review && hasUnsaved ? (
              <span className="text-sm text-green-700">
                Changes reviewed. You can save now.
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync status summary (per form)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form</TableHead>
                  <TableHead>Synced</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncSummary.map((s) => (
                  <TableRow key={s.formId}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.synced}</TableCell>
                    <TableCell>{s.pending}</TableCell>
                    <TableCell>{s.failed}</TableCell>
                    <TableCell>{s.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
