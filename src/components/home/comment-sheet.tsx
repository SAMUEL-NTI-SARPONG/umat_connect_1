
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useUser, type Post, type Comment } from '@/app/providers/user-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageSquare, CornerUpLeft } from 'lucide-react';
import { ProfileAvatar } from '../ui/profile-avatar';
import { formatRelativeTime } from '@/lib/time';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import Image from 'next/image';
import { FileText } from 'lucide-react';

interface CommentSheetProps {
  post: Post;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

function CommentEntry({
  comment,
  postId,
  onReply,
  level = 0,
}: {
  comment: Comment;
  postId: number;
  onReply: (commentId: number) => void;
  level?: number;
}) {
  const { allUsers } = useUser();
  const author = allUsers.find((u) => u.id === comment.authorId);

  if (!author) return null;

  return (
    <div style={{ marginLeft: `${level * 20}px` }} className="flex flex-col">
      <div className="flex items-start gap-3 py-3">
        <ProfileAvatar
          src={author.profileImage}
          fallback={author.name.charAt(0)}
          className="w-8 h-8"
          alt={author.name}
          imageHint="profile picture"
        />
        <div className="flex-1">
          <div className="bg-muted rounded-lg px-3 py-2">
            <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{author.name}</p>
                <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(new Date(comment.timestamp))}
                </p>
            </div>
            <p className="text-sm">{comment.text}</p>
          </div>
          <div className="pl-3">
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onReply(comment.id)}>
              <CornerUpLeft className="w-3 h-3 mr-1" />
              Reply
            </Button>
          </div>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l-2 ml-5">
          {comment.replies.map((reply) => (
            <CommentEntry
              key={reply.id}
              comment={reply}
              postId={postId}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSheet({ post, isOpen, onOpenChange }: CommentSheetProps) {
  const { user, allUsers, addComment, addReply } = useUser();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  
  const endOfCommentsRef = useRef<HTMLDivElement>(null);
  const author = allUsers.find(u => u.id === post.authorId);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(post.id, commentText);
    setCommentText('');
  };

  const handleAddReply = () => {
    if (!replyingTo || !replyText.trim()) return;
    addReply(post.id, replyingTo, replyText);
    setReplyText('');
    setReplyingTo(null);
  };

  const hasAttachment = post.attachedFile && post.attachedFile.url && typeof post.attachedFile.url === 'string';
  const isImage = hasAttachment && post.attachedFile.url.startsWith('data:image');
  
  useEffect(() => {
    if (isOpen) {
        endOfCommentsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [post.comments, isOpen]);

  if (!user || !author) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0" side="bottom">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Post by {author.name}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
                 <p className="whitespace-pre-wrap text-sm">{post.content}</p>
                {hasAttachment && (
                  <div className="rounded-lg overflow-hidden border max-h-[40vh]">
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
            </div>
            <Separator />
            <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">Comments ({post.comments.length})</h3>
                {post.comments.length > 0 ? (
                    <div className="space-y-2">
                    {post.comments.map((comment) => (
                        <CommentEntry
                        key={comment.id}
                        comment={comment}
                        postId={post.id}
                        onReply={setReplyingTo}
                        />
                    ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm text-center py-8">
                        No comments yet. Be the first to comment!
                    </p>
                )}
                <div ref={endOfCommentsRef} />
            </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-background">
            {replyingTo ? (
                <div className="relative">
                    <p className="text-xs text-muted-foreground mb-1">
                        Replying...{' '}
                        <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => setReplyingTo(null)}>Cancel</Button>
                    </p>
                    <Textarea
                        placeholder="Write your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="pr-12"
                        rows={1}
                    />
                    <Button size="icon" className="absolute right-2 top-1/2 h-8 w-8" onClick={handleAddReply} disabled={!replyText.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                 <div className="relative flex items-center gap-2">
                    <ProfileAvatar 
                        src={user.profileImage}
                        fallback={user.name.charAt(0)}
                        className="w-8 h-8"
                        alt={user.name}
                    />
                    <Textarea
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="pr-12"
                        rows={1}
                    />
                    <Button size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={handleAddComment} disabled={!commentText.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
