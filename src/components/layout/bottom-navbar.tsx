
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Calendar, User, Compass, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/app/providers/user-provider';
import { useMemo } from 'react';
import { Badge } from '../ui/badge';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/timetable', icon: Calendar, label: 'Timetable' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/notifications', icon: Bell, label: 'Alerts' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNavbar() {
  const pathname = usePathname();
  const { user, notifications } = useUser();

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return notifications.filter(n => n.recipientId === user.id && !n.isRead).length;
  }, [notifications, user]);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-20">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isNotifications = item.label === 'Alerts';
          return (
            <Link href={item.href} key={item.label}>
              <div
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-md w-16 relative',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
                {isNotifications && unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute top-0 right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
