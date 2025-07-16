
'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { BeatLoader } from 'react-spinners';

interface ChatBubbleProps {
  content: string;
  isUser: boolean;
  isLoading?: boolean;
}

export default function ChatBubble({ content, isUser, isLoading }: ChatBubbleProps) {
  const bubbleClasses = cn(
    'relative max-w-sm rounded-xl px-4 py-2.5',
    isUser
      ? 'bg-primary text-primary-foreground self-end rounded-br-lg'
      : 'bg-muted text-foreground self-start rounded-bl-lg'
  );

  return (
    <div className={cn('flex items-start gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground">
          <Bot className="h-5 w-5" />
        </div>
      )}
      <div className={bubbleClasses}>
        {isLoading ? (
          <BeatLoader size={8} color="currentColor" />
        ) : (
          <p className="whitespace-pre-wrap text-sm">{content}</p>
        )}
      </div>
      {isUser && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
