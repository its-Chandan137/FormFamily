'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapApp } from '@/store/bootstrap';
import { createField } from '@/store/slices/fieldsSlice';
import { EmptyState, ErrorState } from '@/components/shared/ScreenStates';
import type { FieldDefinition, FieldType } from '@/types';
import { toast } from 'sonner';

const fieldTypes: FieldType[] = [
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'currency',
  'date',
  'select',
  'radio',
  'checkbox',
  'file',
];

function similarity(a: string, b: string) {
  const aa = a.toLowerCase();
  const bb = b.toLowerCase();
  if (aa === bb) return 1;
  if (aa.includes(bb) || bb.includes(aa)) return 0.7;
  let common = 0;
  for (const ch of new Set(aa)) if (bb.includes(ch)) common++;
  return common / Math.max(aa.length, bb.length, 1);
}

export default function FieldLibraryPage() {
  const dispatch = useAppDispatch();
  const fields = useAppSelector((s) => s.fields.items);
  const forms = useAppSelector((s) => s.forms.items);
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');

  const usageCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of fields) counts.set(f.key, 0);
    for (const form of forms) {
      const seen = new Set<string>();
      for (const v of form.versions) {
        for (const own of v.content.ownFields) seen.add(own.key);
      }
      if (form.draft) for (const own of form.draft.ownFields) seen.add(own.key);
      for (const k of seen) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return counts;
  }, [fields, forms]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fields;
    return fields.filter(
      (f) =>
        f.key.includes(q) ||
        f.label.toLowerCase().includes(q) ||
        f.type.includes(q),
    );
  }, [fields, query]);

  const suggestions = useMemo(() => {
    if (!key && !label) return [] as FieldDefinition[];
    const needle = (key || label).toLowerCase();
    return fields
      .map((f) => ({
        f,
        score: Math.max(similarity(f.key, needle), similarity(f.label, needle)),
      }))
      .filter((x) => x.score >= 0.4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.f);
  }, [fields, key, label]);

  const keyValid = /^[a-z][a-z0-9_]*$/.test(key);
  const keyExists = fields.some((f) => f.key === key);

  const onCreate = async () => {
    if (!keyValid || !label || keyExists) {
      toast.error('Please provide a unique, valid key and label');
      return;
    }
    await dispatch(createField({ orgId: 'org_1', key, label, type }));
    toast.success('Custom field created');
    setOpen(false);
    setKey('');
    setLabel('');
    setType('text');
  };

  if (!initialized && !error) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="flex items-center justify-between gap-4">
          <PageHeader title="Field library" />
          <Skeleton className="h-9 w-36" />
        </div>
        <Skeleton className="h-9 max-w-sm" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Field library" />
        <ErrorState
          title="Could not load field library"
          message={error}
          onRetry={() => void dispatch(bootstrapApp())}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="Field library" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>Add custom field</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add custom field</DialogTitle>
              <DialogDescription>
                Create an organisation-specific field. Keys are immutable after
                creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="field-key">Key (lowercase snake_case)</Label>
                <Input
                  id="field-key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g. linkedin_url"
                />
                {key && !keyValid ? (
                  <p className="text-destructive text-xs">
                    Key must be lowercase snake_case (start with a letter).
                  </p>
                ) : null}
                {keyExists ? (
                  <p className="text-destructive text-xs">
                    A field with this key already exists.
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="field-label">Label</Label>
                <Input
                  id="field-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="LinkedIn URL"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType((v as FieldType) ?? 'text')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {suggestions.length > 0 ? (
                <div className="rounded-md border p-3">
                  <div className="mb-2 text-sm font-medium">
                    Similar existing fields
                  </div>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    {suggestions.map((s) => (
                      <li key={s.id}>
                        <span className="font-mono text-xs">{s.key}</span> —{' '}
                        {s.label} ({s.type})
                      </li>
                    ))}
                  </ul>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Consider reusing an existing field before creating a new
                    one.
                  </p>
                </div>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={onCreate}
                disabled={!keyValid || !label || keyExists}
              >
                Create field
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search fields..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fields</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              title="No fields found"
              description={
                fields.length === 0
                  ? 'No fields in the library yet.'
                  : 'Try adjusting your search.'
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Used in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs">
                        {f.key}
                      </TableCell>
                      <TableCell>{f.label}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{f.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {f.orgId ? 'Organisation' : 'Platform'}
                      </TableCell>
                      <TableCell>{usageCount.get(f.key) ?? 0} forms</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
