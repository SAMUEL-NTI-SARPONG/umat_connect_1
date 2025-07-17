
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useUser, type User } from '@/app/providers/user-provider';
import { departments as allDepartments, faculties } from '@/lib/data';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, User as UserIcon, Building, GraduationCap, X } from 'lucide-react';

interface AudienceSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: number[]) => void;
}

export default function AudienceSelectionDialog({
  isOpen,
  onClose,
  onConfirm,
}: AudienceSelectionDialogProps) {
  const { allUsers } = useUser();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // Student filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFaculty, setStudentFaculty] = useState('');
  const [studentDept, setStudentDept] = useState('');
  const [studentLevel, setStudentLevel] = useState('');
  
  // Lecturer filters
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [lecturerFaculty, setLecturerFaculty] = useState('');
  const [lecturerDept, setLecturerDept] = useState('');
  
  // Admin filters
  const [adminSearch, setAdminSearch] = useState('');

  // Derived department lists based on faculty selection
  const studentAvailableDepts = useMemo(() => {
    if (!studentFaculty) return allDepartments;
    return faculties.find(f => f.name === studentFaculty)?.departments || [];
  }, [studentFaculty]);

  const lecturerAvailableDepts = useMemo(() => {
    if (!lecturerFaculty) return allDepartments;
    return faculties.find(f => f.name === lecturerFaculty)?.departments || [];
  }, [lecturerFaculty]);

  // Effect to reset department if faculty changes and dept is no longer valid
  useEffect(() => {
    if (studentDept && !studentAvailableDepts.includes(studentDept)) {
      setStudentDept('');
    }
  }, [studentDept, studentAvailableDepts]);

  useEffect(() => {
    if (lecturerDept && !lecturerAvailableDepts.includes(lecturerDept)) {
      setLecturerDept('');
    }
  }, [lecturerDept, lecturerAvailableDepts]);

  const handleSelectUser = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (users: User[]) => {
    const allSelected = users.every(u => selectedIds.has(u.id));
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (allSelected) {
            users.forEach(u => newSet.delete(u.id));
        } else {
            users.forEach(u => newSet.add(u.id));
        }
        return newSet;
    });
  };

  const filteredStudents = useMemo(() => {
    const facultyDepts = studentFaculty ? faculties.find(f => f.name === studentFaculty)?.departments : null;
    return allUsers.filter(user => 
      user.role === 'student' &&
      user.name.toLowerCase().includes(studentSearch.toLowerCase()) &&
      (!studentFaculty || (facultyDepts && facultyDepts.includes(user.department))) &&
      (!studentDept || user.department === studentDept) &&
      (!studentLevel || user.level === Number(studentLevel))
    );
  }, [allUsers, studentSearch, studentFaculty, studentDept, studentLevel]);

  const filteredLecturers = useMemo(() => {
    const facultyDepts = lecturerFaculty ? faculties.find(f => f.name === lecturerFaculty)?.departments : null;
    return allUsers.filter(user =>
      user.role === 'lecturer' &&
      user.name.toLowerCase().includes(lecturerSearch.toLowerCase()) &&
      (!lecturerFaculty || (facultyDepts && facultyDepts.includes(user.department))) &&
      (!lecturerDept || user.department === lecturerDept)
    );
  }, [allUsers, lecturerSearch, lecturerFaculty, lecturerDept]);

  const filteredAdmins = useMemo(() => {
    return allUsers.filter(user =>
      user.role === 'administrator' &&
      user.name.toLowerCase().includes(adminSearch.toLowerCase())
    );
  }, [allUsers, adminSearch]);
  
  const renderUserList = (users: User[], onSelectAll: () => void) => {
    if (users.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No users match the current filters.</p>;
    }
    
    return (
        <div className="space-y-2">
            <div className="flex items-center space-x-2 p-2 rounded-md border">
                <Checkbox
                    id={`select-all-${users[0]?.role}`}
                    checked={users.length > 0 && users.every(u => selectedIds.has(u.id))}
                    onCheckedChange={onSelectAll}
                />
                <Label htmlFor={`select-all-${users[0]?.role}`} className="font-bold">
                    Select All ({users.length})
                </Label>
            </div>
             {users.map(user => (
                <div key={user.id} className="flex items-center space-x-3 p-2 rounded-md border">
                    <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedIds.has(user.id)}
                        onCheckedChange={() => handleSelectUser(user.id)}
                    />
                    <Label htmlFor={`user-${user.id}`} className="flex-grow font-normal cursor-pointer">
                        <p>{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.department}</p>
                    </Label>
                </div>
            ))}
        </div>
    );
  };
  
  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
    onClose();
  };

  const clearFilters = (tab: 'students' | 'lecturers' | 'admins') => {
    if (tab === 'students') {
      setStudentSearch('');
      setStudentFaculty('');
      setStudentDept('');
      setStudentLevel('');
    } else if (tab === 'lecturers') {
      setLecturerSearch('');
      setLecturerFaculty('');
      setLecturerDept('');
    } else {
      setAdminSearch('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Audience</DialogTitle>
          <DialogDescription>
            Choose who will receive this post. You can select individuals or entire groups.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="students" className="flex-grow flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students"><GraduationCap className="mr-2 h-4 w-4" />Students</TabsTrigger>
            <TabsTrigger value="lecturers"><UserIcon className="mr-2 h-4 w-4" />Lecturers</TabsTrigger>
            <TabsTrigger value="admins"><Building className="mr-2 h-4 w-4" />Admins</TabsTrigger>
          </TabsList>
          
          <TabsContent value="students" className="flex-grow flex flex-col min-h-0 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
              <div className="relative lg:col-span-4">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Search by name..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={studentFaculty} onValueChange={setStudentFaculty}>
                <SelectTrigger><SelectValue placeholder="All Faculties" /></SelectTrigger>
                <SelectContent>
                    {faculties.map(f => <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={studentDept} onValueChange={setStudentDept}>
                <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
                <SelectContent>
                    {studentAvailableDepts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={studentLevel} onValueChange={setStudentLevel}>
                <SelectTrigger><SelectValue placeholder="All Levels" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="300">300</SelectItem>
                  <SelectItem value="400">400</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(studentSearch || studentFaculty || studentDept || studentLevel) && <Button variant="ghost" size="sm" onClick={() => clearFilters('students')} className="mb-2 self-start"><X className="mr-2 h-4 w-4" />Clear Filters</Button>}
            <ScrollArea className="flex-grow pr-4 -mr-4">{renderUserList(filteredStudents, () => handleSelectAll(filteredStudents))}</ScrollArea>
          </TabsContent>

          <TabsContent value="lecturers" className="flex-grow flex flex-col min-h-0 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
               <div className="relative md:col-span-3">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Search by name..." value={lecturerSearch} onChange={e => setLecturerSearch(e.target.value)} className="pl-10"/>
               </div>
               <Select value={lecturerFaculty} onValueChange={setLecturerFaculty}>
                  <SelectTrigger><SelectValue placeholder="All Faculties" /></SelectTrigger>
                  <SelectContent>
                     {faculties.map(f => <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>)}
                  </SelectContent>
               </Select>
               <Select value={lecturerDept} onValueChange={setLecturerDept}>
                  <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
                  <SelectContent>
                     {lecturerAvailableDepts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
               </Select>
            </div>
             {(lecturerSearch || lecturerFaculty || lecturerDept) && <Button variant="ghost" size="sm" onClick={() => clearFilters('lecturers')} className="mb-2 self-start"><X className="mr-2 h-4 w-4" />Clear Filters</Button>}
            <ScrollArea className="flex-grow pr-4 -mr-4">{renderUserList(filteredLecturers, () => handleSelectAll(filteredLecturers))}</ScrollArea>
          </TabsContent>

          <TabsContent value="admins" className="flex-grow flex flex-col min-h-0 mt-4">
             <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="pl-10"/>
             </div>
             {adminSearch && <Button variant="ghost" size="sm" onClick={() => clearFilters('admins')} className="mb-2 self-start"><X className="mr-2 h-4 w-4" />Clear Filters</Button>}
            <ScrollArea className="flex-grow pr-4 -mr-4">{renderUserList(filteredAdmins, () => handleSelectAll(filteredAdmins))}</ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4 pt-4 border-t">
          <div className="flex-grow">
            <Badge variant={selectedIds.size > 0 ? "default" : "secondary"}>
              {selectedIds.size} recipient{selectedIds.size !== 1 && 's'} selected
            </Badge>
          </div>
          
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          
          <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
            Confirm and Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
