
'use client';

import { useState, useRef, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Send, Paperclip, X } from 'lucide-react';
import { useUser, type AttachedFile } from '@/app/providers/user-provider';
import Image from 'next/image';

type PostData = {
  content: string;
  attachedFile: AttachedFile | null;
};

const initialPostData: PostData = {
  content: '',
  attachedFile: null,
};

export default function CreatePost({ children }: { children: ReactNode }) {
  const { addPost } = useUser();
  const [postData, setPostData] = useState<PostData>(initialPostData);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePostDataChange = (field: keyof PostData, value: any) => {
    setPostData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        handlePostDataChange('attachedFile', {
          name: file.name,
          type: file.type,
          url: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    handlePostDataChange('attachedFile', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handlePost = () => {
    addPost(postData);
    handleCloseAll();
  };

  const handleCloseAll = () => {
    setPostData(initialPostData);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsPostDialogOpen(false);
  };

  const isImage = postData.attachedFile?.type.startsWith('image/');

  return (
    <>
      <Dialog open={isPostDialogOpen} onOpenChange={(isOpen) => {
        if (!isOpen) handleCloseAll();
        else setIsPostDialogOpen(true);
      }}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px] flex flex-col" onInteractOutside={handleCloseAll}>
          <DialogHeader>
            <DialogTitle>Create a new post</DialogTitle>
          </DialogHeader>
          <div className="flex-grow grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <Textarea
              placeholder="What's on your mind?"
              value={postData.content}
              onChange={(e) => handlePostDataChange('content', e.target.value)}
              className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 resize-none shadow-none text-base"
              rows={1}
            />
            {postData.attachedFile && (
              <div className="relative mt-2">
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full h-8 w-8 z-10"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4" />
                </Button>
                {isImage ? (
                  <Image
                    src={postData.attachedFile.url}
                    alt="Image preview"
                    width={525}
                    height={300}
                    className="rounded-lg object-cover w-full aspect-video"
                    data-ai-hint="post preview"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground truncate">{postData.attachedFile.name}</span>
                  </div>
                )}
              </div>
            )}
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
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
               <span className="sr-only">Attach file</span>
            </Button>
  
            <div className="flex-grow" />
  
            <Button
              onClick={handlePost}
              disabled={!postData.content.trim() && !postData.attachedFile}
              className="rounded-full"
            >
              <Send className="mr-2 h-4 w-4" />
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
