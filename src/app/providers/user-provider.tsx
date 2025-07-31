
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
import { users as defaultUsers, type User, initialFaculties, initialDepartmentMap, allDepartments as initialAllDepartments } from '@/lib/data';
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

export interface AttachedFile {
  name: string;
  type: string;
  url: string;
}

export type Comment = {
  id: number;
  authorId: number;
  text: string;
  timestamp: string;
  replies: Comment[];
  attachedFile?: AttachedFile | null;
};

export type Post = {
  id: number;
  authorId: number;
  timestamp: string;
  content: string;
  attachedFile?: AttachedFile | null;
  comments: Comment[];
  audience: number[]; // Audience is now required
};

export type Notification = {
    id: string; // Firestore document ID
    recipientId: number;
    actorId: number;
    type: 'comment_on_post' | 'reply_to_comment';
    postId: number;
    commentId: number; // The new reply's ID
    isRead: boolean;
    timestamp: string;
};

// Maps userId to an array of rejected entry IDs
export type RejectedEntries = Record<number, number[]>;

export interface SpecialResitEntry {
    id: number;
    date: string | null;
    courseCode: string | null;
    courseName: string | null;
    department: string | null;
    numberOfStudents: number;
    room: string | null;
    examiner: string | null; // This is the original name from the file
    session: string | null;
  }
  
  // This represents the courses for a single lecturer after distribution
  export interface DistributedResitSchedule {
    lecturer: string; // The canonical/original name for display
    courses: SpecialResitEntry[];
  }
  
  export interface SpecialResitTimetable {
    venue: string;
    notice?: string;
    isDistributed: boolean;
    // The sheets will contain the distributed data.
    // For simplicity, we can assume one sheet named "Distributed"
    sheets: {
      sheetName: string;
      // entries will now be an array of DistributedResitSchedule
      entries: DistributedResitSchedule[];
    }[];
  }

export type StudentResitSelections = Record<number, number[]>;

export interface ExamEntry {
    id: number;
    date: any;
    dateStr: string;
    day: string;
    courseCode: string;
    courseName: string;
    class: string;
    lecturer: string;
    room: string;
    invigilator: string;
    period: string;
    is_practical?: boolean;
    level?: number;
    departments?: string[];
  }
  
  export interface ExamsTimetable {
    exams: ExamEntry[];
    practicals: ExamEntry[];
    isDistributed: boolean;
  }
  
export interface Department {
  name: string;
  initial: string;
}

export interface Faculty {
  name: string;
  departments: Department[];
}

// Helper function to check if a timetable entry's lecturer name matches a staff member's name.
const isLecturerMatch = (entryLecturerName: string, staffName: string): boolean => {
  const staffNameLower = staffName.toLowerCase();
  const entryNameLower = entryLecturerName.toLowerCase();

  // Get significant parts of the staff member's name from their profile
  const staffNameParts = staffNameLower
    .replace(/^(dr|prof|mr|mrs|ms)\.?\s*/, '') // Remove common titles
    .split(' ')
    .filter(p => p.length > 1); // Ignore single initials/short parts

  if (staffNameParts.length === 0) return false;

  // Check if all significant parts of the staff's name are present in the entry's lecturer name
  return staffNameParts.every(part => entryNameLower.includes(part));
};

