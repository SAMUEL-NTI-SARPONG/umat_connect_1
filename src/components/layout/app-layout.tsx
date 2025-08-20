
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
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { Search } from 'lucide-react';
import SignUpPage from '@/app/signup/page';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const pathname = usePathname();

  // If user is not logged in, show login or signup pages
  if (!user) {
    if (pathname === '/signup') {
      return <SignUpPage />;
    }
    return <LoginPage />;
  }
  
  // If user is logged in but tries to access login/signup, redirect to home
  if (pathname === '/login' || pathname === '/signup') {
    // This part is tricky without a real router redirect.
    // For now, we render the main layout which will show the home page.
    // In a real app, a `redirect('/')` would be used.
    return <></>; 
  }

  return (
    <div className="relative mx-auto flex min-h-svh w-full flex-col">
      <SidebarProvider>
        <AppHeader />
        
        <div className="flex flex-1">
          <Sidebar variant="sidebar" collapsible="icon">
            <AppSidebar />
          </Sidebar>
          <SidebarInset className="flex flex-col flex-1">
            <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
               {children}
            </main>
          </SidebarInset>
        </div>
        <BottomNavbar />
      </SidebarProvider>
    </div>
  );
}
