'use client';

import * as React from 'react';

export function Form({
  children,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement>) {
  return <form {...props}>{children}</form>;
}

export function FormField(_props: {
  name: string;
  render: (args: { field: Record<string, unknown> }) => React.ReactNode;
}) {
  return <>{_props.render({ field: {} })}</>;
}

export function FormItem({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}

export function FormLabel({
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props}>{children}</label>;
}

export function FormControl({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function FormDescription({
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props}>{children}</p>;
}

export function FormMessage({
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props}>{children}</p>;
}
