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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('student');

  const value = useMemo(() => ({ role, setRole }), [role]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
