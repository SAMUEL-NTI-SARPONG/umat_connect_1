
'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Upload, Check, Ban, FilePenLine, Trash2, Loader2 } from 'lucide-react';
import { useUser } from '../providers/user-provider';
import { timetable } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { handleFileUpload } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type EventStatus = 'confirmed' | 'canceled' | 'undecided';

interface TimetableEntry {
  day: string;
  time: string;
  room: string;
  departments: string[];
  level: number;
  courseCode: string;
  lecturer: string;
}

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
  location:string;
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
  const [parsedData, setParsedData] = useState<TimetableEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setParsedData(null);

    try {
      const data = await handleFileUpload(file);
      if (data.length === 0) {
        setError("The uploaded file could not be parsed or contains no valid schedule data. Please check the file format.");
      } else {
        setParsedData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during file parsing.");
    } finally {
      setIsLoading(false);
      // Reset file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const groupedByDay = useMemo(() => {
    if (!parsedData) return {};
    return parsedData.reduce((acc, entry) => {
      const day = entry.day;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(entry);
      return acc;
    }, {} as Record<string, TimetableEntry[]>);
  }, [parsedData]);

  const days = Object.keys(groupedByDay);

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        className="hidden"
        accept=".xlsx, .xls"
      />
      <TooltipProvider>
        <div className="flex gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleUploadClick} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="sr-only">Upload New</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload New Timetable</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" disabled>
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
              <Button variant="destructive" size="icon" disabled>
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

      {error && (
         <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Parsed Timetable Preview</CardTitle>
            <CardDescription>
              Review the parsed schedule below before saving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={days[0]} className="w-full">
              <TabsList>
                {days.map(day => (
                  <TabsTrigger key={day} value={day}>{day}</TabsTrigger>
                ))}
              </TabsList>
              {days.map(day => (
                <TabsContent key={day} value={day}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Lecturer</TableHead>
                          <TableHead>Departments</TableHead>
                          <TableHead>Level</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedByDay[day].map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell>{entry.time}</TableCell>
                            <TableCell>{entry.room}</TableCell>
                            <TableCell>{entry.courseCode}</TableCell>
                            <TableCell>{entry.lecturer}</TableCell>
                            <TableCell>{entry.departments.join(', ')}</TableCell>
                            <TableCell>{entry.level}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {renderContent()}
    </div>
  );
}
