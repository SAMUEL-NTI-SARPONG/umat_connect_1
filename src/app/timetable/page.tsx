
'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Upload, Check, Ban, FilePenLine, Trash2, Loader2, Clock, MapPin, BookUser, Search, Save, X, FilterX } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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
  const [editedData, setEditedData] = useState<TimetableEntry[] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvalid, setShowInvalid] = useState(false);

  useEffect(() => {
    if (isEditing && parsedData) {
      setEditedData(JSON.parse(JSON.stringify(parsedData))); // Deep copy
    } else {
      setEditedData(null);
    }
  }, [isEditing, parsedData]);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setParsedData(null);
    setIsEditing(false);

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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    setParsedData(null);
    setIsEditing(false);
    setError(null);
    setSearchTerm('');
    setShowInvalid(false);
  };
  
  const handleDeleteRow = (id: number) => {
    if (!editedData) return;
    setEditedData(editedData.filter(item => item.id !== id));
  };

  const handleSave = () => {
    setParsedData(editedData);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedData(null);
  };
  
  const handleEditInputChange = (id: number, field: keyof TimetableEntry, value: string | number | string[]) => {
    if (!editedData) return;
    setEditedData(
      editedData.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const currentData = isEditing ? editedData : parsedData;

  const filteredData = useMemo(() => {
    if (!currentData) return null;

    let data = [...currentData];

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
  }, [currentData, searchTerm, showInvalid]);

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
                <Button variant="outline" size="icon" onClick={handleUploadClick} disabled={isLoading || isEditing}>
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
                <Button variant="outline" size="icon" onClick={() => setIsEditing(true)} disabled={!parsedData || isEditing}>
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
                <Button variant={showInvalid ? "secondary" : "outline"} size="icon" onClick={() => setShowInvalid(!showInvalid)} disabled={!parsedData || isEditing}>
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
                          <Button variant="destructive" size="icon" disabled={!parsedData || isEditing}>
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
                    timetable data from this view.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
             {isEditing && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleSave}>
                      <Save className="h-4 w-4 text-green-600" />
                      <span className="sr-only">Save</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Save Changes</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 text-red-600" />
                      <span className="sr-only">Cancel</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Cancel Edit</p></TooltipContent>
                </Tooltip>
              </>
            )}
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
              disabled={isEditing}
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

      {currentData && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Editing Timetable' : 'Parsed Timetable Preview'}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? `Making changes to ${currentData.length} entries.`
                : showInvalid 
                  ? `Found ${filteredData?.length || 0} entries for review.`
                  : searchTerm 
                    ? `Found ${filteredData?.length || 0} matching entries.`
                    : `A total of ${parsedData?.length || 0} entries were found.`
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
                              {isEditing && <TableHead>Actions</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupedByDay[day]?.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="min-w-[120px]">
                                  {isEditing ? <Input defaultValue={entry.time} onChange={(e) => handleEditInputChange(entry.id, 'time', e.target.value)} /> : entry.time}
                                </TableCell>
                                <TableCell className="min-w-[100px]">
                                  {isEditing ? <Input defaultValue={entry.room} onChange={(e) => handleEditInputChange(entry.id, 'room', e.target.value)}/> : entry.room}
                                </TableCell>
                                <TableCell className="min-w-[150px]">
                                   {isEditing ? <Input defaultValue={entry.courseCode} onChange={(e) => handleEditInputChange(entry.id, 'courseCode', e.target.value)}/> : entry.courseCode}
                                </TableCell>
                                <TableCell className="min-w-[150px]">
                                   {isEditing ? <Input defaultValue={entry.lecturer} onChange={(e) => handleEditInputChange(entry.id, 'lecturer', e.target.value)}/> : entry.lecturer}
                                </TableCell>
                                <TableCell className="min-w-[200px]">
                                   {isEditing ? <Input defaultValue={entry.departments.join(', ')} onChange={(e) => handleEditInputChange(entry.id, 'departments', (e.target.value).split(',').map(s => s.trim()))}/> : entry.departments.join(', ')}
                                </TableCell>
                                 <TableCell className="min-w-[100px]">
                                   {isEditing ? (
                                        <Select
                                            defaultValue={String(entry.level)}
                                            onValueChange={(value) => handleEditInputChange(entry.id, 'level', Number(value))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="100">100</SelectItem>
                                                <SelectItem value="200">200</SelectItem>
                                                <SelectItem value="300">300</SelectItem>
                                                <SelectItem value="400">400</SelectItem>
                                            </SelectContent>
                                        </Select>
                                   ) : entry.level}
                                </TableCell>
                                {isEditing && (
                                    <TableCell>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleDeleteRow(entry.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete row</span>
                                        </Button>
                                    </TableCell>
                                )}
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

    
