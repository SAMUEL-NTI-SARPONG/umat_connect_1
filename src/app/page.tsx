
'use client';

import PostCard from '@/components/home/post-card';
import { useUser } from './providers/user-provider';
import CreatePost from '@/components/home/create-post';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Home() {
  const { user, posts } = useUser();

  if (!user) {
    return null; // Or a loading spinner
  }

  const sortedPosts = [...posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="relative py-4 md:py-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        {sortedPosts.length > 0 ? (
          sortedPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center text-muted-foreground mt-12">
            <p>No posts yet.</p>
            <p className="text-sm">Be the first one to post something!</p>
          </div>
        )}
      </div>

      {(user.role === 'lecturer' || user.role === 'administrator') && (
        <CreatePost>
          <Button
            className="absolute bottom-6 right-6 md:bottom-8 md:right-8 h-16 w-16 rounded-full shadow-lg"
            size="icon"
          >
            <Plus className="h-8 w-8" />
            <span className="sr-only">Create Post</span>
          </Button>
        </CreatePost>
      )}
    </div>
  );
}
