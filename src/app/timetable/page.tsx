import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function EventCard({
  course,
  time,
  location,
  status,
}: {
  course: string;
  time: string;
  location: string;
  status: 'confirmed' | 'canceled' | 'undecided';
}) {
  const statusColors = {
    confirmed: 'bg-green-100 border-green-400',
    canceled: 'bg-red-100 border-red-400',
    undecided: 'bg-yellow-100 border-yellow-400',
  };

  return (
    <Card className={cn('mb-4', statusColors[status])}>
      <CardHeader>
        <CardTitle>{course}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Time: {time}</p>
        <p>Location: {location}</p>
        <p className="font-bold capitalize mt-2">Status: {status}</p>
      </CardContent>
    </Card>
  );
}

export default function TimetablePage() {
  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-bold mb-4">Today's Schedule</h2>
      <EventCard
        course="COEN 457: Software Engineering"
        time="10:00 AM - 12:00 PM"
        location="Room C15"
        status="confirmed"
      />
      <EventCard
        course="MATH 251: Calculus II"
        time="1:00 PM - 3:00 PM"
        location="Auditorium A"
        status="undecided"
      />
      <EventCard
        course="PHYS 164: Electromagnetism"
        time="3:00 PM - 5:00 PM"
        location="Lab 3B"
        status="canceled"
      />
    </div>
  );
}
