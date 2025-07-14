
'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Image as ImageIcon, X, PenSquare } from 'lucide-react';
import { useUser } from '@/app/providers/user-provider';
import { ProfileAvatar } from '../ui/profile-avatar';
import Image from 'next/image';

export default function CreatePostCard() {
  const { user } = useUser();
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePost = () => {
    // Logic to create a new post with content and image would go here
    console.log('New post created:', { content, image: imagePreview });
    handleDialogClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDialogClose = () => {
    setContent('');
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsDialogOpen(false);
  };

  const openDialogAndTriggerFileInput = () => {
    setIsDialogOpen(true);
    // We need to wait for the dialog to be mounted before we can click the input
    setTimeout(() => {
        fileInputRef.current?.click();
    }, 100);
  }

  if (!user || user.role === 'student') {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Card className="p-4 mb-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
                <ProfileAvatar
                    src={user.profileImage}
                    fallback={user.name.charAt(0)}
                    alt={`${user.name}'s profile picture`}
                    imageHint="profile picture"
                />
                <DialogTrigger asChild>
                    <div className="flex-grow text-left text-muted-foreground cursor-pointer hover:text-foreground">
                        What's on your mind?
                    </div>
                </DialogTrigger>
            </div>
            <div className="mt-4 flex justify-around">
                <DialogTrigger asChild>
                    <Button variant="ghost" className="flex-1">
                        <PenSquare className="mr-2 h-5 w-5 text-primary" />
                        Text
                    </Button>
                </DialogTrigger>
                <Button variant="ghost" className="flex-1" onClick={openDialogAndTriggerFileInput}>
                    <ImageIcon className="mr-2 h-5 w-5 text-primary" />
                    Image
                </Button>
            </div>
        </Card>

      <DialogContent className="sm:max-w-[525px]" onInteractOutside={handleDialogClose}>
        <DialogHeader>
          <DialogTitle>Create a new post</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-muted border-none min-h-[120px]"
          />
          {imagePreview && (
            <div className="relative">
              <Image
                src={imagePreview}
                alt="Image preview"
                width={525}
                height={300}
                className="rounded-lg object-cover w-full aspect-video"
                data-ai-hint="post preview"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 rounded-full h-8 w-8"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between items-center">
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Add Image
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <DialogClose asChild>
                <Button variant="ghost" onClick={handleDialogClose}>Cancel</Button>
            </DialogClose>
            <Button
              onClick={handlePost}
              disabled={!content.trim() && !imagePreview}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Post
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
