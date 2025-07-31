'use client';

import { useUser, type Faculty } from '@/app/providers/user-provider';
import { Button } from '@/components/ui/button';
import { PlusCircle, School } from 'lucide-react';
import { useState } from 'react';
import { FacultyDialog } from '@/components/departments/faculty-dialog';
import { FacultyCard } from '@/components/departments/faculty-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DepartmentsPage() {
  const { user, faculties } = useUser();
  const [isFacultyDialogOpen, setIsFacultyDialogOpen] = useState(false);

  if (user?.role !== 'administrator') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <School />
            Manage Faculties & Departments
          </CardTitle>
          <Button onClick={() => setIsFacultyDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Faculty
          </Button>
        </CardHeader>
        <CardContent>
          {faculties.length > 0 ? (
            <div className="space-y-4">
              {faculties.map((faculty, index) => (
                <FacultyCard key={faculty.name} faculty={faculty} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>No faculties found.</p>
              <p className="text-sm">Click "Add Faculty" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <FacultyDialog
        isOpen={isFacultyDialogOpen}
        onClose={() => setIsFacultyDialogOpen(false)}
      />
    </div>
  );
}
