
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import Image from 'next/image';
import { FileText, MessageSquare, Trash2, CornerUpLeft, Send, Paperclip, X } from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { useUser, type Post, type Comment, type AttachedFile } from '@/app/providers/user-provider';
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
import { Textarea } from '../ui/textarea';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';

// CommentEntry component for displaying a single comment and its replies
function CommentEntry({
  comment,
  postId,
  onReply,
  isHighlighted,
}: {
  comment: Comment;
  postId: number;
  onReply: (commentId: number, authorName: string) => void;
  isHighlighted: boolean;
}) {
  const { allUsers } = useUser();
  const author = allUsers.find((u) => u.id === comment.authorId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHighlighted && ref.current) {
        setTimeout(() => {
            ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500); // Delay to allow animation to finish
    }
  }, [isHighlighted]);

  if (!author) return null;
  
  const hasAttachment = comment.attachedFile && typeof comment.attachedFile.url === 'string' && comment.attachedFile.url.trim().length > 0;
  const isImage = hasAttachment && comment.attachedFile!.type.startsWith('image/');

  return (
    <div ref={ref} id={`comment-${comment.id}`}>
      <div className="flex flex-col">
        <div className="flex items-start gap-3 py-2">
          <ProfileAvatar
            src={author.profileImage}
            fallback={author.name.charAt(0)}
            className="w-8 h-8"
            alt={author.name}
            imageHint="profile picture"
          />
          <div className="flex-1">
            <div className="bg-muted rounded-lg px-3 py-2 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{author.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(new Date(comment.timestamp))}
                </p>
              </div>
              {comment.text && <p className="text-sm break-words">{comment.text}</p>}
            </div>
            <div className="pl-3">
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onReply(comment.id, author.name)}>
                <CornerUpLeft className="w-3 h-3 mr-1" />
                Reply
              </Button>
            </div>
          </div>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="border-l-2 ml-5 pl-2">
            {comment.replies.map((reply) => (
                <CommentEntry
                    key={reply.id}
                    comment={reply}
                    postId={postId}
                    onReply={onReply}
                    isHighlighted={isHighlighted}
                />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// CommentSection component to be rendered inline
function CommentSection({ post, highlightedCommentId }: { post: Post, highlightedCommentId: number | null }) {
    const { user, addComment, addReply } = useUser();
    const [commentText, setCommentText] = useState('');
    const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
    const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (replyingTo && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [replyingTo]);
    
    if (!user) return null;

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

    const handleSubmit = () => {
        if (!commentText.trim() && !attachedFile) return;

        if (replyingTo) {
            addReply(post.id, replyingTo.id, commentText, attachedFile);
            setReplyingTo(null);
        } else {
            addComment(post.id, commentText, attachedFile);
        }
        setCommentText('');
        setAttachedFile(null);
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
        setCommentText('');
        setAttachedFile(null);
    };

    const isPreviewImage = attachedFile && attachedFile.type.startsWith('image/') && attachedFile.url;
    
    return (
      <div className="px-2 sm:px-4 pt-2 pb-4 border-t">
        {/* List of comments */}
        <div className="space-y-2 mb-4">
            {post.comments.map(comment => (
                <CommentEntry 
                    key={comment.id}
                    comment={comment}
                    postId={post.id}
                    onReply={(commentId, authorName) => setReplyingTo({ id: commentId, name: authorName })}
                    isHighlighted={comment.id === highlightedCommentId}
                />
            ))}
        </div>

        {/* Input for new comment/reply */}
        <div className="relative flex items-start gap-2">
          <ProfileAvatar 
              src={user.profileImage}
              fallback={user.name.charAt(0)}
              className="w-8 h-8 self-start"
              alt={user.name}
          />
          <div className="flex-1 space-y-2">
            {replyingTo && (
                <p className="text-xs text-muted-foreground">
                    Replying to {replyingTo.name}...{' '}
                    <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={handleCancelReply}>Cancel</Button>
                </p>
            )}
            <div className="relative flex items-center">
              <Textarea
                  ref={textareaRef}
                  placeholder={replyingTo ? 'Write your reply...' : 'Write a comment...'}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="pr-20 min-h-[40px] bg-muted border-none focus-visible:ring-1 focus-visible:ring-ring"
                  rows={1}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                      }
                  }}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button 
                      variant="ghost"
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={handleSubmit} 
                    disabled={!commentText.trim() && !attachedFile}>
                    <Send className="h-4 w-4" />
                  </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}

export default function PostCard({ post }: { post: Post }) {
  const { user, allUsers, deletePost } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryPostId = searchParams.get('postId');
  const queryCommentId = searchParams.get('commentId');

  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(
    post.id === Number(queryPostId)
  );

  useEffect(() => {
    if (post.id === Number(queryPostId)) {
      setIsCommentSectionOpen(true);
      // Clean up URL params after opening
      const newUrl = window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [queryPostId, post.id, router]);

  const author = allUsers.find(u => u.id === post.authorId);

  if (!author || !user) return null;

  const hasAttachment = post.attachedFile && typeof post.attachedFile.url === 'string' && post.attachedFile.url.trim().length > 0;
  const isImage = hasAttachment && post.attachedFile!.type.startsWith('image/');
  const relativeTime = formatRelativeTime(new Date(post.timestamp));

  const canDelete = user.id === post.authorId;
  const canComment = true; 

  const totalCommentsAndReplies = post.comments.reduce((acc, comment) => {
    // Recursive count for replies
    const countReplies = (c: Comment): number => {
        return 1 + c.replies.reduce((sum, reply) => sum + countReplies(reply), 0);
    };
    return acc + countReplies(comment);
  }, 0);

  return (
    <Card className="rounded-xl shadow-sm flex flex-col overflow-hidden">
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
      </CardContent>
      <CardFooter className="px-2 sm:px-4 pt-2 pb-3">
        {canComment && (
          <Button variant="ghost" className="text-muted-foreground -ml-2" onClick={() => setIsCommentSectionOpen(prev => !prev)}>
              <MessageSquare className="w-5 h-5 mr-2" />
              <span className="text-sm">{totalCommentsAndReplies > 0 ? `${totalCommentsAndReplies} Comment${totalCommentsAndReplies > 1 ? 's' : ''}` : 'Comment'}</span>
          </Button>
        )}
      </CardFooter>

      <AnimatePresence initial={false}>
          {isCommentSectionOpen && (
              <motion.section
                key="content"
                initial="collapsed"
                animate="open"
                exit="collapsed"
                variants={{
                  open: { opacity: 1, height: "auto" },
                  collapsed: { opacity: 0, height: 0 }
                }}
                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
              >
                <CommentSection post={post} highlightedCommentId={Number(queryCommentId)} />
              </motion.section>
          )}
      </AnimatePresence>
    </Card>
  );
}
