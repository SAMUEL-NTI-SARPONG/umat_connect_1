
'use client';

import { useUser } from '@/app/providers/user-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { formatRelativeTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import { Bell, MessageSquare, Newspaper, CornerDownRight } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user, notifications, allUsers, markNotificationAsRead } = useUser();

  if (!user) {
    return null;
  }

  const userNotifications = notifications
    .filter((n) => n.recipientId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getNotificationDetails = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userNotifications.length > 0 ? (
            <div className="space-y-4">
              {userNotifications.map((notification) => {
                const actor = allUsers.find((u) => u.id === notification.actorId);
                if (!actor) return null;

                let actionText = '';
                let icon = <MessageSquare className="h-4 w-4 text-blue-500" />;
                if (notification.type === 'reply_to_post') {
                  actionText = 'replied to your post:';
                  icon = <Newspaper className="h-4 w-4 text-green-500" />;
                } else if (notification.type === 'reply_to_comment') {
                  actionText = 'replied to your comment:';
                }

                return (
                  <Link
                    href={`/?postId=${notification.postId}&commentId=${notification.commentId}#comment-${notification.commentId}`}
                    key={notification.id}
                    onClick={() => getNotificationDetails(notification.id)}
                    className={cn(
                      'block p-4 rounded-lg border transition-colors',
                      notification.isRead
                        ? 'bg-transparent hover:bg-muted/50'
                        : 'bg-primary/10 hover:bg-primary/20 border-primary/30'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <ProfileAvatar
                          src={actor.profileImage}
                          fallback={actor.name.charAt(0)}
                          alt={actor.name}
                          className="w-10 h-10"
                        />
                         <div className="absolute -bottom-1 -right-1 p-0.5 bg-background rounded-full">
                           {icon}
                         </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm">
                          <span className="font-semibold">{actor.name}</span> {actionText}
                        </p>
                        <div className="bg-muted p-3 rounded-md">
                           <p className="text-sm">
                              {notification.replyContent}
                           </p>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                           <CornerDownRight className="w-3 h-3" />
                           <blockquote className="italic truncate">
                            "{notification.parentContent}"
                           </blockquote>
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">
                          {formatRelativeTime(new Date(notification.timestamp))}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>You have no notifications yet.</p>
              <p className="text-sm">When someone replies to your posts or comments, you'll see it here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