interface UserContextType {
  user: User | null;
  allUsers: User[];
  login: (userId: number) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  resetState: () => void;
  masterSchedule: TimetableEntry[] | null;
  setMasterSchedule: (data: TimetableEntry[] | null) => void;
  isClassTimetableDistributed: boolean;
  distributeClassTimetable: () => void;
  updateScheduleStatus: (entryId: number, status: EventStatus) => void;
  emptySlots: EmptySlot[];
  setEmptySlots: (slots: EmptySlot[]) => void;
  posts: Post[];
  addPost: (postData: { content: string; attachedFile: AttachedFile | null, audience: number[] }) => void;
  deletePost: (postId: number) => void;
  addComment: (postId: number, text: string, attachedFile: AttachedFile | null) => Promise<void>;
  addReply: (postId: number, parentCommentId: number, text: string, attachedFile: AttachedFile | null) => Promise<void>;
  staffSchedules: TimetableEntry[];
  addStaffSchedule: (entry: Omit<TimetableEntry, 'id' | 'status' | 'lecturer'>) => void;
  reviewedSchedules: number[];
  markScheduleAsReviewed: (userId: number) => void;
  rejectedEntries: RejectedEntries;
  rejectScheduleEntry: (userId: number, entryId: number) => void;
  unrejectScheduleEntry: (userId: number, entryId: number) => void;
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  specialResitTimetable: SpecialResitTimetable | null;
  setSpecialResitTimetable: (data: SpecialResitTimetable | null) => void;
  distributeSpecialResitTimetable: () => void;
  studentResitSelections: StudentResitSelections;
  updateStudentResitSelection: (entryId: number, isSelected: boolean) => void;
  examsTimetable: ExamsTimetable | null;
  setExamsTimetable: (data: ExamsTimetable | null) => void;
  distributeExamsTimetable: () => void;
  faculties: Faculty[];
  departmentMap: Map<string, string>;
  allDepartments: string[];
  addFaculty: (name: string) => void;
  updateFaculty: (oldName: string, newName: string) => void;
  deleteFaculty: (name: string) => void;
  addDepartment: (data: { name: string; initial: string; facultyName: string }) => void;
  updateDepartment: (data: { oldName: string; newName: string; newInitial: string }) => void;
  moveDepartment: (data: { departmentName: string; newFacultyName: string }) => void;
  deleteDepartment: (name: string) => void;
  toast: (options: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(defaultUsers);
  const [masterSchedule, setMasterScheduleState] = useState<TimetableEntry[] | null>([]);
  const [isClassTimetableDistributed, setClassTimetableDistributed] = useState(false);
  const [staffSchedules, setStaffSchedules] = useState<TimetableEntry[]>([]);
  const [emptySlots, setEmptySlotsState] = useState<EmptySlot[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviewedSchedules, setReviewedSchedules] = useState<number[]>([]);
  const [rejectedEntries, setRejectedEntries] = useState<RejectedEntries>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [specialResitTimetable, setSpecialResitTimetableState] = useState<SpecialResitTimetable | null>(null);
  const [studentResitSelections, setStudentResitSelections] = useState<StudentResitSelections>({});
  const [examsTimetable, setExamsTimetableState] = useState<ExamsTimetable | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>(initialFaculties);
  const [departmentMap, setDepartmentMap] = useState<Map<string, string>>(initialDepartmentMap);
  const [allDepartments, setAllDepartments] = useState<string[]>(initialAllDepartments);

  // This useEffect handles session-based login persistence.
  useEffect(() => {
    const storedUserId = sessionStorage.getItem('userId');
    if (storedUserId) {
      const foundUser = allUsers.find(u => u.id === parseInt(storedUserId, 10));
      if (foundUser) {
        setUser(foundUser);
      }
    }
  }, [allUsers]);

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
        const storedResitData = localStorage.getItem('specialResitSchedule');
        if (storedResitData) {
            setSpecialResitTimetableState(JSON.parse(storedResitData));
        }
        const storedSelections = localStorage.getItem('studentResitSelections');
        if (storedSelections) {
            setStudentResitSelections(JSON.parse(storedSelections));
        }
        const storedExamsData = localStorage.getItem('examsTimetable');
        if (storedExamsData) {
            setExamsTimetableState(JSON.parse(storedExamsData));
        }
    } catch(e) {
        console.error("Failed to parse data from localStorage", e);
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
    if (user?.id === updatedUser.id) {
      setUser(updatedUser);
    }
    toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
  };
  
