
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
import { Image as ImageIcon, FileText, Send, Paperclip } from 'lucide-react';
import { useUser } from '@/app/providers/user-provider';
import Image from 'next/image';
import { Card } from '../ui/card';
import { ProfileAvatar } from '../ui/profile-avatar';

interface AttachedFile {
  name: string;
  type: string;
  url: string;
}

export default function CreatePostCard() {
  const { user, addPost } = useUser();
  const [content, setContent] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePost = () => {
    addPost({ content, attachedFile });
    handleDialogClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedFile({
          name: file.name,
          type: file.type,
          url: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDialogClose = () => {
    setContent('');
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsDialogOpen(false);
  };

  if (!user || user.role === 'student') {
    return null;
  }

  const isImage = attachedFile?.type.startsWith('image/');

  return (
    <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
      if (!isOpen) handleDialogClose();
      else setIsDialogOpen(true);
    }}>
      <Card className="mb-4 p-3 rounded-xl shadow-sm cursor-pointer hover:bg-muted transition-colors">
        <DialogTrigger asChild>
            <div className="flex items-center gap-4">
                <ProfileAvatar
                    src={user.profileImage}
                    fallback={user.name.charAt(0)}
                    alt={`${user.name}'s profile picture`}
                    imageHint="profile picture"
                    className="w-10 h-10"
                />
                <div className="flex-grow text-left">
                    <div className="w-full text-muted-foreground p-2 rounded-lg">
                        What's on your mind?
                    </div>
                </div>
            </div>
        </DialogTrigger>
      </Card>

      <DialogContent className="sm:max-w-[525px] flex flex-col" onInteractOutside={handleDialogClose}>
        <DialogHeader>
          <DialogTitle>Create a new post</DialogTitle>
        </DialogHeader>
        <div className="flex-grow grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {attachedFile && (
            <div className="relative mb-4">
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 rounded-full h-8 w-8 z-10"
                onClick={removeFile}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              {isImage ? (
                <Image
                  src={attachedFile.url}
                  alt="Image preview"
                  width={525}
                  height={300}
                  className="rounded-lg object-cover w-full aspect-video"
                  data-ai-hint="post preview"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground truncate">{attachedFile.name}</span>
                </div>
              )}
            </div>
          )}
           <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 resize-none shadow-none text-base min-h-[100px]"
          />
        </div>
         <DialogFooter className="mt-auto flex-row items-center border-t pt-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => fileInput.current?.click()}
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
             <span className="sr-only">Attach file</span>
          </Button>

          <div className="flex-grow" />

          <Button
            onClick={handlePost}
            disabled={!content.trim() && !attachedFile}
            className="rounded-full"
          >
            <Send className="mr-2 h-4 w-4" />
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
