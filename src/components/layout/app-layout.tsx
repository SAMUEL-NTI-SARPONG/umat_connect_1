
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
import TopScheduleBar from '@/components/layout/top-schedule-bar';
import LoginPage from '@/app/login/page';
import React from 'react';

export default function AppLayout({ children, studentSchedule }: { children: React.ReactNode, studentSchedule: TimetableEntry[] }) {
  const { user } = useUser();
  
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
            <TopScheduleBar studentSchedule={studentSchedule} />
            <main className="flex-1 px-4 pb-20 pt-2 md:px-6 md:pb-0 md:pt-0">
               {children}
            </main>
          </SidebarInset>
        </div>
        <BottomNavbar />
      </SidebarProvider>
    </div>
  );
}
