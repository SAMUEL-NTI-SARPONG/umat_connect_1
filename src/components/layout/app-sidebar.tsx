import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Home, Calendar, Search, User } from 'lucide-react';
import Link from 'next/link';

export default function AppSidebar() {
  // In a real app, you'd get the current path from useRouter
  const pathname = '/'; 

  return (
    <SidebarContent>
      <SidebarMenu>
        <SidebarMenuItem>
          <Link href="/" passHref>
            <SidebarMenuButton
              tooltip="Home"
              isActive={pathname === '/'}
            >
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
  );
}
