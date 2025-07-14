
'use client';

import PostCard from '@/components/home/post-card';
import { useUser } from './providers/user-provider';

export default function Home() {
  const { user, posts } = useUser();

  if (!user) {
    return null; // Or a loading spinner
  }

  const sortedPosts = [...posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="py-4 md:py-6 max-w-2xl mx-auto">
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
  );
}
