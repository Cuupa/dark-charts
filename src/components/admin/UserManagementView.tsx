import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  isSuspended?: boolean;
  fanProfile?: { nickname?: string; remainingCredits?: number };
  djProfile?: { expertStatus?: boolean; expertRequested?: boolean; reputationScore?: number };
}

interface UserManagementViewProps {
  users?: AdminUser[];
  isLoading?: boolean;
  onSuspendUser?: (userId: string) => void;
  onUnsuspendUser?: (userId: string) => void;
  onResetCredits?: (userId: string) => void;
  onToggleExpertStatus?: (userId: string, currentStatus: boolean) => void;
  onSetReputation?: (userId: string, currentScore: number) => void;
}

export function UserManagementView({
  users,
  isLoading,
  onSuspendUser,
  onUnsuspendUser,
  onResetCredits,
  onToggleExpertStatus,
  onSetReputation,
}: UserManagementViewProps) {
  if (isLoading) {
    return (
      <Card className="p-0 overflow-hidden" data-testid="users-loading">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map(i => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map(user => {
            const isDj = user.role === 'DJ';
            const expertStatus = user.djProfile?.expertStatus ?? false;
            const expertRequested = user.djProfile?.expertRequested ?? false;
            const reputation = user.djProfile?.reputationScore ?? 1;

            return (
              <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                <TableCell>
                  <div className="font-mono text-xs text-muted-foreground">{user.id.slice(0, 8)}…</div>
                  <div>{user.email}</div>
                  {user.fanProfile?.nickname && (
                    <div className="text-xs text-muted-foreground">{user.fanProfile.nickname}</div>
                  )}
                </TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.isSuspended && (
                      <Badge variant="destructive">Suspended</Badge>
                    )}
                    {isDj && (
                      <Badge variant={expertStatus ? 'default' : 'outline'}>
                        {expertStatus ? 'Expert' : expertRequested ? 'Requested' : 'No Expert'}
                      </Badge>
                    )}
                    {user.fanProfile && (
                      <Badge variant="outline">
                        Credits: {user.fanProfile.remainingCredits ?? 0}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {user.fanProfile && (
                      <Button variant="outline" size="sm" onClick={() => onResetCredits?.(user.id)}>
                        Reset Credits
                      </Button>
                    )}
                    {isDj && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onToggleExpertStatus?.(user.id, expertStatus)}
                        >
                          {expertStatus ? 'Revoke Expert' : 'Grant Expert'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSetReputation?.(user.id, reputation)}
                        >
                          Set Reputation
                        </Button>
                      </>
                    )}
                    {user.isSuspended ? (
                      <Button variant="outline" size="sm" onClick={() => onUnsuspendUser?.(user.id)}>
                        Unsuspend
                      </Button>
                    ) : (
                      <Button variant="destructive" size="sm" onClick={() => onSuspendUser?.(user.id)}>
                        Suspend
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {(!users || users.length === 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}