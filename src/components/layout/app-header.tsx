
'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { GraduationCap, PlusCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/app/providers/user-provider';
import CreatePost from '../home/create-post';
import { Button } from '../ui/button';
import FreeRoomsDialog from '../timetable/free-rooms-dialog';

const pageTitles: { [key: string]: string } = {
  '/': 'Home Feed',
  '/timetable': 'Timetable Management',
  '/notifications': 'Notifications',
  '/profile': 'My Profile',
  '/departments': 'Departments & Faculties',
};

export default function AppHeader() {
  const pathname = usePathname();
  const { user } = useUser();

  const getTitle = () => {
    if (pathname === '/timetable' && user?.role === 'student') {
      return 'Class Timetable';
    }
     if (pathname === '/timetable' && user?.role === 'staff') {
      return 'My Timetable';
    }
    return pageTitles[pathname] || 'UMaT Connect';
  };

  const title = getTitle();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 p-4 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 flex-1">
        <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h2 className="text-lg font-semibold hidden sm:block">UMaT Connect</h2>
        </Link>
      </div>

      <div className="flex-1 text-center flex items-center justify-center gap-2">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>

      <div className="flex-1 flex justify-end">
        {user?.role === 'student' && (
          <FreeRoomsDialog>
             <Button variant="outline" size="sm">
                <Search className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Find Free Rooms</span>
                <span className="sm:hidden">Free Rooms</span>
              </Button>
          </FreeRoomsDialog>
        )}
      </div>
    </header>
  );
}
