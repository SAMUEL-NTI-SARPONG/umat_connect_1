import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

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
  const statusConfig = {
    confirmed: {
      color: 'border-l-green-500',
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      text: 'Confirmed'
    },
    canceled: {
      color: 'border-l-red-500',
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      text: 'Canceled'
    },
    undecided: {
      color: 'border-l-yellow-500',
      icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      text: 'Undecided'
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <Card className={cn('mb-4 border-l-4', currentStatus.color)}>
      <CardHeader>
        <CardTitle>{course}</CardTitle>
        <CardDescription>{time} - {location}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {currentStatus.icon}
          <p className="font-bold capitalize">{currentStatus.text}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TimetablePage() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Today's Schedule</h2>
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
