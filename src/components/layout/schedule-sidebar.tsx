
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser } from '@/app/providers/user-provider';
import { timetable } from '@/lib/data';

function ScheduleItem({
  title,
  time,
  status,
}: {
  title: string;
  time: string;
  status: 'confirmed' | 'canceled' | 'undecided';
}) {
  const statusClasses = {
    confirmed: 'border-l-green-500',
    canceled: 'border-l-red-500',
    undecided: 'border-l-yellow-500',
  };

  return (
    <div className={cn('mb-3 pl-3 border-l-4', statusClasses[status])}>
       <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
    </div>
  );
}

export default function ScheduleSidebar() {
  const { user } = useUser();

  if (!user) return null;

  const scheduleData = timetable[user.role] || [];
  const hasSchedule = scheduleData.length > 0;

  return (
    <div className="hidden md:flex flex-col h-full">
      <SidebarHeader>
        <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
      </SidebarHeader>
      <SidebarContent className="p-4 space-y-4">
        {hasSchedule ? (
          scheduleData.map((event, index) => (
            <ScheduleItem
              key={index}
              title={event.course.split(':')[0]} // Show only course code for brevity
              time={event.time.replace(/ AM| PM/g, '')} // Make time more compact
              status={event.status as 'confirmed' | 'canceled' | 'undecided'}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No schedule for today.</p>
          </div>
        )}
      </SidebarContent>
    </div>
  );
}
