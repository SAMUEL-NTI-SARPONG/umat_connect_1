
'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Upload, Check, Ban, FilePenLine, Trash2, Loader2, Clock, MapPin, BookUser, Search, FilterX, Edit, Delete, CalendarClock, PlusCircle, Settings, MoreHorizontal, ShieldCheck, EyeOff, SearchIcon, User as UserIcon, Calendar as CalendarIcon, PenSquare, Info, Save, ListChecks, SendHorizontal } from 'lucide-react';
import { useUser, type TimetableEntry, type EmptySlot, type EventStatus, type SpecialResitTimetable, type DistributedResitSchedule, type SpecialResitEntry } from '../providers/user-provider';
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
import { handleFileUpload, findEmptyClassrooms, handleSpecialResitUpload } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

const statusConfig = {
    confirmed: { color: 'bg-green-500', text: 'Confirmed', border: 'border-l-green-500', icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
    canceled: { color: 'bg-red-500', text: 'Canceled', border: 'border-l-red-500', icon: <XCircle className="h-5 w-5 text-red-500" /> },
    undecided: { color: 'bg-yellow-500', text: 'Undecided', border: 'border-l-yellow-500', icon: <AlertCircle className="h-5 w-5 text-yellow-500" /> },
};
  
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function StudentResitView() {
  const { user, specialResitTimetable, studentResitSelections, updateStudentResitSelection } = useUser();
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  
  // Local state for selections within the modal
  const [localSelections, setLocalSelections] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user && studentResitSelections[user.id]) {
      setLocalSelections(new Set(studentResitSelections[user.id]));
    }
  }, [studentResitSelections, user]);
  
  if (!specialResitTimetable || !specialResitTimetable.isDistributed) {
    return (
      <Card className="flex items-center justify-center p-12 bg-muted/50 border-dashed">
        <CardContent className="text-center text-muted-foreground">
          <p className="font-medium">Special Resit Timetable Not Yet Published</p>
          <p className="text-sm">The timetable will appear here once the administrator distributes it. Please check back later.</p>
        </CardContent>
      </Card>
    );
  }
  
  const allEntries = useMemo(() => {
    if (!specialResitTimetable) return [];
    // The data is now nested, so we need to flatten it.
    return specialResitTimetable.sheets.flatMap(sheet => 
        sheet.entries.flatMap(lecturerSchedule => 
            lecturerSchedule.courses
        )
    );
  }, [specialResitTimetable]);

  const userSelections = (user && studentResitSelections[user.id]) || [];
  const selectedEntries = allEntries.filter(entry => userSelections.includes(entry.id));

  const handleLocalSelectionChange = (entryId: number, checked: boolean) => {
    setLocalSelections(prev => {
        const newSet = new Set(prev);
        if (checked) {
            newSet.add(entryId);
        } else {
            newSet.delete(entryId);
        }
        return newSet;
    });
  };

  const handleSaveChanges = () => {
    if (!user) return;
    const currentSelections = new Set(userSelections);
    const newSelections = localSelections;

    // Find what to add
    newSelections.forEach(id => {
        if (!currentSelections.has(id)) {
            updateStudentResitSelection(id, true);
        }
    });

    // Find what to remove
    currentSelections.forEach(id => {
        if (!newSelections.has(id)) {
            updateStudentResitSelection(id, false);
        }
    });
    
    setIsSelectionModalOpen(false);
  };
  
  const headers = ['Date', 'Course Code', 'Course Name', 'Department', 'Room', 'Examiner', 'Session'];

  return (
    <div className="space-y-6">
      {specialResitTimetable.notice && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Administrator's Notice</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {specialResitTimetable.notice}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Your Personalized Resit Schedule</CardTitle>
                <CardDescription>
                    {selectedEntries.length > 0
                    ? `Here are the details for your ${selectedEntries.length} selected course(s).`
                    : "Select your courses to see your personalized schedule."}
                </CardDescription>
            </div>
            <Dialog open={isSelectionModalOpen} onOpenChange={setIsSelectionModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <ListChecks className="mr-2 h-4 w-4" />
                        Select / Edit My Courses
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Select Your Resit Courses</DialogTitle>
                        <DialogDescription>Choose the courses you are registered to write from the list below.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-64 border rounded-md p-4">
                        <div className="space-y-2">
                        {allEntries.map(entry => (
                            <div key={entry.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`resit-course-${entry.id}`}
                                checked={localSelections.has(entry.id)}
                                onCheckedChange={(checked) => handleLocalSelectionChange(entry.id, !!checked)}
                            />
                            <Label htmlFor={`resit-course-${entry.id}`} className="font-normal cursor-pointer">
                                {entry.courseCode} - {entry.courseName}
                            </Label>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSelectionModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveChanges}>Save Selections</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
            {selectedEntries.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedEntries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>{entry.date}</TableCell>
                                    <TableCell>{entry.courseCode}</TableCell>
                                    <TableCell>{entry.courseName}</TableCell>
                                    <TableCell>{entry.department}</TableCell>
                                    <TableCell>{entry.room}</TableCell>
                                    <TableCell>{entry.examiner}</TableCell>
                                    <TableCell>{entry.session}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-12">
                    <p>Your schedule will appear here once you select your courses.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}


function StudentTimetableView({ schedule }: { schedule: TimetableEntry[] }) {
  const { user, emptySlots } = useUser();
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
      if (modifier === 'AM' && hours === 12) hours = 0; // 12 AM is 00:00
      return hours * 60 + (minutes || 0);
    };
    
    for (const room in rooms) {
      const slots = (rooms[room] || []).map(time => {
          if (!time || !time.includes('-')) return null;
          const [start, end] = time.split(' - ');
          return { start, end };
      }).filter(Boolean) as { start: string; end: string }[];
      
      if (slots.length === 0) continue;
      
      slots.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
      
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
    <Tabs defaultValue="class" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="class">Class Timetable</TabsTrigger>
          <TabsTrigger value="exams">Exams Timetable</TabsTrigger>
          <TabsTrigger value="resit">Special Resit</TabsTrigger>
        </TabsList>
        <TabsContent value="class" className="mt-6">
            <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={() => setIsFreeRoomModalOpen(true)}>
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Find Free Rooms
                </Button>
            </div>

            <Tabs defaultValue={activeDay} onValueChange={setActiveDay} className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                {days.map(day => (
                    <TabsTrigger key={day} value={day} className="text-xs sm:text-sm">{day.substring(0,3)}</TabsTrigger>
                ))}
                </TabsList>
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
        </TabsContent>
        <TabsContent value="exams" className="mt-6">
            <Card className="flex items-center justify-center p-12 bg-muted/50 border-dashed">
                <CardContent className="text-center text-muted-foreground">
                    <p className="font-medium">Exams Timetable Not Available</p>
                    <p className="text-sm">The exams timetable will appear here once it's published.</p>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="resit" className="mt-6">
            <StudentResitView />
        </TabsContent>

        <Dialog open={isFreeRoomModalOpen} onOpenChange={setIsFreeRoomModalOpen}>
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

function StaffResitView() {
    const { user, specialResitTimetable } = useUser();
  
    const staffResitSchedule = useMemo(() => {
      if (!user || !specialResitTimetable || !specialResitTimetable.isDistributed) return [];
      
      const staffNameParts = user.name.toLowerCase().split(' ').filter(p => p.length > 2);
      
      const allSchedules = specialResitTimetable.sheets.flatMap(s => s.entries);

      const scheduleForStaff = allSchedules.find(lecturerSchedule => 
        staffNameParts.some(part => lecturerSchedule.lecturer.toLowerCase().includes(part))
      );
      
      return scheduleForStaff ? scheduleForStaff.courses : [];
    }, [user, specialResitTimetable]);
  
    if (!specialResitTimetable || !specialResitTimetable.isDistributed) {
      return (
        <Card className="flex items-center justify-center p-12 bg-muted/50 border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p className="font-medium">Special Resit Timetable Not Yet Published</p>
            <p className="text-sm">The resit schedule has not been published by the administrator yet.</p>
          </CardContent>
        </Card>
      );
    }
    
    const headers = ['Date', 'Course Code', 'Course Name', 'Department', '# Students', 'Room', 'Original Examiner', 'Session'];
  
    return (
      <div className="space-y-6">
        {specialResitTimetable.notice && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Administrator's Notice</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">
              {specialResitTimetable.notice}
            </AlertDescription>
          </Alert>
        )}
  
        <Card>
          <CardHeader>
              <CardTitle>Your Resit Supervision Schedule</CardTitle>
              <CardDescription>
                  {staffResitSchedule.length > 0
                  ? `You have ${staffResitSchedule.length} supervision(s) scheduled.`
                  : "You have no resit supervisions scheduled."}
              </CardDescription>
          </CardHeader>
          <CardContent>
              {staffResitSchedule.length > 0 ? (
                  <div className="overflow-x-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {staffResitSchedule.map((entry) => (
                                  <TableRow key={entry.id}>
                                      <TableCell>{entry.date}</TableCell>
                                      <TableCell>{entry.courseCode}</TableCell>
                                      <TableCell>{entry.courseName}</TableCell>
                                      <TableCell>{entry.department}</TableCell>
                                      <TableCell>{entry.numberOfStudents}</TableCell>
                                      <TableCell>{entry.room}</TableCell>
                                      <TableCell>{entry.examiner}</TableCell>
                                      <TableCell>{entry.session}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
              ) : (
                  <div className="text-center text-muted-foreground py-12">
                      <p>No supervision duties found for you in the special resit timetable.</p>
                  </div>
              )}
          </CardContent>
        </Card>
      </div>
    );
  }

function StaffTimetableView({
  schedule,
  masterSchedule,
  emptySlots,
  addStaffSchedule,
  updateScheduleStatus,
}: {
  schedule: TimetableEntry[];
  masterSchedule: TimetableEntry[] | null;
  emptySlots: EmptySlot[];
  addStaffSchedule: (entry: Omit<TimetableEntry, 'id' | 'status' | 'lecturer'>) => void;
  updateScheduleStatus: (entryId: number, status: EventStatus) => void;
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

  const staffCourses = useMemo(() => {
    if (!masterSchedule || !user) return [];
    
    const staffNameParts = user.name.toLowerCase().split(' ').filter(p => p.length > 2);
    
    const allEntriesForStaff = masterSchedule.filter(entry =>
      staffNameParts.some(part => entry.lecturer.toLowerCase().includes(part))
    );

    const groupedByNormalizedId = allEntriesForStaff.reduce((acc, entry) => {
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
    
    const rejectedCourseGroups = staffCourses.filter(course =>
      (rejectedEntries[user.id] || []).includes(course.id)
    );
    
    const rejectedIds = new Set<number>();
    rejectedCourseGroups.forEach(group => {
      group.originalIds.forEach(id => rejectedIds.add(id));
    });
    
    return rejectedIds;
  }, [user, rejectedEntries, staffCourses]);

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
      if (modifier === 'AM' && hours === 12) hours = 0; // 12 AM is 00:00
      return hours * 60 + (minutes || 0);
    };

    for (const room in rooms) {
      const slots = (rooms[room] || []).map(time => {
          if (!time || !time.includes('-')) return null;
          const [start, end] = time.split(' - ');
          return { start, end };
      }).filter(Boolean) as { start: string; end: string }[];

      if (slots.length === 0) continue;
      
      slots.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

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
      const courseGroup = staffCourses.find(c => c.id === courseGroupId);
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
      if (staffCourses.length > 0) {
        setIsReviewModalOpen(true);
      }
    }
  }, [masterSchedule, user, hasReviewed, staffCourses.length]);
  
  const handleRowClick = (entry: TimetableEntry) => {
    setSelectedEntry(entry);
    setIsActionModalOpen(true);
  };

  const handleStatusChange = (id: number, newStatus: EventStatus) => {
    updateScheduleStatus(id, newStatus);
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
    // This is tricky. We're assuming the entry is in the master schedule.
    updateScheduleStatus(updatedEntry.id, updatedEntry.status); // This needs to be a full update.
    closeAllModals();
  };
  
  const handleSaveCreate = () => {
    const { courseCode, day, level, departments, room } = createFormData;
    if (!courseCode || !day || !level || !departments.length || !room || !createStartTime || !createEndTime) {
      alert("Please fill all fields");
      return;
    }
    addStaffSchedule({
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
    const selectedCourse = staffCourses.find(c => c.courseCode === courseCode);
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
    <Tabs defaultValue="class" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="class">Class Timetable</TabsTrigger>
        <TabsTrigger value="exams">Exams Timetable</TabsTrigger>
        <TabsTrigger value="resit">Special Resit</TabsTrigger>
      </TabsList>
      <TabsContent value="class" className="mt-6">
        <>
          <LecturerReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => {
                setIsReviewModalOpen(false);
                if (user && !reviewedSchedules.includes(user.id)) {
                  markScheduleAsReviewed(user.id);
                }
            }}
            courses={staffCourses}
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
                      {staffCourses.map(course => (
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
                  {staffCourses.map((course) => {
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
      </TabsContent>
       <TabsContent value="exams" className="mt-6">
            <Card className="flex items-center justify-center p-12 bg-muted/50 border-dashed">
                <CardContent className="text-center text-muted-foreground">
                    <p className="font-medium">Exams Timetable Not Available</p>
                    <p className="text-sm">The exams timetable will appear here once it's published.</p>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="resit" className="mt-6">
            <StaffResitView />
        </TabsContent>
    </Tabs>
  );
}

function ResitTimetableDisplay({
    parsedData,
    searchTerm,
    setParsedData,
    showInvalid,
  }: {
    parsedData: SpecialResitTimetable | null;
    searchTerm: string;
    setParsedData: (data: SpecialResitTimetable | null) => void;
    showInvalid: boolean;
  }) {
    const { toast } = useToast();
    const { distributeSpecialResitTimetable } = useUser();
    const [localNotice, setLocalNotice] = useState(parsedData?.notice || '');
    const [isEditingNotice, setIsEditingNotice] = useState(false);
    
    // State for modals
    const [selectedEntry, setSelectedEntry] = useState<SpecialResitEntry | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [editedFormData, setEditedFormData] = useState<SpecialResitEntry | null>(null);

    const [isDistributeConfirmOpen, setIsDistributeConfirmOpen] = useState(false);
  
    useEffect(() => {
      setLocalNotice(parsedData?.notice || '');
      if (parsedData && !parsedData.notice && !parsedData.isDistributed) {
          setIsEditingNotice(true);
      }
    }, [parsedData]);
    
    useEffect(() => {
        if (selectedEntry && isEditModalOpen) {
          setEditedFormData(selectedEntry);
        }
    }, [selectedEntry, isEditModalOpen]);

    const handleSaveNotice = () => {
      if (!parsedData) return;
      const updatedData = { ...parsedData, notice: localNotice };
      setParsedData(updatedData);
      toast({
        title: "Notice Updated",
        description: "The special resit timetable notice has been saved.",
      });
      setIsEditingNotice(false);
    };

    const closeAllModals = () => {
        setIsActionModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteConfirmOpen(false);
        setSelectedEntry(null);
    };

    const handleRowClick = (entry: SpecialResitEntry) => {
        if (parsedData?.isDistributed) return;
        setSelectedEntry(entry);
        setIsActionModalOpen(true);
    };

    const handleDeleteRow = () => {
        if (!selectedEntry || !parsedData) return;
        const newSheets = parsedData.sheets.map(sheet => ({
            ...sheet,
            entries: sheet.entries.map(lecturerSchedule => ({
                ...lecturerSchedule,
                courses: lecturerSchedule.courses.filter(course => course.id !== selectedEntry.id)
            })).filter(lecturerSchedule => lecturerSchedule.courses.length > 0)
        }));
        setParsedData({ ...parsedData, sheets: newSheets });
        closeAllModals();
    };

    const handleSaveEdit = () => {
        if (!editedFormData || !parsedData) return;
        const newSheets = parsedData.sheets.map(sheet => ({
            ...sheet,
            entries: sheet.entries.map(lecturerSchedule => ({
                ...lecturerSchedule,
                courses: lecturerSchedule.courses.map(course => 
                    course.id === editedFormData.id ? editedFormData : course
                )
            }))
        }));
        setParsedData({ ...parsedData, sheets: newSheets });
        closeAllModals();
    };

    const handleEditInputChange = (field: keyof SpecialResitEntry, value: string | number | null) => {
        if (!editedFormData) return;
        setEditedFormData({ ...editedFormData, [field]: value });
    };
  
    const filteredSheets = useMemo(() => {
      if (!parsedData) return [];
  
      let sheets = parsedData.sheets;
  
      const filterFunction = (lecturerSchedule: DistributedResitSchedule) => {
        if (showInvalid) {
            return lecturerSchedule.lecturer.toLowerCase() === 'tba';
        }
        if (searchTerm) {
          const lowercasedFilter = searchTerm.toLowerCase();
          const lecturerMatch = lecturerSchedule.lecturer.toLowerCase().includes(lowercasedFilter);
          if (lecturerMatch) return true;
  
          return lecturerSchedule.courses.some(course =>
            Object.values(course).some(value =>
              String(value).toLowerCase().includes(lowercasedFilter)
            )
          );
        }
        return true;
      };
      
      const filteredEntries = sheets[0].entries.filter(filterFunction);
      
      if (filteredEntries.length === 0 && (searchTerm || showInvalid)) {
        return [];
      }
      
      return [{ ...sheets[0], entries: filteredEntries }];
  
    }, [parsedData, searchTerm, showInvalid]);
    
    if (!parsedData) {
      return (
        <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Upload a special resit timetable to begin.</p>
        </div>
      );
    }
    
    const totalEntries = parsedData.sheets.flatMap(s => s.entries).reduce((acc, ls) => acc + ls.courses.length, 0);
    const headers = ['Date', 'Course Code', 'Course Name', 'Department', '# Students', 'Room', 'Original Examiner', 'Session'];
  
    return (
      <>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Special Resit Timetable ({totalEntries} total entries)</CardTitle>
                    <CardDescription>Venue: {parsedData.venue}</CardDescription>
                  </div>
                  <div>
                  {parsedData.isDistributed ? (
                      <Badge variant="secondary" className="text-green-600 border-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Distributed
                      </Badge>
                  ) : (
                      <AlertDialog open={isDistributeConfirmOpen} onOpenChange={setIsDistributeConfirmOpen}>
                          <AlertDialogTrigger asChild>
                              <Button>
                                  <SendHorizontal className="h-4 w-4 mr-2" />
                                  Distribute Timetable
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Distribute Timetable?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will make the timetable visible to all relevant staff and students. This action cannot be undone. Are you sure you want to proceed?
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => {
                                      distributeSpecialResitTimetable();
                                      setIsDistributeConfirmOpen(false);
                                  }}>Distribute</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  )}
                  </div>
                </div>
                <div className="space-y-2 pt-4">
                    <Label htmlFor="notice-textarea" className="font-semibold flex items-center justify-between">
                        <span>Administrator's Notice</span>
                        {!isEditingNotice && !parsedData.isDistributed && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditingNotice(true)}>
                                <PenSquare className="h-4 w-4 mr-2" />
                                Edit Notice
                            </Button>
                        )}
                    </Label>
                    {isEditingNotice && !parsedData.isDistributed ? (
                        <div className="flex items-start gap-2">
                            <Textarea
                                id="notice-textarea"
                                placeholder="Add an important notice for students viewing this timetable..."
                                value={localNotice}
                                onChange={(e) => setLocalNotice(e.target.value)}
                            />
                            <Button onClick={handleSaveNotice} size="icon" disabled={!localNotice.trim()}>
                                <Save className="h-4 w-4" />
                                <span className="sr-only">Save Notice</span>
                            </Button>
                        </div>
                    ) : (
                        parsedData.notice && (
                            <Alert className="mb-6">
                                <Info className="h-4 w-4" />
                                <AlertTitle>Notice</AlertTitle>
                                <AlertDescription className="whitespace-pre-wrap">
                                    {parsedData.notice}
                                </AlertDescription>
                            </Alert>
                        )
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {filteredSheets.length > 0 && filteredSheets[0].entries.length > 0 ? (
                    <div className="space-y-6">
                        {filteredSheets[0].entries.map((lecturerSchedule) => (
                             <div key={lecturerSchedule.lecturer}>
                                <h3 className="text-lg font-semibold mb-2">{lecturerSchedule.lecturer} ({lecturerSchedule.courses.length} entries)</h3>
                                <div className="overflow-x-auto border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {headers.map((header) => (
                                                    <TableHead key={`${lecturerSchedule.lecturer}-${header}`}>{header}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {lecturerSchedule.courses.map((row) => (
                                                <TableRow key={row.id} onClick={() => handleRowClick(row)} className={cn(!parsedData.isDistributed && "cursor-pointer")}>
                                                    <TableCell>{row.date}</TableCell>
                                                    <TableCell>{row.courseCode}</TableCell>
                                                    <TableCell>{row.courseName}</TableCell>
                                                    <TableCell>{row.department}</TableCell>
                                                    <TableCell>{row.numberOfStudents}</TableCell>
                                                    <TableCell>{row.room}</TableCell>
                                                    <TableCell>{row.examiner}</TableCell>
                                                    <TableCell>{row.session}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                  <div className="text-center p-12 text-muted-foreground">
                    <p>No results found for your search term or filter.</p>
                  </div>
                )}
            </CardContent>
        </Card>

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
                <DialogTitle>Edit Resit Entry</DialogTitle>
                <DialogDescription>
                Make changes to the entry here. Click save when you're done.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date-edit" className="text-right">Date</Label>
                    <Input id="date-edit" value={editedFormData?.date || ''} onChange={(e) => handleEditInputChange('date', e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="courseCode-edit" className="text-right">Course Code</Label>
                    <Input id="courseCode-edit" value={editedFormData?.courseCode || ''} onChange={(e) => handleEditInputChange('courseCode', e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="courseName-edit" className="text-right">Course Name</Label>
                    <Input id="courseName-edit" value={editedFormData?.courseName || ''} onChange={(e) => handleEditInputChange('courseName', e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="department-edit" className="text-right">Department</Label>
                    <Input id="department-edit" value={editedFormData?.department || ''} onChange={(e) => handleEditInputChange('department', e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="room-edit" className="text-right">Room</Label>
                    <Input id="room-edit" value={editedFormData?.room || ''} onChange={(e) => handleEditInputChange('room', e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="examiner-edit" className="text-right">Examiner</Label>
                    <Input id="examiner-edit" value={editedFormData?.examiner || ''} onChange={(e) => handleEditInputChange('examiner', e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="session-edit" className="text-right">Session</Label>
                    <Input id="session-edit" value={editedFormData?.session || ''} onChange={(e) => handleEditInputChange('session', e.target.value)} className="col-span-3" />
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
                This action cannot be undone. This will permanently delete this resit entry.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={closeAllModals}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRow}>Continue</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

function TimetableDisplay({
  parsedData,
  setParsedData,
  emptySlots,
  searchTerm,
  showInvalid,
  title,
  description,
  placeholder,
}: {
  parsedData: TimetableEntry[] | null;
  setParsedData: (data: TimetableEntry[] | null) => void;
  emptySlots: EmptySlot[];
  searchTerm: string;
  showInvalid: boolean;
  title: string;
  description: string;
  placeholder: string;
}) {
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editedFormData, setEditedFormData] = useState<TimetableEntry | null>(null);

  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  
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
      {!parsedData && (
        <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">{placeholder}</p>
        </div>
      )}

      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {
                showInvalid 
                  ? `Found ${filteredData?.length || 0} entries for review.`
                  : searchTerm 
                    ? `Found ${filteredData?.length || 0} matching entries.`
                    : description
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
  const { specialResitTimetable, setSpecialResitTimetable } = useUser();
  const [activeTab, setActiveTab] = useState('class');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for Class Timetable
  const [classParsedData, setClassParsedData] = useState<TimetableEntry[] | null>(parsedData);
  const [classEmptySlots, setClassEmptySlots] = useState<EmptySlot[]>(emptySlots);
  const [isClassLoading, setIsClassLoading] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [classShowInvalid, setClassShowInvalid] = useState(false);

  // State for Exams Timetable
  const [examsParsedData, setExamsParsedData] = useState<TimetableEntry[] | null>(null);
  const [examsEmptySlots, setExamsEmptySlots] = useState<EmptySlot[]>([]);
  const [isExamsLoading, setIsExamsLoading] = useState(false);
  const [examsError, setExamsError] = useState<string | null>(null);
  const [examsSearchTerm, setExamsSearchTerm] = useState('');
  const [examsShowInvalid, setExamsShowInvalid] = useState(false);

  // State for Resit Timetable
  const [isResitLoading, setIsResitLoading] = useState(false);
  const [resitError, setResitError] = useState<string | null>(null);
  const [resitSearchTerm, setResitSearchTerm] = useState('');
  const [resitShowInvalid, setResitShowInvalid] = useState(false);
  
  // Map state to the active tab
  const activeState = useMemo(() => {
    switch (activeTab) {
        case 'class':
            return { parsedData: classParsedData, setParsedData: setClassParsedData, emptySlots: classEmptySlots, setEmptySlots: setClassEmptySlots, isLoading: isClassLoading, setIsLoading: setIsClassLoading, error: classError, setError: setClassError, searchTerm: classSearchTerm, setSearchTerm: setClassSearchTerm, showInvalid: classShowInvalid, setShowInvalid: setClassShowInvalid, handler: handleFileUpload, cleaner: setClassEmptySlots };
        case 'exams':
            return { parsedData: examsParsedData, setParsedData: setExamsParsedData, emptySlots: examsEmptySlots, setEmptySlots: setExamsEmptySlots, isLoading: isExamsLoading, setIsLoading: setIsExamsLoading, error: examsError, setError: setExamsError, searchTerm: examsSearchTerm, setSearchTerm: setExamsSearchTerm, showInvalid: examsShowInvalid, setShowInvalid: setExamsShowInvalid, handler: handleFileUpload, cleaner: setExamsEmptySlots };
        case 'resit':
            return { parsedData: specialResitTimetable, setParsedData: setSpecialResitTimetable, isLoading: isResitLoading, setIsLoading: setIsResitLoading, error: resitError, setError: setResitError, searchTerm: resitSearchTerm, setSearchTerm: setResitSearchTerm, showInvalid: resitShowInvalid, setShowInvalid: setResitShowInvalid, handler: handleSpecialResitUpload, cleaner: () => {} };
        default:
            return { parsedData: null, setParsedData: () => {}, emptySlots: [], setEmptySlots: () => {}, isLoading: false, setIsLoading: () => {}, error: null, setError: () => {}, searchTerm: '', setSearchTerm: () => {}, showInvalid: false, setShowInvalid: () => {}, handler: async () => [], cleaner: () => {} };
    }
  }, [activeTab, classParsedData, classEmptySlots, isClassLoading, classError, classSearchTerm, classShowInvalid, examsParsedData, examsEmptySlots, isExamsLoading, examsError, examsSearchTerm, examsShowInvalid, specialResitTimetable, isResitLoading, resitError, resitSearchTerm, resitShowInvalid, setSpecialResitTimetable]);

  useEffect(() => {
      setClassParsedData(parsedData);
      setClassEmptySlots(emptySlots);
  }, [parsedData, emptySlots]);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    activeState.setIsLoading(true);
    activeState.setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileData = Buffer.from(arrayBuffer).toString('base64');
      
      const data = await activeState.handler(fileData);
      
      if (activeTab === 'class' || activeTab === 'exams') {
        const slots = await findEmptyClassrooms(fileData);
        if (!data || (Array.isArray(data) && data.length === 0)) {
            activeState.setError("The uploaded file could not be parsed or contains no valid schedule data. Please check the file format.");
            (activeState.setParsedData as Function)(null);
            (activeState.setEmptySlots as Function)([]);
        } else {
            const dataWithIdsAndStatus = (data as any[]).map((item, index) => ({ ...item, id: index, status: 'undecided' as EventStatus }));
            (activeState.setParsedData as Function)(dataWithIdsAndStatus);
            (activeState.setEmptySlots as Function)(slots);
            
            if (activeTab === 'class') {
              setParsedData(dataWithIdsAndStatus);
              setEmptySlots(slots);
            }
        }
      } else if (activeTab === 'resit') {
         if (!data) {
             activeState.setError("The uploaded file could not be parsed or contains no valid schedule data. Please check the file format.");
             (activeState.setParsedData as Function)(null);
         } else {
             (activeState.setParsedData as Function)(data);
         }
      }

    } catch (err) {
      activeState.setError(err instanceof Error ? err.message : "An unexpected error occurred during file parsing.");
    } finally {
      activeState.setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteAll = () => {
    (activeState.setParsedData as Function)(null);
    if ('setEmptySlots' in activeState) {
        (activeState.setEmptySlots as Function)([]);
    }
    activeState.setError(null);
    activeState.setSearchTerm('');
    if ('setShowInvalid' in activeState) {
        (activeState.setShowInvalid as Function)(false);
    }
    if (activeTab === 'class') {
        setParsedData(null);
        setEmptySlots([]);
    }
  };
  
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
                <Button variant="outline" size="icon" onClick={handleUploadClick} disabled={activeState.isLoading}>
                  {activeState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="sr-only">Upload New</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload New Timetable</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant={activeState.showInvalid ? "secondary" : "outline"} size="icon" onClick={() => 'setShowInvalid' in activeState && (activeState.setShowInvalid as Function)(!activeState.showInvalid)} disabled={!activeState.parsedData}>
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
                          <Button variant="destructive" size="icon" disabled={!activeState.parsedData}>
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
        {activeState.parsedData && (
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search course, lecturer, room, department..."
              className="pl-10"
              value={activeState.searchTerm}
              onChange={(e) => activeState.setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

       {activeState.error && (
         <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{activeState.error}</AlertDescription>
         </Alert>
      )}

      <Tabs defaultValue="class" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="class">Class Timetable</TabsTrigger>
          <TabsTrigger value="exams">Exams Timetable</TabsTrigger>
          <TabsTrigger value="resit">Special Resit Timetable</TabsTrigger>
        </TabsList>
        <TabsContent value="class" className="mt-6">
          <TimetableDisplay
            parsedData={classParsedData}
            setParsedData={setClassParsedData}
            emptySlots={classEmptySlots}
            searchTerm={classSearchTerm}
            showInvalid={classShowInvalid}
            title="Parsed Class Timetable Preview"
            description={`A total of ${classParsedData?.length || 0} entries were found. Click a row to edit or delete.`}
            placeholder="Upload a class timetable to begin."
          />
        </TabsContent>
        <TabsContent value="exams" className="mt-6">
           <TimetableDisplay
            parsedData={examsParsedData}
            setParsedData={setExamsParsedData}
            emptySlots={examsEmptySlots}
            searchTerm={examsSearchTerm}
            showInvalid={examsShowInvalid}
            title="Parsed Exams Timetable Preview"
            description={`A total of ${examsParsedData?.length || 0} exam entries were found.`}
            placeholder="Upload an exams timetable to begin."
          />
        </TabsContent>
        <TabsContent value="resit" className="mt-6">
           <ResitTimetableDisplay
            parsedData={specialResitTimetable}
            searchTerm={resitSearchTerm}
            setParsedData={setSpecialResitTimetable}
            showInvalid={resitShowInvalid}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function TimetablePage() {
  const { 
    user, 
    masterSchedule, 
    setMasterSchedule,
    updateScheduleStatus,
    emptySlots, 
    setEmptySlots,
    staffSchedules,
    addStaffSchedule,
  } = useUser();
  
  const combinedSchedule = useMemo(() => {
    return [...(masterSchedule || []), ...staffSchedules];
  }, [masterSchedule, staffSchedules]);

  // Derived states are now calculated within the render logic using useMemo
  const staffSchedule = useMemo(() => {
    if (!combinedSchedule || !user || user.role !== 'staff') return [];
    
    const currentStaffNameParts = user.name.toLowerCase().split(' ');

    return combinedSchedule.filter(entry => 
      currentStaffNameParts.some(part => entry.lecturer.toLowerCase().includes(part))
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
      case 'staff':
        return <StaffTimetableView 
                  schedule={staffSchedule} 
                  masterSchedule={masterSchedule}
                  emptySlots={emptySlots} 
                  addStaffSchedule={addStaffSchedule}
                  updateScheduleStatus={updateScheduleStatus}
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
    

    
    
