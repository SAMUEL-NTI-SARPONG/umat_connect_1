
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
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Image as ImageIcon, X } from 'lucide-react';
import { useUser } from '@/app/providers/user-provider';
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

  if (!user || user.role === 'student') {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div className="flex justify-center mb-4">
        <DialogTrigger asChild>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Post
            </Button>
        </DialogTrigger>
      </div>

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
