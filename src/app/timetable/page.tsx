
'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Upload, Check, Ban, FilePenLine, Trash2, Loader2, Clock, MapPin, BookUser, Search, FilterX, Edit, Delete, CalendarClock, PlusCircle, Settings, MoreHorizontal, ShieldCheck, EyeOff, SearchIcon, User as UserIcon, Calendar as CalendarIcon, PenSquare, Info, Save, ListChecks, SendHorizontal, ChevronDown, FlaskConical, Circle } from 'lucide-react';
import { useUser, type TimetableEntry, type EmptySlot, type EventStatus, type SpecialResitTimetable, type DistributedResitSchedule, type SpecialResitEntry, ExamsTimetable, ExamEntry } from '../providers/user-provider';
import { allDepartments as initialAllDepartments, initialDepartmentMap } from '@/lib/data';
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
import { handleFileUpload, findEmptyClassrooms, handleSpecialResitUpload, handleExamsUpload, handlePracticalsUpload } from './actions';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';

const statusConfig = {
    confirmed: { color: 'bg-green-500', text: 'Confirmed', border: 'border-l-green-500', icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
    canceled: { color: 'bg-red-500', text: 'Canceled', border: 'border-l-red-500', icon: <XCircle className="h-5 w-5 text-red-500" /> },
    undecided: { color: 'bg-yellow-500', text: 'Undecided', border: 'border-l-yellow-500', icon: <AlertCircle className="h-5 w-5 text-yellow-500" /> },
};
  
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function ExamDetails({ exams }: { exams: ExamEntry[] }) {
    if (exams.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <h1 className="text-lg font-semibold mb-2">No Exams Today</h1>
            <p className="text-sm text-muted-foreground">There are no exams scheduled for the selected day.</p>
        </div>
      );
    }
  
    return (
      <div className="space-y-4 max-h-[60vh] md:max-h-full overflow-y-auto pr-2">
        {exams.map((exam) => (
          <div key={exam.id} className="flex items-start gap-4 p-3 border rounded-lg bg-background/50">
            <div className="flex-shrink-0 w-24">
              <Badge variant="outline">{exam.period}</Badge>
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-medium text-sm">{exam.courseCode}</p>
              <p className="text-sm text-muted-foreground">{exam.courseName}</p>
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">Room: <span className="font-medium text-foreground">{exam.room}</span></p>
              <p className="text-xs text-muted-foreground">Lecturer: <span className="font-medium text-foreground">{exam.lecturer}</span></p>
              <p className="text-xs text-muted-foreground">Invigilator: <span className="font-medium text-foreground">{exam.invigilator}</span></p>
              {exam.is_practical && <Badge variant="destructive" className="mt-1">Practical</Badge>}
            </div>
          </div>
        ))}
      </div>
    );
  }

