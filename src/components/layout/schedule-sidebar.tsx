
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser } from '@/app/providers/user-provider';
import { useMemo } from 'react';
import { BookUser } from 'lucide-react';

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
  const { user, masterSchedule } = useUser();

  const todaysSchedule = useMemo(() => {
    if (!masterSchedule || !user) return [];

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    if (user.role === 'student') {
        return masterSchedule.filter(entry =>
            entry.day === today &&
            entry.level === user.level &&
            entry.departments.includes(user.department)
        );
    }
    
    if (user.role === 'lecturer') {
        const currentLecturerNameParts = user.name.toLowerCase().split(' ');
        return masterSchedule.filter(entry => 
            entry.day === today &&
            currentLecturerNameParts.some(part => entry.lecturer.toLowerCase().includes(part))
        );
    }

    return []; // No schedule view for admin on this sidebar
  }, [masterSchedule, user]);

  const hasSchedule = todaysSchedule.length > 0;

  if (!user || user.role === 'administrator') return null;

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
