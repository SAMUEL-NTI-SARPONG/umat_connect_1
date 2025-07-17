
'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import Image from 'next/image';
import { FileText, MessageSquare, Trash2 } from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { useUser, type Post } from '@/app/providers/user-provider';
import { formatRelativeTime } from '@/lib/time';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PostCard({ post }: { post: Post }) {
  const { user, allUsers, deletePost } = useUser();
  const author = allUsers.find(u => u.id === post.authorId);

  if (!author || !user) return null;

  const isImage = post.attachedFile?.type.startsWith('image/');
  const hasAttachment = post.attachedFile && post.attachedFile.url;
  const relativeTime = formatRelativeTime(new Date(post.timestamp));

  const canDelete = user.id === post.authorId;
  const canComment = true; // Everyone can comment

  return (
    <Card className="rounded-xl shadow-sm flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <ProfileAvatar
              src={author.profileImage}
              fallback={author.name.charAt(0)}
              alt={`${author.name}'s profile picture`}
              imageHint="profile picture"
              className="w-10 h-10"
          />
          <div className="grid gap-0.5">
              <p className="font-semibold text-sm">{author.name}</p>
              <p className="text-xs text-muted-foreground">
              {author.department}
              </p>
              <p className="text-xs text-muted-foreground">{relativeTime}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-2 flex-grow space-y-4">
        <p className="whitespace-pre-wrap text-sm">{post.content}</p>
        {hasAttachment && (
          <div className="rounded-lg overflow-hidden border aspect-video">
            {isImage ? (
              <Image
                src={post.attachedFile.url}
                alt="Post attachment"
                width={600}
                height={400}
                className="w-full h-full object-cover"
                data-ai-hint="post attachment"
              />
            ) : (
              <a
                href={post.attachedFile.url}
                download={post.attachedFile.name}
                className="flex items-center gap-3 p-3 hover:bg-muted"
              >
                <FileText className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground truncate">
                  {post.attachedFile.name}
                </span>
              </a>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2 flex justify-end gap-1">
        {canComment && (
          <Dialog>
              <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MessageSquare className="w-5 h-5" />
                      <span className="sr-only">Comment</span>
                  </Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>View Post</DialogTitle>
                  </DialogHeader>
                  {/* Comments section to be implemented */}
              </DialogContent>
          </Dialog>
        )}
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                <Trash2 className="w-5 h-5" />
                <span className="sr-only">Delete post</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your post and remove its content from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deletePost(post.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}
