export function PageHeader({ title }: { title: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    </div>
  );
}
