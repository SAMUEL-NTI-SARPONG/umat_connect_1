
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
import { GraduationCap, Calendar, Home, User } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AppSidebar() {
  const pathname = usePathname();
  const { role, setRole } = useUser();

  const userDetails = {
    student: { name: 'Student User', avatar: 'S' },
    lecturer: { name: 'Lecturer User', avatar: 'L' },
    administrator: { name: 'Admin User', avatar: 'A' },
  };

  const currentUser = userDetails[role];

  return (
    <>
      <div className="flex flex-col items-center gap-4 p-4 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-primary" />
          <h2 className="text-xl font-bold">UMaT Connect</h2>
        </div>
      </div>
      <SidebarSeparator />
      <div className="flex flex-col items-center gap-2 p-4 text-center group-data-[collapsible=icon]:hidden">
        <Avatar className="w-16 h-16">
          <AvatarImage
            src="https://placehold.co/64x64.png"
            data-ai-hint="profile picture"
          />
          <AvatarFallback>{currentUser.avatar}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{currentUser.name}</p>
          <p className="text-sm capitalize text-sidebar-foreground/80">
            {role}
          </p>
        </div>
      </div>
      <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />
      <SidebarContent>
        <SidebarMenu>
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
        </SidebarMenu>
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