  const setMasterSchedule = useCallback((data: TimetableEntry[] | null) => {
    setMasterScheduleState(data);
    setClassTimetableDistributed(false); // Reset distribution status on new upload
    setReviewedSchedules([]);
    setRejectedEntries({});
    toast({ title: "Timetable Updated", description: "The new master schedule has been distributed." });
  }, [toast]);
  
  const distributeClassTimetable = useCallback(() => {
    if (!masterSchedule) return;
    setClassTimetableDistributed(true);
    toast({ title: "Class Timetable Distributed", description: "The class timetable is now live for all users." });
  }, [masterSchedule, toast]);

  const updateScheduleStatus = useCallback((entryId: number, status: EventStatus) => {
    const updateSchedule = (schedule: TimetableEntry[]) => 
        schedule.map(e => e.id === entryId ? { ...e, status } : e);

    setMasterScheduleState(prev => {
        if (!prev) return null;
        return updateSchedule(prev);
    });
    setStaffSchedules(prev => {
        return updateSchedule(prev);
    });
  }, []);
  
  const setEmptySlots = useCallback((slots: EmptySlot[]) => {
    setEmptySlotsState(slots);
  }, []);

  const addPost = useCallback((postData: { content: string; attachedFile: AttachedFile | null, audience: number[] }) => {
    if (!user) return;
    const newPost: Post = {
      id: Date.now(),
      authorId: user.id,
      timestamp: new Date().toISOString(),
      content: postData.content,
      attachedFile: postData.attachedFile,
      comments: [],
      audience: postData.audience,
    };
    
    setPosts(prevPosts => [newPost, ...prevPosts]);
    toast({ title: 'Post Created', description: 'Your post has been successfully published.' });

  }, [user, toast]);

  const deletePost = useCallback((postId: number) => {
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    toast({ title: 'Post Deleted', description: 'Your post has been removed.' });
  }, [toast]);

  const fetchNotifications = useCallback(async () => {
    // This function is a no-op in local mode.
    // Notifications are managed in-memory.
  }, []);

