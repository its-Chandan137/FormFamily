import Link from 'next/link';
import type { ReactNode } from 'react';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/forms', label: 'Forms' },
  { href: '/forms/new', label: 'Create form' },
  { href: '/families', label: 'Family graph' },
  { href: '/submissions', label: 'Submissions' },
  { href: '/field-library', label: 'Field library' },
  { href: '/integrations/ghl', label: 'Integrations' },
  { href: '/settings', label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r p-4">
          <div className="mb-6 text-lg font-semibold">FormFamily</div>
          <nav className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:bg-accent hover:text-accent-foreground block rounded-md px-3 py-2 text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex h-14 items-center border-b px-6">
            <span className="text-sm font-medium">Dashboard</span>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
