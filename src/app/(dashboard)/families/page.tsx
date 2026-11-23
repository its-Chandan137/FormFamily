'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Plus, Maximize2 } from 'lucide-react';
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
  getFormStatus,
  getFormStatusLabel,
  resolveForm,
} from '@/lib/forms';
import type { FormRecord } from '@/types';
import { CreateChildDialog } from '@/components/family/CreateChildDialog';
import { DetachDialog } from '@/components/family/DetachDialog';
import { DeleteFormDialog } from '@/components/family/DeleteFormDialog';
import { EmptyState, ErrorState } from '@/components/shared/ScreenStates';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';

const nodeWidth = 248;
const nodeHeight = 96;

function layout(nodes: Node[], edges: Edge[], direction: 'LR' | 'TB') {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 48, ranksep: 72 });
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
  const status = getFormStatus(f);
  const statusLabel = getFormStatusLabel(status);
  const dimmed = data.dimmed as boolean | undefined;
  const bar =
    status === 'published'
      ? 'bg-[#039855]'
      : status === 'draft'
        ? 'bg-[#98A2B3]'
        : 'bg-[#DC6803]';
  return (
    <div
      className={cn(
        'group border-border bg-surface text-card-foreground relative w-[248px] overflow-hidden rounded-xl border shadow-xs transition-all',
        dimmed ? 'opacity-30' : 'opacity-100',
        'hover:border-border-strong hover:shadow-sm',
      )}
      tabIndex={0}
      role="button"
      aria-label={`${f.name}, ${statusLabel}. Press Enter to open details.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          data.onSelect(f.id);
        }
      }}
    >
      <span
        className={cn('absolute top-0 bottom-0 left-0 w-[3px]', bar)}
        aria-hidden
      />
      <Handle
        type="target"
        position={data.targetPosition ?? Position.Left}
        className="!border-surface !bg-border-strong !h-2 !w-2 !border-2"
      />
      <div className="p-3 pl-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="text-foreground truncate text-[14px] leading-5 font-semibold">
                {f.name}
              </div>
              {!f.parentFormId ? (
                <Badge
                  variant="outline"
                  dot={false}
                  className="h-5 px-1.5 text-[10px]"
                >
                  Root
                </Badge>
              ) : null}
            </div>
            <div className="text-muted-foreground truncate font-mono text-xs">
              {f.slug}
            </div>
          </div>
          <StatusBadge status={status} className="shrink-0" />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="inline-flex items-center rounded-full bg-[var(--inherit-muted)] px-1.5 py-0.5 font-medium text-[var(--inherit)]">
            {data.inheritedCount} inherited
          </span>
          <span className="bg-surface-muted text-muted-foreground inline-flex items-center rounded-full px-1.5 py-0.5 font-medium">
            +{data.ownCount} own
          </span>
          {data.lockCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-[#FFFAEB] px-1.5 py-0.5 font-medium text-[#B54708] dark:bg-[rgba(253,176,34,0.12)] dark:text-[#FDB022]">
              {data.lockCount} locks
            </span>
          ) : null}
          <span className="text-muted-foreground ml-auto tabular-nums">
            {data.childCount} child{data.childCount === 1 ? '' : 'ren'}
          </span>
        </div>
      </div>
      <button
        type="button"
        className="border-border bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground absolute top-2 right-2 hidden size-6 items-center justify-center rounded-md border shadow-xs group-hover:flex"
        onClick={(e) => {
          e.stopPropagation();
          data.onCreateChild(f.id);
        }}
        aria-label={`Create child form under ${f.name}`}
        title="Create child"
      >
        <Plus className="size-3.5" />
      </button>
      <Handle
        type="source"
        position={data.sourcePosition ?? Position.Right}
        className="!border-surface !bg-border-strong !h-2 !w-2 !border-2"
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
  const [rfInstance, setRfInstance] = useState<any>(null);

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
    const targetPos = direction === 'LR' ? Position.Left : Position.Top;
    const sourcePos = direction === 'LR' ? Position.Right : Position.Bottom;
    const nodes: Node[] = visibleForms.map((f) => {
      const childCount = forms.filter((x) => x.parentFormId === f.id).length;
      let inheritedCount = 0;
      let lockCount = 0;
      let ownCount = 0;
      try {
        const chain = getDraftResolutionChain(forms as any, f.id, {
          allowAncestorDraftFallback: true,
        });
        if (chain) {
          const resolved = resolveForm(chain.chain, chain.ids);
          for (const item of resolved.items) {
            const isInherited =
              item.kind === 'field'
                ? item.field.origin === 'inherited'
                : item.origin === 'inherited';
            if (isInherited) inheritedCount++;
            else ownCount++;
            if (item.kind === 'field' && item.field.locked) lockCount++;
          }
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
          ownCount,
          lockCount,
          onSelect: setSelectedId,
          onCreateChild: setCreateChildFor,
          dimmed,
          targetPosition: targetPos,
          sourcePosition: sourcePos,
        },
        position: { x: 0, y: 0 },
        targetPosition: targetPos,
        sourcePosition: sourcePos,
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
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: dimmed ? '#D0D5DD' : '#98A2B3',
          },
          style: {
            strokeWidth: 1.5,
            stroke: dimmed ? '#E4E7EC' : '#98A2B3',
            ...(dimmed ? { opacity: 0.15 } : { opacity: 1 }),
          },
          animated: hoveredId ? !dimmed : false,
        };
      });
    return { nodes: layout(nodes, edges, direction), edges };
  }, [visibleForms, forms, direction, hoveredId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => {
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
      const chain = getDraftResolutionChain(forms as any, selected.id, {
        allowAncestorDraftFallback: true,
      });
      if (chain) {
        const resolved = resolveForm(chain.chain, chain.ids);
        for (const item of resolved.items) {
          const isInherited =
            item.kind === 'field'
              ? item.field.origin === 'inherited'
              : item.origin === 'inherited';
          if (isInherited) inherited++;
          else own++;
        }
      }
    } catch {}
    return { ancestors, inherited, own };
  }, [selected, forms]);

  if (!initialized && !error) {
    return (
      <div className="flex h-full flex-col p-4 md:p-6" aria-busy="true">
        <div className="mb-4 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="min-h-[70vh] w-full flex-1 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.01em]">
            Family graph
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Visualize inheritance across form families.
          </p>
        </div>
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
      <div className="space-y-4 p-4 md:p-6">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.01em]">
            Family graph
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Visualize inheritance across form families.
          </p>
        </div>
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
    <div className="flex h-[calc(100vh-3.5rem)] min-h-[600px] flex-col">
      <div className="border-border bg-surface/80 flex flex-wrap items-end justify-between gap-3 border-b px-4 py-3 md:px-6">
        <div>
          <h1 className="text-foreground text-[24px] leading-8 font-semibold tracking-[-0.01em]">
            Family graph
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualize inheritance relationships and publish impact across
            families.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={direction}
            onValueChange={(v) => setDirection((v as 'LR' | 'TB') ?? 'LR')}
          >
            <SelectTrigger className="w-40" aria-label="Layout direction">
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
            <SelectTrigger className="w-52" aria-label="Family filter">
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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => rfInstance?.fitView?.({ padding: 0.2 })}
          >
            <Maximize2 className="size-4" aria-hidden /> Fit view
          </Button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 bg-[radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] [background-size:24px_24px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          onNodeClick={(_, n) => setSelectedId(n.id)}
          onNodeMouseEnter={(_, n) => setHoveredId(n.id)}
          onNodeMouseLeave={() => setHoveredId(null)}
          nodesDraggable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} color="var(--border)" />
          <Controls className="!border-border !bg-surface !shadow-sm" />
          <MiniMap
            pannable
            zoomable
            className="!border-border !bg-surface"
            nodeColor={(n) => {
              const f = (n.data as any)?.form as FormRecord | undefined;
              if (!f) return '#E4E7EC';
              const s = getFormStatus(f);
              return s === 'published'
                ? '#039855'
                : s === 'draft'
                  ? '#98A2B3'
                  : '#DC6803';
            }}
          />
        </ReactFlow>

        <div className="border-border bg-surface/95 pointer-events-none absolute bottom-4 left-4 rounded-lg border p-3 text-xs shadow-sm backdrop-blur">
          <div className="text-foreground mb-2 font-medium">Legend</div>
          <div className="text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-3 rounded-sm bg-[#039855]" /> Published
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-3 rounded-sm bg-[#98A2B3]" /> Draft
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-3 rounded-sm bg-[#DC6803]" /> Unpublished
              changes
            </div>
            <div className="flex items-center gap-2">
              <span className="h-px w-4 bg-[#98A2B3]" /> Inherits
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-accent inline-block size-2 rounded-full" />{' '}
              Hover to highlight path
            </div>
          </div>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[420px]">
          {selected && selectedInfo ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selected.name}
                  <StatusBadge form={selected} />
                </SheetTitle>
                <SheetDescription>Family details and actions</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 p-4 pt-0">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="border-border rounded-lg border p-3">
                    <div className="text-muted-foreground text-xs">
                      Inherited items
                    </div>
                    <div className="mt-0.5 text-lg font-semibold tabular-nums">
                      {selectedInfo.inherited}
                    </div>
                  </div>
                  <div className="border-border rounded-lg border p-3">
                    <div className="text-muted-foreground text-xs">
                      Own items
                    </div>
                    <div className="mt-0.5 text-lg font-semibold tabular-nums">
                      {selectedInfo.own}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-sm font-medium">Parent chain</div>
                  <div className="border-border bg-surface-muted/40 text-muted-foreground rounded-lg border p-3 text-sm">
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
                    variant="secondary"
                    onClick={() => setCreateChildFor(selected.id)}
                  >
                    Create child
                  </Button>
                  <Button
                    variant="secondary"
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
