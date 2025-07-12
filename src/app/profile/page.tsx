import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24 text-3xl">
              <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="profile picture" />
              <AvatarFallback>UM</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl">User Name</CardTitle>
              <p className="text-muted-foreground text-lg">Student</p>
            </div>
          </div>
        </CardHeader>
        <Separator/>
        <CardContent className="p-6 space-y-6">
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
          <Button className="w-full">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
