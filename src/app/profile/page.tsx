
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { Separator } from '@/components/ui/separator';
import { Camera, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useUser } from '../providers/user-provider';

export default function ProfilePage() {
  const { 
    user, 
    updateUser 
  } = useUser();
  
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState(16);

  const [formData, setFormData] = useState({ 
    name: user?.name || '', 
    department: user?.department || '', 
    phone: user?.phone || ''
  });
  const [localProfileImage, setLocalProfileImage] = useState(user?.profileImage || '');
  
  // This effect keeps the form data synchronized with the global user state
  // when not in editing mode. This ensures that if the user data is updated
  // elsewhere, the profile page reflects it.
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        name: user.name,
        department: user.department,
        phone: user.phone
      });
      setLocalProfileImage(user.profileImage);
    }
  }, [user, isEditing]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleEditToggle = () => {
    if (isEditing) {
      handleCancel();
    } else {
      // When entering edit mode, sync the form with the current global state.
      if (user) {
        setFormData({ name: user.name, department: user.department, phone: user.phone });
        setLocalProfileImage(user.profileImage);
      }
      setIsEditing(true);
    }
  };

  const handleSaveChanges = () => {
    if (!user) return;
    
    // Create the updated user object
    const updatedUser = {
      ...user,
      name: formData.name,
      department: formData.department,
      phone: formData.phone,
      profileImage: localProfileImage,
    };
    
    // Update the global user context with the new data from the form.
    updateUser(updatedUser);
    
    // Exit editing mode.
    setIsEditing(false);
    // Note: Font size change is a global DOM manipulation and should be handled with care.
    document.documentElement.style.fontSize = `${fontSize}px`;
  };

  const handleCancel = () => {
    // On cancel, simply exit editing mode. The local form state will be
    // re-synced with the (unchanged) global state by the useEffect hook.
    setIsEditing(false);
  };
  
  const currentTheme = theme;
  // Determine which data to display based on whether we are editing or not.
  const displayImage = isEditing ? localProfileImage : user?.profileImage;
  const displayName = isEditing ? formData.name : user?.name;

  if (!user) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <ProfileAvatar
                src={displayImage}
                fallback={user.name.charAt(0).toUpperCase()}
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
                 <h1 className="text-xl font-semibold">{displayName}</h1>
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditToggle}
                    className="text-muted-foreground"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="sr-only">{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
                  </Button>
              </div>
              <p className="text-muted-foreground capitalize">{user.role}</p>
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
              <p className="text-muted-foreground">{user.name}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue={user.email}
              disabled
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            {isEditing ? (
              <Input id="department" value={formData.department} onChange={handleInputChange} />
            ) : (
              <p className="text-muted-foreground">{user.department}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Primary Phone</Label>
            {isEditing ? (
              <Input id="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
            ) : (
              <p className="text-muted-foreground">{user.phone}</p>
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
