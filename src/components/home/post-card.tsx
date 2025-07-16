
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
import { MessageSquare, Send, FileText, CornerDownRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { useUser, type Post, type Comment } from '@/app/providers/user-provider';
import { formatRelativeTime } from '@/lib/time';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function CommentCard({ postId, comment }: { postId: number; comment: Comment }) {
  const { allUsers, user: currentUser, addReply } = useUser();
  const author = allUsers.find(u => u.id === comment.authorId);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  if (!author) return null;

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim() && currentUser) {
      addReply(postId, comment.id, replyText);
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  const canReply = currentUser?.role === 'lecturer' || currentUser?.role === 'administrator';

  return (
    <div className="flex items-start gap-2.5">
      <ProfileAvatar
        src={author.profileImage}
        fallback={author.name.charAt(0)}
        alt={`${author.name}'s profile picture`}
        className="w-8 h-8"
        imageHint="profile picture"
      />
      <div className="flex flex-col gap-1 w-full">
        <div className="bg-muted rounded-lg p-2.5">
          <p className="font-semibold text-sm">{author.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{author.role}</p>
          <p className="text-sm text-foreground mt-1.5">{comment.text}</p>
        </div>
        <div className="flex items-center gap-2 px-2.5">
            <p className="text-xs text-muted-foreground">{formatRelativeTime(new Date(comment.timestamp))}</p>
            {canReply && (
                <button 
                  onClick={() => setShowReplyInput(!showReplyInput)} 
                  className="text-xs font-semibold text-muted-foreground hover:underline"
                >
                  Reply
                </button>
            )}
        </div>
        
        {showReplyInput && (
           <form
              onSubmit={handleReplySubmit}
              className="flex items-center gap-2 pt-2"
            >
              <ProfileAvatar
                  src={currentUser?.profileImage}
                  fallback={currentUser?.name.charAt(0) ?? 'U'}
                  alt="Current user's profile picture"
                  className="w-8 h-8"
                  imageHint="profile picture"
                />
              <Input
                placeholder={`Replying to ${author.name}...`}
                className="rounded-full bg-background h-9"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
              />
              <Button
                type="submit"
                size="icon"
                disabled={!replyText.trim()}
                variant="ghost"
                className="rounded-full h-9 w-9"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Post reply</span>
              </Button>
            </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="pt-2 space-y-3">
            {comment.replies
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .map(reply => (
                <CommentCard key={reply.id} postId={postId} comment={reply} />
              ))}
          </div>
        )}
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

  const totalCommentsAndReplies = (comments: Comment[]): number => {
    return comments.reduce((acc, comment) => {
      return acc + 1 + totalCommentsAndReplies(comment.replies || []);
    }, 0);
  };
  
  const totalCommentCount = totalCommentsAndReplies(post.comments);
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
      <CardContent className="px-4 pb-2 space-y-4">
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
      <CardFooter className="flex flex-col items-start gap-2 p-4 pt-2">
         {totalCommentCount > 0 &&
             <button onClick={() => setIsCommentSectionOpen(!isCommentSectionOpen)} className="text-xs text-muted-foreground hover:underline">
                 {totalCommentCount} {totalCommentCount === 1 ? 'comment' : 'comments'}
             </button>
         }
        <Separator />
        <div className="w-full grid grid-cols-1">
          <Button
            variant="ghost"
            onClick={() => setIsCommentSectionOpen(!isCommentSectionOpen)}
            aria-expanded={isCommentSectionOpen}
            className="text-muted-foreground font-medium justify-start"
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
                .map((comment) => (
                  <CommentCard key={comment.id} postId={post.id} comment={comment} />
              ))}
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
