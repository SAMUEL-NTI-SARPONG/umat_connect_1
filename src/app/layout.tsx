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
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <UserProvider>
          <SidebarProvider>
            <div className="flex">
              <Sidebar variant="floating" collapsible="icon">
                <AppSidebar />
              </Sidebar>
              <SidebarInset className="flex-1">
                <div className="p-4 flex items-center gap-2">
                  <SidebarTrigger className="md:hidden" />
                  <h1 className="text-2xl font-bold text-primary">
                    UMaT Connect
                  </h1>
                </div>
                {children}
              </SidebarInset>
              <Sidebar
                side="right"
                variant="floating"
                collapsible="icon"
                className="w-80"
              >
                <ScheduleSidebar />
              </Sidebar>
            </div>
          </SidebarProvider>
        </UserProvider>
      </body>
    </html>
  );
}
