
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { MessageCircle, Send } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

type Comment = {
  author: string;
  text: string;
};

function PostCard({
  author,
  department,
  timestamp,
  content,
  imageUrl,
  initialComments = [],
}: {
  author: string;
  department: string;
  timestamp: string;
  content: string;
  imageUrl?: string;
  initialComments?: Comment[];
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      setComments([
        ...comments,
        { author: 'Student User', text: newComment },
      ]);
      setNewComment('');
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage
              src={`https://placehold.co/40x40.png`}
              data-ai-hint="profile picture"
            />
            <AvatarFallback>{author.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base font-semibold">{author}</CardTitle>
            <CardDescription>
              {department} - {timestamp}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{content}</p>
        {imageUrl && (
          <div className="mt-4">
            <Image
              src={imageUrl}
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
          <Button variant="ghost" size="sm">
             <MessageCircle className="mr-2 h-4 w-4" />
            <span>Comment</span>
          </Button>
        </div>
        <Separator />
        <div className="w-full flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={`https://placehold.co/32x32.png`} data-ai-hint="profile picture" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <form onSubmit={handleCommentSubmit} className="flex-grow flex items-center gap-2">
            <Input
              placeholder="Add a comment..."
              className="rounded-full"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button type="submit" size="icon" disabled={!newComment.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Post comment</span>
            </Button>
          </form>
        </div>
        <div className="w-full pl-10 space-y-2">
          {comments.map((comment, index) => (
            <div key={index} className="flex items-start gap-2">
               <Avatar className="w-6 h-6">
                <AvatarImage src={`https://placehold.co/24x24.png`} data-ai-hint="profile picture" />
                <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg p-2 text-sm">
                <p className="font-semibold">{comment.author}</p>
                <p>{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}

export default function Home() {
  return (
    <div className="p-4 md:p-6">
      <PostCard
        author="Dr. Yaw Mensah"
        department="Computer Science"
        timestamp="2 hours ago"
        content="Reminder: The assignment deadline for COEN 457 is this Friday. No extensions will be granted. Please submit via the university portal."
        imageUrl="https://placehold.co/600x400.png"
        initialComments={[
          { author: 'Alice', text: 'Thank you for the reminder, Dr. Mensah!' }
        ]}
      />
      <PostCard
        author="Admin Office"
        department="Examinations Unit"
        timestamp="8 hours ago"
        content="The final examination timetable for the second semester has been released. Please check your student dashboards for your personal schedule."
      />
       <PostCard
        author="Dr. Adwoa Ansa"
        department="Geomatic Engineering"
        timestamp="Yesterday"
        content="Guest lecture on 'Modern GIS Applications' will be held tomorrow at the main auditorium. All Geomatic Engineering students are encouraged to attend."
      />
    </div>
  );
}
