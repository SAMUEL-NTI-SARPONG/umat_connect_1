
'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
} from 'react';

export type UserRole = 'student' | 'lecturer' | 'administrator';

interface UserContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  name: string;
  setName: (name: string) => void;
  profileImage: string;
  setProfileImage: (imageUrl: string) => void;
  department: string;
  setDepartment: (department: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('User Name');
  const [profileImage, setProfileImage] = useState('https://placehold.co/100x100.png');
  const [department, setDepartment] = useState('Computer Science');
  const [phone, setPhone] = useState('+233 12 345 6789');


  const value = useMemo(() => ({ 
    role, 
    setRole,
    name,
    setName,
    profileImage,
    setProfileImage,
    department,
    setDepartment,
    phone,
    setPhone,
   }), [role, name, profileImage, department, phone]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
