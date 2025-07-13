
'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Upload, Check, Ban, FilePenLine, Trash2, Loader2, Clock, MapPin, BookUser, Search, FilterX, Edit, Delete } from 'lucide-react';
import { useUser } from '../providers/user-provider';
import { timetable, users } from '@/lib/data';
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


type EventStatus = 'confirmed' | 'canceled' | 'undecided';

interface TimetableEntry {
  day: string;
  time: string;
  room: string;
  departments: string[];
  level: number;
  courseCode: string;
  lecturer: string;
  id: number;
}

const statusConfig = {
    confirmed: { color: 'bg-green-500', text: 'Confirmed', border: 'border-l-green-500', icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
    canceled: { color: 'bg-red-500', text: 'Canceled', border: 'border-l-red-500', icon: <XCircle className="h-5 w-5 text-red-500" /> },
    undecided: { color: 'bg-yellow-500', text: 'Undecided', border: 'border-l-yellow-500', icon: <AlertCircle className="h-5 w-5 text-yellow-500" /> },
};
  
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function StudentTimetableView() {
  const dailySchedule = useMemo(() => {
    const schedule = timetable.student;
    return schedule.reduce((acc, event) => {
      const day = event.day || "Monday"; 
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(event);
      return acc;
    }, {} as Record<string, typeof schedule>);
  }, []);

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
                  const lecturer = users.find(u => u.name.includes(event.course.split(" ")[0])) // simplified lookup
                  const status = statusConfig[event.status as EventStatus];

                  return (
                    <Card key={index} className="overflow-hidden shadow-sm transition-all hover:shadow-md border border-border/80 rounded-xl">
                      <div className="flex">
                        <div className={cn("w-2", status.color)}></div>
                        <div className="flex-grow p-3 md:p-4">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1">
                              <div>
                                  <CardTitle className="text-sm md:text-base font-medium tracking-tight">{event.course}</CardTitle>
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
                                  <span>{event.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <BookUser className="w-3.5 h-3.5 text-primary/70"/>
                                  <span>{lecturer ? lecturer.name : 'TBA'}</span>
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

function LecturerTimetableView() {
  const [schedule, setSchedule] = useState(timetable.lecturer);

  const handleStatusChange = (index: number, newStatus: EventStatus) => {
    const updatedSchedule = [...schedule];
    updatedSchedule[index].status = newStatus;
    setSchedule(updatedSchedule);
  };
  
  const dailySchedule = useMemo(() => {
    return schedule.reduce((acc, event, index) => {
      const day = event.day || "Monday"; 
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push({ ...event, originalIndex: index });
      return acc;
    }, {} as Record<string, (typeof schedule[0] & { originalIndex: number })[]>);
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
                dailySchedule[day].map((event) => {
                  const status = statusConfig[event.status as EventStatus];

                  return (
                    <Card key={event.originalIndex} className="overflow-hidden shadow-sm transition-all hover:shadow-md border border-border/80 rounded-xl">
                      <div className="flex">
                        <div className={cn("w-2", status.color)}></div>
                        <div className="flex-grow p-3 md:p-4">
                           <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1">
                              <div>
                                  <CardTitle className="text-sm md:text-base font-medium tracking-tight">{event.course}</CardTitle>
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
                                  <span>{event.location}</span>
                              </div>
                          </div>
                           <div className="mt-4 flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(event.originalIndex, 'confirmed')} disabled={event.status === 'confirmed'}>
                                <Check className="h-4 w-4 mr-1" /> Confirm
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(event.originalIndex, 'canceled')} disabled={event.status === 'canceled'}>
                                <Ban className="h-4 w-4 mr-1" /> Cancel
                              </Button>
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

function AdminTimetableView() {
  const [parsedData, setParsedData] = useState<TimetableEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvalid, setShowInvalid] = useState(false);
  
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editedFormData, setEditedFormData] = useState<TimetableEntry | null>(null);


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
        const dataWithIds = data.map((item, index) => ({ ...item, id: index }));
        setParsedData(dataWithIds);
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
  
  const handleRowClick = (entry: TimetableEntry) => {
    setSelectedEntry(entry);
    setEditedFormData(entry); // Pre-fill form data
    setIsActionModalOpen(true);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteAll = () => {
    setParsedData(null);
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
     if (!editedFormData || !parsedData) return;
     setParsedData(parsedData.map(item => item.id === editedFormData.id ? editedFormData : item));
     closeAllModals();
  };

  const handleEditInputChange = (field: keyof TimetableEntry, value: string | number | string[]) => {
    if (!editedFormData) return;
    setEditedFormData({ ...editedFormData, [field]: value });
  };
  
  const closeAllModals = () => {
    setIsActionModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteConfirmOpen(false);
    setSelectedEntry(null);
    setEditedFormData(null);
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
                                <TableCell className="min-w-[120px]">{entry.time}</TableCell>
                                <TableCell className="min-w-[100px]">{entry.room}</TableCell>
                                <TableCell className="min-w-[150px]">{entry.courseCode}</TableCell>
                                <TableCell className="min-w-[150px]">{entry.lecturer}</TableCell>
                                <TableCell className="min-w-[200px]">{entry.departments.join(', ')}</TableCell>
                                <TableCell className="min-w-[100px]">{entry.level}</TableCell>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Timetable Entry</DialogTitle>
            <DialogDescription>
              Make changes to the entry here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">Time</Label>
              <Input id="time" value={editedFormData?.time || ''} onChange={(e) => handleEditInputChange('time', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room" className="text-right">Room</Label>
              <Input id="room" value={editedFormData?.room || ''} onChange={(e) => handleEditInputChange('room', e.target.value)} className="col-span-3" />
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
              <Input id="departments" value={editedFormData?.departments.join(', ') || ''} onChange={(e) => handleEditInputChange('departments', e.target.value.split(',').map(s => s.trim()))} className="col-span-3" />
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
