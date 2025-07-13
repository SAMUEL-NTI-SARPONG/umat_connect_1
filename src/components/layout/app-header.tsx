
'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/app/providers/user-provider';

const pageTitles: { [key: string]: string } = {
  '/': 'Home Feed',
  '/timetable': 'Timetable',
  '/profile': 'My Profile',
  '/explore': 'Explore',
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
        <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h2 className="text-lg font-semibold hidden sm:block">UMaT Connect</h2>
        </Link>
      </div>

      <div className="flex-1 text-center">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>

      <div className="flex-1 flex justify-end">
        <SidebarTrigger side="right" className="md:hidden" />
      </div>
    </header>
  );
}
