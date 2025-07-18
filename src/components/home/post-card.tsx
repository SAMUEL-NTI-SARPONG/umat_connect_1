
'use client';

import { useState } from 'react';
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
import CommentSheet from './comment-sheet';

export default function PostCard({ post }: { post: Post }) {
  const { user, allUsers, deletePost } = useUser();
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const author = allUsers.find(u => u.id === post.authorId);

  if (!author || !user) return null;

  const hasAttachment = post.attachedFile && post.attachedFile.url && typeof post.attachedFile.url === 'string';
  const isImage = hasAttachment && post.attachedFile.url.startsWith('data:image');
  const relativeTime = formatRelativeTime(new Date(post.timestamp));

  const canDelete = user.id === post.authorId;
  const canComment = true; 

  const totalComments = post.comments.reduce((acc, comment) => acc + 1 + comment.replies.length, 0);

  return (
    <>
    <Card className="rounded-xl shadow-sm flex flex-col">
      <CardHeader className="p-2 sm:p-4 pb-2">
        <div className="flex items-start gap-3">
          <ProfileAvatar
              src={author.profileImage}
              fallback={author.name.charAt(0)}
              alt={`${author.name}'s profile picture`}
              imageHint="profile picture"
              className="w-10 h-10"
          />
          <div className="grid gap-0.5 flex-1">
              <p className="font-semibold text-sm">{author.name}</p>
              <p className="text-xs text-muted-foreground">
              {author.department}
              </p>
              <p className="text-xs text-muted-foreground">{relativeTime}</p>
          </div>
           {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                  <span className="sr-only">Delete post</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your post.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deletePost(post.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 py-2 flex-grow space-y-4">
        <p className="whitespace-pre-wrap text-sm">{post.content}</p>
        {hasAttachment && (
          <div className="rounded-lg overflow-hidden border max-h-[70vh]">
            {isImage ? (
              <Image
                src={post.attachedFile.url}
                alt="Post attachment"
                width={600}
                height={400}
                className="w-full h-full object-contain"
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
      <CardFooter className="px-2 sm:px-4 pt-2 pb-3">
        {canComment && (
          <Button variant="ghost" className="text-muted-foreground -ml-2" onClick={() => setIsCommentSheetOpen(true)}>
              <MessageSquare className="w-5 h-5 mr-2" />
              <span className="text-sm">{totalComments > 0 ? `${totalComments} Comment${totalComments > 1 ? 's' : ''}` : 'Comment'}</span>
          </Button>
        )}
      </CardFooter>
    </Card>
    <CommentSheet post={post} isOpen={isCommentSheetOpen} onOpenChange={setIsCommentSheetOpen} />
    </>
  );
}
