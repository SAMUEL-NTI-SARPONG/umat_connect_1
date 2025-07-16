
'use client';

import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Separator } from "@/components/ui/separator";

const chats = [
  {
    id: 1,
    name: 'CE Level 100 Group',
    lastMessage: 'Reminder: Assignment 1 is due tomorrow.',
    timestamp: '10:48 AM',
    avatar: 'https://placehold.co/100x100/7986CB/FFFFFF/png',
    imageHint: 'group chat'
  },
  {
    id: 2,
    name: 'Dr. Yaw Mensah',
    lastMessage: 'I have received your email. I will look at it shortly.',
    timestamp: '9:32 AM',
    avatar: 'https://placehold.co/100x100/673AB7/FFFFFF/png',
    imageHint: 'profile picture'
  },
  {
    id: 3,
    name: 'Final Year Project Team',
    lastMessage: 'Let\'s meet at the library at 2 PM to finalize the report.',
    timestamp: 'Yesterday',
    avatar: 'https://placehold.co/100x100/EDE7F6/311B92/png',
    imageHint: 'group chat'
  },
  {
    id: 4,
    name: 'Admin Office',
    lastMessage: 'Your registration for the next semester is confirmed.',
    timestamp: 'Friday',
    avatar: 'https://placehold.co/100x100/C5CAE9/3F51B5/png',
    imageHint: 'office building'
  },
    {
    id: 5,
    name: 'Dr. Adwoa Ansa',
    lastMessage: 'Please see the attached file for the lecture notes.',
    timestamp: 'Thursday',
    avatar: 'https://placehold.co/100x100/9FA8DA/FFFFFF/png',
    imageHint: 'profile picture'
  },
];


export default function ExplorePage() {
  return (
    <div className="flex flex-col h-full">
        <div className="flex-grow overflow-y-auto">
            <div className="divide-y divide-border">
                {chats.map((chat, index) => (
                    <div key={chat.id} className="flex items-center p-3 hover:bg-muted/50 cursor-pointer transition-colors">
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
            </div>
        </div>
    </div>
  );
}