function StudentExamsView() {
    const { user, examsTimetable } = useUser();
    const isMobile = useIsMobile();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { studentExams, examDays, firstExamDate, lastExamDate, numberOfMonths } = useMemo(() => {
        if (!user || !examsTimetable || !examsTimetable.isDistributed) {
            return { studentExams: [], examDays: [], firstExamDate: new Date(), lastExamDate: new Date(), numberOfMonths: 1 };
        }

        const allExams = [...(examsTimetable.exams || []), ...(examsTimetable.practicals || [])];
        
        const filteredStudentExams = allExams.filter(exam => {
            const levelMatch = user.level === exam.level;
            const deptMatch = user.department && exam.departments?.includes(user.department);
            return levelMatch && deptMatch;
        });

        if (filteredStudentExams.length === 0) {
          return { studentExams: [], examDays: [], firstExamDate: new Date(), lastExamDate: new Date(), numberOfMonths: 1 };
        }

        const uniqueExamDays = [...new Set(filteredStudentExams.map(exam => exam.dateStr))].filter(Boolean);
        const sortedExamDays = uniqueExamDays.sort((a, b) => new Date(a.split('-').reverse().join('-')).getTime() - new Date(b.split('-').reverse().join('-')).getTime());
        
        const firstDay = sortedExamDays[0];
        const lastDay = sortedExamDays[sortedExamDays.length - 1];

        const firstDate = firstDay ? new Date(firstDay.split('-').reverse().join('-')) : new Date();
        const lastDate = lastDay ? new Date(lastDay.split('-').reverse().join('-')) : new Date();

        const months = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth()) + 1;

        return { 
            studentExams: filteredStudentExams, 
            examDays: sortedExamDays.map(d => new Date(d.split('-').reverse().join('-'))),
            firstExamDate: firstDate,
            lastExamDate: lastDate,
            numberOfMonths: months || 1,
        };
    }, [user, examsTimetable]);

    useEffect(() => {
        if (!isMobile && examDays.length > 0 && !selectedDate) {
            setSelectedDate(examDays[0]);
        }
    }, [isMobile, examDays, selectedDate]);

    const displayedExams = useMemo(() => {
        if (!selectedDate) return [];
        const formattedDate = format(selectedDate, 'dd-MM-yyyy');
        return studentExams
            .filter(exam => exam.dateStr === formattedDate)
            .sort((a, b) => {
                const periodOrder: { [key: string]: number } = { 'Morning': 1, 'Afternoon': 2, 'Evening': 3, 'Unknown': 4 };
                return periodOrder[a.period] - periodOrder[b.period];
            });
    }, [selectedDate, studentExams]);
    
    const handleDayClick = (day: Date) => {
      const hasExam = examDays.some(examDate => format(examDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
      if(hasExam) {
        setSelectedDate(day);
        if (isMobile) {
            setIsModalOpen(true);
        }
      }
    };

    if (!examsTimetable || !examsTimetable.isDistributed) {
      return (
        <Card className="flex items-center justify-center p-12 bg-muted/50 border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p className="font-medium">Exams Timetable Not Available</p>
            <p className="text-sm">The exams timetable will appear here once it's published.</p>
          </CardContent>
        </Card>
      );
    }
    
    if (studentExams.length === 0) {
        return (
          <Card className="flex items-center justify-center p-12 bg-muted/50 border-dashed">
            <CardContent className="text-center text-muted-foreground">
              <p className="font-medium">No Exams Found</p>
              <p className="text-sm">No exams were found for your level and department.</p>
            </CardContent>
          </Card>
        );
    }
  
    if (isMobile) {
        return (
            <Card>
                <CardContent className="p-2 md:p-4">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onDayClick={handleDayClick}
                        className="w-full"
                        numberOfMonths={numberOfMonths}
                        fromMonth={firstExamDate}
                        toMonth={lastExamDate}
                        modifiers={{ examDay: examDays }}
                        modifiersClassNames={{
                            examDay: 'bg-primary/80 text-primary-foreground font-bold hover:bg-primary/90 focus:bg-primary/90',
                            day_selected: 'bg-primary text-primary-foreground ring-2 ring-primary-hover ring-offset-2',
                        }}
                    />
                </CardContent>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Schedule for {selectedDate ? format(selectedDate, 'PPP') : 'selected date'}</DialogTitle>
                            <DialogDescription>
                                Here are your exams for this day.
                            </DialogDescription>
                        </DialogHeader>
                       <ExamDetails exams={displayedExams} />
                    </DialogContent>
                </Dialog>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                <div>
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onDayClick={handleDayClick}
                        className="w-full"
                        numberOfMonths={numberOfMonths}
                        fromMonth={firstExamDate}
                        toMonth={lastExamDate}
                        modifiers={{ examDay: examDays }}
                        modifiersClassNames={{
                            examDay: 'bg-primary/80 text-primary-foreground font-bold hover:bg-primary/90 focus:bg-primary/90',
                            day_selected: 'bg-primary text-primary-foreground ring-2 ring-primary-hover ring-offset-2',
                        }}
                    />
                </div>
                <div className="border-l pl-6 -ml-3">
                    <h2 className="text-lg font-semibold mb-2">
                        Schedule for {selectedDate ? format(selectedDate, 'PPP') : '...'}
                    </h2>
                    {selectedDate ? (
                        <ExamDetails exams={displayedExams} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <h1 className="text-lg font-semibold mb-2">Select a Day</h1>
                            <p className="text-sm text-muted-foreground">Click on a highlighted day in the calendar to see your exam schedule.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}


function StudentResitView() {
  const { user, specialResitTimetable, studentResitSelections, updateStudentResitSelection } = useUser();
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  
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
    let entries = specialResitTimetable.sheets.flatMap(sheet => 
        sheet.entries.flatMap(lecturerSchedule => 
            lecturerSchedule.courses
        )
    );

    if (courseSearchTerm) {
        const lowercasedFilter = courseSearchTerm.toLowerCase();
        entries = entries.filter(entry => 
            (entry.courseCode && entry.courseCode.toLowerCase().includes(lowercasedFilter)) ||
            (entry.courseName && entry.courseName.toLowerCase().includes(lowercasedFilter))
        );
    }

    return entries;
  }, [specialResitTimetable, courseSearchTerm]);

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
                    <div className="relative my-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by course code or name..."
                            className="pl-10"
                            value={courseSearchTerm}
                            onChange={(e) => setCourseSearchTerm(e.target.value)}
                        />
                    </div>
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
  const { user, emptySlots, isClassTimetableDistributed } = useUser();
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
            {!isClassTimetableDistributed ? (
                 <Card className="flex items-center justify-center p-12 bg-muted/50 border-dashed">
                    <CardContent className="text-center text-muted-foreground">
                    <p className="font-medium">Class Timetable Not Available</p>
                    <p className="text-sm">The class timetable will appear here once it's published.</p>
                    </CardContent>
                </Card>
            ) : (
            <>
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
            </>
            )}
        </TabsContent>
        <TabsContent value="exams" className="mt-6">
            <StudentExamsView />
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

function StaffExamsView({ examsTimetable }: { examsTimetable: ExamsTimetable | null }) {
    const { user } = useUser();
  
    const staffExams = useMemo(() => {
        if (!user || !examsTimetable || !examsTimetable.isDistributed) return [];
    
        const allExams = [...(examsTimetable.exams || []), ...(examsTimetable.practicals || [])];
        const staffName = user.name.toLowerCase();
        
        return allExams.filter(exam => 
          (exam.lecturer && exam.lecturer.toLowerCase().includes(staffName)) || 
          (exam.invigilator && exam.invigilator.toLowerCase().includes(staffName))
        );
      }, [user, examsTimetable]);
  
    if (!examsTimetable || !examsTimetable.isDistributed) {
      return (
        <Card className="flex items-center justify-center p-12 bg-muted/50 border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p className="font-medium">Exams Timetable Not Available</p>
            <p className="text-sm">The exams timetable will appear here once it's published.</p>
          </CardContent>
        </Card>
      );
    }
    
    const headers = ['Date', 'Period', 'Role', 'Course Code', 'Course Name', 'Room'];
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Exam Duties Schedule</CardTitle>
          <CardDescription>
            {staffExams.length > 0
              ? `You have ${staffExams.length} scheduled exam duties.`
              : "No exam duties found for you."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staffExams.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>{headers.map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow>
                </TableHeader>
                <TableBody>
                  {staffExams.map(exam => {
                    const staffName = user!.name.toLowerCase();
                    const isLecturer = exam.lecturer && exam.lecturer.toLowerCase().includes(staffName);
                    const isInvigilator = exam.invigilator && exam.invigilator.toLowerCase().includes(staffName);
                    let role = '';
                    if (isLecturer && isInvigilator) role = 'Lecturer & Invigilator';
                    else if (isLecturer) role = 'Lecturer';
                    else if (isInvigilator) role = 'Invigilator';

                    return (
                        <TableRow key={exam.id}>
                        <TableCell>{exam.dateStr}</TableCell>
                        <TableCell><Badge variant="outline">{exam.period}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{role}</Badge></TableCell>
                        <TableCell>
                            <div className="font-medium">{exam.courseCode}</div>
                            {exam.is_practical && <Badge variant="destructive" className="mt-1 font-normal">Practical</Badge>}
                        </TableCell>
                        <TableCell>{exam.courseName}</TableCell>
                        <TableCell>{exam.room}</TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>No exam duties found for you in the timetable.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

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
    
    const headers = ['Date', 'Course Code', 'Course Name', 'Department', 'Students', 'Room', 'Original Examiner', 'Session'];
  
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

const isLecturerMatch = (entryLecturerName: string, staffName: string): boolean => {
  if (!entryLecturerName || !staffName) return false;

  const entryNameLower = entryLecturerName.toLowerCase();
  
  // Get significant parts of the staff member's name from their profile
  const staffNameParts = staffName.toLowerCase()
    .replace(/^(dr|prof|mr|mrs|ms)\.?\s*/, '') // Remove common titles
    .split(' ')
    .filter(p => p.length > 1); // Ignore single initials/short parts

  if (staffNameParts.length === 0) return false;

  // Check if all significant parts of the staff's name are present in the entry's lecturer name
  return staffNameParts.every(part => entryNameLower.includes(part));
};

function StaffTimetableView({
  schedule,
  masterSchedule,
  emptySlots,
  addStaffSchedule,
  updateScheduleStatus,
  examsTimetable,
}: {
  schedule: TimetableEntry[];
  masterSchedule: TimetableEntry[] | null;
  emptySlots: EmptySlot[];
  addStaffSchedule: (entry: Omit<TimetableEntry, 'id' | 'status' | 'lecturer'>) => void;
  updateScheduleStatus: (entryId: number, status: EventStatus) => void;
  examsTimetable: ExamsTimetable | null;
}) {
  const { user, allDepartments, reviewedSchedules, rejectedEntries, rejectScheduleEntry, unrejectScheduleEntry, markScheduleAsReviewed, isClassTimetableDistributed } = useUser();
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
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
    
    const allEntriesForStaff = masterSchedule.filter(entry => isLecturerMatch(entry.lecturer, user.name));

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
        {!isClassTimetableDistributed ? (
            <Card className="flex items-center justify-center p-12 bg-muted/50 border-dashed">
                <CardContent className="text-center text-muted-foreground">
                    <p className="font-medium">Class Timetable Not Available</p>
                    <p className="text-sm">The class timetable will appear here once it's published by an administrator.</p>
                </CardContent>
            </Card>
        ) : (
        <>
          <LecturerReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => {
                if (user && !reviewedSchedules.includes(user.id)) {
                  markScheduleAsReviewed(user.id);
                }
                setIsReviewModalOpen(false);
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
                            <span className="break-all">{(course.departments || []).join(', ')}</span>
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
        )}
      </TabsContent>
       <TabsContent value="exams" className="mt-6">
            <StaffExamsView examsTimetable={examsTimetable} />
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

    const handleEditInputChange = (field: keyof SpecialResitEntry, value: string | number | null | Date) => {
        if (!editedFormData) return;
        
        let finalValue = value;
        if (field === 'date' && value instanceof Date) {
            finalValue = format(value, 'dd-MM-yyyy');
        }

        setEditedFormData({ ...editedFormData, [field]: finalValue });
    };

    const flattenedAndFilteredData = useMemo(() => {
      if (!parsedData) return [];
  
      let allEntries = parsedData.sheets.flatMap(sheet =>
        sheet.entries.flatMap(lecturerSchedule =>
          lecturerSchedule.courses.map(course => ({
            ...course,
            assignedLecturer: lecturerSchedule.lecturer,
          }))
        )
      );

      if (showInvalid) {
        allEntries = allEntries.filter(entry => String(entry.assignedLecturer).toLowerCase().includes('unassigned'));
      }

      if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        allEntries = allEntries.filter(entry =>
            Object.values(entry).some(value =>
              String(value).toLowerCase().includes(lowercasedFilter)
            )
        );
      }
      return allEntries.sort((a, b) => {
        try {
            const [dayA, monthA, yearA] = a.date!.split('-').map(Number);
            const [dayB, monthB, yearB] = b.date!.split('-').map(Number);
            
            const dateA = new Date(yearA, monthA - 1, dayA);
            const dateB = new Date(yearB, monthB - 1, dayB);

            if (dateA.getTime() > dateB.getTime()) return 1;
            if (dateA.getTime() < dateB.getTime()) return -1;
            return 0;
        } catch (e) {
            return 0;
        }
      });
    }, [parsedData, searchTerm, showInvalid]);
  
    if (!parsedData) {
      return (
        <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Upload a special resit timetable to begin.</p>
        </div>
      );
    }
    
    const totalEntries = parsedData.sheets.flatMap(s => s.entries).reduce((acc, ls) => acc + ls.courses.length, 0);
    const headers = ['Date', 'Course Code', 'Course Name', 'Department', 'Students', 'Room', 'Assigned Lecturer', 'Session'];

    return (
      <div className="space-y-6">
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
                <Accordion type="multiple" className="w-full">
                    <div className="overflow-x-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {headers.map((header) => (
                                        <TableHead key={header}>{header}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {flattenedAndFilteredData.length > 0 ? (
                                    flattenedAndFilteredData.map((row) => (
                                        <TableRow key={`${row.id}-${(row as any).assignedLecturer}`} onClick={() => handleRowClick(row)} className={cn(!parsedData.isDistributed && "cursor-pointer")}>
                                            <TableCell>{row.date}</TableCell>
                                            <TableCell>{row.courseCode}</TableCell>
                                            <TableCell>{row.courseName}</TableCell>
                                            <TableCell>{row.department}</TableCell>
                                            <TableCell>{row.numberOfStudents}</TableCell>
                                            <TableCell>{row.room}</TableCell>
                                            <TableCell>{(row as any).assignedLecturer}</TableCell>
                                            <TableCell>{row.session}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={headers.length} className="h-24 text-center">
                                            No results found for your filter.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Accordion>
            </CardContent>
        </Card>
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal",
                          !editedFormData?.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editedFormData?.date ? editedFormData.date : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editedFormData?.date ? new Date(editedFormData.date.split('-').reverse().join('-')) : undefined}
                        onSelect={(date) => handleEditInputChange('date', date || '')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
      </div>
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
  isExamsTimetable = false,
  onViewPracticals,
  onAddExam,
  isDistributed,
  onDistribute,
}: {
  parsedData: TimetableEntry[] | ExamEntry[] | null;
  setParsedData: (data: any[] | null) => void;
  emptySlots: EmptySlot[];
  searchTerm: string;
  showInvalid: boolean;
  title: string;
  description: string;
  placeholder: string;
  isExamsTimetable?: boolean;
  onViewPracticals?: () => void;
  onAddExam?: () => void;
  isDistributed?: boolean;
  onDistribute?: () => void;
}) {
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | ExamEntry | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editedFormData, setEditedFormData] = useState<TimetableEntry | ExamEntry | null>(null);
  const [isDistributeConfirmOpen, setIsDistributeConfirmOpen] = useState(false);
  const { allDepartments } = useUser();

  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  
  const availableSlotsForEdit = useMemo(() => {
    if (!editedFormData) return { rooms: [], times: [], startTimes: [], endTimes: [] };
    const day = 'day' in editedFormData ? editedFormData.day : '';
    const room = 'room' in editedFormData ? editedFormData.room : '';

    const daySlots = emptySlots.filter(slot => slot.day === day);
    const rooms = [...new Set(daySlots.map(slot => slot.location))];
    const roomDaySlots = daySlots.filter(slot => slot.location === room).map(s => s.time).sort((a, b) => parseInt(a.split(':')[0]) - parseInt(b.split(':')[0]));
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

  useEffect(() => {
    if (selectedEntry && isEditModalOpen) {
      setEditedFormData(selectedEntry);
      if (!isExamsTimetable && 'time' in selectedEntry && selectedEntry.time) {
        const [start, end] = selectedEntry.time.split(' - ');
        setStartTime(start?.trim() || '');
        setEndTime(end?.trim() || '');
      }
    }
  }, [selectedEntry, isEditModalOpen, isExamsTimetable]);

  const handleRowClick = (entry: TimetableEntry | ExamEntry) => {
    if (isDistributed) return;
    setSelectedEntry(entry);
    setIsActionModalOpen(true);
  };
  
  const handleDeleteRow = () => {
    if (!selectedEntry || !parsedData) return;
    setParsedData(parsedData.filter(item => item.id !== selectedEntry.id));
    closeAllModals();
  };
  
  const handleSaveEdit = () => {
     if (!editedFormData || !parsedData) return;
     const updatedEntry = { ...editedFormData, time: isExamsTimetable ? (editedFormData as any).period : `${startTime} - ${endTime}` };
     setParsedData(parsedData.map(item => item.id === updatedEntry.id ? updatedEntry : item));
     closeAllModals();
  };

  const handleEditInputChange = (field: keyof ExamEntry | "period" | "class" | "invigilator" | "courseName" | "is_practical", value: string | number | string[] | boolean) => {
    if (!editedFormData) return;
    
    let updatedData: any = { ...editedFormData, [field]: value };
    if (field === 'room' && !isExamsTimetable) {
      setStartTime('');
      setEndTime('');
    }
    
    setEditedFormData(updatedData as TimetableEntry | ExamEntry);
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
        data = data.filter(entry => (entry as any).lecturer?.toLowerCase() === 'tba' || (entry as any).lecturer?.toLowerCase() === 'unknown' || (entry as any).invigilator?.toLowerCase() === 'tba' || (entry as any).invigilator?.toLowerCase() === 'unknown');
    }
    
    if (!searchTerm) return data;

    const lowercasedFilter = searchTerm.toLowerCase();
    return data.filter(entry => 
      Object.values(entry).some(val => 
        String(val).toLowerCase().includes(lowercasedFilter)
      )
    );
  }, [parsedData, searchTerm, showInvalid]);

  const groupedByDate = useMemo(() => {
    if (!filteredData) return {};
    
    return filteredData.reduce((acc, entry) => {
      const key = isExamsTimetable ? (entry as any).dateStr : (entry as any).day;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(entry);
      return acc;
    }, {} as Record<string, (TimetableEntry | ExamEntry)[]>);
  }, [filteredData, isExamsTimetable]);
  
  const groupKeys = Object.keys(groupedByDate).sort((a, b) => {
    if (isExamsTimetable) {
        try {
            const dateA = new Date(a.split('-').reverse().join('-')).getTime();
            const dateB = new Date(b.split('-').reverse().join('-')).getTime();
            return dateA - dateB;
        } catch(e) { return 0; }
    }
    return days.indexOf(a) - days.indexOf(b);
  });

  const examsTableHeaders = ['Period', 'Course Code', 'Course Name', 'Class', 'Room', 'Lecturer', 'Invigilator'];
  const classTableHeaders = ['Time', 'Room', 'Course', 'Lecturer', 'Departments', 'Level'];

  if (!parsedData) {
    return (
      <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">{placeholder}</p>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className={cn("flex justify-between items-start", (isExamsTimetable || onDistribute) && "flex-col sm:flex-row gap-2")}>
            <div>
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
            </div>
            <div className='flex gap-2'>
                {onDistribute && (
                    isDistributed ? (
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
                                    This will make the timetable visible to all relevant users. This action cannot be undone. Are you sure you want to proceed?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => {
                                    onDistribute();
                                    setIsDistributeConfirmOpen(false);
                                }}>Distribute</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )
                )}
                {isExamsTimetable && onAddExam && !isDistributed && (
                    <Button variant="outline" onClick={onAddExam}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Exam
                    </Button>
                )}
                {isExamsTimetable && onViewPracticals && (
                    <Button variant="outline" onClick={onViewPracticals}>
                    <FlaskConical className="h-4 w-4 mr-2" />
                    View Practicals
                    </Button>
                )}
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {isExamsTimetable ? (
            <Accordion type="multiple" className="w-full space-y-4">
              {groupKeys.map(key => {
                const sortedEntries = [...(groupedByDate[key] as ExamEntry[])].sort((a, b) => {
                    const periodOrder: { [key: string]: number } = { 'Morning': 1, 'Afternoon': 2, 'Evening': 3, 'Unknown': 4 };
                    const aPeriod = a.period || 'Unknown';
                    const bPeriod = b.period || 'Unknown';
                    return periodOrder[aPeriod] - periodOrder[bPeriod];
                });
                
                return (
                  <Card key={key} className="overflow-hidden">
                    <AccordionItem value={key} className="border-b-0">
                      <AccordionTrigger className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors [&[data-state=open]>svg]:rotate-180">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-base">{key}</span>
                          <Badge variant="secondary">{groupedByDate[key]?.length || 0} exams</Badge>
                        </div>
                        <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200" />
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="overflow-x-auto">
                            <Table>
                            <TableHeader>
                                <TableRow>
                                {examsTableHeaders.map(header => (
                                    <TableHead key={header} className="font-semibold text-foreground/80">{header}</TableHead>
                                ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedEntries.map((entry: any) => (
                                <TableRow key={entry.id} onClick={() => handleRowClick(entry)} className={cn(!isDistributed && "cursor-pointer")}>
                                    <TableCell>
                                      <Badge variant={entry.period === 'Morning' ? 'default' : entry.period === 'Afternoon' ? 'secondary' : 'outline'} className="font-medium">{entry.period}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{entry.courseCode}</div>
                                        {entry.is_practical && <Badge variant="destructive" className="mt-1 font-normal">Practical</Badge>}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{entry.courseName}</TableCell>
                                    <TableCell className="text-muted-foreground">{entry.class}</TableCell>
                                    <TableCell className="font-medium">{entry.room}</TableCell>
                                    <TableCell className="text-muted-foreground">{entry.lecturer}</TableCell>
                                    <TableCell className="text-muted-foreground">{entry.invigilator}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                            </Table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Card>
                );
              })}
              {groupKeys.length === 0 && (searchTerm || showInvalid) && (
                  <div className="text-center p-12 text-muted-foreground">
                    <p>No results found for your filter criteria.</p>
                  </div>
              )}
            </Accordion>
          ) : (
            <Tabs defaultValue={days[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                {days.map(day => (
                    <TabsTrigger key={day} value={day} className="text-xs sm:text-sm">{day.substring(0,3)}</TabsTrigger>
                ))}
                </TabsList>
                <div className="py-6">
                {days.map(day => (
                    <TabsContent key={day} value={day}>
                    {groupedByDate[day] && groupedByDate[day].length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    {classTableHeaders.map(header => (
                                        <TableHead key={header} className="font-semibold text-foreground/80">{header}</TableHead>
                                    ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedByDate[day].map((entry: any) => (
                                        <TableRow key={entry.id} onClick={() => handleRowClick(entry)} className={cn(!isDistributed && "cursor-pointer")}>
                                            <TableCell className="whitespace-nowrap font-medium">{entry.time}</TableCell>
                                            <TableCell className="font-medium">{entry.room}</TableCell>
                                            <TableCell className="font-medium">{entry.courseCode}</TableCell>
                                            <TableCell className="text-muted-foreground">{entry.lecturer}</TableCell>
                                            <TableCell className="text-muted-foreground">{(entry.departments || []).join(', ')}</TableCell>
                                            <TableCell className="text-muted-foreground">{entry.level}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center p-12 text-muted-foreground">
                            <p>No classes scheduled for {day}.</p>
                        </div>
                    )}
                    </TabsContent>
                ))}
                </div>
            </Tabs>
          )}
          {groupKeys.length === 0 && (searchTerm || showInvalid) && (
              <div className="text-center p-12 text-muted-foreground">
                <p>No results found for your filter criteria.</p>
              </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modals */}
      <Dialog open={isActionModalOpen} onOpenChange={closeAllModals}>
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
      
      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Timetable Entry</DialogTitle>
            <DialogDescription>
              Make changes to the entry here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
            {isExamsTimetable ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exam-period" className="text-right">Period</Label>
                         <Select value={(editedFormData as any)?.period || ''} onValueChange={(value) => handleEditInputChange('period', value)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Morning">Morning</SelectItem>
                                <SelectItem value="Afternoon">Afternoon</SelectItem>
                                <SelectItem value="Evening">Evening</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exam-courseCode" className="text-right">Course Code</Label>
                        <Input id="exam-courseCode" value={editedFormData?.courseCode || ''} onChange={(e) => handleEditInputChange('courseCode', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exam-courseName" className="text-right">Course Name</Label>
                        <Input id="exam-courseName" value={(editedFormData as any)?.courseName || ''} onChange={(e) => handleEditInputChange('courseName', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exam-class" className="text-right">Class</Label>
                        <Input id="exam-class" value={(editedFormData as any)?.class || ''} onChange={(e) => handleEditInputChange('class', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exam-room" className="text-right">Room</Label>
                        <Input id="exam-room" value={editedFormData?.room || ''} onChange={(e) => handleEditInputChange('room', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exam-lecturer" className="text-right">Lecturer</Label>
                        <Input id="exam-lecturer" value={editedFormData?.lecturer || ''} onChange={(e) => handleEditInputChange('lecturer', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exam-invigilator" className="text-right">Invigilator</Label>
                        <Input id="exam-invigilator" value={(editedFormData as any)?.invigilator || ''} onChange={(e) => handleEditInputChange('invigilator', e.target.value)} className="col-span-3" />
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="room" className="text-right">Room</Label>
                    <Select
                        value={('room' in (editedFormData || {})) ? (editedFormData as any).room : ''}
                        onValueChange={(value) => handleEditInputChange('room', value)}
                        >
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a room" />
                        </SelectTrigger>
                        <SelectContent>
                            {editedFormData?.room && <SelectItem value={editedFormData.room} disabled>
                                {editedFormData.room} (Current)
                            </SelectItem>}
                            {availableSlotsForEdit.rooms.map(room => (
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
                            {availableSlotsForEdit.startTimes.map(time => (
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
                            {availableSlotsForEdit.endTimes.map(time => (
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
                        value={('departments' in (editedFormData || {})) ? (editedFormData as any).departments[0] || '' : ''}
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
                        value={String(('level' in (editedFormData || {})) ? (editedFormData as any).level : '')}
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
                </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeAllModals}>Cancel</Button>
            <Button type="submit" onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type TabStatus = 'empty' | 'uploaded' | 'distributed';

function TabStatusIndicator({ status }: { status: TabStatus }) {
  const statusConfig: Record<TabStatus, { text: string; color: string; textColor: string }> = {
    empty: { text: 'Empty', color: 'bg-gray-200 dark:bg-gray-700', textColor: 'text-gray-600 dark:text-gray-300' },
    uploaded: { text: 'Uploaded', color: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-600 dark:text-yellow-300' },
    distributed: { text: 'Distributed', color: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-600 dark:text-green-300' },
  };

  const { text, color, textColor } = statusConfig[status];

  return (
    <div className={cn("ml-2 flex items-center gap-1.5 py-0.5 px-2 rounded-full", color)}>
      <div className={cn("h-2 w-2 rounded-full", color.replace(/bg-([a-z]+)-[0-9]{2,3}/, "bg-$1-500"))} />
      <span className={cn("text-xs font-medium", textColor)}>{text}</span>
    </div>
  );
}

function AdminTimetableView() {
  const { 
      masterSchedule, setMasterSchedule, 
      emptySlots, setEmptySlots,
      specialResitTimetable, setSpecialResitTimetable,
      examsTimetable, setExamsTimetable,
      isClassTimetableDistributed, distributeClassTimetable,
      distributeExamsTimetable
  } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('class');

  // State for Class Timetable
  const [isClassLoading, setIsClassLoading] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [classShowInvalid, setClassShowInvalid] = useState(false);

  // State for Exams Timetable
  const [isExamsLoading, setIsExamsLoading] = useState(false);
  const [examsError, setExamsError] = useState<string | null>(null);
  const [examsSearchTerm, setExamsSearchTerm] = useState('');
  const [examsShowInvalid, setExamsShowInvalid] = useState(false);
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
  
  // State for Practical Exams
  const [isPracticalsModalOpen, setIsPracticalsModalOpen] = useState(false);
  const [isPracticalsLoading, setIsPracticalsLoading] = useState(false);
  const [practicalsError, setPracticalsError] = useState<string | null>(null);
  const [isAddPracticalModalOpen, setIsAddPracticalModalOpen] = useState(false);
  
  // State for editing practicals
  const [selectedPractical, setSelectedPractical] = useState<any | null>(null);
  const [isEditPracticalModalOpen, setIsEditPracticalModalOpen] = useState(false);
  const [isDeletePracticalConfirmOpen, setIsDeletePracticalConfirmOpen] = useState(false);
  const [editedPracticalData, setEditedPracticalData] = useState<any | null>(null);

  // State for Resit Timetable
  const [isResitLoading, setIsResitLoading] = useState(false);
  const [resitError, setResitError] = useState<string | null>(null);
  const [resitSearchTerm, setResitSearchTerm] = useState('');
  const [resitShowInvalid, setResitShowInvalid] = useState(false);

  const activeLoadingState = useMemo(() => {
    switch (activeTab) {
        case 'class': return { isLoading: isClassLoading, setIsLoading: setIsClassLoading };
        case 'exams': return { isLoading: isExamsLoading, setIsLoading: setIsExamsLoading };
        case 'resit': return { isLoading: isResitLoading, setIsLoading: setIsResitLoading };
        default: return { isLoading: false, setIsLoading: () => {} };
    }
  }, [activeTab, isClassLoading, isExamsLoading, isResitLoading]);

  const activeErrorState = useMemo(() => {
    switch (activeTab) {
        case 'class': return { error: classError, setError: setClassError };
        case 'exams': return { error: examsError, setError: setExamsError };
        case 'resit': return { error: resitError, setError: setResitError };
        default: return { error: null, setError: () => {} };
    }
  }, [activeTab, classError, examsError, resitError]);
  
  const activeSearchState = useMemo(() => {
    switch (activeTab) {
        case 'class': return { searchTerm: classSearchTerm, setSearchTerm: setClassSearchTerm, showInvalid: classShowInvalid, setShowInvalid: setClassShowInvalid };
        case 'exams': return { searchTerm: examsSearchTerm, setSearchTerm: setExamsSearchTerm, showInvalid: examsShowInvalid, setShowInvalid: setExamsShowInvalid };
        case 'resit': return { searchTerm: resitSearchTerm, setSearchTerm: setResitSearchTerm, showInvalid: resitShowInvalid, setShowInvalid: setResitShowInvalid };
        default: return { searchTerm: '', setSearchTerm: () => {}, showInvalid: false, setShowInvalid: () => {} };
    }
  }, [activeTab, classSearchTerm, classShowInvalid, examsSearchTerm, examsShowInvalid, resitSearchTerm, resitShowInvalid]);

  const currentParsedData = useMemo(() => {
    if (activeTab === 'class') return masterSchedule;
    if (activeTab === 'exams') return examsTimetable;
    if (activeTab === 'resit') return specialResitTimetable;
    return null;
  }, [activeTab, masterSchedule, examsTimetable, specialResitTimetable]);

  
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    activeLoadingState.setIsLoading(true);
    activeErrorState.setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileData = Buffer.from(arrayBuffer).toString('base64');
      
      if (activeTab === 'class') {
        const data = await handleFileUpload(fileData);
        if (!data || (Array.isArray(data) && data.length === 0)) {
            setClassError("The uploaded file could not be parsed or contains no valid schedule data. Please check the file format.");
            setMasterSchedule(null);
            setEmptySlots([]);
        } else {
            const slots = await findEmptyClassrooms(fileData);
            const dataWithIdsAndStatus = data.map((item, index) => ({ ...item, id: index, status: 'undecided' as EventStatus }));
            setMasterSchedule(dataWithIdsAndStatus);
            setEmptySlots(slots);
        }
      } else if (activeTab === 'exams') {
        const data = await handleExamsUpload(fileData);
        setExamsTimetable({ exams: data.exams, practicals: data.practicals, isDistributed: false });
      } else if (activeTab === 'resit') {
        const data = await handleSpecialResitUpload(fileData);
         if (!data) {
             setResitError("The uploaded file could not be parsed or contains no valid schedule data. Please check the file format.");
             setSpecialResitTimetable(null);
         } else {
             setSpecialResitTimetable(data);
         }
      }

    } catch (err) {
      activeErrorState.setError(err instanceof Error ? err.message : "An unexpected error occurred during file parsing.");
    } finally {
      activeLoadingState.setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteAll = () => {
    if(activeTab === 'class') {
        setMasterSchedule(null);
        setEmptySlots([]);
        setClassError(null);
        setClassSearchTerm('');
        setClassShowInvalid(false);
    } else if (activeTab === 'exams') {
        setExamsTimetable(null);
        setExamsError(null);
        setExamsSearchTerm('');
        setExamsShowInvalid(false);
    } else if (activeTab === 'resit') {
        setSpecialResitTimetable(null);
        setResitError(null);
        setResitSearchTerm('');
        setResitShowInvalid(false);
    }
  };
  
  const handleAddExam = (newExam: any) => {
    setExamsTimetable(prev => {
        const exams = [...(prev?.exams || []), newExam];
        return { ...(prev || { exams: [], practicals: [], isDistributed: false }), exams };
    });
  };
  
  const handleAddPractical = (newPractical: any) => {
    setExamsTimetable(prev => {
        const practicals = [...(prev?.practicals || []), newPractical];
        return { ...(prev || { exams: [], practicals: [], isDistributed: false }), practicals };
    });
  };

  const groupedPracticals = useMemo(() => {
    if (!examsTimetable?.practicals) return {};
    return examsTimetable.practicals.reduce((acc, entry) => {
        const key = entry.dateStr;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(entry);
        return acc;
    }, {} as Record<string, any[]>);
  }, [examsTimetable?.practicals]);

  const practicalGroupKeys = Object.keys(groupedPracticals).sort((a, b) => {
    try {
        const dateA = new Date(a.split('-').reverse().join('-')).getTime();
        const dateB = new Date(b.split('-').reverse().join('-')).getTime();
        return dateA - dateB;
    } catch(e) { return 0; }
  });

  const openPracticalEditModal = (practical: any) => {
    setSelectedPractical(practical);
    setEditedPracticalData(practical);
    setIsEditPracticalModalOpen(true);
  };
  
  const closeAllPracticalModals = () => {
      setSelectedPractical(null);
      setEditedPracticalData(null);
      setIsEditPracticalModalOpen(false);
      setIsDeletePracticalConfirmOpen(false);
  };

  const handlePracticalEditInputChange = (field: string, value: string) => {
      setEditedPracticalData((prev: any) => ({...prev, [field]: value}));
  };

  const handleSavePracticalEdit = () => {
      if (!editedPracticalData) return;
      setExamsTimetable(prev => {
        const practicals = prev!.practicals.map(p => p.id === editedPracticalData.id ? editedPracticalData : p);
        return { ...prev!, practicals };
      });
      closeAllPracticalModals();
  };
  
  const handleDeletePractical = () => {
      if (!selectedPractical) return;
       setExamsTimetable(prev => {
        const practicals = prev!.practicals.filter(p => p.id !== selectedPractical.id);
        return { ...prev!, practicals };
      });
      closeAllPracticalModals();
  };

  const classStatus: TabStatus = isClassTimetableDistributed ? 'distributed' : (masterSchedule && masterSchedule.length > 0) ? 'uploaded' : 'empty';
  const examsStatus: TabStatus = examsTimetable?.isDistributed ? 'distributed' : (examsTimetable && (examsTimetable.exams.length > 0 || examsTimetable.practicals.length > 0)) ? 'uploaded' : 'empty';
  const resitStatus: TabStatus = specialResitTimetable?.isDistributed ? 'distributed' : (specialResitTimetable && specialResitTimetable.sheets.length > 0) ? 'uploaded' : 'empty';
  
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
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleUploadClick} disabled={activeLoadingState.isLoading}>
                  {activeLoadingState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="sr-only">Upload New</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload New Timetable</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant={activeSearchState.showInvalid ? "secondary" : "outline"} size="icon" onClick={() => activeSearchState.setShowInvalid(!activeSearchState.showInvalid)} disabled={!currentParsedData}>
                  <FilterX className="h-4 w-4" />
                  <span className="sr-only">Filter for review</span>
                  </Button>
              </TooltipTrigger>
              <TooltipContent>
                  <p>Filter for review</p>
              </TooltipContent>
            </Tooltip>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" disabled={!currentParsedData}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                </Button>
              </AlertDialogTrigger>
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
          </TooltipProvider>
        </div>
        {currentParsedData && (
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search course, lecturer, room, department..."
              className="pl-10"
              value={activeSearchState.searchTerm}
              onChange={(e) => activeSearchState.setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

       {activeErrorState.error && (
         <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{activeErrorState.error}</AlertDescription>
         </Alert>
      )}

      <Tabs defaultValue="class" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="class">Class Timetable <TabStatusIndicator status={classStatus} /></TabsTrigger>
          <TabsTrigger value="exams">Exams Timetable <TabStatusIndicator status={examsStatus} /></TabsTrigger>
          <TabsTrigger value="resit">Special Resit <TabStatusIndicator status={resitStatus} /></TabsTrigger>
        </TabsList>
        <TabsContent value="class" className="mt-6">
          <TimetableDisplay
            parsedData={masterSchedule}
            setParsedData={setMasterSchedule as any}
            emptySlots={emptySlots}
            searchTerm={classSearchTerm}
            showInvalid={classShowInvalid}
            title="Parsed Class Timetable Preview"
            description={`A total of ${masterSchedule?.length || 0} entries were found. Click a row to edit or delete.`}
            placeholder="Upload a class timetable to begin."
            isDistributed={isClassTimetableDistributed}
            onDistribute={distributeClassTimetable}
          />
        </TabsContent>
        <TabsContent value="exams" className="mt-6">
           <TimetableDisplay
            parsedData={examsTimetable?.exams ?? null}
            setParsedData={(data) => setExamsTimetable(prev => ({ ...(prev || { exams: [], practicals: [], isDistributed: false }), exams: data || [] }))}
            emptySlots={[]}
            searchTerm={examsSearchTerm}
            showInvalid={examsShowInvalid}
            title="Parsed Exams Timetable Preview"
            description={`A total of ${examsTimetable?.exams.length || 0} exam entries were found.`}
            placeholder="Upload an exams timetable to begin."
            isExamsTimetable={true}
            onViewPracticals={() => setIsPracticalsModalOpen(true)}
            onAddExam={() => setIsAddExamModalOpen(true)}
            isDistributed={examsTimetable?.isDistributed}
            onDistribute={distributeExamsTimetable}
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
      <AddExamDialog
        isOpen={isAddExamModalOpen}
        onClose={() => setIsAddExamModalOpen(false)}
        onAddExam={handleAddExam}
       />
      <Dialog open={isPracticalsModalOpen} onOpenChange={setIsPracticalsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className='flex-row items-center justify-between'>
            <div>
                <DialogTitle>Practical Exams Timetable</DialogTitle>
                <DialogDescription>
                  The following practical exams were found in the uploaded file.
                </DialogDescription>
            </div>
            <Button variant="outline" onClick={() => setIsAddPracticalModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Practical
            </Button>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto my-4 pr-4">
            {isPracticalsLoading && <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            {practicalsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{practicalsError}</AlertDescription>
              </Alert>
            )}
            {examsTimetable?.practicals && (
              examsTimetable.practicals.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-4">
                    {practicalGroupKeys.map(key => (
                        <Card key={key} className="overflow-hidden">
                            <AccordionItem value={key} className="border-b-0">
                                <AccordionTrigger className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors [&[data-state=open]>svg]:rotate-180">
                                    <div className="flex items-center gap-4">
                                        <span className="font-semibold text-base">{key}</span>
                                        <Badge variant="secondary">{groupedPracticals[key]?.length || 0} practicals</Badge>
                                    </div>
                                    <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200" />
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Period</TableHead>
                                                    <TableHead>Course</TableHead>
                                                    <TableHead>Class</TableHead>
                                                    <TableHead>Room</TableHead>
                                                    <TableHead>Examiner</TableHead>
                                                    <TableHead>Invigilator</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {groupedPracticals[key].map((prac: any) => (
                                                <TableRow key={prac.id} onClick={() => openPracticalEditModal(prac)} className="cursor-pointer">
                                                    <TableCell><Badge variant={prac.period === 'Morning' ? 'default' : prac.period === 'Afternoon' ? 'secondary' : 'outline'}>{prac.period}</Badge></TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{prac.courseCode}</div>
                                                        <div className="text-sm text-muted-foreground">{prac.courseName}</div>
                                                    </TableCell>
                                                    <TableCell>{prac.class}</TableCell>
                                                    <TableCell>{prac.room}</TableCell>
                                                    <TableCell>{prac.lecturer}</TableCell>
                                                    <TableCell>{prac.invigilator}</TableCell>
                                                </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Card>
                    ))}
                </Accordion>
              ) : (
                <div className="text-center p-12 text-muted-foreground">
                  <p>No practical exams found in the 'PRACTICAL' sheet of the uploaded file.</p>
                </div>
              )
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPracticalsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Practical Modal */}
      <Dialog open={isEditPracticalModalOpen} onOpenChange={closeAllPracticalModals}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Practical Exam</DialogTitle>
            <DialogDescription>Make changes to this practical exam entry.</DialogDescription>
          </DialogHeader>
          {editedPracticalData && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prac-date" className="text-right">Date</Label>
                <Input id="prac-date" value={editedPracticalData.dateStr} onChange={(e) => handlePracticalEditInputChange('dateStr', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prac-course" className="text-right">Course</Label>
                <Input id="prac-course" value={editedPracticalData.courseCode} onChange={(e) => handlePracticalEditInputChange('courseCode', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prac-class" className="text-right">Class</Label>
                <Input id="prac-class" value={editedPracticalData.class} onChange={(e) => handlePracticalEditInputChange('class', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prac-room" className="text-right">Room</Label>
                <Input id="prac-room" value={editedPracticalData.room} onChange={(e) => handlePracticalEditInputChange('room', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prac-examiner" className="text-right">Examiner</Label>
                <Input id="prac-examiner" value={editedPracticalData.lecturer} onChange={(e) => handlePracticalEditInputChange('lecturer', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prac-invigilator" className="text-right">Invigilator</Label>
                <Input id="prac-invigilator" value={editedPracticalData.invigilator} onChange={(e) => handlePracticalEditInputChange('invigilator', e.target.value)} className="col-span-3" />
              </div>
            </div>
          )}
          <DialogFooter className="justify-between">
            <AlertDialog open={isDeletePracticalConfirmOpen} onOpenChange={setIsDeletePracticalConfirmOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4"/> Delete
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this practical exam entry.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={closeAllPracticalModals}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeletePractical}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
                <Button variant="ghost" onClick={closeAllPracticalModals}>Cancel</Button>
                <Button onClick={handleSavePracticalEdit}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AddPracticalDialog
        isOpen={isAddPracticalModalOpen}
        onClose={() => setIsAddPracticalModalOpen(false)}
        onAddPractical={handleAddPractical}
       />
    </div>
  );
}


const initialExamState = {
    date: undefined,
    dateStr: '',
    period: '',
    courseCode: '',
    courseName: '',
    class: '',
    room: '',
    lecturer: '',
    invigilator: '',
};

function AddExamDialog({ isOpen, onClose, onAddExam }: { isOpen: boolean; onClose: () => void; onAddExam: (exam: any) => void; }) {
    const [examData, setExamData] = useState<any>(initialExamState);

    const handleInputChange = (field: string, value: any) => {
        setExamData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setExamData((prev: any) => ({
                ...prev,
                date: date,
                dateStr: format(date, 'dd-MM-yyyy')
            }));
        }
    };

    const handleSave = () => {
        const newExam = {
            ...examData,
            id: Date.now(), // Unique ID for the new entry
            day: examData.date ? format(examData.date, 'EEEE') : '',
        };
        onAddExam(newExam);
        setExamData(initialExamState);
        onClose();
    };

    const canSave = examData.dateStr && examData.period && examData.courseCode;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Exam Entry</DialogTitle>
                    <DialogDescription>Fill in the details for the new exam and click 'Add Entry' to save.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "col-span-3 justify-start text-left font-normal",
                                        !examData.date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {examData.date ? format(examData.date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={examData.date}
                                    onSelect={handleDateSelect}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="period" className="text-right">Period</Label>
                        <Select onValueChange={(value) => handleInputChange('period', value)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Morning">Morning</SelectItem>
                                <SelectItem value="Afternoon">Afternoon</SelectItem>
                                <SelectItem value="Evening">Evening</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="courseCode" className="text-right">Course Code</Label>
                        <Input id="courseCode" value={examData.courseCode} onChange={(e) => handleInputChange('courseCode', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="courseName" className="text-right">Course Name</Label>
                        <Input id="courseName" value={examData.courseName} onChange={(e) => handleInputChange('courseName', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="class" className="text-right">Class</Label>
                        <Input id="class" value={examData.class} onChange={(e) => handleInputChange('class', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="room" className="text-right">Room</Label>
                        <Input id="room" value={examData.room} onChange={(e) => handleInputChange('room', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lecturer" className="text-right">Lecturer</Label>
                        <Input id="lecturer" value={examData.lecturer} onChange={(e) => handleInputChange('lecturer', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="invigilator" className="text-right">Invigilator</Label>
                        <Input id="invigilator" value={examData.invigilator} onChange={(e) => handleInputChange('invigilator', e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!canSave}>Add Entry</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AddPracticalDialog({ isOpen, onClose, onAddPractical }: { isOpen: boolean; onClose: () => void; onAddPractical: (exam: any) => void; }) {
    const [practicalData, setPracticalData] = useState<any>(initialExamState);

    const handleInputChange = (field: string, value: any) => {
        setPracticalData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setPracticalData((prev: any) => ({
                ...prev,
                date: date,
                dateStr: format(date, 'dd-MM-yyyy')
            }));
        }
    };

    const handleSave = () => {
        const newPractical = {
            ...practicalData,
            id: Date.now(), // Unique ID for the new entry
            day: practicalData.date ? format(practicalData.date, 'EEEE') : '',
            is_practical: true,
        };
        onAddPractical(newPractical);
        setPracticalData(initialExamState);
        onClose();
    };

    const canSave = practicalData.dateStr && practicalData.period && practicalData.courseCode;

    return (
        <Dialog open={isOpen} onOpenChange={(isOpen) => { if (!isOpen) { setPracticalData(initialExamState); } onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Practical Entry</DialogTitle>
                    <DialogDescription>Fill in the details for the new practical exam.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "col-span-3 justify-start text-left font-normal",
                                        !practicalData.date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {practicalData.date ? format(practicalData.date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={practicalData.date}
                                    onSelect={handleDateSelect}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="period" className="text-right">Period</Label>
                        <Select onValueChange={(value) => handleInputChange('period', value)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Morning">Morning</SelectItem>
                                <SelectItem value="Afternoon">Afternoon</SelectItem>
                                <SelectItem value="Evening">Evening</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="courseCode" className="text-right">Course Code</Label>
                        <Input id="courseCode" value={practicalData.courseCode} onChange={(e) => handleInputChange('courseCode', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="courseName" className="text-right">Course Name</Label>
                        <Input id="courseName" value={practicalData.courseName} onChange={(e) => handleInputChange('courseName', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="class" className="text-right">Class</Label>
                        <Input id="class" value={practicalData.class} onChange={(e) => handleInputChange('class', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="room" className="text-right">Room</Label>
                        <Input id="room" value={practicalData.room} onChange={(e) => handleInputChange('room', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lecturer" className="text-right">Examiner</Label>
                        <Input id="lecturer" value={practicalData.lecturer} onChange={(e) => handleInputChange('lecturer', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="invigilator" className="text-right">Invigilator</Label>
                        <Input id="invigilator" value={practicalData.invigilator} onChange={(e) => handleInputChange('invigilator', e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!canSave}>Add Entry</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function TimetablePage({ setStudentSchedule }: { setStudentSchedule?: (schedule: TimetableEntry[]) => void }) {
  const { 
    user, 
    masterSchedule, 
    setMasterSchedule,
    updateScheduleStatus,
    emptySlots, 
    setEmptySlots,
    staffSchedules,
    addStaffSchedule,
    examsTimetable,
    isClassTimetableDistributed,
  } = useUser();
  
  const combinedSchedule = useMemo(() => {
    if (!isClassTimetableDistributed) return [];
    return [...(masterSchedule || []), ...staffSchedules];
  }, [masterSchedule, staffSchedules, isClassTimetableDistributed]);

  // Derived states are now calculated within the render logic using useMemo
  const staffSchedule = useMemo(() => {
    if (!combinedSchedule || !user || user.role !== 'staff') return [];
    
    return combinedSchedule.filter(entry => 
      isLecturerMatch(entry.lecturer, user.name)
    );
  }, [combinedSchedule, user]);

  const studentSchedule = useMemo(() => {
    if (!combinedSchedule || !user || user.role !== 'student') return [];

    return combinedSchedule.filter(entry =>
        entry.level === user.level &&
        user.department &&
        (entry.departments || []).includes(user.department)
      );
  }, [combinedSchedule, user]);

  useEffect(() => {
    if (user?.role === 'student' && setStudentSchedule) {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todaysStudentSchedule = studentSchedule.filter(entry => entry.day === today);
      setStudentSchedule(todaysStudentSchedule);
    }
  }, [studentSchedule, user, setStudentSchedule]);

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
                  examsTimetable={examsTimetable}
               />;
      case 'administrator':
        return <AdminTimetableView />
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
    
 


