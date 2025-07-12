
'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';

const pageTitles: { [key: string]: string } = {
  '/': 'Home',
  '/timetable': 'Timetable',
  '/explore': 'Explore',
  '/profile': 'Profile',
};

export default function AppHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'UMaT Connect';

  return (
    <header className="flex items-center gap-2 p-4 border-b">
      <SidebarTrigger className="md:hidden" />
      <h1 className="text-2xl font-bold text-primary">{title}</h1>
    </header>
  );
}
