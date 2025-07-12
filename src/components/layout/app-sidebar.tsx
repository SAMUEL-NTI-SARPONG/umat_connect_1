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
import { Calendar, Home, Search, User } from 'lucide-react';
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

export default function AppSidebar() {
  const pathname = usePathname();
  const { role, setRole } = useUser();

  return (
    <>
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
            <Link href="/explore" passHref>
              <SidebarMenuButton
                tooltip="Explore"
                isActive={pathname === '/explore'}
              >
                <Search />
                <span>Explore</span>
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
          <Select value={role} onValueChange={(value) => setRole(value as any)}>
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
