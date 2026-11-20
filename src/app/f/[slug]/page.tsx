'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
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
        className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-6"
        aria-busy="true"
      >
        <div className="border-border bg-surface w-full max-w-[640px] space-y-4 rounded-2xl border p-8 shadow-sm">
          <Skeleton className="mx-auto h-10 w-10 rounded-lg" />
          <Skeleton className="mx-auto h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-6">
        <div className="border-border bg-surface w-full max-w-md space-y-4 rounded-2xl border p-8 text-center shadow-sm">
          <h1 className="text-foreground text-xl font-semibold">
            Could not load form
          </h1>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button
            type="button"
            variant="secondary"
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
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-6">
        <div className="border-border bg-surface w-full max-w-md rounded-2xl border p-8 text-center shadow-sm">
          <h1 className="text-foreground text-xl font-semibold">
            This form is not available
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            The form you’re looking for doesn’t exist or hasn’t been published
            yet.
          </p>
          <Link
            href="/"
            className="text-primary mt-4 inline-block text-sm font-medium hover:underline"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4 py-10">
        <div className="border-border bg-surface w-full max-w-[640px] rounded-2xl border p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#ECFDF3] text-[#039855] dark:bg-[rgba(50,213,131,0.12)] dark:text-[#32D583]">
            <Check className="size-7" aria-hidden />
          </div>
          <h1 className="text-foreground text-[28px] leading-9 font-semibold tracking-[-0.01em]">
            Submission received
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {snapshot.settings.successMessage ??
              'Thank you for your submission.'}
          </p>
          <p className="text-subtle mt-8 text-xs">Built with FormFamily</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF2FF]/60 via-[#F7F8FA] to-[#F7F8FA] px-4 py-8 sm:py-12">
      <div className="border-border bg-surface mx-auto w-full max-w-[640px] rounded-2xl border p-6 shadow-sm sm:p-8">
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
    </div>
  );
}
