'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Sparkles,
  GitBranch,
  Check,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapApp } from '@/store/bootstrap';
import { createForm } from '@/store/slices/formsSlice';
import { exceedsMaxDepth, getDepth } from '@/lib/forms';
import { START_ANCHOR } from '@/lib/constants';
import { ErrorState } from '@/components/shared/ScreenStates';
import type { FormContent } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function hiringTemplate(name: string): FormContent {
  return {
    settings: {
      companyName: 'Northwind Labs',
      title: name || 'Application',
      about:
        '<p>Tell us about yourself and why you are a great fit for this role.</p>',
      submitLabel: 'Submit application',
      successMessage: 'Thanks for applying!',
    },
    ownFields: [
      {
        key: 'first_name',
        label: 'First Name',
        type: 'text',
        required: true,
        hidden: false,
        insertAfter: 'el_about' as any,
      },
      {
        key: 'last_name',
        label: 'Last Name',
        type: 'text',
        required: true,
        hidden: false,
        insertAfter: 'first_name',
      },
      {
        key: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        hidden: false,
        insertAfter: 'last_name',
      },
      {
        key: 'phone',
        label: 'Phone',
        type: 'phone',
        required: false,
        hidden: false,
        insertAfter: 'email',
      },
      {
        key: 'resume',
        label: 'Resume',
        type: 'file',
        required: true,
        hidden: false,
        insertAfter: 'phone',
      },
      {
        key: 'current_company',
        label: 'Current Company',
        type: 'text',
        required: false,
        hidden: false,
        insertAfter: 'resume',
      },
      {
        key: 'experience',
        label: 'Experience',
        type: 'number',
        required: true,
        hidden: false,
        insertAfter: 'current_company',
      },
      {
        key: 'expected_ctc',
        label: 'Expected CTC',
        type: 'currency',
        required: false,
        hidden: false,
        insertAfter: 'experience',
      },
    ],
    elements: [
      {
        id: 'el_logo',
        type: 'logo',
        props: { alt: 'Northwind Labs' },
        insertAfter: START_ANCHOR as any,
      },
      {
        id: 'el_heading',
        type: 'heading',
        props: { text: 'Northwind Labs' },
        insertAfter: 'el_logo',
      },
      {
        id: 'el_about',
        type: 'richtext',
        props: {
          html: '<p>Tell us about yourself and why you are a great fit for this role.</p>',
        },
        insertAfter: 'el_heading',
      },
    ],
    overrides: {},
    locks: [],
  };
}

const startOptions = [
  {
    id: 'blank' as const,
    title: 'Blank form',
    description: 'Start from scratch with an empty canvas.',
    icon: FileText,
  },
  {
    id: 'template' as const,
    title: 'Hiring template',
    description: 'Pre-filled with common hiring fields and layout.',
    icon: Sparkles,
  },
  {
    id: 'child' as const,
    title: 'Inherit from a form',
    description: 'Create a child that inherits from an existing parent.',
    icon: GitBranch,
  },
];

