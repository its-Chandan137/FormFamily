'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { FormRenderer } from '@/components/renderer/FormRenderer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapApp } from '@/store/bootstrap';
import { createSubmission } from '@/store/slices/submissionsSlice';
import type { ResolvedForm } from '@/types';

export default function PublicFormPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const dispatch = useAppDispatch();
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);
  const forms = useAppSelector((s) => s.forms.items);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useMemo(
    () => forms.find((f) => f.slug === slug) ?? null,
    [forms, slug],
  );
  const publishedVersion = useMemo(() => {
    if (!form?.publishedVersionId) return null;
    return form.versions.find((v) => v.id === form.publishedVersionId) ?? null;
  }, [form]);
  const snapshot = (publishedVersion?.resolvedSnapshot ??
    null) as ResolvedForm | null;

  if (!initialized && !error) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        aria-busy="true"
      >
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-xl font-semibold">Could not load form</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void dispatch(bootstrapApp())}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!form || !publishedVersion || !snapshot) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">This form is not available</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            The form you’re looking for doesn’t exist or hasn’t been published
            yet.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Submission received</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {snapshot.settings.successMessage ??
              'Thank you for your submission.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen px-4 py-10">
      <FormRenderer
        resolved={snapshot}
        submitting={submitting}
        submitLabel={snapshot.settings.submitLabel}
        onSubmit={async (answers) => {
          try {
            setSubmitting(true);
            await dispatch(
              createSubmission({
                orgId: form.orgId,
                formId: form.id,
                formVersionId: publishedVersion.id,
                answers,
                ghlSyncStatus: 'pending',
              }),
            ).unwrap();
            setSubmitted(true);
            toast.success('Application submitted');
          } catch (e) {
            toast.error('Failed to submit form');
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </div>
  );
}
