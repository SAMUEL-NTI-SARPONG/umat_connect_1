import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="profile picture" />
              <AvatarFallback>UM</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <CardTitle className="text-2xl">User Name</CardTitle>
              <p className="text-muted-foreground">Student</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue="User Name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="user.name@st.umat.edu.gh" disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" defaultValue="Computer Science" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Primary Phone</Label>
            <Input id="phone" type="tel" defaultValue="+233 12 345 6789" />
          </div>
          <Button className="w-full">Edit Profile</Button>
        </CardContent>
      </Card>
    </div>
  );
}
