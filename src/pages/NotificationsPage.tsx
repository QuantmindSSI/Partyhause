// In-app notification center. Replaces the Settings "Notifications — Coming
// soon" dead row with the real thing: newest-first list from
// /api/notifications, per-item and bulk mark-read, actor avatars, and
// relative timestamps.

import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, Loader2, UserPlus, Heart, MessageSquare, Share2, CalendarDays, PartyPopper } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageShell, useBackToDashboard } from '@/components/layout/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import {
  useNotifications,
  useMarkNotificationsRead,
  type AppNotification,
} from '@/features/notifications/useNotifications';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<string, LucideIcon> = {
  new_partycrew_member: PartyPopper,
  connection_request: UserPlus,
  event_invite: CalendarDays,
  crew_rsvp: CalendarDays,
  event_reminder: CalendarDays,
  post_like: Heart,
  post_comment: MessageSquare,
  post_share: Share2,
  new_post: MessageSquare,
};

function NotificationRow({ notification }: { notification: AppNotification }) {
  const markRead = useMarkNotificationsRead();
  const Icon = TYPE_ICONS[notification.type] ?? Bell;
  const actorName = notification.actor?.display_name || notification.actor?.username;

  return (
    <Card
      className={cn(
        'transition-colors',
        notification.read ? 'opacity-70' : 'border-primary/40 bg-primary/5',
      )}
    >
      <CardContent className="p-4 flex items-start gap-3">
        {notification.actor ? (
          <Avatar className="h-10 w-10">
            {notification.actor.avatar_url && (
              <AvatarImage src={notification.actor.avatar_url} alt="" />
            )}
            <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
              {(actorName ?? '?').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">
            {notification.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {actorName ? `${actorName} ` : ''}
            {notification.body}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>

        {!notification.read && (
          <Button
            variant="ghost"
            size="sm"
            aria-label="Mark as read"
            disabled={markRead.isLoading}
            onClick={() => markRead.mutate({ ids: [notification.id] })}
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function NotificationsPage() {
  const handleBack = useBackToDashboard();
  const { data: notifications, isLoading, isError, refetch } = useNotifications(50);
  const markRead = useMarkNotificationsRead();

  const hasUnread = (notifications ?? []).some((n) => !n.read);

  return (
    <PageShell
      title="Notifications"
      subtitle="Activity from your PartyCrew and events"
      maxWidth="sm"
      onBack={handleBack}
      actions={
        hasUnread ? (
          <Button
            variant="outline"
            size="sm"
            disabled={markRead.isLoading}
            onClick={() => markRead.mutate({ all: true })}
          >
            <CheckCheck className="h-4 w-4 mr-1" aria-hidden="true" />
            Mark all read
          </Button>
        ) : undefined
      }
    >
      {isLoading && (
        <div className="flex justify-center py-12" role="status" aria-label="Loading notifications">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {isError && (
        <EmptyState
          icon={Bell}
          title="Could not load notifications"
          description="Something went wrong while loading your notifications."
          action={{ label: 'Try again', onClick: () => refetch() }}
        />
      )}

      {!isLoading && !isError && (notifications ?? []).length === 0 && (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="When people join your PartyCrew, RSVP to your events, or interact with your posts, you'll see it here."
        />
      )}

      <div className="space-y-2">
        {(notifications ?? []).map((n) => (
          <NotificationRow key={n.id} notification={n} />
        ))}
      </div>
    </PageShell>
  );
}
