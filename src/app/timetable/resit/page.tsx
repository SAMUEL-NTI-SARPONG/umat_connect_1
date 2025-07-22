
'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useUser } from '@/app/providers/user-provider';
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
import { handleSpecialResitUpload } from '../actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import type { SpecialResitEntry } from '@/app/providers/user-provider';


function SpecialResitTimetableView() {
  const { specialResitSchedule, setSpecialResitSchedule } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSpecialResitSchedule(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileData = Buffer.from(arrayBuffer).toString('base64');
      const data = await handleSpecialResitUpload(fileData);
      
      if (data.length === 0) {
        setError("The uploaded file could not be parsed or contains no valid resit data. Please check the file format and content.");
        setSpecialResitSchedule(null);
      } else {
        setSpecialResitSchedule(data);
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

  const handleDeleteAll = () => {
    setSpecialResitSchedule(null);
    setError(null);
  };
  
  const groupedByDate = useMemo(() => {
    if (!specialResitSchedule) return {};
    return specialResitSchedule.reduce((acc, entry) => {
        const date = entry.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(entry);
        return acc;
    }, {} as Record<string, SpecialResitEntry[]>);
  }, [specialResitSchedule]);
  
  const datesWithData = useMemo(() => {
    return Object.keys(groupedByDate);
  }, [groupedByDate]);

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        className="hidden"
        accept=".xlsx, .xls, .csv"
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
                <p>Upload New Special Resit Schedule</p>
              </TooltipContent>
            </Tooltip>
            
            <AlertDialog>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" disabled={!specialResitSchedule}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                          </Button>
                      </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Delete Schedule</p>
                  </TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    entire special resit schedule from this view.
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
      </div>

      {error && (
         <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {specialResitSchedule && (
        <Card>
          <CardHeader>
            <CardTitle>Parsed Special Resit Schedule</CardTitle>
            <CardDescription>
              A total of {specialResitSchedule?.length || 0} entries were found in the uploaded file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {datesWithData.map(date => (
                <div key={date} className="mb-6">
                    <h3 className="font-semibold text-lg mb-2 border-b pb-1">{date}</h3>
                    <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Course No.</TableHead>
                              <TableHead>Course Name</TableHead>
                              <TableHead>Department</TableHead>
                              <TableHead>Room</TableHead>
                              <TableHead>Examiner</TableHead>
                              <TableHead>Session</TableHead>
                              <TableHead className="text-right">Students</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupedByDate[date]?.map((entry, index) => (
                              <TableRow key={`${entry.course_no}-${index}`}>
                                <TableCell>{entry.course_no}</TableCell>
                                <TableCell>{entry.course_name}</TableCell>
                                <TableCell>{entry.department}</TableCell>
                                <TableCell>{entry.room}</TableCell>
                                <TableCell>{entry.examiner}</TableCell>
                                <TableCell>{entry.session}</TableCell>
                                <TableCell className="text-right">{entry.number}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                    </div>
                </div>
              ))}
               {datesWithData.length === 0 && (
                  <div className="text-center p-12 text-muted-foreground">
                    <p>No valid data could be displayed.</p>
                  </div>
               )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SpecialResitTimetablePage() {
    const { user } = useUser();

    if (!user || user.role !== 'administrator') {
        return (
            <div className="p-4 md:p-6 max-w-7xl mx-auto text-center">
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }
    
    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <SpecialResitTimetableView />
        </div>
    );
}
