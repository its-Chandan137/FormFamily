import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold">FormFamily</h1>
        <p className="text-muted-foreground">Part 1 scaffold</p>
        <Link className="underline" href="/dashboard">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
