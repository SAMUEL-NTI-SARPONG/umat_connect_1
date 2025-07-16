
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
import { Calendar, Home, User, LogOut, Compass, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/app/providers/user-provider';
import { ProfileAvatar } from '../ui/profile-avatar';

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useUser();

  if (!user) {
    return null;
  }
  
  const timetableLabel = user.role === 'administrator' ? 'Manage Timetable' : 'Timetable';

  return (
    <>
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
      <SidebarContent>
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
                isActive={pathname === '/timetable'}
              >
                <Calendar />
                <span>{timetableLabel}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
           <SidebarMenuItem>
                <Link href="/sms" passHref>
                    <SidebarMenuButton
                        tooltip="SMS Service"
                        isActive={pathname === '/sms'}
                    >
                        <MessageSquare />
                        <span>SMS Service</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
           {user.role === 'lecturer' && (
            <SidebarMenuItem>
              <Link href="/explore" passHref>
                <SidebarMenuButton
                  tooltip="Explore"
                  isActive={pathname === '/explore'}
                >
                  <Compass />
                  <span>Explore</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
           )}
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
    </>
  );
}
