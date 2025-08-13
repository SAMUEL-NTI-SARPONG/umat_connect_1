
'use client';

import PostCard from '@/components/home/post-card';
import { useUser } from './providers/user-provider';
import CreatePost from '@/components/home/create-post';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useMemo, Suspense } from 'react';

function HomePageContent() {
  const { user, posts } = useUser();

  const filteredPosts = useMemo(() => {
    if (!user) return [];
    
    // Admins see all posts.
    if (user.role === 'administrator') {
      return posts;
    }

    return posts.filter(post => {
      // Show post if the user is the author
      if (post.authorId === user.id) {
        return true;
      }
      // If audience is not defined or empty, everyone sees it (legacy posts)
      if (!post.audience || post.audience.length === 0) {
        return true;
      }
      // Otherwise, check if the user is in the audience
      return post.audience.includes(user.id);
    });
  }, [posts, user]);

  if (!user) {
    return null; // Or a loading spinner
  }

  const sortedPosts = [...filteredPosts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="relative py-4 md:py-6 max-w-xl mx-auto px-2">
      <div className="space-y-4">
        {sortedPosts.length > 0 ? (
          sortedPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center text-muted-foreground mt-12">
            <p>No posts for you yet.</p>
            <p className="text-sm">When there's a new announcement for you, it will appear here.</p>
          </div>
        )}
      </div>

      {(user.role === 'staff' || user.role === 'administrator') && (
        <CreatePost>
          <Button
            className="fixed bottom-20 right-6 md:bottom-8 md:right-[calc(50vw-18rem-4rem)] h-16 w-16 rounded-full shadow-lg"
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

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}
