import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/hooks/use-notifications';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllRead();
  const navigate = useNavigate();

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const handleClick = (notification: { id: string; isRead: boolean; linkUrl: string | null }) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.linkUrl) {
      navigate(notification.linkUrl);
    }
  };

  return (
    <div className="container py-8 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-muted-foreground">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()} className="gap-2">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                'cursor-pointer hover:shadow-md transition-shadow',
                !n.isRead && 'border-primary/30 bg-primary/5',
              )}
              onClick={() => handleClick(n)}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className={cn(
                  'mt-1 h-2 w-2 rounded-full flex-shrink-0',
                  n.isRead ? 'bg-transparent' : 'bg-primary',
                )} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      markReadMutation.mutate(n.id);
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center space-y-3">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="font-heading font-semibold">No notifications</p>
            <p className="text-sm text-muted-foreground">You're all caught up!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
