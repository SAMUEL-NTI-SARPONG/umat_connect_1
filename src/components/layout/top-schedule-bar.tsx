
'use client';

import { useUser, type EventStatus } from '@/app/providers/user-provider';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { useMemo } from 'react';

function ScheduleItem({
  course,
  time,
  location,
  status,
}: {
  course: string;
  time: string;
  location: string;
  status: EventStatus;
}) {
  const statusConfig = {
    confirmed: {
      color: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    canceled: {
      color: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
      icon: <XCircle className="h-4 w-4" />,
    },
    undecided: {
      color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
      icon: <AlertCircle className="h-4 w-4" />,
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="flex-shrink-0 flex items-center gap-2 p-2 rounded-lg bg-card border">
      <div className={cn('p-1.5 rounded-full', currentStatus.color)}>
        {currentStatus.icon}
      </div>
      <div>
        <p className="font-semibold text-xs leading-tight">{course}</p>
        <p className="text-xs text-muted-foreground leading-tight">
          {time} - {location}
        </p>
      </div>
    </div>
  );
}

export default function TopScheduleBar() {
  const { user, masterSchedule, staffSchedules } = useUser();

  const studentSchedule = useMemo(() => {
    const combinedSchedule = [...(masterSchedule || []), ...staffSchedules];
    if (!combinedSchedule || !user || user.role !== 'student') return [];

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const userDepartments = Array.isArray(user.department) ? user.department : [user.department];

    return combinedSchedule.filter(entry =>
        entry.level === user.level &&
        entry.day === today &&
        entry.departments.some(dep => userDepartments.includes(dep))
      );
  }, [masterSchedule, staffSchedules, user]);

  if (!user || user.role !== 'student' || studentSchedule.length === 0) {
    return null;
  }

  return (
    <div className="md:hidden sticky top-[56px] z-10 p-2 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {studentSchedule.map(event => (
           <ScheduleItem
            key={event.id}
            course={event.courseCode}
            time={event.time}
            location={event.room}
            status={event.status}
          />
        ))}
      </div>
    </div>
  );
}
