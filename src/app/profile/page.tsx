
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { Separator } from '@/components/ui/separator';
import { Camera, Settings, Moon, Sun, Monitor } from 'lucide-react';
import { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState('https://placehold.co/100x100.png');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme, systemTheme } = useTheme();
  const [fontSize, setFontSize] = useState(16);

  const [formData, setFormData] = useState({
    name: 'User Name',
    department: 'Computer Science',
    phone: '+233 12 345 6789',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    setIsEditing(false);
    // Here you would typically handle the form submission,
    // like sending the data to a server.
    document.documentElement.style.fontSize = `${fontSize}px`;
  };

  const handleCancel = () => {
    // Reset form data to initial state if needed
    setIsEditing(false);
  };

  const currentTheme = theme === 'system' ? systemTheme : theme;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <ProfileAvatar
                src={profileImage}
                fallback="UM"
                alt="User's profile picture"
                className="w-24 h-24 text-3xl"
                imageHint="profile picture"
              />
              {isEditing && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full w-8 h-8"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4" />
                    <span className="sr-only">Change profile picture</span>
                  </Button>
                </>
              )}
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                 <h1 className="text-xl font-semibold">{formData.name}</h1>
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditToggle}
                    className="text-muted-foreground"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="sr-only">Edit Profile</span>
                  </Button>
              </div>
              <p className="text-muted-foreground">Student</p>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            {isEditing ? (
              <Input id="name" value={formData.name} onChange={handleInputChange} />
            ) : (
              <p className="text-muted-foreground">{formData.name}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue="user.name@st.umat.edu.gh"
              disabled
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            {isEditing ? (
              <Input id="department" value={formData.department} onChange={handleInputChange} />
            ) : (
              <p className="text-muted-foreground">{formData.department}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Primary Phone</Label>
            {isEditing ? (
              <Input id="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
            ) : (
              <p className="text-muted-foreground">{formData.phone}</p>
            )}
          </div>
          {isEditing && (
            <div className="flex gap-4">
              <Button onClick={handleSaveChanges} className="w-full font-semibold">
                Save Changes
              </Button>
              <Button onClick={handleCancel} variant="outline" className="w-full font-semibold">
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {isEditing && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="dark-mode"
                  checked={currentTheme === 'dark'}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? 'dark' : 'light')
                  }
                />
                <Label htmlFor="dark-mode">Dark Mode</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Font Size</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  defaultValue={[fontSize]}
                  max={20}
                  min={12}
                  step={1}
                  onValueChange={(value) => setFontSize(value[0])}
                />
                <span className="text-sm text-muted-foreground w-8 text-right">
                  {fontSize}px
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
