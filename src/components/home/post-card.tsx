
'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import Image from 'next/image';
import { FileText, MoreHorizontal, Bookmark, MessageSquare } from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { useUser, type Post } from '@/app/providers/user-provider';
import { formatRelativeTime } from '@/lib/time';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';

export default function PostCard({ post }: { post: Post }) {
  const { user, allUsers } = useUser();
  const author = allUsers.find(u => u.id === post.authorId);

  if (!author || !user) return null;

  const isImage = post.attachedFile?.type.startsWith('image/');
  const relativeTime = formatRelativeTime(new Date(post.timestamp));
  const canModify = user?.id === post.authorId || user?.role === 'administrator';

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
            <ProfileAvatar
                src={author.profileImage}
                fallback={author.name.charAt(0)}
                alt={`${author.name}'s profile picture`}
                imageHint="profile picture"
                className="w-12 h-12"
            />
            <div className="grid gap-0.5">
                <p className="font-semibold">{author.name}</p>
                <p className="text-xs text-muted-foreground">
                {author.department}
                </p>
                <p className="text-xs text-muted-foreground">{relativeTime}</p>
            </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-5 h-5" />
                        <span className="sr-only">Post options</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {canModify ? (
                        <>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </>
                    ) : user.role === 'student' ? (
                         <>
                            <DropdownMenuItem>
                                <Bookmark className="mr-2 h-4 w-4" />
                                <span>Save</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                <span>Comment</span>
                            </DropdownMenuItem>
                        </>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {post.content && <p className="text-sm whitespace-pre-line">{post.content}</p>}
        
        {post.attachedFile && (
          <div className="rounded-lg overflow-hidden border">
            {isImage ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="bg-muted cursor-pointer">
                      <Image
                        src={post.attachedFile.url}
                        alt="Post attachment"
                        width={600}
                        height={400}
                        className="object-contain w-full max-h-[500px]"
                        data-ai-hint="university campus"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="p-0 w-auto max-w-[90vw] max-h-[90vh] bg-transparent border-none">
                     <DialogHeader className="sr-only">
                        <DialogTitle>Post Image</DialogTitle>
                        <DialogDescription>Full view of the image attached to the post.</DialogDescription>
                    </DialogHeader>
                    <Image
                        src={post.attachedFile.url}
                        alt="Post attachment"
                        width={1200}
                        height={800}
                        className="rounded-lg object-contain w-full h-full"
                        data-ai-hint="university campus"
                    />
                  </DialogContent>
                </Dialog>
            ) : (
               <a href={post.attachedFile.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-muted hover:bg-muted/80 transition-colors">
                  <FileText className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-foreground truncate">{post.attachedFile.name}</span>
                    <span className="text-xs text-muted-foreground">Click to view file</span>
                  </div>
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
