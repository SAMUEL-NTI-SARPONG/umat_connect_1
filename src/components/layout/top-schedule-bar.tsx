
'use client';

import { useUser } from '@/app/providers/user-provider';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

function ScheduleItem({
  course,
  time,
  location,
  status,
}: {
  course: string;
  time: string;
  location: string;
  status: 'confirmed' | 'canceled' | 'undecided';
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
  const { user } = useUser();

  if (!user || user.role !== 'student') {
    return null;
  }

  return (
    <div className="md:hidden sticky top-[56px] z-10 p-2 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <ScheduleItem
          course="COEN 457"
          time="10-12"
          location="C15"
          status="confirmed"
        />
        <ScheduleItem
          course="MATH 251"
          time="1-3"
          location="Audi A"
          status="undecided"
        />
        <ScheduleItem
          course="PHYS 164"
          time="3-5"
          location="Lab 3B"
          status="canceled"
        />
        <ScheduleItem
          course="ELEN 342"
          time="5-7"
          location="Lab 1A"
          status="confirmed"
        />
      </div>
    </div>
  );
}
