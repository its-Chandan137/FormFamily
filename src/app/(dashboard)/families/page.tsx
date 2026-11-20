'use client';

import { useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Position,
  Handle,
  MarkerType,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import '@xyflow/react/dist/style.css';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapApp } from '@/store/bootstrap';
import {
  getAncestors,
  getDescendants,
  getDraftResolutionChain,
  resolveForm,
} from '@/lib/forms';
import type { FormRecord } from '@/types';
import { CreateChildDialog } from '@/components/family/CreateChildDialog';
import { DetachDialog } from '@/components/family/DetachDialog';
import { DeleteFormDialog } from '@/components/family/DeleteFormDialog';
import { EmptyState, ErrorState } from '@/components/shared/ScreenStates';

const nodeWidth = 240;
const nodeHeight = 110;

function layout(nodes: Node[], edges: Edge[], direction: 'LR' | 'TB') {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 60 });
  nodes.forEach((n) =>
    g.setNode(n.id, { width: nodeWidth, height: nodeHeight }),
  );
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 },
      targetPosition: direction === 'LR' ? Position.Left : Position.Top,
      sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
    };
  });
}

function FormNode({ data }: { data: any }) {
  const f: FormRecord = data.form;
  const status =
    f.draft && f.publishedVersionId
      ? 'Unpublished changes'
      : f.publishedVersionId
        ? 'Published'
        : 'Draft';
  const dimmed = data.dimmed as boolean | undefined;
  return (
    <div
      className={`bg-card text-card-foreground group w-[240px] rounded-lg border p-3 shadow-sm transition-opacity ${dimmed ? 'opacity-30' : 'opacity-100'}`}
      tabIndex={0}
      role="button"
      aria-label={`${f.name}, ${status}. Press Enter to open details.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          data.onSelect(f.id);
        }
      }}
    >
      <Handle
        type="target"
        position={data.targetPosition ?? Position.Left}
        className="!bg-muted-foreground"
      />
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="leading-tight font-medium">{f.name}</div>
        <Badge
          variant={
            status === 'Published'
              ? 'default'
              : status === 'Draft'
                ? 'outline'
                : 'secondary'
          }
          className="shrink-0 text-[10px]"
        >
          {status}
        </Badge>
      </div>
      <div className="text-muted-foreground mb-2 text-xs">
        Children: {data.childCount} • Inherits: {data.inheritedCount} • Locks:{' '}
        {data.lockCount}
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            data.onSelect(f.id);
          }}
        >
          Details
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            data.onCreateChild(f.id);
          }}
          aria-label={`Create child form under ${f.name}`}
        >
          + Child
        </Button>
      </div>
      <Handle
        type="source"
        position={data.sourcePosition ?? Position.Right}
        className="!bg-muted-foreground"
      />
    </div>
  );
}

const nodeTypes = { formNode: FormNode };

function getFamilyRootId(forms: FormRecord[], id: string): string {
  let cur = forms.find((f) => f.id === id);
  const byId = new Map(forms.map((f) => [f.id, f]));
  const seen = new Set<string>();
  while (cur?.parentFormId && byId.has(cur.parentFormId) && !seen.has(cur.id)) {
    seen.add(cur.id);
    cur = byId.get(cur.parentFormId)!;
  }
  return cur?.id ?? id;
}

export default function FamiliesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const forms = useAppSelector((s) => s.forms.items);
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR');
  const [familyFilter, setFamilyFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createChildFor, setCreateChildFor] = useState<string | null>(null);
  const [detachFor, setDetachFor] = useState<string | null>(null);
  const [deleteFor, setDeleteFor] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const roots = useMemo(() => {
    const map = new Map<string, FormRecord>();
    for (const f of forms) {
      const rid = getFamilyRootId(forms, f.id);
      const r = forms.find((x) => x.id === rid);
      if (r) map.set(rid, r);
    }
    return Array.from(map.values());
  }, [forms]);

  const visibleForms = useMemo(() => {
    if (familyFilter === 'all') return forms;
    return forms.filter((f) => getFamilyRootId(forms, f.id) === familyFilter);
  }, [forms, familyFilter]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const highlightSet = new Set<string>();
    if (hoveredId) {
      highlightSet.add(hoveredId);
      for (const a of getAncestors(forms as any, hoveredId))
        highlightSet.add(a);
      for (const d of getDescendants(forms as any, hoveredId))
        highlightSet.add(d);
    }
    const nodes: Node[] = visibleForms.map((f) => {
      const childCount = forms.filter((x) => x.parentFormId === f.id).length;
      let inheritedCount = 0;
      let lockCount = 0;
      try {
        const chain = getDraftResolutionChain(forms as any, f.id);
        if (chain) {
          const resolved = resolveForm(chain.chain, chain.ids);
          inheritedCount = resolved.items.filter((i) =>
            i.kind === 'field'
              ? i.field.origin === 'inherited'
              : i.origin === 'inherited',
          ).length;
          lockCount = resolved.items.filter(
            (i) => i.kind === 'field' && i.field.locked,
          ).length;
        }
      } catch {}
      const dimmed = hoveredId ? !highlightSet.has(f.id) : false;
      return {
        id: f.id,
        type: 'formNode',
        data: {
          form: f,
          childCount,
          inheritedCount,
          lockCount,
          onSelect: setSelectedId,
          onCreateChild: setCreateChildFor,
          dimmed,
        },
        position: { x: 0, y: 0 },
      };
    });
    const edges: Edge[] = visibleForms
      .filter(
        (f) =>
          f.parentFormId && visibleForms.some((x) => x.id === f.parentFormId),
      )
      .map((f) => {
        const dimmed = hoveredId
          ? !(highlightSet.has(f.parentFormId!) && highlightSet.has(f.id))
          : false;
        return {
          id: `${f.parentFormId}-${f.id}`,
          source: f.parentFormId!,
          target: f.id,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: dimmed ? { opacity: 0.15 } : undefined,
          animated: hoveredId ? !dimmed : false,
        };
      });
    return { nodes: layout(nodes, edges, direction), edges };
  }, [visibleForms, forms, direction, hoveredId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // sync when computed changes
  useMemo(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const selected = selectedId
    ? (forms.find((f) => f.id === selectedId) ?? null)
    : null;
  const selectedInfo = useMemo(() => {
    if (!selected) return null;
    const ancestors = getAncestors(forms as any, selected.id)
      .slice()
      .reverse()
      .map((id) => forms.find((f) => f.id === id)?.name ?? id);
    let inherited = 0,
      own = 0;
    try {
      const chain = getDraftResolutionChain(forms as any, selected.id);
      if (chain) {
        const resolved = resolveForm(chain.chain, chain.ids);
        for (const item of resolved.items) {
          if (item.kind === 'field') {
            if (item.field.origin === 'inherited') inherited++;
            else own++;
          } else {
            if (item.origin === 'inherited') inherited++;
            else own++;
          }
        }
      }
    } catch {}
    return { ancestors, inherited, own };
  }, [selected, forms]);

  if (!initialized && !error) {
    return (
      <div className="space-y-4" aria-busy="true">
        <PageHeader title="Family graph" />
        <Skeleton className="h-[70vh] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Family graph" />
        <ErrorState
          title="Could not load family graph"
          message={error}
          onRetry={() => void dispatch(bootstrapApp())}
        />
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Family graph" />
        <EmptyState
          title="No forms yet"
          description="Create a form to see its family relationships here."
          action={
            <Button onClick={() => router.push('/forms/new')}>
              Create form
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Family graph" />
        <div className="flex flex-wrap gap-2">
          <Select
            value={direction}
            onValueChange={(v) => setDirection((v as 'LR' | 'TB') ?? 'LR')}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LR">Left to right</SelectItem>
              <SelectItem value="TB">Top to bottom</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={familyFilter}
            onValueChange={(v) => setFamilyFilter(v ?? 'all')}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All families" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All families</SelectItem>
              {roots.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className="h-[70vh] rounded-lg border"
        role="application"
        aria-label="Form family graph. Use Tab to focus nodes and Enter to open details."
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          onNodeClick={(_, n) => setSelectedId(n.id)}
          onNodeMouseEnter={(_, n) => setHoveredId(n.id)}
          onNodeMouseLeave={() => setHoveredId(null)}
          nodesDraggable={false}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <div
        className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm"
        aria-label="Graph legend"
      >
        <span className="text-foreground font-medium">Legend:</span>
        <span className="inline-flex items-center gap-1">
          <Badge>Published</Badge> published form
        </span>
        <span className="inline-flex items-center gap-1">
          <Badge variant="outline">Draft</Badge> draft-only
        </span>
        <span className="inline-flex items-center gap-1">
          <Badge variant="secondary">Unpublished changes</Badge> has draft edits
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="bg-primary/70 inline-block size-3 rounded-full" />{' '}
          hover highlights path to root and descendants
        </span>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {selected && selectedInfo ? (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>Family details and actions</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 p-4 pt-0">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md border p-2">
                    <div className="text-muted-foreground text-xs">
                      Inherited items
                    </div>
                    <div className="font-medium">{selectedInfo.inherited}</div>
                  </div>
                  <div className="rounded-md border p-2">
                    <div className="text-muted-foreground text-xs">
                      Own items
                    </div>
                    <div className="font-medium">{selectedInfo.own}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm font-medium">Parent chain</div>
                  <div className="text-muted-foreground text-sm">
                    {selectedInfo.ancestors.length
                      ? selectedInfo.ancestors.join(' → ') +
                        ' → ' +
                        selected.name
                      : 'Root form'}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => router.push(`/forms/${selected.id}/edit`)}
                  >
                    Open builder
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCreateChildFor(selected.id)}
                  >
                    Create child
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDetachFor(selected.id)}
                    disabled={!selected.parentFormId}
                  >
                    Detach
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteFor(selected.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

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
