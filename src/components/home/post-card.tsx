
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
import { MessageCircle, Send } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { useUser } from '@/app/providers/user-provider';
import { users } from '@/lib/data';

type Comment = {
  author: string;
  text: string;
};

type Post = {
  id: number;
  authorId: number;
  timestamp: string;
  content: string;
  imageUrl?: string;
  comments: Comment[];
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
        <p className="text-sm">{post.content}</p>
        {post.imageUrl && (
          <div className="mt-4">
            <Image
              src={post.imageUrl}
              alt="Post image"
              width={600}
              height={400}
              className="rounded-lg object-cover w-full"
              data-ai-hint="university campus"
            />
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
