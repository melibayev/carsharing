import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminAuditLogs } from '@/hooks/use-admin';
import { formatDate } from '@/lib/utils';

export default function AdminAudit() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState<string | undefined>();
  const { data, isLoading } = useAdminAuditLogs(entityType, page);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <div className="flex gap-1">
          {[undefined, 'User', 'Car', 'Booking', 'KycVerification', 'Dispute'].map((t) => (
            <Button
              key={t ?? 'all'}
              size="sm"
              variant={entityType === t ? 'default' : 'outline'}
              onClick={() => { setEntityType(t); setPage(1); }}
            >
              {t ?? 'All'}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Action</th>
                  <th className="text-left p-3 font-medium">Entity</th>
                  <th className="text-left p-3 font-medium">Actor</th>
                  <th className="text-left p-3 font-medium">IP</th>
                  <th className="text-left p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="p-3">
                      <Badge variant="outline">{log.action}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {log.entityType}
                      {log.entityId && <span className="text-xs ml-1">({log.entityId.slice(0, 8)})</span>}
                    </td>
                    <td className="p-3">{log.actorEmail ?? 'System'}</td>
                    <td className="p-3 text-muted-foreground text-xs font-mono">{log.ipAddress ?? '-'}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {data && data.totalCount > data.pageSize && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground py-2">
            Page {page} of {Math.ceil(data.totalCount / data.pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(data.totalCount / data.pageSize)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
