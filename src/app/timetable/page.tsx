
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Upload, Check, Ban, Trash2, FilePenLine } from 'lucide-react';
import { useUser } from '../providers/user-provider';
import { timetable } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type EventStatus = 'confirmed' | 'canceled' | 'undecided';

function EventCard({
  course,
  time,
  location,
  status,
  isLecturerView,
  onStatusChange,
}: {
  course: string;
  time: string;
  location: string;
  status: EventStatus;
  isLecturerView: boolean;
  onStatusChange: (newStatus: EventStatus) => void;
}) {
  const statusConfig = {
    confirmed: {
      color: 'border-l-green-500',
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      text: 'Confirmed'
    },
    canceled: {
      color: 'border-l-red-500',
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      text: 'Canceled'
    },
    undecided: {
      color: 'border-l-yellow-500',
      icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      text: 'Undecided'
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <Card className={cn('mb-4 border-l-4 rounded-xl shadow-sm', currentStatus.color)}>
      <CardHeader>
        <CardTitle className="font-semibold">{course}</CardTitle>
        <CardDescription>{time} - {location}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {currentStatus.icon}
          <p className="font-semibold capitalize">{currentStatus.text}</p>
        </div>
        {isLecturerView && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onStatusChange('confirmed')} disabled={status === 'confirmed'}>
              <Check className="h-4 w-4 mr-1" /> Confirm
            </Button>
            <Button size="sm" variant="outline" onClick={() => onStatusChange('canceled')} disabled={status === 'canceled'}>
              <Ban className="h-4 w-4 mr-1" /> Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StudentTimetableView() {
  const studentSchedule = timetable.student;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Today's Schedule</h2>
      {studentSchedule.map((event, index) => (
        <EventCard
          key={index}
          course={event.course}
          time={event.time}
          location={event.location}
          status={event.status as EventStatus}
          isLecturerView={false}
          onStatusChange={() => {}}
        />
      ))}
    </div>
  );
}

function LecturerTimetableView() {
  const [schedule, setSchedule] = React.useState(timetable.lecturer);

  const handleStatusChange = (index: number, newStatus: EventStatus) => {
    const updatedSchedule = [...schedule];
    updatedSchedule[index].status = newStatus;
    setSchedule(updatedSchedule);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Your Teaching Schedule</h2>
      {schedule.map((event, index) => (
        <EventCard
          key={index}
          course={event.course}
          time={event.time}
          location={event.location}
          status={event.status as EventStatus}
          isLecturerView={true}
          onStatusChange={(newStatus) => handleStatusChange(index, newStatus)}
        />
      ))}
    </div>
  );
}

function AdminTimetableView() {
  return (
     <div className="space-y-6">
      <TooltipProvider>
        <div className="flex gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Upload New</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload New</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <FilePenLine className="h-4 w-4" />
                  <span className="sr-only">Edit Current</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Current</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}

export default function TimetablePage() {
  const { role } = useUser();

  const renderContent = () => {
    switch (role) {
      case 'student':
        return <StudentTimetableView />;
      case 'lecturer':
        return <LecturerTimetableView />;
      case 'administrator':
        return <AdminTimetableView />;
      default:
        return <p>Select a role to see the timetable.</p>;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {renderContent()}
    </div>
  );
}
