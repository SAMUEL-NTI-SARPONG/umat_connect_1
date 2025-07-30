'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, ArrowRightLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useUser, type Department } from '@/app/providers/user-provider';
import { DepartmentDialog } from './department-dialog';
import { MoveDepartmentDialog } from './move-department-dialog';
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
} from '../ui/alert-dialog';

export function DepartmentActions({ department, facultyName }: { department: Department; facultyName: string }) {
  const { deleteDepartment } = useUser();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Department Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Department
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsMoveDialogOpen(true)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Move to...
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Department
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isEditDialogOpen && (
        <DepartmentDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          department={department}
          facultyName={facultyName}
        />
      )}
      
      {isMoveDialogOpen && (
        <MoveDepartmentDialog
          isOpen={isMoveDialogOpen}
          onClose={() => setIsMoveDialogOpen(false)}
          department={department}
          currentFacultyName={facultyName}
        />
       )}
       
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
             <AlertDialogDescription>
               This action cannot be undone. This will permanently delete the <strong>{department.name}</strong> department.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={() => deleteDepartment(department.name)}>Delete</AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
    </>
  );
}
