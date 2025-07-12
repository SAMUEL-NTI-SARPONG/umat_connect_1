
'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle } from 'lucide-react';
import { useUser } from '@/app/providers/user-provider';

export default function CreatePostCard() {
  const { role } = useUser();
  const [content, setContent] = useState('');

  const handlePost = () => {
    // Logic to create a new post would go here
    console.log('New post created:', content);
    setContent('');
  };

  if (role !== 'lecturer' && role !== 'administrator') {
    return null;
  }

  return (
    <Card className="mb-4 rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Create a new post</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-muted border-none"
        />
      </CardContent>
      <CardFooter>
        <Button onClick={handlePost} disabled={!content.trim()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Post
        </Button>
      </CardFooter>
    </Card>
  );
}
