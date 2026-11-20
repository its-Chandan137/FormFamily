'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { mockOrganization } from '@/data/mock/organizations';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapApp, resetDemoData } from '@/store/bootstrap';
import { ErrorState } from '@/components/shared/ScreenStates';
import { SegmentedControl } from '@/components/shared/SegmentedControl';
import { Avatar } from '@/components/shared/Avatar';
import { toast } from 'sonner';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { theme, setTheme } = useTheme();
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);
  const [resetOpen, setResetOpen] = useState(false);

  const onReset = async () => {
    await dispatch(resetDemoData());
    toast.success('Demo data has been reset');
    setResetOpen(false);
  };

  if (!initialized && !error) {
    return (
      <div className="space-y-6" aria-busy="true">
        <PageHeader
          title="Settings"
          description="Manage your organisation, members, appearance, and demo data."
        />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Manage your organisation, members, appearance, and demo data."
        />
        <ErrorState
          title="Could not load settings"
          message={error}
          onRetry={() => void dispatch(bootstrapApp())}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your organisation, members, appearance, and demo data."
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1 lg:sticky lg:top-20 lg:self-start">
          {['General', 'Members', 'Appearance', 'Demo data'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="text-muted-foreground hover:bg-surface-muted hover:text-foreground block rounded-md px-3 py-2 text-sm font-medium"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="space-y-6">
          <Card id="general">
            <CardHeader>
              <CardTitle>Organisation</CardTitle>
              <CardDescription>
                Basic organisation details for this demo workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-w-md space-y-2">
              <Label htmlFor="org-name">Organisation name</Label>
              <Input
                id="org-name"
                defaultValue={mockOrganization.name}
                readOnly
              />
            </CardContent>
          </Card>

          <Card id="members">
            <CardHeader>
              <CardTitle>Members and roles</CardTitle>
              <CardDescription>
                People with access to Northwind Labs.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockOrganization.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar name={member.name} size="sm" />
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.role === 'owner' ? 'default' : 'secondary'
                          }
                          dot={false}
                          className="capitalize"
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card id="appearance">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Choose how FormFamily looks for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Theme</Label>
                <SegmentedControl
                  ariaLabel="Theme"
                  value={(theme as 'light' | 'dark' | 'system') || 'system'}
                  onValueChange={(v) => setTheme(v)}
                  options={[
                    {
                      value: 'light',
                      label: 'Light',
                      icon: <Sun className="size-4" />,
                    },
                    {
                      value: 'dark',
                      label: 'Dark',
                      icon: <Moon className="size-4" />,
                    },
                    {
                      value: 'system',
                      label: 'System',
                      icon: <Monitor className="size-4" />,
                    },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          <Card id="demo-data" className="border-destructive/20">
            <CardHeader>
              <CardTitle>Demo data</CardTitle>
              <CardDescription>
                Reset the in-memory mock store and localStorage to the original
                dataset.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => setResetOpen(true)}>
                Reset demo data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the original demo dataset and clear local
              changes stored in this browser.
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
