
'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { users as defaultUsers, type User } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

// Define the shape of timetable entries and empty slots
// These types are moved here to be shared via context
export type EventStatus = 'confirmed' | 'canceled' | 'undecided';
export interface TimetableEntry {
  day: string;
  time: string;
  room: string;
  departments: string[];
  level: number;
  courseCode: string;
  lecturer: string;
  id: number;
  status: EventStatus;
}
export interface EmptySlot {
  day: string;
  location: string;
  time: string;
}

interface UserContextType {
  user: User | null;
  allUsers: User[];
  login: (userId: number) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  resetState: () => void;
  masterSchedule: TimetableEntry[] | null;
  setMasterSchedule: (data: TimetableEntry[] | null) => void;
  emptySlots: EmptySlot[];
  setEmptySlots: (slots: EmptySlot[]) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Helper functions for localStorage
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  try {
    const item = JSON.stringify(value);
    window.localStorage.setItem(key, item);
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
};

export function UserProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [masterSchedule, setMasterScheduleState] = useState<TimetableEntry[] | null>([]);
  const [emptySlots, setEmptySlotsState] = useState<EmptySlot[]>([]);

  // Initialize state from localStorage on mount
  useEffect(() => {
    setAllUsers(getFromStorage('allUsers', defaultUsers));
    setMasterScheduleState(getFromStorage('masterSchedule', null));
    setEmptySlotsState(getFromStorage('emptySlots', []));

    const storedUserId = sessionStorage.getItem('userId');
    if (storedUserId) {
      const usersFromStorage = getFromStorage('allUsers', defaultUsers);
      const foundUser = usersFromStorage.find(u => u.id === parseInt(storedUserId, 10));
      if (foundUser) {
        setUser(foundUser);
      }
    }
  }, []);

  const login = (userId: number) => {
    const foundUser = allUsers.find(u => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
      sessionStorage.setItem('userId', String(userId));
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('userId');
  };

  const updateUser = (updatedUser: User) => {
    const newAllUsers = allUsers.map(u => (u.id === updatedUser.id ? updatedUser : u));
    setAllUsers(newAllUsers);
    saveToStorage('allUsers', newAllUsers);
    // Also update the currently logged-in user if they are the one being edited
    if (user?.id === updatedUser.id) {
      setUser(updatedUser);
    }
    toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
  };
  
  const setMasterSchedule = useCallback((data: TimetableEntry[] | null) => {
    setMasterScheduleState(data);
    saveToStorage('masterSchedule', data);
  }, []);
  
  const setEmptySlots = useCallback((slots: EmptySlot[]) => {
    setEmptySlotsState(slots);
    saveToStorage('emptySlots', slots);
  }, []);

  const resetState = () => {
    logout(); // Log out current user
    
    // Clear localStorage
    window.localStorage.removeItem('allUsers');
    window.localStorage.removeItem('masterSchedule');
    window.localStorage.removeItem('emptySlots');
    
    // Reset state to defaults
    setAllUsers(defaultUsers);
    setMasterScheduleState(null);
    setEmptySlotsState([]);

    toast({ title: "Application Reset", description: "All data has been reset to its initial state." });
    
    // Optional: force a reload to ensure a clean slate, though changing state should be enough
    window.location.reload();
  };

  const value = useMemo(() => ({
    user,
    allUsers,
    login,
    logout,
    updateUser,
    resetState,
    masterSchedule,
    setMasterSchedule,
    emptySlots,
    setEmptySlots,
  }), [user, allUsers, masterSchedule, emptySlots, setMasterSchedule, setEmptySlots]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
