'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Eye, Monitor, Smartphone } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { FormRenderer } from '@/components/renderer/FormRenderer';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapApp } from '@/store/bootstrap';
import {
  getDraftResolutionChain,
  getPublishedContent,
  resolveForm,
} from '@/lib/forms';
import { ErrorState } from '@/components/shared/ScreenStates';
import type { FormContent, FormRecord, ResolvedForm } from '@/types';

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function ensureDraft(form: FormRecord): FormContent {
  if (form.draft) return clone(form.draft);
  const pub = getPublishedContent(form);
  if (pub) return clone(pub);
  return {
    settings: { title: form.name },
    ownFields: [],
    elements: [],
    overrides: {},
    locks: [],
  };
}

export default function FormPreviewPage() {
  const params = useParams<{ formId: string }>();
  const formId = params?.formId as string;
  const dispatch = useAppDispatch();
  const forms = useAppSelector((s) => s.forms.items);
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);
  const form = forms.find((f) => f.id === formId) ?? null;
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>(
    'desktop',
  );

  if (!initialized && !error) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4" aria-busy="true">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <ErrorState
          title="Could not load preview"
          message={error}
          onRetry={() => void dispatch(bootstrapApp())}
        />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="space-y-4 p-6">
        <ErrorState
          title="Form not found"
          message="The requested form could not be found."
        />
        <Link
          href="/forms"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Back to forms
        </Link>
      </div>
    );
  }

  let resolved: ResolvedForm | null = null;
  try {
    const draft = ensureDraft(form);
    const chain = getDraftResolutionChain(
      forms.map((f) => (f.id === form.id ? { ...f, draft } : f)) as any,
      form.id,
      { allowAncestorDraftFallback: true },
    );
    if (chain) resolved = resolveForm(chain.chain, chain.ids);
  } catch {
    resolved = null;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/forms/${form.id}/edit`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to builder
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground hidden items-center gap-2 text-sm sm:flex">
            <Eye className="size-4" />
            Applicant preview
          </div>
          <div className="bg-background flex items-center rounded-md border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
              onClick={() => setPreviewMode('desktop')}
              aria-label="Desktop preview"
              className="gap-1.5"
            >
              <Monitor className="size-4" />
              Desktop
            </Button>
            <Button
              type="button"
              size="sm"
              variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
              onClick={() => setPreviewMode('mobile')}
              aria-label="Mobile preview"
              className="gap-1.5"
            >
              <Smartphone className="size-4" />
              Mobile
            </Button>
          </div>
        </div>
      </div>
      <div className="border-border bg-muted/40 rounded-md border p-4">
        <div className="font-medium">Preview: submissions are disabled</div>
        <p className="text-muted-foreground mt-1 text-sm">
          This preview resolves the current draft against ancestors’ published
          versions. Submissions from this screen are disabled.
        </p>
      </div>
      {resolved ? (
        <div
          className={cn(
            'bg-background rounded-lg border p-4 sm:p-8',
            previewMode === 'mobile' ? 'mx-auto max-w-[390px]' : 'w-full',
          )}
        >
          <FormRenderer
            resolved={resolved}
            onSubmit={() => {}}
            disableSubmit
            submitLabel="Submit (preview disabled)"
            previewMode={previewMode}
          />
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Unable to render preview for this form.
        </p>
      )}
    </div>
  );
}
