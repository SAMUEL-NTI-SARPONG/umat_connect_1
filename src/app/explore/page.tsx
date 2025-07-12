import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Image from 'next/image';

function GroupCard({ name, imageUrl }: { name: string; imageUrl: string }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative h-32 w-full">
          <Image
            src={imageUrl}
            alt={name}
            layout="fill"
            className="object-cover"
            data-ai-hint="campus groups students"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg mb-4 truncate">{name}</CardTitle>
        <Button className="w-full" variant="outline">Join</Button>
      </CardContent>
    </Card>
  );
}

export default function ExplorePage() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Search People & Groups</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search by name, department, or expertise..." className="pl-10" />
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4">Campus Groups</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <GroupCard name="UMaT Debating Society" imageUrl="https://placehold.co/300x150.png" />
          <GroupCard name="AI & Robotics Club" imageUrl="https://placehold.co/300x150.png" />
          <GroupCard name="Google Developer Students Club" imageUrl="https://placehold.co/300x150.png" />
          <GroupCard name="Entrepreneurs Hub" imageUrl="https://placehold.co/300x150.png" />
        </div>
      </div>
    </div>
  );
}
