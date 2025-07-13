
'use client';

import { useUser } from '@/app/providers/user-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { users } from '@/lib/data';
import { GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const { login } = useUser();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
            <GraduationCap className="w-12 h-12 text-primary" />
            <h1 className="text-4xl font-bold">UMaT Connect</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Please select a user profile to log in.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl">
        {users.map((user) => (
          <Card
            key={user.id}
            className="text-center hover:shadow-lg hover:border-primary transition-all cursor-pointer"
            onClick={() => login(user.id)}
          >
            <CardHeader>
              <ProfileAvatar
                src={user.profileImage}
                fallback={user.name.charAt(0)}
                alt={`${user.name}'s profile`}
                className="w-24 h-24 mx-auto text-3xl"
                imageHint="profile picture"
              />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <p className="text-muted-foreground capitalize">{user.role}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
