
'use client';

import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Calendar, Home, User, LogOut, MessageSquare, Bell, Compass, BookOpen, School, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/app/providers/user-provider';
import { ProfileAvatar } from '../ui/profile-avatar';
import { Badge } from '../ui/badge';
import { useMemo } from 'react';
import { Button } from '../ui/button';

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, notifications } = useUser();

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return notifications.filter(n => n.recipientId === user.id && !n.isRead).length;
  }, [notifications, user]);

  if (!user) {
    return null;
  }
  
  const timetableLabel = user.role === 'administrator' ? 'Manage Timetable' : 'Timetable';

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center gap-2 p-4 text-center group-data-[collapsible=icon]:hidden">
        <Link href="/profile">
          <ProfileAvatar
              src={user.profileImage}
              fallback={user.name.charAt(0).toUpperCase()}
              alt="Current user's profile picture"
              className="w-16 h-16 text-2xl"
              imageHint="profile picture"
            />
        </Link>
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm capitalize text-sidebar-foreground/80">
            {user.role}
          </p>
        </div>
      </div>
      <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />
      <SidebarContent className="flex-1">
        <SidebarMenu className="hidden md:flex">
          <SidebarMenuItem>
            <Link href="/" passHref>
              <SidebarMenuButton tooltip="Home" isActive={pathname === '/'}>
                <Home />
                <span>Home</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/timetable" passHref>
              <SidebarMenuButton
                tooltip={timetableLabel}
                isActive={pathname.startsWith('/timetable') && !pathname.includes('free-rooms')}
              >
                <Calendar />
                <span>{timetableLabel}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          {user.role === 'student' && (
            <SidebarMenuItem>
              <Link href="/timetable/free-rooms" passHref>
                <SidebarMenuButton
                  tooltip="Free Rooms"
                  isActive={pathname === '/timetable/free-rooms'}
                >
                  <Users />
                  <span>Free Rooms</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
           )}
           {user.role === 'administrator' && (
             <SidebarMenuItem>
              <Link href="/departments" passHref>
                <SidebarMenuButton
                  tooltip="Departments"
                  isActive={pathname.startsWith('/departments')}
                >
                  <School />
                  <span>Departments</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
           )}
          <SidebarMenuItem>
            <Link href="/notifications" passHref>
              <SidebarMenuButton
                tooltip="Notifications"
                isActive={pathname === '/notifications'}
              >
                <Bell />
                <span>Notifications</span>
                 {unreadCount > 0 && (
                    <Badge className="absolute top-1 right-1 h-5 w-5 p-0 flex items-center justify-center">{unreadCount}</Badge>
                )}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/profile" passHref>
              <SidebarMenuButton
                tooltip="Profile"
                isActive={pathname === '/profile'}
              >
                <User />
                <span>Profile</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
         <div className='md:hidden p-4 text-center text-muted-foreground'>
            <p>Main navigation is in the bottom bar.</p>
        </div>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Logout"
                onClick={logout}
              >
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </div>
  );
}