  useEffect(() => {
    if (user) {
        fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const addComment = useCallback(async (postId: number, text: string, attachedFile: AttachedFile | null) => {
    if (!user) return;

    const newComment: Comment = {
      id: Date.now(),
      authorId: user.id,
      text,
      timestamp: new Date().toISOString(),
      replies: [],
      attachedFile,
    };

    let postAuthorId: number | null = null;
    
    setPosts(prevPosts => {
      const updatedPosts = prevPosts.map(p => {
        if (p.id === postId) {
          postAuthorId = p.authorId;
          return { ...p, comments: [...p.comments, newComment] };
        }
        return p;
      });
      return updatedPosts;
    });
    
    // Create notification locally
    if (postAuthorId && postAuthorId !== user.id) {
        const newNotification: Notification = {
            id: String(Date.now()), // Local unique ID
            recipientId: postAuthorId,
            actorId: user.id,
            type: 'comment_on_post',
            postId: postId,
            commentId: newComment.id,
            isRead: false,
            timestamp: newComment.timestamp,
        };
        setNotifications(prev => [newNotification, ...prev]);
    }
  }, [user]);

  const addReply = useCallback(async (postId: number, parentCommentId: number, text: string, attachedFile: AttachedFile | null) => {
      if (!user) return;

      const newReply: Comment = {
          id: Date.now(),
          authorId: user.id,
          text,
          timestamp: new Date().toISOString(),
          replies: [],
          attachedFile,
      };

      const notificationsToAdd: Notification[] = [];
      
      setPosts(prevPosts => {
          const updatedPosts = JSON.parse(JSON.stringify(prevPosts));
          const post = updatedPosts.find((p: Post) => p.id === postId);

          if (post) {
              const findParentComment = (comments: Comment[]): Comment | null => {
                  for (const comment of comments) {
                      if (comment.id === parentCommentId) return comment;
                      const found = findParentComment(comment.replies);
                      if (found) return found;
                  }
                  return null;
              };

              const parentComment = findParentComment(post.comments);

              if (parentComment) {
                  parentComment.replies.push(newReply);
                  
                  // Notify parent comment author
                  if (parentComment.authorId !== user.id) {
                      notificationsToAdd.push({
                          id: String(Date.now() + Math.random()),
                          recipientId: parentComment.authorId,
                          actorId: user.id,
                          type: 'reply_to_comment',
                          postId: postId,
                          commentId: newReply.id,
                          isRead: false,
                          timestamp: newReply.timestamp,
                      });
                  }
                  
                  // Notify post author if they are a different person
                  if (post.authorId !== user.id && post.authorId !== parentComment.authorId) {
                      notificationsToAdd.push({
                          id: String(Date.now() + Math.random()),
                          recipientId: post.authorId,
                          actorId: user.id,
                          type: 'reply_to_comment',
                          postId: postId,
                          commentId: newReply.id,
                          isRead: false,
                          timestamp: newReply.timestamp,
                      });
                  }
              }
          }
          return updatedPosts;
      });

      if (notificationsToAdd.length > 0) {
          setNotifications(prev => [
            ...notificationsToAdd,
            ...prev
          ]);
      }
  }, [user]);


  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
  }, []);

  const clearAllNotifications = useCallback(async () => {
    if (!user) return;
    setNotifications(prev => prev.map(n => n.recipientId === user.id ? { ...n, isRead: true } : n));
    toast({ title: 'Notifications Cleared', description: 'All your notifications have been marked as read.' });
  }, [user, toast]);

  const addStaffSchedule = useCallback((entry: Omit<TimetableEntry, 'id' | 'status' | 'lecturer'>) => {
    if (!user || user.role !== 'staff') return;
    
    const newEntry: TimetableEntry = {
      ...entry,
      id: Date.now(), 
      status: 'confirmed', 
      lecturer: user.name,
    };
    
    setStaffSchedules(prev => [...prev, newEntry]);
    toast({ title: 'Class Added', description: 'The new class has been added to the schedule.' });

  }, [user, toast]);
  
  const markScheduleAsReviewed = useCallback((userId: number) => {
    setReviewedSchedules(prev => [...new Set([...prev, userId])]);
    toast({ title: "Schedule Confirmed", description: "Thank you for reviewing your schedule." });
  }, [toast]);
  
  const rejectScheduleEntry = useCallback((userId: number, entryId: number) => {
    setRejectedEntries(prev => {
      const userRejections = prev[userId] || [];
      return { ...prev, [userId]: [...new Set([...userRejections, entryId])] };
    });
  }, []);
  
  const unrejectScheduleEntry = useCallback((userId: number, entryId: number) => {
    setRejectedEntries(prev => {
      const userRejections = prev[userId] || [];
      return { ...prev, [userId]: userRejections.filter(id => id !== entryId) };
    });
  }, []);

  const setSpecialResitTimetable = useCallback((data: SpecialResitTimetable | null) => {
    setSpecialResitTimetableState(data);
    if (data) {
      localStorage.setItem('specialResitSchedule', JSON.stringify(data));
    } else {
      localStorage.removeItem('specialResitSchedule');
    }
  }, []);

  const distributeSpecialResitTimetable = useCallback(() => {
    const currentState = specialResitTimetable;
    if (!currentState) return;

    const distributedData = { ...currentState, isDistributed: true };
    setSpecialResitTimetableState(distributedData);
    localStorage.setItem('specialResitSchedule', JSON.stringify(distributedData));
    toast({ title: "Timetable Distributed", description: "The special resit timetable is now live for students and staff." });

  }, [specialResitTimetable, toast]);
  
  const setExamsTimetable = useCallback((data: ExamsTimetable | null) => {
    setExamsTimetableState(data);
    if (data) {
      localStorage.setItem('examsTimetable', JSON.stringify(data));
    } else {
      localStorage.removeItem('examsTimetable');
    }
  }, []);

  const distributeExamsTimetable = useCallback(() => {
    const currentState = examsTimetable;
    if (!currentState) return;
    
    const distributedData = { ...currentState, isDistributed: true };
    setExamsTimetableState(distributedData);
localStorage.setItem('examsTimetable', JSON.stringify(distributedData));
    toast({ title: "Exams Timetable Distributed", description: "The exams timetable is now live for all users." });

  }, [examsTimetable, toast]);

  const updateStudentResitSelection = useCallback((entryId: number, isSelected: boolean) => {
    if (!user) return;
    
    setStudentResitSelections(prev => {
        const currentUserSelections = prev[user.id] || [];
        let newSelections;
        if (isSelected) {
            newSelections = [...new Set([...currentUserSelections, entryId])];
        } else {
            newSelections = currentUserSelections.filter(id => id !== entryId);
        }
        
        const newState = { ...prev, [user.id]: newSelections };
        localStorage.setItem('studentResitSelections', JSON.stringify(newState));
        return newState;
    });
  }, [user]);

  const addFaculty = useCallback((name: string) => {
    if (faculties.some(f => f.name.toLowerCase() === name.toLowerCase())) {
        toast({ title: "Faculty Exists", description: "A faculty with this name already exists.", variant: "destructive" });
        return;
    }
    setFaculties(prev => [...prev, { name, departments: [] }]);
    toast({ title: "Faculty Added", description: `The "${name}" faculty has been created.` });
  }, [faculties, toast]);

  const updateFaculty = useCallback((oldName: string, newName: string) => {
    setFaculties(prev => prev.map(f => f.name === oldName ? { ...f, name: newName } : f));
    toast({ title: "Faculty Updated", description: "The faculty name has been updated." });
  }, [toast]);

  const deleteFaculty = useCallback((name: string) => {
    setFaculties(prev => {
        const facultyToDelete = prev.find(f => f.name === name);
        if (facultyToDelete) {
            const departmentNames = facultyToDelete.departments.map(d => d.name);
            setAllDepartments(ad => ad.filter(d => !departmentNames.includes(d)));
            setDepartmentMap(dm => {
                const newMap = new Map(dm);
                facultyToDelete.departments.forEach(d => newMap.delete(d.initial));
                return newMap;
            });
        }
        return prev.filter(f => f.name !== name);
    });
    toast({ title: "Faculty Deleted", description: `The "${name}" faculty has been deleted.` });
  }, [toast]);

  const addDepartment = useCallback(({ name, initial, facultyName }: { name: string; initial: string; facultyName: string }) => {
    setFaculties(prev => prev.map(f => {
        if (f.name === facultyName) {
            return { ...f, departments: [...f.departments, { name, initial }] };
        }
        return f;
    }));
    setAllDepartments(prev => [...prev, name].sort());
    setDepartmentMap(prev => new Map(prev).set(initial, name));
    toast({ title: "Department Added", description: `"${name}" has been added to the ${facultyName} faculty.` });
  }, [toast]);

  const updateDepartment = useCallback(({ oldName, newName, newInitial }: { oldName: string; newName: string; newInitial: string }) => {
    let oldInitial = '';
    setFaculties(prev => prev.map(f => ({
        ...f,
        departments: f.departments.map(d => {
            if (d.name === oldName) {
                oldInitial = d.initial;
                return { name: newName, initial: newInitial };
            }
            return d;
        }),
    })));
    setAllDepartments(prev => prev.map(d => d === oldName ? newName : d).sort());
    setDepartmentMap(prev => {
        const newMap = new Map(prev);
        if (oldInitial) newMap.delete(oldInitial);
        newMap.set(newInitial, newName);
        return newMap;
    });
    toast({ title: "Department Updated", description: "The department details have been updated." });
  }, [toast]);
  
  const moveDepartment = useCallback(({ departmentName, newFacultyName }: { departmentName: string; newFacultyName: string }) => {
    let departmentToMove: Department | null = null;
    // Remove from old faculty
    setFaculties(prev => {
        const nextState = prev.map(f => {
            const dept = f.departments.find(d => d.name === departmentName);
            if (dept) {
                departmentToMove = dept;
                return { ...f, departments: f.departments.filter(d => d.name !== departmentName) };
            }
            return f;
        });
        // Add to new faculty
        return nextState.map(f => {
            if (f.name === newFacultyName && departmentToMove) {
                return { ...f, departments: [...f.departments, departmentToMove] };
            }
            return f;
        });
    });
    toast({ title: "Department Moved", description: `Moved "${departmentName}" to the ${newFacultyName} faculty.` });
  }, [toast]);

  const deleteDepartment = useCallback((name: string) => {
    let initialToDelete = '';
    setFaculties(prev => prev.map(f => ({
        ...f,
        departments: f.departments.filter(d => {
            if (d.name === name) {
                initialToDelete = d.initial;
                return false;
            }
            return true;
        })
    })));
    setAllDepartments(prev => prev.filter(d => d !== name));
    if (initialToDelete) {
        setDepartmentMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(initialToDelete);
            return newMap;
        });
    }
    toast({ title: "Department Deleted", description: `The "${name}" department has been deleted.` });
  }, [toast]);


  const resetState = () => {
    logout();
    setAllUsers(defaultUsers);
    setMasterScheduleState(null);
    setClassTimetableDistributed(false);
    setEmptySlotsState([]);
    setPosts([]);
    setStaffSchedules([]);
    setReviewedSchedules([]);
    setRejectedEntries({});
    setNotifications([]);
    setSpecialResitTimetableState(null);
    setStudentResitSelections({});
    setExamsTimetableState(null);
    setFaculties(initialFaculties);
    setDepartmentMap(initialDepartmentMap);
    setAllDepartments(initialAllDepartments);
    
    // Clear local storage for all dynamic data
    if (typeof window !== 'undefined') {
        localStorage.removeItem('specialResitSchedule');
        localStorage.removeItem('studentResitSelections');
        localStorage.removeItem('examsTimetable');
    }

    toast({ title: "Application Reset", description: "All data has been reset to its initial state." });
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
    isClassTimetableDistributed,
    distributeClassTimetable,
    updateScheduleStatus,
    emptySlots,
    setEmptySlots,
    posts,
    addPost,
    deletePost,
    addComment,
    addReply,
    staffSchedules,
    addStaffSchedule,
    reviewedSchedules,
    markScheduleAsReviewed,
    rejectedEntries,
    rejectScheduleEntry,
    unrejectScheduleEntry,
    notifications,
    fetchNotifications,
    markNotificationAsRead,
    clearAllNotifications,
    specialResitTimetable,
    setSpecialResitTimetable,
    distributeSpecialResitTimetable,
    studentResitSelections,
    updateStudentResitSelection,
    examsTimetable,
    setExamsTimetable,
    distributeExamsTimetable,
    faculties,
    departmentMap,
    allDepartments,
    addFaculty,
    updateFaculty,
    deleteFaculty,
    addDepartment,
    updateDepartment,
    moveDepartment,
    deleteDepartment,
    toast,
  }), [user, allUsers, login, logout, updateUser, resetState, masterSchedule, setMasterSchedule, isClassTimetableDistributed, distributeClassTimetable, updateScheduleStatus, emptySlots, setEmptySlots, posts, addPost, deletePost, addComment, addReply, staffSchedules, addStaffSchedule, reviewedSchedules, markScheduleAsReviewed, rejectedEntries, rejectScheduleEntry, unrejectScheduleEntry, notifications, fetchNotifications, markNotificationAsRead, clearAllNotifications, specialResitTimetable, setSpecialResitTimetable, distributeSpecialResitTimetable, studentResitSelections, updateStudentResitSelection, examsTimetable, setExamsTimetable, distributeExamsTimetable, faculties, departmentMap, allDepartments, addFaculty, updateFaculty, deleteFaculty, addDepartment, updateDepartment, moveDepartment, deleteDepartment, toast]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

    