import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

function GroupCard({ name, imageUrl }: { name: string; imageUrl: string }) {
  return (
    <Card>
      <CardHeader className="p-0">
        <Image
          src={imageUrl}
          alt={name}
          width={300}
          height={150}
          className="rounded-t-lg object-cover w-full h-32"
          data-ai-hint="campus groups students"
        />
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg mb-4">{name}</CardTitle>
        <Button className="w-full">Join</Button>
      </CardContent>
    </Card>
  );
}

export default function ExplorePage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Search People & Groups</h2>
        <Input placeholder="Search by name, department, or expertise..." />
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Campus Groups</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <GroupCard name="UMaT Debating Society" imageUrl="https://placehold.co/300x150.png" />
          <GroupCard name="AI & Robotics Club" imageUrl="https://placehold.co/300x150.png" />
          <GroupCard name="Google Developer Students Club" imageUrl="https://placehold.co/300x150.png" />
          <GroupCard name="Entrepreneurs Hub" imageUrl="https://placehold.co/300x150.png" />
        </div>
      </div>
    </div>
  );
}
