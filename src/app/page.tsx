import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

function PostCard({
  author,
  department,
  timestamp,
  content,
  imageUrl,
}: {
  author: string;
  department: string;
  timestamp: string;
  content: string;
  imageUrl?: string;
}) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="profile picture" />
            <AvatarFallback>{author.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{author}</CardTitle>
            <CardDescription>
              {department} - {timestamp}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p>{content}</p>
        {imageUrl && (
          <div className="mt-4">
            <Image
              src={imageUrl}
              alt="Post image"
              width={600}
              height={400}
              className="rounded-lg object-cover w-full"
              data-ai-hint="university campus"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <h3 className="font-semibold">Comments</h3>
        <div className="w-full flex items-center gap-2">
          <Input placeholder="Write a comment..." />
          <Button>Comment</Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function Home() {
  return (
    <main className="p-4 md:p-6">
      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current Posts</TabsTrigger>
          <TabsTrigger value="past">Past Posts</TabsTrigger>
        </TabsList>
        <TabsContent value="current">
          <PostCard
            author="Dr. Yaw Mensah"
            department="Computer Science"
            timestamp="2 hours ago"
            content="Reminder: The assignment deadline for COEN 457 is this Friday. No extensions will be granted. Please submit via the university portal."
            imageUrl="https://placehold.co/600x400.png"
          />
          <PostCard
            author="Admin Office"
            department="Examinations Unit"
            timestamp="8 hours ago"
            content="The final examination timetable for the second semester has been released. Please check your student dashboards for your personal schedule."
          />
        </TabsContent>
        <TabsContent value="past">
          <PostCard
            author="Dr. Adwoa Ansa"
            department="Geomatic Engineering"
            timestamp="Yesterday"
            content="Guest lecture on 'Modern GIS Applications' will be held tomorrow at the main auditorium. All Geomatic Engineering students are encouraged to attend."
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
