
'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
  dialogClassName?: string;
  imageHint?: string;
}

export function ProfileAvatar({
  src,
  fallback,
  alt,
  className,
  dialogClassName,
  imageHint,
}: ProfileAvatarProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Avatar className={cn('cursor-pointer', className)}>
          <AvatarImage src={src} data-ai-hint={imageHint} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      </DialogTrigger>
      <DialogContent
        className={cn('p-0 w-auto bg-transparent border-none', dialogClassName)}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Profile Picture</DialogTitle>
          <DialogDescription>
            A larger view of the user's profile picture.
          </DialogDescription>
        </DialogHeader>
        <Image
          src={src}
          alt={alt}
          width={500}
          height={500}
          className="rounded-lg object-cover"
          data-ai-hint={imageHint}
        />
      </DialogContent>
    </Dialog>
  );
}
