
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { departments as allDepartments } from '@/lib/data';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';

const titles = [
    'Prof.', 'Professor', 'Dr.', 'Doctor', 'DPhil', 'ScD', 'EdD', 'DSc', 'DVM',
    'Mr.', 'Mrs.', 'Ms.', 'Miss', 'Mx.',
    'Sr.', 'Fr.', 'Br.', 'Rev.', 'Rev. Fr.',
    'Eng.', 'Engr.', 'Arch.', 'Capt.', 'Col.', 'Hon.'
];
const suffixes = ['PhD', 'MPhil', 'MSc', 'MA', 'MBA', 'BSc', 'BA', 'LLB', 'LLM', 'JD', 'MD', 'RN', 'Esq.'];

// Function to parse a full name into its components
const parseFullName = (fullName: string) => {
    const parts = fullName.split(' ').filter(Boolean);
    let title = '';
    let surname = '';
    let firstname = '';
    let othername = '';
    let suffix = '';

    // Extract title
    if (parts.length > 0 && titles.includes(parts[0])) {
        title = parts.shift() || '';
    }
    
    // Extract suffix
    if (parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        const lastPartClean = lastPart.replace(/,/g, '');
        if (suffixes.includes(lastPartClean)) {
            suffix = parts.pop() || '';
        }
    }

    if (parts.length > 0) firstname = parts.shift() || '';
    if (parts.length > 0) surname = parts.pop() || '';
    if (parts.length > 0) othername = parts.join(' ');
    
    // Handle cases with only one or two names
    if (!surname && firstname) {
        surname = firstname;
        firstname = '';
    }
    if (title && !firstname && !surname) {
        surname = parts.join(' ');
    }


    return { title, firstname, surname, othername, suffix };
};

export default function ProfilePage() {
  const { user, updateUser } = useUser();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState(16);

  const [formData, setFormData] = useState({
    title: '',
    firstname: '',
    surname: '',
    othername: '',
    department: user?.department || '',
    phone: user?.phone || '',
    level: user?.level || 0,
  });
  const [localProfileImage, setLocalProfileImage] = useState(user?.profileImage || '');

  const setFormDataFromUser = (currentUser: typeof user) => {
    if (currentUser) {
        const { title, firstname, surname, othername } = parseFullName(currentUser.name);
        setFormData({
            title,
            firstname,
            surname,
            othername,
            department: currentUser.department,
            phone: currentUser.phone,
            level: currentUser.level,
        });
        setLocalProfileImage(currentUser.profileImage);
    }
  };

  useEffect(() => {
    if (user && !isEditing) {
      setFormDataFromUser(user);
    }
  }, [user, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    const processedValue = value === 'none' ? '' : value;
    setFormData((prev) => ({ ...prev, [field]: processedValue }));
  };

  const handleLevelChange = (value: string) => {
    setFormData((prev) => ({ ...prev, level: Number(value) }));
  };

  const handleDepartmentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, department: value }));
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
      if (user) {
        setFormDataFromUser(user);
      }
    }
    setIsEditing(!isEditing);
  };
  
  const constructFullName = () => {
    const { title, firstname, surname, othername } = formData;
    return [title, firstname, othername, surname].filter(Boolean).join(' ');
  };

  const handleSaveChanges = () => {
    if (!user) return;
    
    if (!formData.firstname.trim() || !formData.surname.trim()) {
        toast({
            title: "Missing Information",
            description: "First Name and Surname are required.",
            variant: "destructive",
        });
        return;
    }

    const fullName = constructFullName();

    const updatedUser = {
      ...user,
      name: fullName,
      department: formData.department,
      phone: formData.phone,
      level: formData.level,
      profileImage: localProfileImage,
    };

    updateUser(updatedUser);
    setIsEditing(false);
    document.documentElement.style.fontSize = `${fontSize}px`;
  };

  const handleCancel = () => {
    if (user) {
        setFormDataFromUser(user);
    }
    setIsEditing(false);
  };
  
  const currentTheme = theme;
  const displayImage = isEditing ? localProfileImage : user?.profileImage;
  const displayName = isEditing ? constructFullName() : user?.name;

  if (!user) {
    return <div>Loading profile...</div>;
  }
  
  const titleOptions = [
      { value: 'none', label: 'None' },
      ...titles.map(t => ({ value: t, label: t }))
  ];

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
            {isEditing ? (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-1">
                      <Label htmlFor="title">Title</Label>
                      <Combobox
                        options={titleOptions}
                        value={formData.title || 'none'}
                        onChange={(value) => handleSelectChange('title', value)}
                        placeholder="Select a title..."
                        searchPlaceholder="Search titles..."
                        notFoundMessage="No title found."
                      />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="firstname">First Name</Label>
                      <Input id="firstname" value={formData.firstname} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="othername">Other Name(s)</Label>
                      <Input id="othername" value={formData.othername} onChange={handleInputChange} />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="surname">Surname</Label>
                      <Input id="surname" value={formData.surname} onChange={handleInputChange} />
                  </div>
                </div>
            </>
            ) : (
                <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <p className="text-muted-foreground">{user.name}</p>
                </div>
            )}
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
              <Select value={formData.department} onValueChange={handleDepartmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {allDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-muted-foreground">{user.department}</p>
            )}
          </div>
          {user.role === 'student' && (
            <div className="grid gap-2">
              <Label htmlFor="level">Level</Label>
              {isEditing ? (
                 <Select value={String(formData.level)} onValueChange={handleLevelChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="300">300</SelectItem>
                        <SelectItem value="400">400</SelectItem>
                    </SelectContent>
                 </Select>
              ) : (
                <p className="text-muted-foreground">{user.level}</p>
              )}
            </div>
          )}
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
