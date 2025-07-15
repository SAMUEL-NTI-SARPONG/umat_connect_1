
'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Upload, Check, Ban, FilePenLine, Trash2, Loader2, Clock, MapPin, BookUser, Search, FilterX, Edit, Delete, CalendarClock, PlusCircle, Settings, MoreHorizontal, ShieldCheck, EyeOff, SearchIcon, User as UserIcon, Calendar as CalendarIcon } from 'lucide-react';
import { useUser, type TimetableEntry, type EmptySlot, type EventStatus } from '../providers/user-provider';
import { departments as allDepartments } from '@/lib/data';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { handleFileUpload, findEmptyClassrooms } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import LecturerReviewModal from '@/components/timetable/lecturer-review-modal';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

const statusConfig = {
    confirmed: { color: 'bg-green-500', text: 'Confirmed', border: 'border-l-green-500', icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
    canceled: { color: 'bg-red-500', text: 'Canceled', border: 'border-l-red-500', icon: <XCircle className="h-5 w-5 text-red-500" /> },
    undecided: { color: 'bg-yellow-500', text: 'Undecided', border: 'border-l-yellow-500', icon: <AlertCircle className="h-5 w-5 text-yellow-500" /> },
};
  
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function StudentTimetableView({ schedule }: { schedule: TimetableEntry[] }) {
  const { emptySlots } = useUser();
  const [activeDay, setActiveDay] = useState("Monday");
  const [isFreeRoomModalOpen, setIsFreeRoomModalOpen] = useState(false);

  const dailySchedule = useMemo(() => {
    return schedule.reduce((acc, event) => {
      const day = event.day || "Monday"; 
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(event);
      return acc;
    }, {} as Record<string, typeof schedule>);
  }, [schedule]);

  const freeRoomsForDay = useMemo(() => {
    const daySlots = emptySlots.filter(slot => slot.day === activeDay);
    if (daySlots.length === 0) return [];

    const rooms: Record<string, string[]> = daySlots.reduce((acc, slot) => {
      if (!acc[slot.location]) {
        acc[slot.location] = [];
      }
      acc[slot.location].push(slot.time);
      return acc;
    }, {} as Record<string, string[]>);

    const consolidatedRooms: { room: string; freeRanges: string[] }[] = [];

    const timeToMinutes = (timeStr: string) => {
      if (!timeStr) return 0;
      const [time, modifier] = timeStr.split(' ');
      if (!time) return 0;
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + (minutes || 0);
    };

    for (const room in rooms) {
      const slots = (rooms[room] || []).map(time => {
          if (!time || !time.includes(' - ')) return null;
          const [start, end] = time.split(' - ');
          return { start, end };
      }).filter(Boolean) as { start: string; end: string }[];
      
      slots.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
      
      if (!slots || slots.length === 0) continue;
      
      const ranges: string[] = [];
      let currentRangeStart = slots[0].start;
      let currentRangeEnd = slots[0].end;

      for (let i = 1; i < slots.length; i++) {
        if (timeToMinutes(currentRangeEnd) === timeToMinutes(slots[i].start)) {
          currentRangeEnd = slots[i].end;
        } else {
          ranges.push(`${currentRangeStart} - ${currentRangeEnd}`);
          currentRangeStart = slots[i].start;
          currentRangeEnd = slots[i].end;
        }
      }
      ranges.push(`${currentRangeStart} - ${currentRangeEnd}`);
      consolidatedRooms.push({ room, freeRanges: ranges });
    }

    return consolidatedRooms.sort((a, b) => a.room.localeCompare(b.room));
  }, [emptySlots, activeDay]);


  return (
    <Tabs defaultValue={activeDay} onValueChange={setActiveDay} className="w-full">
      <div className="sticky top-[56px] z-10 bg-background/95 backdrop-blur-sm -mx-4 md:-mx-6 px-4 md:px-6 py-2 border-b">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <TabsList className="grid w-full grid-cols-7 h-12 flex-grow">
              {days.map(day => (
                <TabsTrigger key={day} value={day} className="text-xs sm:text-sm">{day.substring(0,3)}</TabsTrigger>
              ))}
            </TabsList>
            <Dialog open={isFreeRoomModalOpen} onOpenChange={setIsFreeRoomModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <SearchIcon className="mr-2 h-4 w-4" />
                        Find Free Rooms
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Free Classrooms for {activeDay}</DialogTitle>
                        <DialogDescription>
                            Here are the classrooms that are available and their free time slots.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] my-4 pr-6">
                        {freeRoomsForDay.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {freeRoomsForDay.map(({ room, freeRanges }) => (
                                    <Card key={room}>
                                        <CardHeader className="p-4">
                                            <CardTitle className="text-base">{room}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <div className="space-y-1">
                                                {freeRanges.map((range, idx) => (
                                                   <Badge key={idx} variant="secondary" className="font-normal text-xs whitespace-nowrap">{range}</Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-12 text-muted-foreground">
                                <p>No free classrooms found for {activeDay}.</p>
                            </div>
                        )}
                    </ScrollArea>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFreeRoomModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>
      <div className="py-6">
        {days.map(day => (
          <TabsContent key={day} value={day}>
            {dailySchedule[day] && dailySchedule[day].length > 0 ? (
                <div className="md:border md:rounded-lg md:overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="hidden md:table-header-group">
                                <TableRow>
                                    <TableHead className="w-[20%]">Time</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead className="w-[20%]">Location</TableHead>
                                    <TableHead className="hidden lg:table-cell w-[25%]">Lecturer</TableHead>
                                    <TableHead className="w-[15%]">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailySchedule[day].map((event, index) => (
                                    <TableRow key={`${event.id}-${index}`} className="block md:table-row -ml-4 -mr-4 md:ml-0 md:mr-0 md:border-b mb-4 md:mb-0">
                                        <TableCell className="block md:hidden p-0 w-full">
                                          <div className="border rounded-lg p-4 space-y-2 m-2">
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full">
                                              <div>
                                                <div className="font-bold text-xs text-muted-foreground flex items-center gap-1.5"><CalendarIcon className="w-3 h-3"/>Time</div>
                                                <div className="font-medium break-words pl-5">{event.time}</div>
                                              </div>
                                              <div>
                                                <div className="font-bold text-xs text-muted-foreground flex items-center gap-1.5"><BookUser className="w-3 h-3"/>Course</div>
                                                <div className="font-medium break-words pl-5">{event.courseCode}</div>
                                              </div>
                                              <div>
                                                <div className="font-bold text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3 h-3"/>Location</div>
                                                <div className="font-medium break-words pl-5">{event.room}</div>
                                              </div>
                                              <div>
                                                <div className="font-bold text-xs text-muted-foreground flex items-center gap-1.5"><AlertCircle className="w-3 h-3"/>Status</div>
                                                 <div className="pl-5">
                                                    <Badge variant="outline" className={cn("capitalize font-normal text-xs", statusConfig[event.status].border, 'border-l-4')}>
                                                        {statusConfig[event.status].text}
                                                    </Badge>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell font-medium">{event.time}</TableCell>
                                        <TableCell className="hidden md:table-cell">{event.courseCode}</TableCell>
                                        <TableCell className="hidden md:table-cell">{event.room}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{event.lecturer}</TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant="outline" className={cn("capitalize font-normal text-xs", statusConfig[event.status].border, 'border-l-4')}>
                                                {statusConfig[event.status].text}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ) : (
                <Card className="flex items-center justify-center p-12 bg-muted/50 border-dashed">
                   <CardContent className="text-center text-muted-foreground">
                       <p className="font-medium">No classes scheduled for {day}.</p>
                       <p className="text-sm">Enjoy your day off!</p>
                   </CardContent>
                </Card>
            )}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

const initialCreateFormState = {
  courseCode: '',
  day: 'Monday',
  level: 100,
  departments: [],
  room: '',
  time: '',
};

function LecturerTimetableView({
  schedule,
  setSchedule,
  masterSchedule,
  emptySlots,
  addLecturerSchedule,
}: {
  schedule: TimetableEntry[];
  setSchedule: (schedule: TimetableEntry[]) => void;
  masterSchedule: TimetableEntry[] | null;
  emptySlots: EmptySlot[];
  addLecturerSchedule: (entry: Omit<TimetableEntry, 'id' | 'status' | 'lecturer'>) => void;
}) {
  const { user, reviewedSchedules, rejectedEntries, rejectScheduleEntry, unrejectScheduleEntry, markScheduleAsReviewed } = useUser();
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [activeDay, setActiveDay] = useState("Monday");
  const [isFreeRoomModalOpen, setIsFreeRoomModalOpen] = useState(false);

  const [editedFormData, setEditedFormData] = useState<TimetableEntry | null>(null);
  const [createFormData, setCreateFormData] = useState<any>(initialCreateFormState);
  
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [createStartTime, setCreateStartTime] = useState('');
  const [createEndTime, setCreateEndTime] = useState('');

  const normalizeCourse = (entry: TimetableEntry): { normalizedId: string; displayCode: string, originalId: number } => {
    const courseCode = entry.courseCode || '';
    const deptParts = (courseCode.match(/[a-zA-Z]+/g) || []).filter(p => !/^[ivxlcdm]+$/i.test(p));
    const numParts = courseCode.match(/\d+/g) || [];
    const numPart = numParts.pop();

    if (deptParts.length > 0 && numPart) {
      const displayCode = `${deptParts.join(' ')} ${numPart}`;
      const normalizedId = `${deptParts.join('')}-${numPart}`;
      return { normalizedId, displayCode, originalId: entry.id };
    }
    
    const fallbackId = courseCode.replace(/\s+/g, '-');
    return { normalizedId: fallbackId, displayCode: courseCode, originalId: entry.id };
  };

  const lecturerCourses = useMemo(() => {
    if (!masterSchedule || !user) return [];
    
    const lecturerNameParts = user.name.toLowerCase().split(' ').filter(p => p.length > 2);
    
    const allEntriesForLecturer = masterSchedule.filter(entry =>
      lecturerNameParts.some(part => entry.lecturer.toLowerCase().includes(part))
    );

    const groupedByNormalizedId = allEntriesForLecturer.reduce((acc, entry) => {
        const { normalizedId, displayCode } = normalizeCourse(entry);
        if (!acc[normalizedId]) {
            acc[normalizedId] = {
                ...entry,
                courseCode: displayCode, 
                originalIds: new Set([entry.id]),
            };
        } else {
            acc[normalizedId].originalIds.add(entry.id);
        }
        return acc;
    }, {} as Record<string, TimetableEntry & { originalIds: Set<number> }>);

    return Object.values(groupedByNormalizedId);
  }, [masterSchedule, user]);

  const allRejectedIds = useMemo(() => {
    if (!user || !rejectedEntries[user.id]) return new Set<number>();
    
    const rejectedCourseGroups = lecturerCourses.filter(course =>
      (rejectedEntries[user.id] || []).includes(course.id)
    );
    
    const rejectedIds = new Set<number>();
    rejectedCourseGroups.forEach(group => {
      group.originalIds.forEach(id => rejectedIds.add(id));
    });
    
    return rejectedIds;
  }, [user, rejectedEntries, lecturerCourses]);

  const freeRoomsForDay = useMemo(() => {
    const daySlots = emptySlots.filter(slot => slot.day === activeDay);
    if (daySlots.length === 0) return [];

    const rooms: Record<string, string[]> = daySlots.reduce((acc, slot) => {
      if (!acc[slot.location]) {
        acc[slot.location] = [];
      }
      acc[slot.location].push(slot.time);
      return acc;
    }, {} as Record<string, string[]>);

    const consolidatedRooms: { room: string; freeRanges: string[] }[] = [];

    const timeToMinutes = (timeStr: string) => {
      if (!timeStr) return 0;
      const [time, modifier] = timeStr.split(' ');
      if (!time) return 0;
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + (minutes || 0);
    };

    for (const room in rooms) {
      const slots = (rooms[room] || []).map(time => {
          if (!time || !time.includes(' - ')) return null;
          const [start, end] = time.split(' - ');
          return { start, end };
      }).filter(Boolean) as { start: string; end: string }[];

      slots.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
      
      if (!slots || slots.length === 0) continue;
      
      const ranges: string[] = [];
      let currentRangeStart = slots[0].start;
      let currentRangeEnd = slots[0].end;

      for (let i = 1; i < slots.length; i++) {
        if (timeToMinutes(currentRangeEnd) === timeToMinutes(slots[i].start)) {
          currentRangeEnd = slots[i].end;
        } else {
          ranges.push(`${currentRangeStart} - ${currentRangeEnd}`);
          currentRangeStart = slots[i].start;
          currentRangeEnd = slots[i].end;
        }
      }
      ranges.push(`${currentRangeStart} - ${currentRangeEnd}`);
      consolidatedRooms.push({ room, freeRanges: ranges });
    }

    return consolidatedRooms.sort((a, b) => a.room.localeCompare(b.room));
  }, [emptySlots, activeDay]);


  const handleReviewToggle = (courseGroupId: number, shouldReject: boolean) => {
      if (!user) return;
      const courseGroup = lecturerCourses.find(c => c.id === courseGroupId);
      if (!courseGroup) return;

      if (shouldReject) {
        rejectScheduleEntry(user.id, courseGroupId);
      } else {
        unrejectScheduleEntry(user.id, courseGroupId);
      }
  };
  
  const hasReviewed = user ? reviewedSchedules.includes(user.id) : false;
  
  useEffect(() => {
    if (user && masterSchedule && masterSchedule.length > 0 && !hasReviewed) {
      if (lecturerCourses.length > 0) {
        setIsReviewModalOpen(true);
      }
    }
  }, [masterSchedule, user, hasReviewed]);
  
  const handleRowClick = (entry: TimetableEntry) => {
    setSelectedEntry(entry);
    setIsActionModalOpen(true);
  };

  const handleStatusChange = (id: number, newStatus: EventStatus) => {
    setSchedule(
      schedule.map((event) => (event.id === id ? { ...event, status: newStatus } : event))
    );
    setIsActionModalOpen(false);
  };

  const handleRescheduleClick = (entry: TimetableEntry) => {
    setSelectedEntry(entry);
    setEditedFormData(entry);
    const [start, end] = entry.time.split(' - ');
    setStartTime(start?.trim() || '');
    setEndTime(end?.trim() || '');
    setIsActionModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editedFormData) return;
    const updatedEntry = { ...editedFormData, time: `${startTime} - ${endTime}` };
    setSchedule(schedule.map((item) => (item.id === updatedEntry.id ? updatedEntry : item)));
    closeAllModals();
  };
  
  const handleSaveCreate = () => {
    const { courseCode, day, level, departments, room } = createFormData;
    if (!courseCode || !day || !level || !departments.length || !room || !createStartTime || !createEndTime) {
      alert("Please fill all fields");
      return;
    }
    addLecturerSchedule({
      courseCode,
      day,
      level,
      departments,
      room,
      time: `${createStartTime} - ${createEndTime}`,
    });
    closeAllModals();
  };

  const handleEditInputChange = (field: keyof TimetableEntry, value: string | number | string[]) => {
    if (!editedFormData) return;
    const updatedData = { ...editedFormData, [field]: value };
    if (field === 'room') {
      setStartTime('');
      setEndTime('');
    }
    setEditedFormData(updatedData);
  };

  const handleCreateInputChange = (field: string, value: any) => {
    setCreateFormData((prev: any) => {
        const newState = { ...prev, [field]: value };
        if (field === 'day' || field === 'room') {
            setCreateStartTime('');
            setCreateEndTime('');
        }
        return newState;
    });
  };

  const handleCourseSelection = (courseCode: string) => {
    const selectedCourse = lecturerCourses.find(c => c.courseCode === courseCode);
    if (selectedCourse) {
      setCreateFormData((prev: any) => ({
        ...prev,
        courseCode: selectedCourse.courseCode,
        level: selectedCourse.level,
        departments: selectedCourse.departments,
      }));
    }
  };

  const closeAllModals = () => {
    setIsEditModalOpen(false);
    setIsCreateModalOpen(false);
    setIsManageModalOpen(false);
    setIsActionModalOpen(false);
    setSelectedEntry(null);
    setEditedFormData(null);
    setCreateFormData(initialCreateFormState);
    setStartTime('');
    setEndTime('');
    setCreateStartTime('');
    setCreateEndTime('');
  };

  const dailySchedule = useMemo(() => {
    const visibleSchedule = schedule.filter(event => !allRejectedIds.has(event.id));
    
    return visibleSchedule.reduce((acc, event) => {
      const day = event.day || "Monday";
      if (!acc[day]) acc[day] = [];
      acc[day].push(event);
      return acc;
    }, {} as Record<string, TimetableEntry[]>);
  }, [schedule, allRejectedIds]);

  const availableSlotsForEdit = useMemo(() => {
    if (!editedFormData) return { rooms: [], times: [], startTimes: [], endTimes: [] };
    const daySlots = emptySlots.filter(slot => slot.day === editedFormData.day);
    const rooms = [...new Set(daySlots.map(slot => slot.location))];
    const roomDaySlots = daySlots.filter(slot => slot.location === editedFormData.room).map(s => s.time).sort((a, b) => parseInt(a.split(':')[0]) - parseInt(b.split(':')[0]));
    const startTimes = [...new Set(roomDaySlots.map(time => time.split(' - ')[0].trim()))];
    
    let endTimes: string[] = [];
    const startIndex = roomDaySlots.findIndex(slot => slot.startsWith(startTime));
    if (startTime && startIndex !== -1) {
      for (let i = startIndex; i < roomDaySlots.length; i++) {
        const currentSlot = roomDaySlots[i];
        const prevSlot = i > startIndex ? roomDaySlots[i - 1] : null;
        if (prevSlot && prevSlot.split(' - ')[1].trim() !== currentSlot.split(' - ')[0].trim()) break;
        endTimes.push(currentSlot.split(' - ')[1].trim());
      }
    }
    return { rooms, times: roomDaySlots, startTimes, endTimes };
  }, [emptySlots, editedFormData, startTime]);

  const availableSlotsForCreate = useMemo(() => {
    const daySlots = emptySlots.filter(slot => slot.day === createFormData.day);
    const rooms = [...new Set(daySlots.map(slot => slot.location))];
    const roomDaySlots = daySlots.filter(slot => slot.location === createFormData.room).map(s => s.time).sort((a, b) => parseInt(a.split(':')[0]) - parseInt(b.split(':')[0]));
    const startTimes = [...new Set(roomDaySlots.map(time => time.split(' - ')[0].trim()))];

    let endTimes: string[] = [];
    const startIndex = roomDaySlots.findIndex(slot => slot.startsWith(createStartTime));
    if (createStartTime && startIndex !== -1) {
        for (let i = startIndex; i < roomDaySlots.length; i++) {
            const currentSlot = roomDaySlots[i];
            const prevSlot = i > startIndex ? roomDaySlots[i - 1] : null;
            if (prevSlot && prevSlot.split(' - ')[1].trim() !== currentSlot.split(' - ')[0].trim()) break;
            endTimes.push(currentSlot.split(' - ')[1].trim());
        }
    }
    return { rooms, times: roomDaySlots, startTimes, endTimes };
  }, [emptySlots, createFormData, createStartTime]);
  
  const userRejectedEntryIds = (user && rejectedEntries[user.id]) || [];

  return (
    <>
      <LecturerReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
            setIsReviewModalOpen(false);
            if (user) {
              markScheduleAsReviewed(user.id);
            }
        }}
        courses={lecturerCourses}
      />
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
        <div className="flex justify-end sm:justify-start gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsManageModalOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Manage Courses
            </Button>
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Schedule
            </Button>
             <Dialog open={isFreeRoomModalOpen} onOpenChange={setIsFreeRoomModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <SearchIcon className="mr-2 h-4 w-4" />
                        Find Free Rooms
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Free Classrooms for {activeDay}</DialogTitle>
                        <DialogDescription>
                            Here are the classrooms that are available and their free time slots.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] my-4 pr-6">
                        {freeRoomsForDay.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {freeRoomsForDay.map(({ room, freeRanges }) => (
                                    <Card key={room}>
                                        <CardHeader className="p-4">
                                            <CardTitle className="text-base">{room}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <div className="space-y-1">
                                                {freeRanges.map((range, idx) => (
                                                   <Badge key={idx} variant="secondary" className="font-normal text-xs whitespace-nowrap">{range}</Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-12 text-muted-foreground">
                                <p>No free classrooms found for {activeDay}.</p>
                            </div>
                        )}
                    </ScrollArea>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFreeRoomModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /> Confirmed</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Undecided</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> Canceled</div>
        </div>
      </div>
      <Tabs defaultValue="Monday" onValueChange={setActiveDay} className="w-full">
        <div className="sticky top-[56px] z-10 bg-background/95 backdrop-blur-sm -mx-4 md:-mx-6 px-4 md:px-6 py-2 border-b">
          <TabsList className="grid w-full grid-cols-7 h-12">
            {days.map((day) => (
              <TabsTrigger key={day} value={day} className="text-xs sm:text-sm">{day.substring(0, 3)}</TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="py-6">
          {days.map((day) => (
            <TabsContent key={day} value={day}>
              {dailySchedule[day] && dailySchedule[day].length > 0 ? (
                <div className="md:border md:rounded-lg md:overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="hidden md:table-header-group">
                                <TableRow>
                                    <TableHead className="w-1/4">Time</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead className="w-1/4">Location</TableHead>
                                    <TableHead className="w-1/4">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {dailySchedule[day].map((event, index) => (
                                <TableRow key={`${event.id}-${index}`} onClick={() => handleRowClick(event)} className="block md:table-row -ml-4 -mr-4 md:ml-0 md:mr-0 md:border-b mb-4 md:mb-0 cursor-pointer">
                                    <TableCell className="block md:hidden p-0 w-full">
                                      <div className="border rounded-lg p-4 space-y-4 m-2">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full">
                                          <div>
                                            <div className="font-bold text-xs text-muted-foreground flex items-center gap-1.5"><CalendarIcon className="w-3 h-3"/>Time</div>
                                            <div className="font-medium break-words pl-5">{event.time}</div>
                                          </div>
                                          <div>
                                            <div className="font-bold text-xs text-muted-foreground flex items-center gap-1.5"><BookUser className="w-3 h-3"/>Course</div>
                                            <div className="font-medium break-words pl-5">{event.courseCode}</div>
                                          </div>
                                          <div>
                                            <div className="font-bold text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3 h-3"/>Location</div>
                                            <div className="font-medium break-words pl-5">{event.room}</div>
                                          </div>
                                          <div>
                                            <div className="font-bold text-xs text-muted-foreground flex items-center gap-1.5"><AlertCircle className="w-3 h-3"/>Status</div>
                                            <div className="pl-5">
                                              <Badge variant="outline" className={cn("capitalize font-normal text-xs", statusConfig[event.status].border, 'border-l-4')}>
                                                {statusConfig[event.status].text}
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell font-medium">{event.time}</TableCell>
                                    <TableCell className="hidden md:table-cell">{event.courseCode}</TableCell>
                                    <TableCell className="hidden md:table-cell">{event.room}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <Badge variant="outline" className={cn("capitalize font-normal text-xs", statusConfig[event.status].border, 'border-l-4')}>
                                            {statusConfig[event.status].text}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
              ) : (
                <Card className="flex items-center justify-center p-12 bg-muted/50 border-dashed">
                    <CardContent className="text-center text-muted-foreground">
                      <p className="font-medium">No classes scheduled for {day}.</p>
                      <p className="text-sm">Enjoy your day off!</p>
                    </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>
      
      {/* Action Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Class Actions</DialogTitle>
            {selectedEntry && (
              <DialogDescription>
                Manage your class: {selectedEntry.courseCode} at {selectedEntry.time}.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
             <Button
                variant="outline"
                onClick={() => selectedEntry && handleStatusChange(selectedEntry.id, 'confirmed')}
                disabled={selectedEntry?.status === 'confirmed'}
                className="w-full justify-start"
            >
                <ShieldCheck className="mr-2 h-4 w-4 text-green-500" /> Confirm Class
            </Button>
            <Button
                variant="outline"
                onClick={() => selectedEntry && handleRescheduleClick(selectedEntry)}
                className="w-full justify-start"
            >
                <CalendarClock className="mr-2 h-4 w-4" /> Reschedule Class
            </Button>
            <Button
                variant="outline"
                onClick={() => selectedEntry && handleStatusChange(selectedEntry.id, 'canceled')}
                disabled={selectedEntry?.status === 'canceled'}
                className="w-full justify-start text-destructive hover:text-destructive"
            >
                <Ban className="mr-2 h-4 w-4" /> Cancel Class
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeAllModals}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Class</DialogTitle>
            <DialogDescription>
              Select a new room and time for this class.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room" className="text-right">Room</Label>
              <Select value={editedFormData?.room || ''} onValueChange={(value) => handleEditInputChange('room', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {editedFormData?.room && <SelectItem value={editedFormData.room} disabled>{editedFormData.room} (Current)</SelectItem>}
                  {availableSlotsForEdit.rooms.map(room => <SelectItem key={room} value={room}>{room}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Time</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                <Select value={startTime} onValueChange={setStartTime} disabled={!editedFormData?.room}>
                  <SelectTrigger><SelectValue placeholder="Start" /></SelectTrigger>
                  <SelectContent>
                    {availableSlotsForEdit.startTimes.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={endTime} onValueChange={setEndTime} disabled={!startTime}>
                  <SelectTrigger><SelectValue placeholder="End" /></SelectTrigger>
                  <SelectContent>
                    {availableSlotsForEdit.endTimes.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeAllModals}>Cancel</Button>
            <Button type="submit" onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
            <DialogDescription>
              Add a new class. Select a day, room and time from available slots.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courseCode-create" className="text-right">Course</Label>
              <Select onValueChange={handleCourseSelection}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {lecturerCourses.map(course => (
                    <SelectItem key={course.id} value={course.courseCode}>{course.courseCode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="level-create" className="text-right">Level</Label>
              <Input id="level-create" value={createFormData.level || ''} className="col-span-3" readOnly disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departments-create" className="text-right">Department</Label>
              <Input id="departments-create" value={createFormData.departments.join(', ') || ''} className="col-span-3" readOnly disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="day-create" className="text-right">Day</Label>
              <Select value={createFormData.day} onValueChange={(value) => handleCreateInputChange('day', value)}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {days.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room-create" className="text-right">Room</Label>
              <Select value={createFormData.room} onValueChange={(value) => handleCreateInputChange('room', value)} disabled={!createFormData.day}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a room" /></SelectTrigger>
                <SelectContent>
                  {availableSlotsForCreate.rooms.map(room => <SelectItem key={room} value={room}>{room}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Time</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                <Select value={createStartTime} onValueChange={setCreateStartTime} disabled={!createFormData.room}>
                  <SelectTrigger><SelectValue placeholder="Start" /></SelectTrigger>
                  <SelectContent>
                    {availableSlotsForCreate.startTimes.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={createEndTime} onValueChange={setCreateEndTime} disabled={!createStartTime}>
                  <SelectTrigger><SelectValue placeholder="End" /></SelectTrigger>
                  <SelectContent>
                    {availableSlotsForCreate.endTimes.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeAllModals}>Cancel</Button>
            <Button type="submit" onClick={handleSaveCreate}>Add Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Courses Modal */}
      <Dialog open={isManageModalOpen} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage My Assigned Courses</DialogTitle>
            <DialogDescription>
              Here are all courses officially assigned to you. You can hide or show them in your personal timetable.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] my-4 pr-6">
            <div className="space-y-2 py-4">
              {lecturerCourses.map((course) => {
                const isRejected = userRejectedEntryIds.includes(course.id);
                return (
                  <div key={course.id} className="flex items-center justify-between p-3 rounded-md border">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold break-words">{course.courseCode}</p>
                      <div className="flex flex-wrap items-center text-sm text-muted-foreground">
                        <span className="break-all">{course.departments.join(', ')}</span>
                        <span className="mx-1.5">&middot;</span>
                        <span>Level {course.level}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-4">
                      <Label htmlFor={`switch-${course.id}`} className="text-sm shrink-0">
                        {isRejected ? 'Hidden' : 'Visible'}
                      </Label>
                      <Switch
                        id={`switch-${course.id}`}
                        checked={!isRejected}
                        onCheckedChange={(checked) => handleReviewToggle(course.id, !checked)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdminTimetableView({
  parsedData,
  setParsedData,
  emptySlots,
  setEmptySlots,
}: {
  parsedData: TimetableEntry[] | null;
  setParsedData: (data: TimetableEntry[] | null) => void;
  emptySlots: EmptySlot[];
  setEmptySlots: (slots: EmptySlot[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvalid, setShowInvalid] = useState(false);
  
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editedFormData, setEditedFormData] = useState<TimetableEntry | null>(null);

  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileData = Buffer.from(arrayBuffer).toString('base64');
      const [data, slots] = await Promise.all([
        handleFileUpload(fileData),
        findEmptyClassrooms(fileData)
      ]);
      
      if (data.length === 0) {
        setError("The uploaded file could not be parsed or contains no valid schedule data. Please check the file format.");
        setParsedData(null);
        setEmptySlots([]);
      } else {
        const dataWithIdsAndStatus = data.map((item, index) => ({ ...item, id: index, status: 'undecided' as EventStatus }));
        setParsedData(dataWithIdsAndStatus);
        setEmptySlots(slots);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during file parsing.");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  useEffect(() => {
    if (selectedEntry && isEditModalOpen) {
      setEditedFormData(selectedEntry);
      const [start, end] = selectedEntry.time.split(' - ');
      setStartTime(start?.trim() || '');
      setEndTime(end?.trim() || '');
    }
  }, [selectedEntry, isEditModalOpen]);

  const handleRowClick = (entry: TimetableEntry) => {
    setSelectedEntry(entry);
    setIsActionModalOpen(true);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteAll = () => {
    setParsedData(null);
    setEmptySlots([]);
    setError(null);
    setSearchTerm('');
    setShowInvalid(false);
  };
  
  const handleDeleteRow = () => {
    if (!selectedEntry || !parsedData) return;
    setParsedData(parsedData.filter(item => item.id !== selectedEntry.id));
    closeAllModals();
  };
  
  const handleSaveEdit = () => {
     if (!editedFormData || !parsedData || !startTime || !endTime) return;
     const updatedEntry = { ...editedFormData, time: `${startTime} - ${endTime}` };
     setParsedData(parsedData.map(item => item.id === updatedEntry.id ? updatedEntry : item));
     closeAllModals();
  };

  const handleEditInputChange = (field: keyof TimetableEntry, value: string | number | string[]) => {
    if (!editedFormData) return;
    
    let updatedData = { ...editedFormData, [field]: value };

    if (field === 'room') {
      setStartTime('');
      setEndTime('');
    }
    
    setEditedFormData(updatedData);
  };
  
  const closeAllModals = () => {
    setIsActionModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteConfirmOpen(false);
    setSelectedEntry(null);
  }

  const filteredData = useMemo(() => {
    if (!parsedData) return null;

    let data = [...parsedData];

    if (showInvalid) {
        data = data.filter(entry => entry.lecturer.toLowerCase() === 'unknown' || entry.lecturer.toLowerCase() === 'tba');
    }
    
    if (!searchTerm) return data;

    const lowercasedFilter = searchTerm.toLowerCase();
    return data.filter(entry => 
      entry.courseCode.toLowerCase().includes(lowercasedFilter) ||
      entry.lecturer.toLowerCase().includes(lowercasedFilter) ||
      entry.room.toLowerCase().includes(lowercasedFilter) ||
      entry.departments.some(dep => dep.toLowerCase().includes(lowercasedFilter))
    );
  }, [parsedData, searchTerm, showInvalid]);

  const groupedByDay = useMemo(() => {
    if (!filteredData) return {};
    return filteredData.reduce((acc, entry) => {
      const day = entry.day;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(entry);
      return acc;
    }, {} as Record<string, TimetableEntry[]>);
  }, [filteredData]);
  
  const availableSlotsForRoomAndDay = useMemo(() => {
    if (!editedFormData) return [];
    return emptySlots
      .filter(slot => slot.day === editedFormData.day && slot.location === editedFormData.room)
      .map(slot => slot.time)
      .sort((a, b) => {
        const timeA = parseInt(a.split(':')[0]);
        const timeB = parseInt(b.split(':')[0]);
        return timeA - timeB;
      });
  }, [emptySlots, editedFormData]);

  const availableRoomsForDay = useMemo(() => {
    if (!editedFormData) return [];
    const daySlots = emptySlots.filter(slot => slot.day === editedFormData.day);
    return [...new Set(daySlots.map(slot => slot.location))];
  }, [emptySlots, editedFormData]);

  const availableStartTimes = useMemo(() => {
    return [...new Set(availableSlotsForRoomAndDay.map(time => time.split(' - ')[0].trim()))];
  }, [availableSlotsForRoomAndDay]);

  const availableEndTimes = useMemo(() => {
    if (!startTime) return [];
    
    const startIndex = availableSlotsForRoomAndDay.findIndex(slot => slot.startsWith(startTime));
    if (startIndex === -1) return [];

    let continuousEndTimes: string[] = [];
    for (let i = startIndex; i < availableSlotsForRoomAndDay.length; i++) {
        const currentSlot = availableSlotsForRoomAndDay[i];
        const prevSlot = i > startIndex ? availableSlotsForRoomAndDay[i - 1] : null;

        if (prevSlot) {
            const prevEndTime = prevSlot.split(' - ')[1].trim();
            const currentStartTime = currentSlot.split(' - ')[0].trim();
            if (prevEndTime !== currentStartTime) {
                break; // Break if not continuous
            }
        }
        continuousEndTimes.push(currentSlot.split(' - ')[1].trim());
    }
    
    return continuousEndTimes;
  }, [startTime, availableSlotsForRoomAndDay]);

  const daysWithData = Object.keys(groupedByDay);

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        className="hidden"
        accept=".xlsx, .xls"
      />
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <TooltipProvider>
          <div className="flex gap-2 flex-wrap flex-shrink-0">
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
                <Button variant={showInvalid ? "secondary" : "outline"} size="icon" onClick={() => setShowInvalid(!showInvalid)} disabled={!parsedData}>
                  <FilterX className="h-4 w-4" />
                  <span className="sr-only">Filter for review</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter for review</p>
              </TooltipContent>
            </Tooltip>

            <AlertDialog>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" disabled={!parsedData}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                          </Button>
                      </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Delete Timetable</p>
                  </TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    entire timetable data from this view.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TooltipProvider>
        {parsedData && (
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search course, lecturer, room, department..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

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
              {
                showInvalid 
                  ? `Found ${filteredData?.length || 0} entries for review.`
                  : searchTerm 
                    ? `Found ${filteredData?.length || 0} matching entries.`
                    : `A total of ${parsedData?.length || 0} entries were found. Click a row to edit or delete.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={daysWithData.length > 0 ? daysWithData[0] : ""} className="w-full">
              <TabsList>
                {daysWithData.map(day => (
                  <TabsTrigger key={day} value={day}>
                    {day} ({groupedByDay[day]?.length || 0})
                  </TabsTrigger>
                ))}
              </TabsList>
              {daysWithData.map(day => (
                <TabsContent key={day} value={day}>
                    <div className="overflow-x-auto">
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
                            {groupedByDay[day]?.map((entry) => (
                              <TableRow key={entry.id} onClick={() => handleRowClick(entry)} className="cursor-pointer">
                                <TableCell className="whitespace-nowrap">{entry.time}</TableCell>
                                <TableCell>{entry.room}</TableCell>
                                <TableCell>{entry.courseCode}</TableCell>
                                <TableCell>{entry.lecturer}</TableCell>
                                <TableCell>{entry.departments.join(', ')}</TableCell>
                                <TableCell>{entry.level}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                    </div>
                </TabsContent>
              ))}
               {daysWithData.length === 0 && (searchTerm || showInvalid) && (
                  <div className="text-center p-12 text-muted-foreground">
                    <p>No results found for your filter criteria.</p>
                  </div>
               )}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Action Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Action</DialogTitle>
            <DialogDescription>
              What would you like to do with this timetable entry?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-around py-4">
             <Button variant="outline" onClick={() => { setIsActionModalOpen(false); setIsEditModalOpen(true); }}>
                <Edit className="mr-2 h-4 w-4" /> Edit
             </Button>
             <Button variant="destructive" onClick={() => { setIsActionModalOpen(false); setIsDeleteConfirmOpen(true); }}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
             </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Timetable Entry</DialogTitle>
            <DialogDescription>
              Make changes to the entry here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room" className="text-right">Room</Label>
               <Select
                  value={editedFormData?.room || ''}
                  onValueChange={(value) => handleEditInputChange('room', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {editedFormData?.room && <SelectItem value={editedFormData.room} disabled>
                        {editedFormData.room} (Current)
                    </SelectItem>}
                    {availableRoomsForDay.map(room => (
                        <SelectItem key={room} value={room}>{room}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Time</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                <Select
                  value={startTime}
                  onValueChange={(value) => {
                    setStartTime(value);
                    setEndTime('');
                  }}
                  disabled={!editedFormData?.room}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Start" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStartTimes.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={endTime}
                  onValueChange={setEndTime}
                  disabled={!startTime}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="End" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEndTimes.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courseCode" className="text-right">Course</Label>
              <Input id="courseCode" value={editedFormData?.courseCode || ''} onChange={(e) => handleEditInputChange('courseCode', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lecturer" className="text-right">Lecturer</Label>
              <Input id="lecturer" value={editedFormData?.lecturer || ''} onChange={(e) => handleEditInputChange('lecturer', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departments" className="text-right">Depts</Label>
              <Select
                value={editedFormData?.departments[0] || ''}
                onValueChange={(value) => handleEditInputChange('departments', [value])}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {allDepartments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="level" className="text-right">Level</Label>
               <Select
                  value={String(editedFormData?.level || '')}
                  onValueChange={(value) => handleEditInputChange('level', Number(value))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="400">400</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeAllModals}>Cancel</Button>
            <Button type="submit" onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this timetable entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeAllModals}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRow}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

export default function TimetablePage() {
  const { 
    user, 
    masterSchedule, 
    setMasterSchedule, 
    emptySlots, 
    setEmptySlots,
    lecturerSchedules,
    addLecturerSchedule,
    rejectedEntries
  } = useUser();
  
  const combinedSchedule = useMemo(() => {
    return [...(masterSchedule || []), ...lecturerSchedules];
  }, [masterSchedule, lecturerSchedules]);

  // Derived states are now calculated within the render logic using useMemo
  const lecturerSchedule = useMemo(() => {
    if (!combinedSchedule || !user || user.role !== 'lecturer') return [];
    
    const currentLecturerNameParts = user.name.toLowerCase().split(' ');

    return combinedSchedule.filter(entry => 
      currentLecturerNameParts.some(part => entry.lecturer.toLowerCase().includes(part))
    );
  }, [combinedSchedule, user]);

  const studentSchedule = useMemo(() => {
    if (!combinedSchedule || !user || user.role !== 'student') return [];

    return combinedSchedule.filter(entry =>
        entry.level === user.level &&
        user.department &&
        entry.departments.includes(user.department)
      );
  }, [combinedSchedule, user]);

  const renderContent = () => {
    if (!user) return <p>Loading...</p>;

    switch (user.role) {
      case 'student':
        return <StudentTimetableView schedule={studentSchedule} />;
      case 'lecturer':
        return <LecturerTimetableView 
                  schedule={lecturerSchedule} 
                  setSchedule={setMasterSchedule as any} 
                  masterSchedule={masterSchedule}
                  emptySlots={emptySlots} 
                  addLecturerSchedule={addLecturerSchedule}
               />;
      case 'administrator':
        return <AdminTimetableView 
                  parsedData={masterSchedule} 
                  setParsedData={setMasterSchedule} 
                  emptySlots={emptySlots} 
                  setEmptySlots={setEmptySlots} 
               />;
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

    
