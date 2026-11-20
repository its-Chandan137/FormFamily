'use client';

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
import { mockOrganization } from '@/data/mock/organizations';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapApp, resetDemoData } from '@/store/bootstrap';
import { ErrorState } from '@/components/shared/ScreenStates';
import { toast } from 'sonner';

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector((s) => s.ui.initialized);
  const error = useAppSelector((s) => s.ui.error);

  const onReset = async () => {
    await dispatch(resetDemoData());
    toast.success('Demo data has been reset');
  };

  if (!initialized && !error) {
    return (
      <div className="space-y-6" aria-busy="true">
        <PageHeader title="Settings" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" />
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
      <PageHeader title="Settings" />

      <Card>
        <CardHeader>
          <CardTitle>Organisation</CardTitle>
          <CardDescription>
            Basic organisation details for this demo workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-md space-y-2">
          <Label htmlFor="org-name">Organisation name</Label>
          <Input id="org-name" defaultValue={mockOrganization.name} readOnly />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members and roles</CardTitle>
          <CardDescription>
            People with access to Northwind Labs.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrganization.members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.role === 'owner' ? 'default' : 'secondary'
                      }
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

      <Card>
        <CardHeader>
          <CardTitle>Demo data</CardTitle>
          <CardDescription>
            Reset the in-memory mock store and localStorage to the original
            dataset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={onReset}>
            Reset demo data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
