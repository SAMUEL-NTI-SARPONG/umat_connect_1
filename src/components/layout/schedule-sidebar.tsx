
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser } from '@/app/providers/user-provider';
import { useMemo } from 'react';
import { BookUser } from 'lucide-react';
import AdminStats from './admin-stats';

function ScheduleItem({
  title,
  time,
  location,
  lecturer,
  status,
}: {
  title: string;
  time: string;
  location: string;
  lecturer: string;
  status: 'confirmed' | 'canceled' | 'undecided';
}) {
  const statusClasses = {
    confirmed: 'border-l-green-500',
    canceled: 'border-l-red-500',
    undecided: 'border-l-yellow-500',
  };

  return (
    <div className={cn('mb-3 pl-3 border-l-4 space-y-1', statusClasses[status])}>
       <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{time} - {location}</p>
        <div className="flex items-center gap-2">
            <BookUser className="w-3 h-3 text-muted-foreground"/>
            <p className="text-xs text-muted-foreground">{lecturer}</p>
        </div>
    </div>
  );
}

export default function ScheduleSidebar() {
  const { user, masterSchedule, staffSchedules, rejectedEntries } = useUser();

  const todaysSchedule = useMemo(() => {
    if (!user) return [];
    
    const combinedSchedule = [...(masterSchedule || []), ...staffSchedules];
    if (combinedSchedule.length === 0) return [];

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];

    if (user.role === 'student') {
        const userDepartments = Array.isArray(user.department) ? user.department : [user.department];
        return combinedSchedule.filter(entry =>
            entry.day === today &&
            entry.level === user.level &&
            entry.departments.some(dep => userDepartments.includes(dep))
        );
    }
    
    if (user.role === 'staff') {
        const userRejectedIds = rejectedEntries[user.id] || [];
        const currentStaffNameParts = user.name.toLowerCase().split(' ');
        
        return combinedSchedule.filter(entry => {
            const isRejected = masterSchedule?.some(ms => ms.id === entry.id) && userRejectedIds.includes(entry.id);
            
            return !isRejected &&
                   entry.day === today &&
                   currentStaffNameParts.some(part => entry.lecturer.toLowerCase().includes(part));
        });
    }

    return []; // No personal schedule for admin
  }, [masterSchedule, staffSchedules, user, rejectedEntries]);

  const hasSchedule = todaysSchedule.length > 0;

  if (!user) return null;

  if (user.role === 'administrator') {
    return <AdminStats />;
  }

  return (
    <div className="hidden md:flex flex-col h-full">
      <SidebarHeader>
        <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
      </SidebarHeader>
      <SidebarContent className="p-4 space-y-4">
        {hasSchedule ? (
          todaysSchedule.map((event) => (
            <ScheduleItem
              key={event.id}
              title={event.courseCode}
              time={event.time.replace(/ AM| PM/g, '')} // Make time more compact
              location={event.room}
              lecturer={event.lecturer}
              status={event.status}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <p>No classes scheduled for today.</p>
          </div>
        )}
      </SidebarContent>
    </div>
  );
}
