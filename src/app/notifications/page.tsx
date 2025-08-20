
'use client';

import { useUser } from '@/app/providers/user-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { formatRelativeTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import { Bell, MessageSquare, CornerUpLeft, Trash2, FileText, CalendarCheck, BookOpen, FileCheck2 } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user, notifications, allUsers, markNotificationAsRead, clearAllNotifications } = useUser();

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
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Bell />
              Notifications
            </CardTitle>
            {userNotifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {userNotifications.length > 0 ? (
            <div className="space-y-2">
              {userNotifications.map((notification) => {
                const actor = allUsers.find((u) => u.id === notification.actorId);
                if (!actor) return null;

                let actionText = '';
                let icon = <MessageSquare className="h-4 w-4 text-blue-500" />;
                let href = `/?postId=${notification.postId}&commentId=${notification.commentId}#comment-${notification.commentId}`;

                switch (notification.type) {
                  case 'comment_on_post':
                    actionText = 'commented on your post.';
                    break;
                  case 'reply_to_comment':
                    actionText = 'replied to your comment.';
                    icon = <CornerUpLeft className="h-4 w-4 text-green-500" />;
                    break;
                  case 'new_post':
                    actionText = 'sent you a new post.';
                    icon = <FileText className="h-4 w-4 text-indigo-500" />;
                    href = `/?postId=${notification.postId}#post-${notification.postId}`;
                    break;
                   case 'class_timetable':
                    actionText = 'distributed the new Class Timetable.';
                    icon = <CalendarCheck className="h-4 w-4 text-purple-500" />;
                    href = '/timetable';
                    break;
                  case 'exam_timetable':
                    actionText = 'distributed the Exams Timetable.';
                    icon = <BookOpen className="h-4 w-4 text-red-500" />;
                    href = '/timetable';
                    break;
                  case 'resit_timetable':
                    actionText = 'distributed the Special Resit Timetable.';
                    icon = <FileCheck2 className="h-4 w-4 text-teal-500" />;
                    href = '/timetable';
                    break;
                  default:
                     actionText = 'interacted with your post.';
                }


                return (
                  <Link
                    key={notification.id}
                    href={href}
                    onClick={() => getNotificationDetails(notification.id)}
                    className={cn(
                      'block p-3 rounded-lg border transition-colors',
                      notification.isRead
                        ? 'bg-transparent hover:bg-muted/50'
                        : 'bg-primary/10 hover:bg-primary/20 border-primary/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
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
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">
                            <span className="font-semibold">{actor.name}</span> {actionText}
                        </p>
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
              <p className="text-sm">When someone interacts with you, you'll see it here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
