'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Copy,
  Plus,
  Unlink,
  Trash2,
  Pencil,
  ExternalLink,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapApp } from '@/store/bootstrap';
import { CreateChildDialog } from '@/components/family/CreateChildDialog';
import { DetachDialog } from '@/components/family/DetachDialog';
import { DeleteFormDialog } from '@/components/family/DeleteFormDialog';
import { EmptyState, ErrorState } from '@/components/shared/ScreenStates';
import { toast } from 'sonner';
import type { FormRecord } from '@/types';

function getFamilyRoot(
  forms: FormRecord[],
  formId: string,
): FormRecord | undefined {
  const byId = new Map(forms.map((f) => [f.id, f]));
  let cur = byId.get(formId);
  const seen = new Set<string>();
  while (cur?.parentFormId && byId.has(cur.parentFormId) && !seen.has(cur.id)) {
    seen.add(cur.id);
    cur = byId.get(cur.parentFormId);
  }
  return cur;
}

export default function FormsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const forms = useAppSelector((s) => s.forms.items);
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'table' | 'card'>('table');
  const [createChildFor, setCreateChildFor] = useState<string | null>(null);
  const [detachFor, setDetachFor] = useState<string | null>(null);
  const [deleteFor, setDeleteFor] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return forms.filter((f) => {
      if (
        q &&
        !f.name.toLowerCase().includes(q) &&
        !f.slug.toLowerCase().includes(q)
      )
        return false;
      if (statusFilter === 'published' && !f.publishedVersionId) return false;
      if (statusFilter === 'draft' && !f.draft) return false;
      if (statusFilter === 'unpublished' && !(f.draft && f.publishedVersionId))
        return false;
      return true;
    });
  }, [forms, query, statusFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, { root: FormRecord; items: FormRecord[] }>();
    for (const f of filtered) {
      const root = getFamilyRoot(forms, f.id) ?? f;
      if (!map.has(root.id)) map.set(root.id, { root, items: [] });
      map.get(root.id)!.items.push(f);
    }
    // include all members of families that have any match? simpler: group filtered by root
    const result = Array.from(map.values()).map((g) => ({
      ...g,
      items: g.items.sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return result.sort((a, b) => a.root.name.localeCompare(b.root.name));
  }, [filtered, forms]);

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/f/${slug}`;
    await navigator.clipboard.writeText(url);
    toast.success('Public link copied');
  };

  const statusBadge = (f: FormRecord) => {
    if (f.draft && f.publishedVersionId)
      return <Badge variant="secondary">Unpublished changes</Badge>;
    if (f.publishedVersionId) return <Badge>Published</Badge>;
    return <Badge variant="outline">Draft</Badge>;
  };

  if (!initialized && !error) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader title="All forms" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Skeleton className="h-9 w-full md:max-w-sm" />
          <Skeleton className="h-9 w-full md:w-48" />
          <Skeleton className="h-9 w-full md:w-36" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader title="All forms" />
          <Link href="/forms/new">
            <Button>Create form</Button>
          </Link>
        </div>
        <ErrorState
          title="Could not load forms"
          message={error}
          onRetry={() => void dispatch(bootstrapApp())}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="All forms" />
        <Link href="/forms/new">
          <Button>Create form</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          placeholder="Search forms..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v ?? 'all')}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft only</SelectItem>
            <SelectItem value="unpublished">Unpublished changes</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={view}
          onValueChange={(v) => setView((v as any) ?? 'table')}
        >
          <SelectTrigger className="w-full md:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="table">Table view</SelectItem>
            <SelectItem value="card">Card view</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <Card key={group.root.id}>
            <CardHeader>
              <CardTitle className="text-base">
                Family: {group.root.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {view === 'table' ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">
                            <div>{f.name}</div>
                            <div className="text-muted-foreground text-xs">
                              {f.parentFormId ? 'Child form' : 'Root form'}
                            </div>
                          </TableCell>
                          <TableCell>{statusBadge(f)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {f.slug}
                          </TableCell>
                          <TableCell>
                            {f.updatedAt
                              ? format(new Date(f.updatedAt), 'MMM d, yyyy')
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="hover:bg-accent inline-flex size-8 items-center justify-center rounded-md">
                                <MoreHorizontal className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/forms/${f.id}/edit`)
                                  }
                                >
                                  <Pencil className="mr-2 size-4" />
                                  Open builder
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => void copyLink(f.slug)}
                                >
                                  <Copy className="mr-2 size-4" />
                                  Copy public link
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/f/${f.slug}`)}
                                >
                                  <ExternalLink className="mr-2 size-4" />
                                  Open public form
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setCreateChildFor(f.id)}
                                >
                                  <Plus className="mr-2 size-4" />
                                  Create child
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDetachFor(f.id)}
                                  disabled={!f.parentFormId}
                                >
                                  <Unlink className="mr-2 size-4" />
                                  Detach
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteFor(f.id)}
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((f) => (
                    <div key={f.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">{f.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {f.slug}
                          </div>
                        </div>
                        {statusBadge(f)}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/forms/${f.id}/edit`)}
                        >
                          Open builder
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCreateChildFor(f.id)}
                        >
                          Create child
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void copyLink(f.slug)}
                        >
                          Copy link
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {groups.length === 0 ? (
          <EmptyState
            title="No forms found"
            description={
              forms.length === 0
                ? 'Create your first form to get started.'
                : 'Try adjusting your search or filters.'
            }
            action={
              forms.length === 0 ? (
                <Link href="/forms/new">
                  <Button>Create form</Button>
                </Link>
              ) : undefined
            }
          />
        ) : null}
      </div>

      <CreateChildDialog
        open={!!createChildFor}
        onOpenChange={(o) => !o && setCreateChildFor(null)}
        parentFormId={createChildFor}
      />
      <DetachDialog
        open={!!detachFor}
        onOpenChange={(o) => !o && setDetachFor(null)}
        formId={detachFor}
      />
      <DeleteFormDialog
        open={!!deleteFor}
        onOpenChange={(o) => !o && setDeleteFor(null)}
        formId={deleteFor}
      />
    </div>
  );
}
