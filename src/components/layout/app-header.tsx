
'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';

const pageTitles: { [key: string]: string } = {
  '/': 'Home Feed',
  '/timetable': 'Timetable',
  '/explore': 'Explore',
  '/profile': 'My Profile',
};

export default function AppHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'UMaT Connect';

  return (
    <header className="flex items-center gap-2 p-4 border-b bg-card">
      <SidebarTrigger className="md:hidden" />
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
    </header>
  );
}
