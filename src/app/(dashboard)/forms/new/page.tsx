'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapApp } from '@/store/bootstrap';
import { createForm } from '@/store/slices/formsSlice';
import { exceedsMaxDepth, getDepth } from '@/lib/forms';
import { START_ANCHOR } from '@/lib/constants';
import { ErrorState } from '@/components/shared/ScreenStates';
import type { FormContent } from '@/types';
import { toast } from 'sonner';

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

export default function NewFormPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const forms = useAppSelector((s) => s.forms.items);
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);
  const [path, setPath] = useState<'blank' | 'template' | 'child'>('blank');
  const [parentId, setParentId] = useState<string>('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
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
    if (!slug) setSlug(slugify(v));
  };

  const onCreate = async () => {
    if (!name || !slug) {
      toast.error('Name and slug are required');
      return;
    }
    if (path === 'child' && !parentId) {
      toast.error('Select a parent form');
      return;
    }
    setCreating(true);
    try {
      let content: FormContent;
      if (path === 'blank') {
        content = {
          settings: { title: name },
          ownFields: [],
          elements: [],
          overrides: {},
          locks: [],
        };
      } else if (path === 'template') {
        content = hiringTemplate(name);
      } else {
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
          name,
          slug,
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
        <PageHeader title="Create form" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Create form" />
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
      <PageHeader title="Create form" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Start from</CardTitle>
            <CardDescription>
              Choose how you want to create your form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={path}
              onValueChange={(v) => setPath(v as any)}
              className="space-y-3"
            >
              <div className="flex items-start gap-2">
                <RadioGroupItem
                  value="blank"
                  id="path-blank"
                  className="mt-1"
                />
                <Label htmlFor="path-blank" className="font-normal">
                  <div className="font-medium">Blank form</div>
                  <div className="text-muted-foreground text-sm">
                    Start from scratch.
                  </div>
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem
                  value="template"
                  id="path-template"
                  className="mt-1"
                />
                <Label htmlFor="path-template" className="font-normal">
                  <div className="font-medium">Hiring template</div>
                  <div className="text-muted-foreground text-sm">
                    Pre-filled with common hiring fields.
                  </div>
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem
                  value="child"
                  id="path-child"
                  className="mt-1"
                />
                <Label htmlFor="path-child" className="font-normal">
                  <div className="font-medium">Child of existing form</div>
                  <div className="text-muted-foreground text-sm">
                    Inherit from a parent form.
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {path === 'child' ? (
              <div className="mt-4 space-y-2">
                <Label>Parent form</Label>
                <Select
                  value={parentId}
                  onValueChange={(v) => setParentId(v ?? '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent form" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptions.map((f) => (
                      <SelectItem key={f.id} value={f.id} disabled={f.disabled}>
                        {f.name} (depth {f.depth}
                        {f.disabled ? ', max depth reached' : ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Name and slug for the new form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="form-name">Name</Label>
              <Input
                id="form-name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="e.g. Frontend Developer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-slug">Slug</Label>
              <Input
                id="form-slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="frontend-developer"
              />
            </div>
            <Button
              onClick={onCreate}
              disabled={
                creating || !name || !slug || (path === 'child' && !parentId)
              }
            >
              {creating ? 'Creating…' : 'Create and open builder'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
