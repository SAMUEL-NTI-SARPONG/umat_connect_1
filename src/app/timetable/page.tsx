
'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Upload, Check, Ban, FilePenLine, Trash2, Loader2, Clock, MapPin, BookUser, Search, FilterX, Edit, Delete, CalendarClock } from 'lucide-react';
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

const statusConfig = {
    confirmed: { color: 'bg-green-500', text: 'Confirmed', border: 'border-l-green-500', icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
    canceled: { color: 'bg-red-500', text: 'Canceled', border: 'border-l-red-500', icon: <XCircle className="h-5 w-5 text-red-500" /> },
    undecided: { color: 'bg-yellow-500', text: 'Undecided', border: 'border-l-yellow-500', icon: <AlertCircle className="h-5 w-5 text-yellow-500" /> },
};
  
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function StudentTimetableView({ schedule }: { schedule: TimetableEntry[] }) {
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

  return (
    <Tabs defaultValue="Monday" className="w-full">
      <div className="sticky top-[56px] z-10 bg-background/95 backdrop-blur-sm -mx-4 md:-mx-6 px-4 md:px-6 py-2 border-b">
        <TabsList className="grid w-full grid-cols-7 h-12">
          {days.map(day => (
            <TabsTrigger key={day} value={day} className="text-xs sm:text-sm">{day.substring(0,3)}</TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="py-6">
        {days.map(day => (
          <TabsContent key={day} value={day}>
            <div className="space-y-4">
              {dailySchedule[day] && dailySchedule[day].length > 0 ? (
                dailySchedule[day].map((event, index) => {
                  const status = statusConfig[event.status as EventStatus];

                  return (
                    <Card key={index} className="overflow-hidden shadow-sm transition-all hover:shadow-md border border-border/80 rounded-xl">
                      <div className="flex">
                        <div className={cn("w-2", status.color)}></div>
                        <div className="flex-grow p-3 md:p-4">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1">
                              <div>
                                  <CardTitle className="text-sm md:text-base font-medium tracking-tight">{event.courseCode}</CardTitle>
                                  <Badge variant="outline" className="mt-1.5 capitalize font-normal text-xs">{status.text}</Badge>
                              </div>
                              <div className="text-xs sm:text-right font-medium text-muted-foreground flex items-center gap-1.5 pt-1">
                                  <Clock className="w-3 h-3"/>
                                  <span>{event.time}</span>
                              </div>
                          </div>
                          <div className="mt-3 space-y-1.5 text-muted-foreground text-xs">
                              <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-primary/70"/>
                                  <span>{event.room}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <BookUser className="w-3.5 h-3.5 text-primary/70"/>
                                  <span>{event.lecturer}</span>
                              </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })
              ) : (
                <Card className="flex items-center justify-center p-12 bg-muted/50 border-dashed">
                   <CardContent className="text-center text-muted-foreground">
                       <p className="font-medium">No classes scheduled for {day}.</p>
                       <p className="text-sm">Enjoy your day off!</p>
                   </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

function LecturerTimetableView({
  schedule,
  setSchedule,
  emptySlots,
}: {
  schedule: TimetableEntry[];
  setSchedule: (schedule: TimetableEntry[]) => void;
  emptySlots: EmptySlot[];
}) {
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedFormData, setEditedFormData] = useState<TimetableEntry | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleStatusChange = (id: number, newStatus: EventStatus) => {
    setSchedule(
      schedule.map((event) => (event.id === id ? { ...event, status: newStatus } : event))
    );
  };

  const handleCancelClick = (entry: TimetableEntry) => {
    setSelectedEntry(entry);
    setIsActionModalOpen(true);
  };

  const handleRescheduleClick = () => {
    setEditedFormData(selectedEntry);
    if (selectedEntry) {
      const [start, end] = selectedEntry.time.split('-');
      setStartTime(start?.trim() || '');
      setEndTime(end?.trim() || '');
    }
    setIsActionModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editedFormData) return;
    const updatedEntry = { ...editedFormData, time: `${startTime}-${endTime}` };
    setSchedule(schedule.map((item) => (item.id === updatedEntry.id ? updatedEntry : item)));
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

  const closeAllModals = () => {
    setIsActionModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedEntry(null);
    setEditedFormData(null);
    setStartTime('');
    setEndTime('');
  };

  const dailySchedule = useMemo(() => {
    return schedule.reduce((acc, event) => {
      const day = event.day || "Monday";
      if (!acc[day]) acc[day] = [];
      acc[day].push(event);
      return acc;
    }, {} as Record<string, TimetableEntry[]>);
  }, [schedule]);

  const availableRoomsForDay = useMemo(() => {
    if (!editedFormData) return [];
    const daySlots = emptySlots.filter((slot) => slot.day === editedFormData.day);
    return [...new Set(daySlots.map((slot) => slot.location))];
  }, [emptySlots, editedFormData]);

  const availableSlotsForRoomAndDay = useMemo(() => {
    if (!editedFormData) return [];
    return emptySlots
      .filter((slot) => slot.day === editedFormData.day && slot.location === editedFormData.room)
      .map((slot) => slot.time)
      .sort((a, b) => parseInt(a.split(':')[0]) - parseInt(b.split(':')[0]));
  }, [emptySlots, editedFormData]);

  const availableStartTimes = useMemo(() => {
    return [...new Set(availableSlotsForRoomAndDay.map((time) => time.split('-')[0]))];
  }, [availableSlotsForRoomAndDay]);

  const availableEndTimes = useMemo(() => {
    if (!startTime) return [];
    const startIndex = availableSlotsForRoomAndDay.findIndex((slot) => slot.startsWith(startTime));
    if (startIndex === -1) return [];
    let continuousEndTimes: string[] = [];
    for (let i = startIndex; i < availableSlotsForRoomAndDay.length; i++) {
      const currentSlot = availableSlotsForRoomAndDay[i];
      const prevSlot = i > startIndex ? availableSlotsForRoomAndDay[i - 1] : null;
      if (prevSlot && prevSlot.split('-')[1] !== currentSlot.split('-')[0]) break;
      continuousEndTimes.push(currentSlot.split('-')[1]);
    }
    return continuousEndTimes;
  }, [startTime, availableSlotsForRoomAndDay]);

  return (
    <>
      <Tabs defaultValue="Monday" className="w-full">
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
              <div className="space-y-4">
                {dailySchedule[day] && dailySchedule[day].length > 0 ? (
                  dailySchedule[day].map((event) => {
                    const status = statusConfig[event.status as EventStatus];
                    return (
                      <Card key={event.id} className="overflow-hidden shadow-sm transition-all hover:shadow-md border border-border/80 rounded-xl">
                        <div className="flex">
                          <div className={cn("w-2", status.color)}></div>
                          <div className="flex-grow p-3 md:p-4">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1">
                              <div>
                                <CardTitle className="text-sm md:text-base font-medium tracking-tight">{event.courseCode}</CardTitle>
                                <Badge variant="outline" className="mt-1.5 capitalize font-normal text-xs">{status.text}</Badge>
                              </div>
                              <div className="text-xs sm:text-right font-medium text-muted-foreground flex items-center gap-1.5 pt-1">
                                <Clock className="w-3 h-3" />
                                <span>{event.time}</span>
                              </div>
                            </div>
                            <div className="mt-3 space-y-1.5 text-muted-foreground text-xs">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-primary/70" />
                                <span>{event.room}</span>
                              </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(event.id, 'confirmed')} disabled={event.status === 'confirmed'}>
                                <Check className="h-4 w-4 mr-1" /> Confirm
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleCancelClick(event)}>
                                <Ban className="h-4 w-4 mr-1" /> Cancel / Reschedule
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="flex items-center justify-center p-12 bg-muted/50 border-dashed">
                    <CardContent className="text-center text-muted-foreground">
                      <p className="font-medium">No classes scheduled for {day}.</p>
                      <p className="text-sm">Enjoy your day off!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* Action Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel or Reschedule Class</DialogTitle>
            <DialogDescription>
              Would you like to cancel this class or reschedule it for another time/location?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-around py-4">
            <Button variant="destructive" onClick={() => {
              if(selectedEntry) handleStatusChange(selectedEntry.id, 'canceled');
              closeAllModals();
            }}>
              <XCircle className="mr-2 h-4 w-4" /> Just Cancel
            </Button>
            <Button variant="outline" onClick={handleRescheduleClick}>
              <CalendarClock className="mr-2 h-4 w-4" /> Reschedule
            </Button>
          </div>
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
                  {availableRoomsForDay.map(room => <SelectItem key={room} value={room}>{room}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Time</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                <Select value={startTime} onValueChange={setStartTime} disabled={!editedFormData?.room}>
                  <SelectTrigger><SelectValue placeholder="Start" /></SelectTrigger>
                  <SelectContent>
                    {availableStartTimes.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={endTime} onValueChange={setEndTime} disabled={!startTime}>
                  <SelectTrigger><SelectValue placeholder="End" /></SelectTrigger>
                  <SelectContent>
                    {availableEndTimes.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
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
      const [start, end] = selectedEntry.time.split('-');
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
     const updatedEntry = { ...editedFormData, time: `${startTime}-${endTime}` };
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
    return [...new Set(availableSlotsForRoomAndDay.map(time => time.split('-')[0]))];
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
            const prevEndTime = prevSlot.split('-')[1];
            const currentStartTime = currentSlot.split('-')[0];
            if (prevEndTime !== currentStartTime) {
                break; // Break if not continuous
            }
        }
        continuousEndTimes.push(currentSlot.split('-')[1]);
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
    setEmptySlots 
  } = useUser();
  
  // Derived states are now calculated within the render logic using useMemo
  const lecturerSchedule = useMemo(() => {
    if (!masterSchedule || !user || user.role !== 'lecturer') return [];
    
    const currentLecturerNameParts = user.name.toLowerCase().split(' ');
    return masterSchedule.filter(entry => 
      currentLecturerNameParts.some(part => entry.lecturer.toLowerCase().includes(part))
    );
  }, [masterSchedule, user]);

  const studentSchedule = useMemo(() => {
    if (!masterSchedule || !user || user.role !== 'student') return [];

    return masterSchedule.filter(entry =>
        entry.level === user.level &&
        entry.departments.some(dep => user.department.includes(dep))
      );
  }, [masterSchedule, user]);

  const renderContent = () => {
    if (!user) return <p>Loading...</p>;

    switch (user.role) {
      case 'student':
        return <StudentTimetableView schedule={studentSchedule} />;
      case 'lecturer':
        return <LecturerTimetableView 
                  schedule={lecturerSchedule} 
                  setSchedule={setMasterSchedule as any} 
                  emptySlots={emptySlots} 
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
