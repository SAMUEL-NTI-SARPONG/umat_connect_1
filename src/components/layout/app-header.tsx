
'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { GraduationCap, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/app/providers/user-provider';
import CreatePost from '../home/create-post';
import { Button } from '../ui/button';

const pageTitles: { [key: string]: string } = {
  '/': 'Home Feed',
  '/timetable': 'Timetable',
  '/notifications': 'Notifications',
  '/profile': 'My Profile',
};

export default function AppHeader() {
  const pathname = usePathname();
  const { user } = useUser();

  const getTitle = () => {
    if (pathname === '/timetable' && user?.role === 'administrator') {
      return 'Manage Timetable';
    }
    return pageTitles[pathname] || 'UMaT Connect';
  };

  const title = getTitle();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 p-4 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 flex-1">
        <SidebarTrigger side="left" className="md:hidden" />
        <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h2 className="text-lg font-semibold hidden sm:block">UMaT Connect</h2>
        </Link>
      </div>

      <div className="flex-1 text-center flex items-center justify-center gap-2">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>

      <div className="flex-1 flex justify-end">
        <SidebarTrigger side="right" className="md:hidden" />
      </div>
    </header>
  );
}
