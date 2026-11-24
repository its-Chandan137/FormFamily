'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { PageHeader } from '@/components/layout/PageHeader';
import { QuickEditDialog } from '@/components/forms/QuickEditDialog';
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
  DropdownMenuSeparator,
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
  Search,
  LayoutList,
  LayoutGrid,
  GitBranch,
  CornerDownRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapApp } from '@/store/bootstrap';
import { CreateChildDialog } from '@/components/family/CreateChildDialog';
import { DetachDialog } from '@/components/family/DetachDialog';
import { DeleteFormDialog } from '@/components/family/DeleteFormDialog';
import { EmptyState, ErrorState } from '@/components/shared/ScreenStates';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Avatar } from '@/components/shared/Avatar';
import { SegmentedControl } from '@/components/shared/SegmentedControl';
import { getFormStatus } from '@/lib/forms';
import { toast } from 'sonner';
import type { FormRecord } from '@/types';
import { cn } from '@/lib/utils';

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

function getDepth(forms: FormRecord[], formId: string): number {
  const byId = new Map(forms.map((f) => [f.id, f]));
  let depth = 0;
  let cur = byId.get(formId);
  const seen = new Set<string>();
  while (cur?.parentFormId && byId.has(cur.parentFormId) && !seen.has(cur.id)) {
    seen.add(cur.id);
    depth++;
    cur = byId.get(cur.parentFormId);
  }
  return depth;
}

