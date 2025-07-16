
'use client';

import { useState, useEffect, useRef } from 'react';
import ChatLayout from '@/components/sms/chat-layout';
import { useUser } from '@/app/providers/user-provider';
import { processSms, ProcessSmsInput } from '@/ai/flows/sms-flow';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Message = {
  id: number;
  content: string;
  isUser: boolean;
};

export default function SmsPage() {
  const { user, allUsers, masterSchedule, lecturerSchedules, emptySlots } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start with a welcome message from the bot
    setMessages([
      {
        id: 1,
        content: `Welcome to the UMaT Connect SMS service.
You can ask for things like:
- "My schedule for Monday"
- "Any free rooms on Tuesday?"
- "What's my level?"`,
        isUser: false,
      },
    ]);
  }, []);
  
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now(),
      content: input,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const smsInput: ProcessSmsInput = {
        from: user.phone,
        message: input,
        allUsers,
        masterSchedule: masterSchedule || [],
        lecturerSchedules,
        emptySlots,
      };

      const result = await processSms(smsInput);

      const botMessage: Message = {
        id: Date.now() + 1,
        content: result.response,
        isUser: false,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error processing SMS:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        content: 'Sorry, something went wrong. Please try again later.',
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)] md:h-[calc(100vh-3.5rem)]">
      <ChatLayout
        messages={messages}
        isLoading={isLoading}
        endOfMessagesRef={endOfMessagesRef}
      />
      <div className="px-4 py-2 bg-background border-t">
        <div className="relative">
          <Textarea
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="pr-16"
            rows={1}
          />
          <Button
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

