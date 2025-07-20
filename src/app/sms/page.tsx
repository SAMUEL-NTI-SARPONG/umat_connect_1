
'use client';

import { useState, useEffect, useRef } from 'react';
import ChatLayout from '@/components/sms/chat-layout';
import { useUser } from '@/app/providers/user-provider';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type Message = {
  id: number;
  content: string;
  isUser: boolean;
};

// This is a mock function to simulate calling the backend API
// In a real app this would be an actual fetch call.
async function sendSmsToBackend(from: string, body: string): Promise<string> {
    const formData = new FormData();
    formData.append('From', from);
    formData.append('Body', body);

    try {
        const response = await fetch('/api/sms', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const text = await response.text();
        // Twilio returns XML, so we need to parse it to get the message.
        const matches = text.match(/<Message>(.*?)<\/Message>/);
        return matches ? matches[1] : 'Sorry, there was an issue with the response.';

    } catch (error) {
        console.error("Failed to send SMS to backend", error);
        return "Sorry, an error occurred while sending your message.";
    }
}


export default function SmsPage() {
  const { user } = useUser();
  const { toast } = useToast();
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
- "Today", "Now", "Next" for your schedule.
- Lecturers can update class status with "[course code] [confirm/cancel]".`,
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
      // Simulate sending the SMS to our backend and getting a response
      const responseText = await sendSmsToBackend(user.phone, input);

      const botMessage: Message = {
        id: Date.now() + 1,
        content: responseText,
        isUser: false,
      };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error('Error processing SMS:', error);
      toast({
          title: "Error",
          description: "Failed to get a response from the SMS service.",
          variant: "destructive"
      })
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
