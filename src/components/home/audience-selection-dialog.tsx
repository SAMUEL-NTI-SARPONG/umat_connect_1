
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
import { useUser, type User, type Post } from '@/app/providers/user-provider';
import { departments as allDepartments, faculties } from '@/lib/data';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, User as UserIcon, Building, GraduationCap, X, PlusCircle, Users } from 'lucide-react';
import { ProfileAvatar } from '../ui/profile-avatar';

interface AudienceSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (audience: number[]) => void;
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

  const handleAddFilteredToSelection = (users: User[]) => {
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        users.forEach(u => newSet.add(u.id));
        return newSet;
    });
  };

  const handleRemoveFromSelection = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };
  
  const handleClearSelection = () => {
    setSelectedIds(new Set());
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
  
  const selectedUsers = useMemo(() => {
    return allUsers.filter(u => selectedIds.has(u.id));
  }, [selectedIds, allUsers]);

  const renderFilterControls = (
    users: User[], 
    onAdd: () => void, 
    filterActive: boolean,
    onClearFilters: () => void
  ) => (
    <>
      {filterActive && 
        <div className="flex justify-between items-center mb-2">
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="self-start text-xs"><X className="mr-1 h-3 w-3" />Clear Filters</Button>
            <Button size="sm" onClick={onAdd} disabled={users.length === 0}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add {users.length} to Audience
            </Button>
        </div>
      }
      <ScrollArea className="flex-grow pr-4 -mr-4 border rounded-md">
        <div className="p-2 space-y-2">
        {users.length > 0 ? (
          users.map(user => (
            <div key={user.id} className="flex items-center space-x-3 p-2 rounded-md border bg-muted/50">
              <ProfileAvatar src={user.profileImage} fallback={user.name.charAt(0)} className="w-8 h-8"/>
              <div className="flex-grow font-normal">
                  <p className="text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.department}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleAddFilteredToSelection([user])} disabled={selectedIds.has(user.id)}>Add</Button>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8 text-sm">No users match the current filters.</p>
        )}
        </div>
      </ScrollArea>
    </>
  );

  
  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
    onClose();
  };

  const clearStudentFilters = () => {
    setStudentSearch('');
    setStudentFaculty('');
    setStudentDept('');
    setStudentLevel('');
  };
  const clearLecturerFilters = () => {
    setLecturerSearch('');
    setLecturerFaculty('');
    setLecturerDept('');
  };
  const clearAdminFilters = () => {
    setAdminSearch('');
  };
  
  const isStudentFilterActive = !!(studentSearch || studentFaculty || studentDept || studentLevel);
  const isLecturerFilterActive = !!(lecturerSearch || lecturerFaculty || lecturerDept);
  const isAdminFilterActive = !!adminSearch;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Audience</DialogTitle>
          <DialogDescription>
            Build your audience by filtering and adding users. You can add multiple groups.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
          {/* Left Side: Filters and Results */}
          <div className="flex flex-col min-h-0">
            <Tabs defaultValue="students" className="flex-grow flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="students"><GraduationCap className="mr-2 h-4 w-4" />Students</TabsTrigger>
                <TabsTrigger value="lecturers"><UserIcon className="mr-2 h-4 w-4" />Lecturers</TabsTrigger>
                <TabsTrigger value="admins"><Building className="mr-2 h-4 w-4" />Admins</TabsTrigger>
              </TabsList>
              
              <TabsContent value="students" className="flex-grow flex flex-col min-h-0 mt-4 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                  <div className="relative col-span-2">
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
                {renderFilterControls(filteredStudents, () => handleAddFilteredToSelection(filteredStudents), isStudentFilterActive, clearStudentFilters)}
              </TabsContent>

              <TabsContent value="lecturers" className="flex-grow flex flex-col min-h-0 mt-4 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                   <div className="relative md:col-span-2">
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
                {renderFilterControls(filteredLecturers, () => handleAddFilteredToSelection(filteredLecturers), isLecturerFilterActive, clearLecturerFilters)}
              </TabsContent>

              <TabsContent value="admins" className="flex-grow flex flex-col min-h-0 mt-4 space-y-2">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="pl-10"/>
                 </div>
                 {renderFilterControls(filteredAdmins, () => handleAddFilteredToSelection(filteredAdmins), isAdminFilterActive, clearAdminFilters)}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Side: Selected Audience */}
          <div className="flex flex-col border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Selected Audience ({selectedUsers.length})</h3>
              <Button variant="ghost" size="sm" onClick={handleClearSelection} disabled={selectedUsers.length === 0} className="text-xs">
                <X className="mr-1 h-3 w-3" /> Clear All
              </Button>
            </div>
            <ScrollArea className="flex-grow -mr-4 pr-4">
              {selectedUsers.length > 0 ? (
                <div className="space-y-2">
                  {selectedUsers.map(user => (
                    <div key={user.id} className="flex items-center space-x-3 p-2 rounded-md border">
                        <ProfileAvatar src={user.profileImage} fallback={user.name.charAt(0)} className="w-8 h-8"/>
                        <div className="flex-grow">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.department}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveFromSelection(user.id)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground text-sm">
                    <p>No users selected. <br /> Use the filters on the left to add recipients.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        
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
            <Users className="mr-2 h-4 w-4" />
            Confirm and Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
