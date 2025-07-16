
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import { useUser } from '@/app/providers/user-provider';
import ScheduleSidebar from '@/components/layout/schedule-sidebar';
import AppHeader from '@/components/layout/app-header';
import BottomNavbar from '@/components/layout/bottom-navbar';
import TopScheduleBar from '@/components/layout/top-schedule-bar';
import LoginPage from '@/app/login/page';
import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const pathname = usePathname();

  if (!user) {
    return <LoginPage />;
  }
  
  const isSmsPage = pathname === '/sms';

  return (
    <SidebarProvider>
       <div className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col">
        <AppHeader />
        <div className="flex flex-1">
          <Sidebar variant="floating" collapsible="icon">
            <AppSidebar />
          </Sidebar>
          <SidebarInset className={`flex flex-col ${isSmsPage ? 'p-0' : ''}`}>
             {!isSmsPage && <TopScheduleBar />}
            <main className={`flex-1 ${isSmsPage ? '' : 'px-4 pb-20 pt-2 md:px-6 md:pb-0 md:pt-0'}`}>
              {children}
            </main>
          </SidebarInset>
          {!isSmsPage && (
            <Sidebar side="right" variant="floating" collapsible="icon">
                <ScheduleSidebar />
            </Sidebar>
          )}
        </div>
        <BottomNavbar />
      </div>
    </SidebarProvider>
  );
}
