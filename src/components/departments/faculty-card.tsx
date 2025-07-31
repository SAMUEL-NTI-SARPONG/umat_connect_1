
'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useUser, type Faculty, type Department } from '@/app/providers/user-provider';
import { DepartmentActions } from './department-actions';
import { Button } from '../ui/button';
import { DepartmentDialog } from './department-dialog';
import { PlusCircle, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { FacultyDialog } from './faculty-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';

export function FacultyCard({ faculty, index }: { faculty: Faculty, index: number }) {
  const { deleteFaculty } = useUser();
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [isFacultyEditDialogOpen, setIsFacultyEditDialogOpen] = useState(false);
  const [isFacultyDeleteDialogOpen, setIsFacultyDeleteDialogOpen] = useState(false);
  
  const isEven = index % 2 === 0;

  return (
    <>
      <Card className="overflow-hidden">
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="border-b-0">
            <div className={cn(
              "flex items-center p-4 hover:bg-muted transition-colors",
              isEven ? "bg-muted" : "bg-muted/50"
            )}>
              <AccordionTrigger className="p-0 flex-1 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-base">{faculty.name}</span>
                    <div className="flex items-center gap-4">
                        <Badge variant="secondary">{faculty.departments.length} departments</Badge>
                        <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200" />
                    </div>
                </div>
              </AccordionTrigger>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                          <MoreHorizontal className="h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setIsFacultyEditDialogOpen(true)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Faculty
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setIsFacultyDeleteDialogOpen(true)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Faculty
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <AccordionContent className="p-4">
              <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={() => setIsDepartmentDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Department
                </Button>
              </div>
              {faculty.departments.length > 0 ? (
                <div className="space-y-2">
                  {faculty.departments.map((dept) => (
                    <div
                      key={dept.name}
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <div>
                        <p className="font-medium">{dept.name}</p>
                        <p className="text-sm text-muted-foreground">Initial: {dept.initial}</p>
                      </div>
                      <DepartmentActions department={dept} facultyName={faculty.name} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center text-muted-foreground py-4">
                  No departments in this faculty yet.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      <DepartmentDialog
        isOpen={isDepartmentDialogOpen}
        onClose={() => setIsDepartmentDialogOpen(false)}
        facultyName={faculty.name}
      />
      <FacultyDialog
        isOpen={isFacultyEditDialogOpen}
        onClose={() => setIsFacultyEditDialogOpen(false)}
        faculty={faculty}
      />
      <AlertDialog open={isFacultyDeleteDialogOpen} onOpenChange={setIsFacultyDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{' '}
              <strong>{faculty.name}</strong> faculty and all its departments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteFaculty(faculty.name)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
