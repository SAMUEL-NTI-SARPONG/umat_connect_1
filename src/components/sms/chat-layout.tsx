
'use client';

import React from 'react';
import ChatBubble from './chat-bubble';
import { ScrollArea } from '../ui/scroll-area';

type Message = {
  id: number;
  content: string;
  isUser: boolean;
};

interface ChatLayoutProps {
  messages: Message[];
  isLoading: boolean;
  endOfMessagesRef: React.RefObject<HTMLDivElement>;
}

export default function ChatLayout({ messages, isLoading, endOfMessagesRef }: ChatLayoutProps) {
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-6">
        {messages.map((message) => (
          <ChatBubble key={message.id} {...message} />
        ))}
        {isLoading && <ChatBubble content="" isUser={false} isLoading={true} />}
        <div ref={endOfMessagesRef} />
      </div>
    </ScrollArea>
  );
}
