
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { MessageCircle, Send, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { useUser, type Post } from '@/app/providers/user-provider';
import { users } from '@/lib/data';

type Comment = {
  author: string;
  text: string;
};

export default function PostCard({ post }: { post: Post }) {
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [newComment, setNewComment] = useState('');
  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(false);

  const { allUsers } = useUser();
  const author = allUsers.find(u => u.id === post.authorId);
  const { user: currentUser } = useUser();

  if (!author) return null;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && currentUser) {
      setComments([
        ...comments,
        { author: currentUser.name, text: newComment },
      ]);
      setNewComment('');
    }
  };
  
  const isImage = post.attachedFile?.type.startsWith('image/');

  return (
    <Card className="mb-4 rounded-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-4">
          <ProfileAvatar
            src={author.profileImage}
            fallback={author.name.charAt(0)}
            alt={`${author.name}'s profile picture`}
            imageHint="profile picture"
          />
          <div>
            <CardTitle className="text-base font-semibold">{author.name}</CardTitle>
            <CardDescription>
              {author.department} - {post.timestamp}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {post.content && <p className="text-sm mb-4">{post.content}</p>}
        {post.attachedFile && (
          <div className="mt-4">
            {isImage ? (
                <Image
                  src={post.attachedFile.url}
                  alt="Post image"
                  width={600}
                  height={400}
                  className="rounded-lg object-cover w-full"
                  data-ai-hint="university campus"
                />
            ) : (
               <a href={post.attachedFile.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border bg-muted hover:bg-muted/80 transition-colors">
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
      <CardFooter className="flex flex-col items-start gap-4">
        <Separator />
        <div className="w-full flex items-center gap-2 text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCommentSectionOpen(!isCommentSectionOpen)}
            aria-expanded={isCommentSectionOpen}
            className="text-muted-foreground"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            <span>Comment</span>
          </Button>
        </div>

        {isCommentSectionOpen && (
          <>
            <div className="w-full flex items-center gap-2">
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
                  className="rounded-full bg-muted border-none"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newComment.trim()}
                  variant="ghost"
                  className="rounded-full"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Post comment</span>
                </Button>
              </form>
            </div>
            <div className="w-full pl-10 space-y-2">
              {comments.map((comment, index) => {
                const commentAuthor = users.find(u => u.name === comment.author);
                return (
                  <div key={index} className="flex items-start gap-2">
                    <ProfileAvatar
                        src={commentAuthor?.profileImage}
                        fallback={comment.author.charAt(0)}
                        alt={`${comment.author}'s profile picture`}
                        className="w-6 h-6"
                        imageHint="profile picture"
                      />
                    <div className="bg-muted rounded-lg p-2 text-sm w-full">
                      <p className="font-semibold">{comment.author}</p>
                      <p className="text-muted-foreground">{comment.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