export default function NewFormPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const forms = useAppSelector((s) => s.forms.items);
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);
  const [path, setPath] = useState<'blank' | 'template' | 'child' | null>(
    'blank',
  );
  const [parentId, setParentId] = useState<string>('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [creating, setCreating] = useState(false);

  const parentOptions = useMemo(() => {
    return forms.map((f) => {
      const depth = getDepth(forms as any, f.id);
      const disabled = depth >= 5 || exceedsMaxDepth(forms as any, 'new', f.id);
      return { ...f, depth, disabled };
    });
  }, [forms]);

  const onNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const selectedParent = forms.find((f) => f.id === parentId) ?? null;
  const canCreate =
    !!path &&
    !!name.trim() &&
    !!slug.trim() &&
    (path !== 'child' || !!parentId) &&
    !creating;
  const disabledReason = !path
    ? 'Choose how to start'
    : !name.trim()
      ? 'Enter a form name'
      : !slug.trim()
        ? 'Enter a slug'
        : path === 'child' && !parentId
          ? 'Select a parent form'
          : null;

  const onCreate = async () => {
    if (!canCreate || !path) return;
    setCreating(true);
    try {
      let content: FormContent;
      if (path === 'template') content = hiringTemplate(name);
      else {
        content = {
          settings: { title: name },
          ownFields: [],
          elements: [],
          overrides: {},
          locks: [],
        };
      }
      const created = await dispatch(
        createForm({
          name: name.trim(),
          slug: slug.trim(),
          parentFormId: path === 'child' ? parentId : null,
          content,
        }),
      ).unwrap();
      toast.success('Form created');
      router.push(`/forms/${created.id}/edit`);
    } catch {
      toast.error('Failed to create form');
    } finally {
      setCreating(false);
    }
  };

  if (!initialized && !error) {
    return (
      <div className="space-y-6" aria-busy="true">
        <PageHeader
          title="Create form"
          description="Start a new form from scratch, a template, or an existing parent."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Create form"
          description="Start a new form from scratch, a template, or an existing parent."
        />
        <ErrorState
          title="Could not load form creator"
          message={error}
          onRetry={() => void dispatch(bootstrapApp())}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create form"
        description="Start a new form from scratch, a template, or an existing parent."
      />

      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-medium">
          1. Choose a starting point
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {startOptions.map((opt) => {
            const Icon = opt.icon;
            const selected = path === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPath(opt.id)}
                className={cn(
                  'group focus-visible:ring-ring flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                  selected
                    ? 'border-primary bg-accent/40 ring-primary/20 shadow-sm ring-1'
                    : 'border-border bg-surface hover:border-border-strong hover:bg-surface-muted/40',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 items-center justify-center rounded-lg border',
                    selected
                      ? 'border-primary/20 bg-primary text-primary-foreground'
                      : 'border-border bg-surface-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="space-y-1">
                  <span className="text-foreground block text-sm font-semibold">
                    {opt.title}
                  </span>
                  <span className="text-muted-foreground block text-sm">
                    {opt.description}
                  </span>
                </span>
                {selected ? (
                  <span className="text-primary mt-auto inline-flex items-center gap-1 text-xs font-medium">
                    <Check className="size-3.5" aria-hidden /> Selected
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {path ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {path === 'child' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    2. Choose a parent
                  </CardTitle>
                  <CardDescription>
                    Select the form this child will inherit from. Maximum depth
                    is 5 levels.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {parentOptions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No forms available to inherit from yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {parentOptions.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          disabled={f.disabled}
                          onClick={() => setParentId(f.id)}
                          className={cn(
                            'focus-visible:ring-ring flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                            parentId === f.id
                              ? 'border-primary bg-accent/40'
                              : 'border-border hover:bg-surface-muted/50',
                          )}
                          style={{ marginLeft: Math.min(f.depth, 3) * 12 }}
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              {f.depth > 0 ? (
                                <ChevronRight
                                  className="text-subtle size-3.5"
                                  aria-hidden
                                />
                              ) : null}
                              <span className="truncate text-sm font-medium">
                                {f.name}
                              </span>
                            </span>
                            <span className="text-muted-foreground block font-mono text-xs">
                              {f.slug}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <Badge
                              variant="outline"
                              dot={false}
                              className="h-5"
                            >
                              Depth {f.depth}
                            </Badge>
                            {f.disabled ? (
                              <span className="text-muted-foreground text-xs">
                                Max depth reached
                              </span>
                            ) : null}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {path === 'child' ? '3. Form details' : '2. Form details'}
                </CardTitle>
                <CardDescription>
                  Name your form and choose its public slug.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="form-name">Name</Label>
                  <Input
                    id="form-name"
                    name="Name"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="e.g. Frontend Developer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-slug">Slug</Label>
                  <div className="border-input bg-surface focus-within:ring-ring flex items-center gap-2 rounded-md border px-3 focus-within:ring-2">
                    <span className="text-muted-foreground shrink-0 text-sm">
                      formfamily.app/f/
                    </span>
                    <Input
                      id="form-slug"
                      name="Slug"
                      value={slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setSlug(slugify(e.target.value));
                      }}
                      placeholder="frontend-developer"
                      className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Auto-generated from the name; you can edit it.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button onClick={onCreate} disabled={!canCreate}>
                    {creating ? 'Creating…' : 'Create and open builder'}
                  </Button>
                  {disabledReason && !canCreate ? (
                    <span className="text-muted-foreground text-sm">
                      {disabledReason}
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
                <CardDescription>What will be created</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Type</span>
                  <span className="text-foreground text-right font-medium">
                    {path === 'blank'
                      ? 'Blank form'
                      : path === 'template'
                        ? 'Hiring template'
                        : 'Child form'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Name</span>
                  <span className="text-foreground text-right font-medium">
                    {name.trim() || '—'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Slug</span>
                  <span className="text-foreground text-right font-mono text-xs">
                    {slug.trim() || '—'}
                  </span>
                </div>
                {path === 'child' ? (
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Parent</span>
                    <span className="text-foreground text-right font-medium">
                      {selectedParent?.name || '—'}
                    </span>
                  </div>
                ) : null}
                {path === 'template' ? (
                  <div className="border-border bg-surface-muted/50 text-muted-foreground rounded-lg border p-3 text-xs">
                    Includes logo, heading, about section, and common hiring
                    fields (name, email, phone, resume, experience, and more).
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
