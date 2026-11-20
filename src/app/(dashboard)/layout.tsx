'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import {
  Bell,
  ChevronDown,
  ChevronsUpDown,
  Command,
  FileText,
  GitBranch,
  LayoutDashboard,
  Library,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sun,
  TableProperties,
  LogOut,
  Monitor,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { resetDemoData } from '@/store/bootstrap';
import { mockOrganization } from '@/data/mock/organizations';
import { Avatar } from '@/components/shared/Avatar';
import { Kbd } from '@/components/shared/Kbd';
import { cn } from '@/lib/utils';

const workspaceLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/forms', label: 'Forms', icon: FileText },
  { href: '/families', label: 'Family graph', icon: GitBranch },
  { href: '/submissions', label: 'Submissions', icon: TableProperties },
];

const setupLinks = [
  { href: '/field-library', label: 'Field library', icon: Library },
  { href: '/integrations/ghl', label: 'Integrations', icon: Plug },
];

function getBreadcrumbs(pathname: string, formNameById: Map<string, string>) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return [{ label: 'Dashboard', href: '/dashboard' }];
  const crumbs: { label: string; href?: string }[] = [];
  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    forms: 'Forms',
    new: 'Create form',
    families: 'Family graph',
    submissions: 'Submissions',
    'field-library': 'Field library',
    integrations: 'Integrations',
    ghl: 'GHL',
    settings: 'Settings',
    edit: 'Builder',
    preview: 'Preview',
  };
  let acc = '';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    acc += `/${part}`;
    const prev = parts[i - 1];
    let label = labels[part] ?? part;
    if (prev === 'forms' && part !== 'new' && formNameById.has(part)) {
      label = formNameById.get(part)!;
    }
    if (part.startsWith('form_') && formNameById.has(part)) {
      label = formNameById.get(part)!;
    }
    const isLast = i === parts.length - 1;
    crumbs.push({ label, href: isLast ? undefined : acc });
  }
  return crumbs;
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="6" cy="6" r="2.5" className="fill-primary" />
      <circle cx="18" cy="6" r="2.5" className="fill-[var(--inherit)]" />
      <circle cx="12" cy="18" r="2.5" className="fill-primary/70" />
      <path
        d="M8 7.5L10.5 15M16 7.5L13.5 15M8.5 6h7"
        className="stroke-border-strong"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { setTheme, theme } = useTheme();
  const initialized = useAppSelector((s) => s.ui.initialized);
  const forms = useAppSelector((s) => s.forms.items);
  const submissions = useAppSelector((s) => s.submissions.items);
  const ghl = useAppSelector((s) => s.ghl);

  const [collapsedManual, setCollapsedManual] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const collapsed = collapsedManual || pathname.includes('/edit');

  const formNameById = useMemo(
    () => new Map(forms.map((f) => [f.id, f.name])),
    [forms],
  );
  const breadcrumbs = useMemo(
    () => getBreadcrumbs(pathname, formNameById),
    [pathname, formNameById],
  );

  const failedSyncs = useMemo(
    () => submissions.filter((s) => s.ghlSyncStatus === 'failed'),
    [submissions],
  );
  const unmappedFields = useMemo(
    () => ghl.mappings.filter((m) => m.status !== 'mapped'),
    [ghl.mappings],
  );
  const notificationCount = failedSyncs.length + unmappedFields.length;

  const onReset = async () => {
    await dispatch(resetDemoData());
    toast.success('Demo data has been reset');
    setResetOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
      if (mod && e.key.toLowerCase() === 'b') {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        const editable = (e.target as HTMLElement)?.isContentEditable;
        if (tag === 'input' || tag === 'textarea' || editable) return;
        e.preventDefault();
        setCollapsedManual((c) => !c);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  const navItem = (
    link: { href: string; label: string; icon: any },
    rail: boolean,
  ) => {
    const active =
      pathname === link.href ||
      (link.href !== '/forms' && pathname.startsWith(link.href + '/')) ||
      (link.href === '/forms' &&
        (pathname === '/forms' ||
          (pathname.startsWith('/forms/') &&
            !pathname.startsWith('/forms/new'))));
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        title={rail ? link.label : undefined}
        className={cn(
          'group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
          rail && 'justify-center px-0',
          active
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        {!rail ? <span className="truncate">{link.label}</span> : null}
      </Link>
    );
  };

  const sidebarContent = (rail: boolean, onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'border-border flex h-14 items-center gap-2 border-b px-3',
          rail && 'justify-center px-2',
        )}
      >
        <LogoMark className="size-6 shrink-0" />
        {!rail ? (
          <span className="text-sm font-semibold tracking-[-0.01em]">
            FormFamily
          </span>
        ) : null}
        {!rail ? (
          <button
            type="button"
            className="text-muted-foreground hover:bg-surface-muted hover:text-foreground ml-auto inline-flex size-8 items-center justify-center rounded-md"
            onClick={() => setCollapsedManual(true)}
            aria-label="Collapse sidebar (Cmd+B)"
          >
            <PanelLeftClose className="size-4" />
          </button>
        ) : null}
      </div>

      <div className={cn('p-2', rail && 'px-1.5')}>
        {!rail ? (
          <button
            type="button"
            className="border-border bg-surface hover:bg-surface-muted flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left text-sm shadow-xs"
            aria-label="Organisation switcher"
          >
            <Avatar name="Northwind Labs" size="sm" />
            <span className="min-w-0 flex-1 truncate font-medium">
              Northwind Labs
            </span>
            <ChevronsUpDown className="text-muted-foreground size-4" />
          </button>
        ) : (
          <div className="flex justify-center py-1">
            <Avatar name="Northwind Labs" size="sm" />
          </div>
        )}
      </div>

      <div className={cn('px-2 pb-2', rail && 'px-1.5')}>
        <Link
          href="/forms/new"
          onClick={onNavigate}
          title={rail ? 'New form' : undefined}
          className={cn(
            'bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium shadow-xs transition-colors hover:bg-[#4338CA] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:hover:bg-[#5558E3]',
            rail && 'h-9 w-9 px-0',
          )}
        >
          <Plus className="size-4" aria-hidden />
          {!rail ? 'New form' : null}
        </Link>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-1">
        <div className="space-y-1">
          {!rail ? (
            <div className="text-subtle px-2 py-1 text-[11px] font-medium tracking-wide uppercase">
              Workspace
            </div>
          ) : null}
          {workspaceLinks.map((l) => navItem(l, rail))}
        </div>
        <div className="space-y-1">
          {!rail ? (
            <div className="text-subtle px-2 py-1 text-[11px] font-medium tracking-wide uppercase">
              Setup
            </div>
          ) : null}
          {setupLinks.map((l) => navItem(l, rail))}
        </div>
      </nav>

      <div className="border-border mt-auto space-y-1 border-t p-2">
        {rail ? (
          <button
            type="button"
            className="text-muted-foreground hover:bg-surface-muted hover:text-foreground flex w-full items-center justify-center rounded-md py-2"
            onClick={() => setCollapsedManual(false)}
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        ) : null}
        {navItem(
          { href: '/settings', label: 'Settings', icon: Settings },
          rail,
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'hover:bg-surface-muted flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm',
              rail && 'justify-center px-0',
            )}
          >
            <Avatar name="Alex Morgan" size="sm" />
            {!rail ? (
              <>
                <div className="min-w-0 flex-1">
                  <div className="text-foreground truncate font-medium">
                    Alex Morgan
                  </div>
                  <div className="text-muted-foreground truncate text-xs">
                    Owner
                  </div>
                </div>
                <ChevronDown className="text-muted-foreground size-4" />
              </>
            ) : null}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={rail ? 'center' : 'start'}
            side="top"
            className="w-56"
          >
            <DropdownMenuLabel>
              <div className="font-medium">Alex Morgan</div>
              <div className="text-muted-foreground text-xs font-normal">
                alex@northwindlabs.com
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setResetOpen(true)}>
              <RotateCcw className="size-4" />
              Reset demo data
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            'border-border bg-surface sticky top-0 hidden h-screen shrink-0 border-r transition-[width] duration-200 md:block',
            collapsed ? 'w-16' : 'w-[248px]',
          )}
        >
          {sidebarContent(collapsed)}
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="border-border bg-surface/95 supports-[backdrop-filter]:bg-surface/80 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur md:px-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </Button>

            <nav
              aria-label="Breadcrumb"
              className="hidden min-w-0 flex-1 items-center gap-1.5 text-sm md:flex"
            >
              {breadcrumbs.map((c, i) => (
                <span key={i} className="flex min-w-0 items-center gap-1.5">
                  {i > 0 ? <span className="text-subtle">/</span> : null}
                  {c.href ? (
                    <Link
                      href={c.href}
                      className="text-muted-foreground hover:text-foreground truncate"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-foreground truncate font-medium">
                      {c.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="border-border bg-surface text-muted-foreground hover:bg-surface-muted ml-auto flex h-9 w-full max-w-md items-center gap-2 rounded-md border px-3 text-sm shadow-xs md:ml-0 md:flex-1"
            >
              <Search className="size-4" aria-hidden />
              <span className="flex-1 truncate text-left">
                Search or jump to...
              </span>
              <span className="hidden items-center gap-1 sm:inline-flex">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </span>
            </button>

            <div className="flex items-center gap-1">
              {!initialized ? (
                <span className="text-muted-foreground hidden text-xs lg:inline">
                  Loading…
                </span>
              ) : null}

              <Popover>
                <PopoverTrigger className="text-muted-foreground hover:bg-surface-muted hover:text-foreground relative inline-flex size-9 items-center justify-center rounded-md">
                  <Bell className="size-4" />
                  {notificationCount > 0 ? (
                    <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#D92D20]" />
                  ) : null}
                  <span className="sr-only">Notifications</span>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="border-border border-b px-3 py-2 text-sm font-medium">
                    Notifications
                  </div>
                  <div className="max-h-80 overflow-auto p-2">
                    {notificationCount === 0 ? (
                      <p className="text-muted-foreground p-3 text-sm">
                        No alerts right now.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {failedSyncs.length > 0 ? (
                          <button
                            type="button"
                            className="hover:bg-surface-muted w-full rounded-md p-2 text-left"
                            onClick={() => router.push('/submissions')}
                          >
                            <div className="text-foreground text-sm font-medium">
                              {failedSyncs.length} failed sync
                              {failedSyncs.length > 1 ? 's' : ''}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              Review and retry submissions
                            </div>
                          </button>
                        ) : null}
                        {unmappedFields.length > 0 ? (
                          <button
                            type="button"
                            className="hover:bg-surface-muted w-full rounded-md p-2 text-left"
                            onClick={() => router.push('/integrations/ghl')}
                          >
                            <div className="text-foreground text-sm font-medium">
                              {unmappedFields.length} unmapped or suggested
                              field{unmappedFields.length > 1 ? 's' : ''}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              Review GHL field mappings
                            </div>
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Theme"
                  className="text-muted-foreground hover:bg-surface-muted hover:text-foreground inline-flex size-9 items-center justify-center rounded-md"
                >
                  <Sun className="size-4 dark:hidden" />
                  <Moon className="hidden size-4 dark:block" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="size-4" /> Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="size-4" /> Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="size-4" /> System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main
            className={cn(
              'flex-1',
              pathname.includes('/edit')
                ? 'p-0'
                : pathname === '/families'
                  ? 'p-0 md:p-0 lg:p-0'
                  : 'p-4 md:p-6 lg:p-8',
            )}
          >
            <div
              className={cn(
                'w-full',
                pathname.includes('/edit') || pathname === '/families'
                  ? 'h-full max-w-none'
                  : 'mx-auto max-w-[1200px]',
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[280px] p-0"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          {sidebarContent(false, () => setMobileOpen(false))}
        </SheetContent>
      </Sheet>

      <CommandDialog
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        title="Command palette"
        description="Search or jump to..."
        commandProps={{ className: 'rounded-none border-0' }}
      >
        <CommandInput placeholder="Search or jump to..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Forms', href: '/forms' },
              { label: 'Family graph', href: '/families' },
              { label: 'Submissions', href: '/submissions' },
              { label: 'Field library', href: '/field-library' },
              { label: 'Integrations (GHL)', href: '/integrations/ghl' },
              { label: 'Settings', href: '/settings' },
            ].map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  setCmdOpen(false);
                  router.push(item.href);
                }}
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => {
                setCmdOpen(false);
                router.push('/forms/new');
              }}
            >
              <Plus className="size-4" /> New form
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setCmdOpen(false);
                setTheme(theme === 'dark' ? 'light' : 'dark');
              }}
            >
              {theme === 'dark' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}{' '}
              Toggle theme
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setCmdOpen(false);
                setResetOpen(true);
              }}
            >
              <RotateCcw className="size-4" /> Reset demo data
            </CommandItem>
          </CommandGroup>
          {forms.length > 0 ? (
            <CommandGroup heading="Forms">
              {forms.slice(0, 12).map((f) => (
                <CommandItem
                  key={f.id}
                  onSelect={() => {
                    setCmdOpen(false);
                    router.push(`/forms/${f.id}/edit`);
                  }}
                >
                  <FileText className="size-4" /> {f.name}
                  <CommandShortcut>{f.slug}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the in-browser mock store and localStorage and
              restore the original demo dataset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
