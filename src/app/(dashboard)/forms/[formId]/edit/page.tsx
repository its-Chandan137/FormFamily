'use client';

import { useParams } from 'next/navigation';
import { BuilderEditor } from '@/components/builder/BuilderEditor';

export default function FormBuilderPage() {
  const params = useParams<{ formId: string }>();
  const formId = params?.formId as string;
  if (!formId)
    return <div className="text-muted-foreground text-sm">Form not found.</div>;
  return <BuilderEditor formId={formId} />;
}
