
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, masterSchedule, staffSchedules, isClassTimetableDistributed } = useUser();
  const [studentSchedule, setStudentSchedule] = useState<TimetableEntry[]>([]);

  const combinedSchedule = useMemo(() => {
    if (!isClassTimetableDistributed) return [];
    return [...(masterSchedule || []), ...staffSchedules];
  }, [masterSchedule, staffSchedules, isClassTimetableDistributed]);
  
  useEffect(() => {
    if (user?.role === 'student') {
       const filtered = combinedSchedule.filter(entry =>
        entry.level === user.level &&
        user.department &&
        (entry.departments || []).includes(user.department)
      );
      setStudentSchedule(filtered);
    } else {
      setStudentSchedule([]);
    }
  }, [user, combinedSchedule]);
  
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
               {React.cloneElement(children as React.ReactElement, { studentSchedule })}
            </main>
          </SidebarInset>
        </div>
        <BottomNavbar />
      </SidebarProvider>
    </div>
  );
}
