
'use client';

import { useState } from 'react';
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const chats = [
  {
    id: 1,
    name: 'CE Level 100 Group',
    lastMessage: 'Reminder: Assignment 1 is due tomorrow.',
    timestamp: '10:48 AM',
    avatar: 'https://placehold.co/100x100/7986CB/FFFFFF/png',
    imageHint: 'group chat',
    messages: [
        { sender: 'Dr. Yaw Mensah', text: 'Please be reminded that your first assignment is due tomorrow at 4pm.', time: '10:45 AM' },
        { sender: 'You', text: 'Thank you for the reminder, sir.', time: '10:46 AM' },
        { sender: 'Student Rep', text: 'Reminder: Assignment 1 is due tomorrow.', time: '10:48 AM' },
    ]
  },
  {
    id: 2,
    name: 'Dr. Yaw Mensah',
    lastMessage: 'I have received your email. I will look at it shortly.',
    timestamp: '9:32 AM',
    avatar: 'https://placehold.co/100x100/673AB7/FFFFFF/png',
    imageHint: 'profile picture',
    messages: [
      { sender: 'You', text: 'Good morning, sir. I have submitted my proposal via email.', time: '9:30 AM' },
      { sender: 'Dr. Yaw Mensah', text: 'I have received your email. I will look at it shortly.', time: '9:32 AM' },
    ]
  },
  {
    id: 3,
    name: 'Final Year Project Team',
    lastMessage: 'Let\'s meet at the library at 2 PM to finalize the report.',
    timestamp: 'Yesterday',
    avatar: 'https://placehold.co/100x100/EDE7F6/311B92/png',
    imageHint: 'group project',
     messages: [
      { sender: 'Team Member 1', text: 'Hey everyone, what\'s the status of the final report?', time: 'Yesterday' },
      { sender: 'You', text: 'I\'m almost done with my section. Just need to add the conclusion.', time: 'Yesterday' },
      { sender: 'Team Lead', text: 'Let\'s meet at the library at 2 PM to finalize the report.', time: 'Yesterday' },
    ]
  },
  {
    id: 4,
    name: 'Admin Office',
    lastMessage: 'Your registration for the next semester is confirmed.',
    timestamp: 'Friday',
    avatar: 'https://placehold.co/100x100/C5CAE9/3F51B5/png',
    imageHint: 'office building',
    messages: [
       { sender: 'Admin Office', text: 'Your registration for the next semester is confirmed.', time: 'Friday' },
    ]
  },
    {
    id: 5,
    name: 'Dr. Adwoa Ansa',
    lastMessage: 'Please see the attached file for the lecture notes.',
    timestamp: 'Thursday',
    avatar: 'https://placehold.co/100x100/9FA8DA/FFFFFF/png',
    imageHint: 'profile picture',
    messages: [
        { sender: 'Dr. Adwoa Ansa', text: 'Please see the attached file for the lecture notes.', time: 'Thursday' },
    ]
  },
];


export default function ExplorePage() {
  const [selectedChat, setSelectedChat] = useState(chats[0]);

  return (
    <div className="flex h-full border rounded-lg bg-card text-card-foreground">
        {/* Left Panel: Chat List */}
        <div className="w-full md:w-1/3 lg:w-1/4 border-r flex flex-col">
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search chats..." className="pl-10" />
                </div>
            </div>
            <ScrollArea className="flex-grow">
                {chats.map((chat) => (
                    <div 
                        key={chat.id} 
                        className={cn(
                            "flex items-center p-3 cursor-pointer transition-colors",
                            selectedChat?.id === chat.id ? 'bg-muted/80' : 'hover:bg-muted/50'
                        )}
                        onClick={() => setSelectedChat(chat)}
                    >
                        <ProfileAvatar
                            src={chat.avatar}
                            fallback={chat.name.charAt(0)}
                            alt={`${chat.name}'s profile`}
                            className="w-12 h-12 mr-4"
                            imageHint={chat.imageHint}
                        />
                        <div className="flex-grow overflow-hidden">
                            <p className="font-semibold truncate">{chat.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                        </div>
                        <div className="text-xs text-muted-foreground ml-4 self-start shrink-0">
                            {chat.timestamp}
                        </div>
                    </div>
                ))}
            </ScrollArea>
        </div>

        {/* Right Panel: Chat Window */}
        <div className="hidden md:flex flex-1 flex-col">
            {selectedChat ? (
                <>
                    <div className="flex items-center p-3 border-b">
                        <ProfileAvatar
                            src={selectedChat.avatar}
                            fallback={selectedChat.name.charAt(0)}
                            alt={`${selectedChat.name}'s profile`}
                            className="w-10 h-10 mr-4"
                            imageHint={selectedChat.imageHint}
                        />
                        <p className="font-semibold">{selectedChat.name}</p>
                    </div>
                    <ScrollArea className="flex-grow p-4 bg-muted/30">
                        <div className="space-y-4">
                            {selectedChat.messages.map((msg, index) => (
                                <div key={index} className={cn("flex", msg.sender === 'You' ? 'justify-end' : 'justify-start')}>
                                    <div className={cn(
                                        "rounded-lg px-3 py-2 max-w-sm",
                                        msg.sender === 'You' ? 'bg-primary text-primary-foreground' : 'bg-background'
                                    )}>
                                        <p className="font-semibold text-xs mb-1">{msg.sender}</p>
                                        <p className="text-sm">{msg.text}</p>
                                        <p className="text-right text-xs opacity-70 mt-1">{msg.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t bg-background">
                        <div className="relative">
                            <Input placeholder="Type a message..." className="pr-12" />
                            <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p>Select a chat to start messaging</p>
                </div>
            )}
        </div>
    </div>
  );
}
