
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Calendar, User, PanelLeft, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useUser } from '@/app/providers/user-provider';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/timetable', icon: Calendar, label: 'Timetable' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNavbar() {
  const pathname = usePathname();
  const { logout } = useUser();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-20">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.label}>
              <div
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-md',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
        <div
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-md text-muted-foreground'
          )}
          onClick={logout}
        >
          <LogOut className="h-6 w-6" />
          <span className="text-xs font-medium">Logout</span>
        </div>
        <SidebarTrigger>
           <div
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-md text-muted-foreground'
                )}
              >
                <PanelLeft className="h-6 w-6" />
                <span className="text-xs font-medium">More</span>
              </div>
        </SidebarTrigger>
      </div>
    </div>
  );
}
