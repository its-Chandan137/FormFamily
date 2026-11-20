'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Menu, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { resetDemoData } from '@/store/bootstrap';
import { cn } from '@/lib/utils';

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
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const initialized = useAppSelector((s) => s.ui.initialized);

  const onReset = async () => {
    await dispatch(resetDemoData());
    toast.success('Demo data reset');
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r p-4 md:block">
          <div className="mb-6 text-lg font-semibold tracking-tight">
            FormFamily
          </div>
          <nav className="space-y-1">
            {links.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'block rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'hover:bg-accent/60 hover:text-accent-foreground',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium md:hidden">FormFamily</span>
              <span className="text-muted-foreground hidden text-sm md:inline">
                Northwind Labs
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!initialized && (
                <span className="text-muted-foreground text-xs">
                  Loading demo data…
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Menu"
                  className="hover:bg-accent hover:text-accent-foreground inline-flex size-9 items-center justify-center rounded-md"
                >
                  <Menu className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onReset}>
                    <RotateCcw className="mr-2 size-4" />
                    Reset demo data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
