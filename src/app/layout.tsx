
'use client';

import './globals.css';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import { UserProvider, useUser } from './providers/user-provider';
import ScheduleSidebar from '@/components/layout/schedule-sidebar';
import AppHeader from '@/components/layout/app-header';
import BottomNavbar from '@/components/layout/bottom-navbar';
import TopScheduleBar from '@/components/layout/top-schedule-bar';
import { ThemeProvider } from './providers/theme-provider';
import LoginPage from './login/page';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <SidebarProvider>
      <div className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col">
        <AppHeader />
        <div className="flex flex-1">
          <Sidebar variant="floating" collapsible="icon">
            <AppSidebar />
          </Sidebar>
          <SidebarInset className="flex flex-1 flex-col">
            <TopScheduleBar />
            <main className="flex-1 overflow-y-auto px-4 pb-20 pt-2 md:px-6 md:pb-0 md:pt-0">
              {children}
            </main>
          </SidebarInset>
          <Sidebar side="right" variant="floating" collapsible="icon">
            <ScheduleSidebar />
          </Sidebar>
        </div>
        <BottomNavbar />
      </div>
    </SidebarProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <title>UMaT Connect</title>
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <AppLayout>{children}</AppLayout>
          </UserProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
