
'use client';

import { useState, useRef } from 'react';
import { useUser, type AttachedFile } from '@/app/providers/user-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { formatRelativeTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import { Bell, MessageSquare, Newspaper, Paperclip, Send, X, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

function QuickReplyBox({ notification }: { notification: any }) {
    const { addReply } = useUser();
    const [replyText, setReplyText] = useState('');
    const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachedFile({
                    name: file.name,
                    type: file.type,
                    url: reader.result as string,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeFile = () => {
        setAttachedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendReply = () => {
        if (!replyText.trim() && !attachedFile) return;

        addReply(notification.postId, notification.commentId, replyText, attachedFile);
        setReplyText('');
        setAttachedFile(null);
    };

    const isImage = attachedFile?.type.startsWith('image/');

    return (
        <div className="mt-4 space-y-2">
            {attachedFile && (
                <div className="relative">
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 rounded-full h-6 w-6 z-10"
                        onClick={removeFile}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                    {isImage ? (
                        <Image
                            src={attachedFile.url}
                            alt="Image preview"
                            width={80}
                            height={80}
                            className="rounded-lg object-cover w-20 h-20"
                            data-ai-hint="reply preview"
                        />
                    ) : (
                        <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50 text-xs">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            <span className="font-medium text-foreground truncate">{attachedFile.name}</span>
                        </div>
                    )}
                </div>
            )}
            <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                    <Textarea
                        placeholder="Send a quick reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="pr-20"
                        rows={1}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleSendReply}
                            disabled={!replyText.trim() && !attachedFile}
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
                  <div
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
                        <div className="text-sm">
                            <Link href={`/?postId=${notification.postId}&commentId=${notification.commentId}#comment-${notification.commentId}`} className="font-semibold hover:underline">{actor.name}</Link> {actionText}
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                           <div className="bg-background/50 border-l-4 border-primary/50 rounded-r-sm px-2 py-1 mb-2">
                               <blockquote className="italic text-sm text-muted-foreground truncate">
                                "{notification.parentContent}"
                               </blockquote>
                           </div>
                           <p className="text-sm">
                              {notification.replyContent}
                           </p>
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">
                          {formatRelativeTime(new Date(notification.timestamp))}
                        </p>
                        <QuickReplyBox notification={notification} />
                      </div>
                    </div>
                  </div>
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
