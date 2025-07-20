
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Compass } from "lucide-react";

export default function ExplorePage() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass />
            Explore UMaT Connect
          </CardTitle>
          <CardDescription>
            Discover and connect with students and lecturers across campus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <p>The AI-powered people search functionality will be built here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
