
'use client';

import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { GraduationCap, Calendar, Home, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUser } from '@/app/providers/user-provider';
import { ProfileAvatar } from '../ui/profile-avatar';

export default function AppSidebar() {
  const pathname = usePathname();
  const { role, setRole, name, profileImage } = useUser();

  const userDetails = {
    student: { roleText: 'Student' },
    lecturer: { roleText: 'Lecturer' },
    administrator: { roleText: 'Administrator' },
  };

  const currentUser = userDetails[role];

  return (
    <>
      <div className="flex flex-col items-center gap-4 p-4 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-foreground" />
          <h2 className="text-lg font-semibold">UMaT Connect</h2>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 p-4 text-center group-data-[collapsible=icon]:hidden">
         <ProfileAvatar
            src={profileImage}
            fallback={name.charAt(0).toUpperCase()}
            alt="Current user's profile picture"
            className="w-16 h-16 text-2xl"
            imageHint="profile picture"
          />
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm capitalize text-sidebar-foreground/80">
            {currentUser.roleText}
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
                tooltip="Timetable"
                isActive={pathname === '/timetable'}
              >
                <Calendar />
                <span>Timetable</span>
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
           <SidebarMenuItem>
             <Link href="/" passHref>
              <SidebarMenuButton
                tooltip="Logout"
              >
                <LogOut />
                <span>Logout</span>
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
        <SidebarGroup>
          <SidebarGroupLabel>Switch Role</SidebarGroupLabel>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="lecturer">Lecturer</SelectItem>
              <SelectItem value="administrator">Administrator</SelectItem>
            </SelectContent>
          </Select>
        </SidebarGroup>
      </SidebarFooter>
    </>
  );
}
