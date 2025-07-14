
'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { MessageSquare, Send, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { useUser, type Post, type Comment } from '@/app/providers/user-provider';
import { formatRelativeTime } from '@/lib/time';

function CommentCard({ comment }: { comment: Comment }) {
  const { allUsers } = useUser();
  const author = allUsers.find(u => u.id === comment.authorId);

  if (!author) return null;

  return (
    <div className="flex items-start gap-2.5">
       <ProfileAvatar
          src={author.profileImage}
          fallback={author.name.charAt(0)}
          alt={`${author.name}'s profile picture`}
          className="w-8 h-8"
          imageHint="profile picture"
        />
      <div className="flex flex-col gap-0.5 w-full">
        <div className="bg-muted rounded-lg p-2.5">
          <p className="font-semibold text-sm">{author.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{author.role}</p>
          <p className="text-sm text-foreground mt-1.5">{comment.text}</p>
        </div>
        <p className="text-xs text-muted-foreground px-2.5">{formatRelativeTime(new Date(comment.timestamp))}</p>
      </div>
    </div>
  );
}

export default function PostCard({ post }: { post: Post }) {
  const [newComment, setNewComment] = useState('');
  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(false);

  const { allUsers, user: currentUser, addComment } = useUser();
  const author = allUsers.find(u => u.id === post.authorId);

  if (!author) return null;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && currentUser) {
      addComment(post.id, newComment);
      setNewComment('');
    }
  };
  
  const isImage = post.attachedFile?.type.startsWith('image/');
  const relativeTime = formatRelativeTime(new Date(post.timestamp));

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="p-4">
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
      </CardHeader>
      <CardContent className="px-4 pb-2">
        {post.content && <p className="text-sm whitespace-pre-line mb-4">{post.content}</p>}
        {post.attachedFile && (
          <div className="mt-2 -mx-4">
            {isImage ? (
                <Image
                  src={post.attachedFile.url}
                  alt="Post attachment"
                  width={600}
                  height={400}
                  className="object-cover w-full"
                  data-ai-hint="university campus"
                />
            ) : (
               <a href={post.attachedFile.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 mx-4 rounded-lg border bg-muted hover:bg-muted/80 transition-colors">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground truncate">{post.attachedFile.name}</span>
                    <span className="text-xs text-muted-foreground">Click to view file</span>
                  </div>
              </a>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 p-4 pt-2">
         {post.comments.length > 0 &&
             <button onClick={() => setIsCommentSectionOpen(!isCommentSectionOpen)} className="text-xs text-muted-foreground hover:underline">
                 {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
             </button>
         }
        <Separator />
        <div className="w-full grid grid-cols-1">
          <Button
            variant="ghost"
            onClick={() => setIsCommentSectionOpen(!isCommentSectionOpen)}
            aria-expanded={isCommentSectionOpen}
            className="text-muted-foreground font-medium"
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            <span>Comment</span>
          </Button>
        </div>

        {isCommentSectionOpen && (
          <>
            <Separator />
            <div className="w-full flex items-start gap-2 pt-2">
               <ProfileAvatar
                  src={currentUser?.profileImage}
                  fallback={currentUser?.name.charAt(0) ?? 'U'}
                  alt="Current user's profile picture"
                  className="w-8 h-8"
                  imageHint="profile picture"
                />
              <form
                onSubmit={handleCommentSubmit}
                className="flex-grow flex items-center gap-2"
              >
                <Input
                  placeholder="Add a comment..."
                  className="rounded-full bg-muted border-none h-9"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newComment.trim()}
                  variant="ghost"
                  className="rounded-full h-9 w-9"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Post comment</span>
                </Button>
              </form>
            </div>
            <div className="w-full space-y-4 pt-2">
              {post.comments
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((comment, index) => (
                  <CommentCard key={index} comment={comment} />
              ))}
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