export default function FormsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const forms = useAppSelector((s) => s.forms.items);
  const submissions = useAppSelector((s) => s.submissions.items);
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'table' | 'card'>('table');
  const [createChildFor, setCreateChildFor] = useState<string | null>(null);
  const [detachFor, setDetachFor] = useState<string | null>(null);
  const [deleteFor, setDeleteFor] = useState<string | null>(null);
  const [quickEditFor, setQuickEditFor] = useState<string | null>(null);

  const submissionCountByForm = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of submissions) m.set(s.formId, (m.get(s.formId) ?? 0) + 1);
    return m;
  }, [submissions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return forms.filter((f) => {
      if (
        q &&
        !f.name.toLowerCase().includes(q) &&
        !f.slug.toLowerCase().includes(q)
      )
        return false;
      const status = getFormStatus(f);
      if (statusFilter === 'published' && status !== 'published') return false;
      if (statusFilter === 'draft' && status !== 'draft') return false;
      if (statusFilter === 'unpublished' && status !== 'unpublished_changes')
        return false;
      return true;
    });
  }, [forms, query, statusFilter]);

  const groups = useMemo(() => {
    const byId = new Map(forms.map((f) => [f.id, f]));
    const map = new Map<string, { root: FormRecord; items: FormRecord[] }>();
    for (const f of filtered) {
      const root = getFamilyRoot(forms, f.id) ?? f;
      if (!map.has(root.id)) map.set(root.id, { root, items: [] });
      const group = map.get(root.id)!;
      if (!group.items.some((x) => x.id === f.id)) group.items.push(f);
      // ensure root included in its family group if any member matched
      if (
        !group.items.some((x) => x.id === group.root.id) &&
        filtered.some((x) => x.id === group.root.id || byId.get(x.id))
      ) {
        // handled by filtered inclusion; keep as-is
      }
    }
    const result = Array.from(map.values()).map((g) => {
      const familyMembers = forms.filter(
        (f) => getFamilyRoot(forms, f.id)?.id === g.root.id,
      );
      const visibleIds = new Set(g.items.map((i) => i.id));
      // show whole family context when part matches? keep matched + ancestors path is complex; show matched items but root first then children by depth/name
      const ordered = [...familyMembers]
        .filter((f) => visibleIds.has(f.id))
        .sort((a, b) => {
          const da = getDepth(forms, a.id);
          const db = getDepth(forms, b.id);
          if (da !== db) return da - db;
          return a.name.localeCompare(b.name);
        });
      return { root: g.root, items: ordered.length ? ordered : g.items };
    });
    return result.sort((a, b) => a.root.name.localeCompare(b.root.name));
  }, [filtered, forms]);

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/f/${slug}`;
    await navigator.clipboard.writeText(url);
    toast.success('Public link copied');
  };

  if (!initialized && !error) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Skeleton className="h-9 w-full md:max-w-sm" />
          <Skeleton className="h-9 w-full md:w-48" />
          <Skeleton className="h-9 w-full md:w-36" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Forms"
          description="Manage forms, families, and publishing."
        />
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
      <PageHeader
        title="Forms"
        description="Manage forms, families, and publishing."
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              placeholder="Search forms..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm whitespace-nowrap">
              Status
            </span>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v ?? 'all')}
            >
              <SelectTrigger className="w-[180px]" aria-label="Status filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="unpublished">Unpublished changes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <SegmentedControl
          ariaLabel="View"
          value={view}
          onValueChange={(v) => setView(v as 'table' | 'card')}
          options={[
            {
              value: 'table',
              label: 'List',
              icon: <LayoutList className="size-4" />,
            },
            {
              value: 'card',
              label: 'Cards',
              icon: <LayoutGrid className="size-4" />,
            },
          ]}
        />
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <Card key={group.root.id} className="overflow-hidden p-0">
            <CardHeader className="border-border flex-row items-center justify-between gap-2 border-b px-5 py-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="bg-accent text-accent-foreground flex size-8 items-center justify-center rounded-md">
                  <GitBranch className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <CardTitle className="truncate text-sm font-semibold">
                    {group.root.name}
                  </CardTitle>
                  <div className="text-muted-foreground text-xs">
                    Family · {group.items.length} form
                    {group.items.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {view === 'table' ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submissions</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead className="w-12">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((f) => {
                        const depth = getDepth(forms, f.id);
                        const isRoot = !f.parentFormId;
                        return (
                          <TableRow
                            key={f.id}
                            className="cursor-pointer"
                            onClick={() => router.push(`/forms/${f.id}/edit`)}
                          >
                            <TableCell>
                              <div
                                className="flex items-center gap-2"
                                style={{ paddingLeft: depth * 20 }}
                              >
                                {depth > 0 ? (
                                  <CornerDownRight
                                    className="text-subtle size-4 shrink-0"
                                    aria-hidden
                                  />
                                ) : null}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-foreground truncate font-medium">
                                      {f.name}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      dot={false}
                                      className="h-5 px-1.5 text-[11px]"
                                    >
                                      {isRoot ? 'Root' : 'Child'}
                                    </Badge>
                                  </div>
                                  <div className="text-muted-foreground truncate font-mono text-xs">
                                    {f.slug}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <StatusBadge form={f} />
                            </TableCell>
                            <TableCell className="text-muted-foreground tabular-nums">
                              {submissionCountByForm.get(f.id) ?? 0}
                            </TableCell>
                            <TableCell
                              className="text-muted-foreground"
                              title={f.updatedAt || undefined}
                            >
                              {f.updatedAt
                                ? formatDistanceToNow(new Date(f.updatedAt), {
                                    addSuffix: true,
                                  })
                                : '—'}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Avatar name="Alex Morgan" size="sm" />
                            </TableCell>
                            <TableCell
                              className="text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Quick edit ${f.name}`}
                                  onClick={() => setQuickEditFor(f.id)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger className="text-muted-foreground hover:bg-surface-muted hover:text-foreground inline-flex size-8 items-center justify-center rounded-md opacity-100 transition-opacity md:opacity-0 md:group-hover/row:opacity-100 md:focus:opacity-100">
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">
                                      Actions for {f.name}
                                    </span>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => setQuickEditFor(f.id)}
                                    >
                                      <Pencil className="mr-2 size-4" /> Quick
                                      edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(`/forms/${f.id}/edit`)
                                      }
                                    >
                                      <LayoutList className="mr-2 size-4" />{' '}
                                      Open builder
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => void copyLink(f.slug)}
                                    >
                                      <Copy className="mr-2 size-4" /> Copy
                                      public link
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(`/f/${f.slug}`)
                                      }
                                    >
                                      <ExternalLink className="mr-2 size-4" />{' '}
                                      Open public form
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setCreateChildFor(f.id)}
                                    >
                                      <Plus className="mr-2 size-4" /> Create
                                      child
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setDetachFor(f.id)}
                                      disabled={!f.parentFormId}
                                    >
                                      <Unlink className="mr-2 size-4" /> Detach
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setDeleteFor(f.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 size-4" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((f) => {
                    const depth = getDepth(forms, f.id);
                    return (
                      <div
                        key={f.id}
                        className={cn(
                          'border-border bg-surface rounded-xl border p-4',
                          depth > 0 && 'ml-4',
                        )}
                      >
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">
                                {f.name}
                              </span>
                              <Badge
                                variant="outline"
                                dot={false}
                                className="h-5 px-1.5 text-[11px]"
                              >
                                {f.parentFormId ? 'Child' : 'Root'}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground truncate font-mono text-xs">
                              {f.slug}
                            </div>
                          </div>
                          <StatusBadge form={f} />
                        </div>
                        <div className="text-muted-foreground mb-3 flex items-center gap-3 text-xs">
                          <span className="tabular-nums">
                            {submissionCountByForm.get(f.id) ?? 0} submissions
                          </span>
                          <span>·</span>
                          <span>
                            {f.updatedAt
                              ? formatDistanceToNow(new Date(f.updatedAt), {
                                  addSuffix: true,
                                })
                              : '—'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setQuickEditFor(f.id)}
                          >
                            <Pencil className="size-4" /> Quick edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/forms/${f.id}/edit`)}
                          >
                            Open builder
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
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {groups.length === 0 ? (
          <EmptyState
            title={forms.length === 0 ? 'No forms yet' : 'No forms found'}
            description={
              forms.length === 0
                ? 'Create your first form to start collecting responses.'
                : 'Try adjusting your search or status filter.'
            }
            action={
              forms.length === 0 ? (
                <Link
                  href="/forms/new"
                  className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium shadow-xs transition-colors hover:bg-[#4338CA] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:hover:bg-[#5558E3]"
                >
                  Create form
                </Link>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setStatusFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              )
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
      <QuickEditDialog
        formId={quickEditFor}
        open={!!quickEditFor}
        onOpenChange={(o) => !o && setQuickEditFor(null)}
      />
    </div>
  );
}
