
'use client';

import CreatePostCard from '@/components/home/create-post-card';
import PostCard from '@/components/home/post-card';
import { posts as allPosts } from '@/lib/data';
import { useUser } from './providers/user-provider';

export default function Home() {
  const { user } = useUser();

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="py-4 md:py-6 max-w-2xl mx-auto">
      <CreatePostCard />
      {allPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
