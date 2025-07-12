
'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';

const pageTitles: { [key: string]: string } = {
  '/': 'Home Feed',
  '/timetable': 'Timetable',
  '/profile': 'My Profile',
};

export default function AppHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'UMaT Connect';

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 p-4 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex-1">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>
      <SidebarTrigger side="right" className="md:hidden" />
    </header>
  );
}
