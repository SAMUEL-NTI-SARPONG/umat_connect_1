
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import { useUser, type TimetableEntry } from '@/app/providers/user-provider';
import AppHeader from '@/components/layout/app-header';
import BottomNavbar from '@/components/layout/bottom-navbar';
import LoginPage from '@/app/login/page';
import React, { useState, useEffect, useMemo } from 'react';
import FreeRoomsSidebar from '../timetable/free-rooms-sidebar';
import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const pathname = usePathname();

  const showRightSidebar = user?.role === 'student' && pathname === '/timetable';
  
  if (!user) {
    return <LoginPage />;
  }
  
  return (
    <div className="relative mx-auto flex min-h-svh w-full flex-col">
      <SidebarProvider>
        <AppHeader />
        <div className="flex flex-1">
          <Sidebar variant="floating" collapsible="icon">
            <AppSidebar />
          </Sidebar>
          <SidebarInset className="flex flex-col flex-1">
            <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
               {children}
            </main>
          </SidebarInset>
           {showRightSidebar && (
             <Sidebar side="right" variant="floating" collapsible="offcanvas" className="hidden md:block">
                <FreeRoomsSidebar />
             </Sidebar>
           )}
        </div>
        <BottomNavbar />
      </SidebarProvider>
    </div>
  );
}
