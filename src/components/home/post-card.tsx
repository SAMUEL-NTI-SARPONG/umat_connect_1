
'use client';

import {
  Card,
  CardContent,
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
  DialogDescription,
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
  const relativeTime = formatRelativeTime(new Date(post.timestamp));
  const canDelete = user?.id === post.authorId;

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
            <ProfileAvatar
                src={author.profileImage}
                fallback={author.name.charAt(0)}
                alt={`${author.name}'s profile picture`}
                imageHint="profile picture"
                className="w-12 h-12"
            />
            <div className="grid gap-0.5">
                <p className="font-semibold">{author.name}</p>
                <p className="text-xs text-muted-foreground">
                {author.department}
                </p>
                <p className="text-xs text-muted-foreground">{relativeTime}</p>
            </div>
            </div>
            {canDelete ? (
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
            ) : user.role === 'student' ? (
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MessageSquare className="w-5 h-5" />
                    <span className="sr-only">Comment on post</span>
                </Button>
            ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {post.content && <p className="text-sm whitespace-pre-line">{post.content}</p>}
        
        {post.attachedFile && (
          <div className="rounded-lg overflow-hidden border">
            {isImage ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="bg-muted cursor-pointer">
                      <Image
                        src={post.attachedFile.url}
                        alt="Post attachment"
                        width={600}
                        height={400}
                        className="object-contain w-full max-h-[500px]"
                        data-ai-hint="university campus"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="p-0 w-auto max-w-[90vw] max-h-[90vh] bg-transparent border-none">
                     <DialogHeader className="sr-only">
                        <DialogTitle>Post Image</DialogTitle>
                        <DialogDescription>Full view of the image attached to the post.</DialogDescription>
                    </DialogHeader>
                    <Image
                        src={post.attachedFile.url}
                        alt="Post attachment"
                        width={1200}
                        height={800}
                        className="rounded-lg object-contain w-full h-full"
                        data-ai-hint="university campus"
                    />
                  </DialogContent>
                </Dialog>
            ) : (
               <a href={post.attachedFile.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-muted hover:bg-muted/80 transition-colors">
                  <FileText className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-foreground truncate">{post.attachedFile.name}</span>
                    <span className="text-xs text-muted-foreground">Click to view file</span>
                  </div>
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
