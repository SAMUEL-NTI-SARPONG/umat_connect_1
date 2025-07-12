import type { Metadata } from 'next';
import './globals.css';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import { UserProvider } from './providers/user-provider';
import ScheduleSidebar from '@/components/layout/schedule-sidebar';
import AppHeader from '@/components/layout/app-header';
import BottomNavbar from '@/components/layout/bottom-navbar';

export const metadata: Metadata = {
  title: 'UMaT Connect',
  description: 'A communication platform for UMaT.',
};

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
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <UserProvider>
          <SidebarProvider>
            <div className="relative mx-auto max-w-7xl">
              <div className="flex">
                <Sidebar variant="floating" collapsible="icon">
                  <AppSidebar />
                </Sidebar>
                <SidebarInset className="flex-1 flex flex-col">
                  <AppHeader />
                  <main className="flex-1 overflow-y-auto px-4 md:px-6 pb-20 md:pb-0">
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
        </UserProvider>
      </body>
    </html>
  );
}
