'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser } from '@/app/providers/user-provider';

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
    confirmed: 'border-l-4 border-green-500',
    canceled: 'border-l-4 border-red-500',
    undecided: 'border-l-4 border-yellow-500',
  };

  return (
    <Card className={cn('mb-2', statusClasses[status])}>
      <CardContent className="p-3">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{time}</p>
      </CardContent>
    </Card>
  );
}

export default function ScheduleSidebar() {
  const { role } = useUser();

  if (role !== 'student') {
    return (
      <div className="flex flex-col h-full">
        <SidebarHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </SidebarHeader>
        <SidebarContent className="p-4">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Only students have a schedule.</p>
          </div>
        </SidebarContent>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader>
        <CardTitle>Today's Schedule</CardTitle>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <ScheduleItem
          title="COEN 457: Software Engineering"
          time="10:00 - 12:00"
          status="confirmed"
        />
        <ScheduleItem
          title="MATH 251: Calculus II"
          time="13:00 - 15:00"
          status="undecided"
        />
        <ScheduleItem
          title="PHYS 164: Electromagnetism"
          time="15:00 - 17:00"
          status="canceled"
        />
      </SidebarContent>
    </div>
  );
}
