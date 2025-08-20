
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
import { getFromStorage, saveToStorage } from '@/lib/storage';

// Define the shape of timetable entries and empty slots
// These types are moved here to be shared via context
export type EventStatus = 'confirmed' | 'canceled' | 'undecided' | 'quiz';
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

export type NotificationType = 
  | 'comment_on_post' 
  | 'reply_to_comment' 
  | 'new_post'
  | 'class_timetable' 
  | 'exam_timetable' 
  | 'resit_timetable';

export type Notification = {
    id: string;
    recipientId: number;
    actorId: number; // Admin who distributed
    type: NotificationType;
    postId: number | null; // Can be null for timetable notifications
    commentId: number | null; // Can be null
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

// Interface for staff account data
interface StaffAccount {
  surname: string;
  firstname: string;
  otherName?: string;
  title?: string;
  id: string;
}

export const isLecturerMatchWithUsers = (entryLecturerName: string, staffUser: User): boolean => {
    if (!entryLecturerName || typeof entryLecturerName !== 'string' || !staffUser) return false;
    
    // Direct match is the most reliable.
    if (entryLecturerName === staffUser.name) {
        return true;
    }
    // Fallback for simple cases
    const staffNameParts = staffUser.name.toLowerCase().split(' ').filter(p => p.length > 2);
    return staffNameParts.some(part => entryLecturerName.toLowerCase().includes(part));
};

// New type for timetable metadata
export type TimetableMetadata = {
  allRooms: string[];
  allTimeSlots: string[];
  allDays: string[];
};

interface UserContextType {
  user: User | null;
  allUsers: User[];
  login: (email: string, password?: string) => void;
  logout: () => void;
  signup: (userData: Omit<User, 'id'>) => void;
  updateUser: (updatedUser: User) => void;
  resetState: () => void;
  masterSchedule: TimetableEntry[] | null;
  setMasterSchedule: (data: TimetableEntry[] | null) => void;
  isClassTimetableDistributed: boolean;
  distributeClassTimetable: () => { success: boolean; message: string };
  updateScheduleStatus: (updatedEntry: TimetableEntry) => void;
  posts: Post[];
  addPost: (postData: { content: string; attachedFile: AttachedFile | null, audience: number[] }) => void;
  deletePost: (postId: number) => void;
  addComment: (postId: number, text: string, attachedFile: AttachedFile | null) => Promise<void>;
  addReply: (postId: number, parentCommentId: number, text: string, attachedFile: AttachedFile | null) => Promise<void>;
  staffSchedules: TimetableEntry[];
  addStaffSchedule: (entry: Omit<TimetableEntry, 'id' | 'lecturer'>) => void;
  reviewedSchedules: number[];
  markScheduleAsReviewed: (userId: number) => void;
  rejectedEntries: RejectedEntries;
  rejectScheduleEntry: (userId: number, entryId: number) => void;
  unrejectScheduleEntry: (userId: number, entryId: number) => void;
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => void;
  clearAllNotifications: () => Promise<void>;
  specialResitTimetable: SpecialResitTimetable | null;
  setSpecialResitTimetable: (data: SpecialResitTimetable | null) => void;
  distributeSpecialResitTimetable: () => void;
  studentResitSelections: StudentResitSelections;
  updateStudentResitSelection: (entryIds: number[]) => void;
  examsTimetable: ExamsTimetable | null;
  setExamsTimetable: (data: ExamsTimetable | null) => void;
  distributeExamsTimetable: () => { success: boolean; message: string; studentCount?: number };
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
  playingAlarm: Howl | null;
  playAlarm: (soundSrc: string) => Howl;
  stopAlarm: () => void;
  timetableMetadata?: TimetableMetadata;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const useLocalStorageState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => getFromStorage(key, defaultValue));
    useEffect(() => {
        saveToStorage(key, state);
    }, [key, state]);
    return [state, setState];
};

export function UserProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const [allUsers, setAllUsers] = useLocalStorageState<User[]>('allUsers', defaultUsers);
  const [user, setUser] = useState<User | null>(null);

  const [masterSchedule, setMasterScheduleState] = useLocalStorageState<TimetableEntry[] | null>('masterSchedule', null);
  const [isClassTimetableDistributed, setClassTimetableDistributed] = useLocalStorageState<boolean>('isClassTimetableDistributed', false);
  const [staffSchedules, setStaffSchedules] = useLocalStorageState<TimetableEntry[]>('staffSchedules', []);
  const [posts, setPosts] = useLocalStorageState<Post[]>('posts', []);
  const [reviewedSchedules, setReviewedSchedules] = useLocalStorageState<number[]>('reviewedSchedules', []);
  const [rejectedEntries, setRejectedEntries] = useLocalStorageState<RejectedEntries>('rejectedEntries', {});
  const [notifications, setNotifications] = useLocalStorageState<Notification[]>('notifications', []);
  const [specialResitTimetable, setSpecialResitTimetableState] = useLocalStorageState<SpecialResitTimetable | null>('specialResitTimetable', null);
  const [studentResitSelections, setStudentResitSelections] = useLocalStorageState<StudentResitSelections>('studentResitSelections', {});
  const [examsTimetable, setExamsTimetableState] = useLocalStorageState<ExamsTimetable | null>('examsTimetable', null);
  const [faculties, setFaculties] = useLocalStorageState<Faculty[]>('faculties', initialFaculties);
  const [departmentMap, setDepartmentMap] = useLocalStorageState<Map<string, string>>('departmentMap', initialDepartmentMap);
  const [allDepartments, setAllDepartments] = useLocalStorageState<string[]>('allDepartments', initialAllDepartments);
  const [playingAlarm, setPlayingAlarm] = useState<Howl | null>(null);

  // Add timetableMetadata state
  const [timetableMetadata, setTimetableMetadata] = useState<TimetableMetadata | undefined>(undefined);

  const playAlarm = useCallback((soundSrc: string) => {
    const sound = new (require('howler').Howl)({
        src: [soundSrc],
        loop: true,
        volume: 0.5,
    });
    sound.play();
    setPlayingAlarm(sound);
    return sound;
  }, []);

  const stopAlarm = useCallback(() => {
    if (playingAlarm) {
        playingAlarm.stop();
        setPlayingAlarm(null);
    }
  }, [playingAlarm]);

  
  // This useEffect handles session-based login persistence.
  useEffect(() => {
    try {
        const storedUserId = sessionStorage.getItem('userId');
        if (storedUserId) {
          const foundUser = allUsers.find(u => u.id === parseInt(storedUserId, 10));
          if (foundUser) {
            setUser(foundUser);
          }
        }
    } catch (error) {
        console.error("Failed to read from sessionStorage:", error);
    }
  }, [allUsers]);

  const login = useCallback((email: string) => {
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      setUser(foundUser);
      try {
        sessionStorage.setItem('userId', String(foundUser.id));
        toast({ title: "Login Successful", description: `Welcome back, ${foundUser.name}!` });
      } catch (error) {
          console.error("Failed to write to sessionStorage:", error);
      }
    } else {
        toast({ title: "Login Failed", description: "No account found with that email.", variant: "destructive" });
    }
  }, [allUsers, toast]);

  const logout = () => {
    setUser(null);
    try {
        sessionStorage.removeItem('userId');
    } catch (error) {
        console.error("Failed to remove from sessionStorage:", error);
    }
  };

  const updateUser = useCallback((updatedUser: User) => {
    setAllUsers(prevUsers => prevUsers.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    if (user?.id === updatedUser.id) {
      setUser(updatedUser);
    }
    toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
  }, [user, toast, setAllUsers]);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => {
    // Check for existing notifications to prevent duplicates
    const exists = notifications.some(n =>
        n.type === notificationData.type &&
        n.recipientId === notificationData.recipientId &&
        n.actorId === notificationData.actorId &&
        n.commentId === notificationData.commentId &&
        n.postId === notificationData.postId
    );

    if (exists) {
        return; // Don't add a duplicate notification
    }
    
    const newNotification: Notification = {
        ...notificationData,
        id: `${notificationData.type}-${notificationData.recipientId}-${Date.now()}`,
        isRead: false,
        timestamp: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, [notifications, setNotifications]);

  const distributeClassTimetable = useCallback(() => {
    if (!masterSchedule) {
      return { success: false, message: 'No class timetable to distribute.' };
    }
    setClassTimetableDistributed(true);

    if (user) {
        allUsers.forEach(recipient => {
            if(recipient.id !== user.id) { // Don't notify the admin
                addNotification({
                    recipientId: recipient.id,
                    actorId: user.id,
                    type: 'class_timetable',
                    postId: null,
                    commentId: null,
                });
            }
        });
    }

    return { success: true, message: `The class timetable is now live for all ${allUsers.length -1} users.` };
  }, [masterSchedule, setClassTimetableDistributed, user, allUsers, addNotification]);
  
  const setMasterSchedule = useCallback(async (data: TimetableEntry[] | null) => {
    setMasterScheduleState(data);
    if (data) {
        toast({ title: "Timetable Updated", description: "The new master schedule has been loaded." });
    }
    
    setClassTimetableDistributed(false); // Reset distribution status on new upload
    setReviewedSchedules([]);
    setRejectedEntries({});

  }, [toast, setMasterScheduleState, setClassTimetableDistributed, setReviewedSchedules, setRejectedEntries]);
  
  const updateScheduleStatus = useCallback((updatedEntry: TimetableEntry) => {
    const updateSchedule = (schedule: TimetableEntry[] | null): TimetableEntry[] | null => {
        if (!schedule) return null;
        return schedule.map(e => (e.id === updatedEntry.id ? updatedEntry : e));
    }

    setMasterScheduleState(prev => updateSchedule(prev));
    setStaffSchedules(prev => updateSchedule(prev) || []);
    
  }, [setMasterScheduleState, setStaffSchedules]);
  
  const addPost = useCallback((postData: { content: string; attachedFile: AttachedFile | null, audience: number[] }) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to post.", variant: "destructive" });
        return;
    }
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

    // Create notifications for the audience
    postData.audience.forEach(recipientId => {
      addNotification({
        recipientId: recipientId,
        actorId: user.id,
        type: 'new_post',
        postId: newPost.id,
        commentId: 0,
      });
    });

  }, [user, toast, setPosts, addNotification]);

  const deletePost = useCallback((postId: number) => {
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    toast({ title: 'Post Deleted', description: 'Your post has been removed.' });
  }, [toast, setPosts]);

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
    if (!text.trim() && !attachedFile) {
        toast({ title: "Cannot post empty comment", variant: "destructive" });
        return;
    }

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
        addNotification({
            recipientId: postAuthorId,
            actorId: user.id,
            type: 'comment_on_post',
            postId: postId,
            commentId: newComment.id,
        });
    }
  }, [user, addNotification, toast, setPosts]);

  const addReply = useCallback(async (postId: number, parentCommentId: number, text: string, attachedFile: AttachedFile | null) => {
      if (!user) return;
      if (!text.trim() && !attachedFile) {
        toast({ title: "Cannot post empty reply", variant: "destructive" });
        return;
      }

      const newReply: Comment = {
          id: Date.now(),
          authorId: user.id,
          text,
          timestamp: new Date().toISOString(),
          replies: [],
          attachedFile,
      };

      setPosts(prevPosts => {
          const updatedPosts = JSON.parse(JSON.stringify(prevPosts));
          const post = updatedPosts.find((p: Post) => p.id === postId);

          if (post) {
              let parentComment: Comment | null = null;
              const findParentComment = (comments: Comment[]): Comment | null => {
                  for (const comment of comments) {
                      if (comment.id === parentCommentId) return comment;
                      const found = findParentComment(comment.replies);
                      if (found) return found;
                  }
                  return null;
              };
              parentComment = findParentComment(post.comments);

              if (parentComment) {
                  parentComment.replies.push(newReply);
                  
                  // Only notify the parent comment's author, if they aren't the one replying
                  if (parentComment.authorId !== user.id) {
                      addNotification({
                          recipientId: parentComment.authorId,
                          actorId: user.id,
                          type: 'reply_to_comment',
                          postId: postId,
                          commentId: newReply.id,
                      });
                  }
              }
          }
          return updatedPosts;
      });
  }, [user, addNotification, toast, setPosts]);


  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
  }, [setNotifications]);

  const clearAllNotifications = useCallback(async () => {
    if (!user) return;
    setNotifications(prev => prev.map(n => n.recipientId === user.id ? { ...n, isRead: true } : n));
    toast({ title: 'Notifications Cleared', description: 'All your notifications have been marked as read.' });
  }, [user?.id, toast, setNotifications]);

  const addStaffSchedule = useCallback((entry: Omit<TimetableEntry, 'id' | 'lecturer'>) => {
    if (!user || user.role !== 'staff') return;

    const newEntry: TimetableEntry = {
        ...entry,
        id: Date.now(),
        lecturer: user.name,
    };
    
    // Only add to staffSchedules. The combined schedule logic will handle visibility.
    setStaffSchedules(prev => [...prev, newEntry]);

    const toastTitle = entry.status === 'quiz' ? 'Quiz Scheduled' : 'Class Scheduled';
    const toastDescription = `The new event has been added to the timetable for all users.`;
    toast({ title: toastTitle, description: toastDescription });

  }, [user, toast, setStaffSchedules]);
  
  const markScheduleAsReviewed = useCallback((userId: number) => {
    setReviewedSchedules(prev => [...new Set([...prev, userId])]);
    toast({ title: "Schedule Confirmed", description: "Thank you for reviewing your schedule." });
  }, [toast, setReviewedSchedules]);
  
  const rejectScheduleEntry = useCallback((userId: number, entryId: number) => {
    setRejectedEntries(prev => {
      const userRejections = prev[userId] || [];
      return { ...prev, [userId]: [...new Set([...userRejections, entryId])] };
    });
  }, [setRejectedEntries]);
  
  const unrejectScheduleEntry = useCallback((userId: number, entryId: number) => {
    setRejectedEntries(prev => {
      const userRejections = prev[userId] || [];
      return { ...prev, [userId]: userRejections.filter(id => id !== entryId) };
    });
  }, [setRejectedEntries]);

  const setSpecialResitTimetable = useCallback((data: SpecialResitTimetable | null) => {
    setSpecialResitTimetableState(data);
  }, [setSpecialResitTimetableState]);

  const distributeSpecialResitTimetable = useCallback(() => {
    setSpecialResitTimetableState(prev => {
        if (!prev) return null;
        const allStaffUsers = allUsers.filter(u => u.role === 'staff');
        
        let allEntriesFlat: SpecialResitEntry[];

        if (prev.isDistributed) {
            allEntriesFlat = prev.sheets.flatMap(sheet => 
                sheet.entries.flatMap(lecturerSchedule => lecturerSchedule.courses)
            );
        } else {
            allEntriesFlat = prev.sheets.flatMap(sheet =>
                sheet.entries.flatMap(lecturerSchedule => lecturerSchedule.courses)
            );
        }

        const distributedMap = new Map<string, SpecialResitEntry[]>();

        allEntriesFlat.forEach(entry => {
            let assigned = false;
            if (entry.examiner) {
                // Find a matching staff member
                const staffUser = allStaffUsers.find(staff => isLecturerMatchWithUsers(entry.examiner!, staff));
                if (staffUser) {
                    const staffName = staffUser.name;
                    if (!distributedMap.has(staffName)) {
                        distributedMap.set(staffName, []);
                    }
                    distributedMap.get(staffName)!.push(entry);
                    assigned = true;
                }
            }
            if (!assigned) {
                if (!distributedMap.has('Unassigned')) {
                    distributedMap.set('Unassigned', []);
                }
                distributedMap.get('Unassigned')!.push(entry);
            }
        });

        const newEntries: DistributedResitSchedule[] = [];
        distributedMap.forEach((courses, lecturer) => {
            newEntries.push({ lecturer, courses });
        });
        
        const finalEntries = newEntries.filter(e => !(e.lecturer === 'Unassigned' && e.courses.length === 0));

        const distributedData: SpecialResitTimetable = {
            ...prev,
            isDistributed: true,
            sheets: [{
                sheetName: 'Distributed',
                entries: finalEntries
            }]
        };

        if (user) {
            const studentIdsWithResits = new Set<number>();
            Object.values(studentResitSelections).forEach((selections, studentId) => {
                if (Array.isArray(selections) && selections.length > 0) {
                    studentIdsWithResits.add(Number(studentId));
                }
            });

            studentIdsWithResits.forEach(studentId => {
                addNotification({
                    recipientId: studentId,
                    actorId: user.id,
                    type: 'resit_timetable',
                    postId: null,
                    commentId: null,
                });
            });
        }

        return distributedData;
    });
  }, [allUsers, user, studentResitSelections, addNotification, setSpecialResitTimetableState]);
  
  const setExamsTimetable = useCallback((data: ExamsTimetable | null) => {
    setExamsTimetableState(data);
  }, [setExamsTimetableState]);

  const distributeExamsTimetable = useCallback(() => {
    if (!examsTimetable) {
      return { success: false, message: "No exam timetable available to distribute." };
    }
    if (!examsTimetable.exams?.length && !examsTimetable.practicals?.length) {
      return { success: false, message: "Exam timetable contains no entries." };
    }
  
    setExamsTimetableState(prev => {
      if (!prev) return null;
      const distributedData = { ...prev, isDistributed: true };
      return distributedData;
    });
  
    const allExams = [...(examsTimetable.exams || []), ...(examsTimetable.practicals || [])];
    const studentsWithSchedules = allUsers.filter(u => {
      if (u.role !== 'student') return false;
      return allExams.some(exam => exam.level === u.level && u.department && exam.departments?.includes(u.department));
    });
  
    studentsWithSchedules.forEach(student => {
      if (user) {
        addNotification({
          recipientId: student.id,
          actorId: user.id,
          type: 'exam_timetable',
          postId: 0,
          commentId: 0,
        });
      }
    });
  
    return { 
      success: true, 
      message: `The exams timetable is now live for ${studentsWithSchedules.length} students and relevant staff.`,
      studentCount: studentsWithSchedules.length
    };
  }, [examsTimetable, allUsers, user, addNotification, setExamsTimetableState]);

  const updateStudentResitSelection = useCallback((entryIds: number[]) => {
    if (!user) return;
    setStudentResitSelections(prev => {
        const newState = { ...prev, [user.id]: entryIds };
        return newState;
    });
  }, [user, setStudentResitSelections]);

  const addFaculty = useCallback((name: string) => {
    if (faculties.some(f => f.name.toLowerCase() === name.toLowerCase())) {
        toast({ title: "Faculty Exists", description: "A faculty with this name already exists.", variant: "destructive" });
        return;
    }
    setFaculties(prev => [...prev, { name, departments: [] }]);
    toast({ title: "Faculty Added", description: `The "${name}" faculty has been created.` });
  }, [faculties, toast, setFaculties]);

  const updateFaculty = useCallback((oldName: string, newName: string) => {
    setFaculties(prev => prev.map(f => f.name === oldName ? { ...f, name: newName } : f));
    toast({ title: "Faculty Updated", description: "The faculty name has been updated." });
  }, [toast, setFaculties]);

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
  }, [toast, setFaculties, setAllDepartments, setDepartmentMap]);

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
  }, [toast, setFaculties, setAllDepartments, setDepartmentMap]);

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
  }, [toast, setFaculties, setAllDepartments, setDepartmentMap]);
  
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
  }, [toast, setFaculties]);

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
  }, [toast, setFaculties, setAllDepartments, setDepartmentMap]);

  const signup = useCallback((userData: Omit<User, 'id'>) => {
    const existingUser = allUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser) {
        toast({ title: "Signup Failed", description: "An account with this email already exists.", variant: "destructive" });
        return;
    }

    const newUser: User = {
        id: Date.now(),
        ...userData,
    };
    setAllUsers(prev => [...prev, newUser]);
    login(newUser.email);
    toast({ title: "Account Created", description: "Welcome to UMaT Connect!" });
  }, [allUsers, toast, setAllUsers, login]);

  const resetState = () => {
    logout();
    setAllUsers(defaultUsers);
    setMasterScheduleState(null);
    setClassTimetableDistributed(false);
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
        sessionStorage.clear();
        localStorage.clear();
    }

    toast({ title: "Application Reset", description: "All data has been reset to its initial state." });
    window.location.reload();
  };

  const contextValue = useMemo(() => ({
    user,
    allUsers,
    login,
    logout,
    signup,
    updateUser,
    resetState,
    masterSchedule,
    setMasterSchedule,
    isClassTimetableDistributed,
    distributeClassTimetable,
    updateScheduleStatus,
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
    addNotification,
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
    playingAlarm,
    playAlarm,
    stopAlarm,
    timetableMetadata,
  }), [
      user, allUsers, login, logout, signup, updateUser, resetState, masterSchedule, isClassTimetableDistributed, posts, staffSchedules, reviewedSchedules,
      rejectedEntries, notifications, specialResitTimetable, studentResitSelections, examsTimetable, faculties, departmentMap, allDepartments,
      distributeClassTimetable, distributeExamsTimetable, distributeSpecialResitTimetable, addPost, deletePost, addComment, addReply,
      addStaffSchedule, markScheduleAsReviewed, rejectScheduleEntry, unrejectScheduleEntry, fetchNotifications, markNotificationAsRead,
      addNotification, clearAllNotifications, updateStudentResitSelection, addFaculty, updateFaculty, deleteFaculty, addDepartment,
      updateDepartment, moveDepartment, deleteDepartment, toast, setMasterSchedule,
      updateScheduleStatus, playingAlarm, playAlarm, stopAlarm, setSpecialResitTimetable, setExamsTimetable, timetableMetadata
    ]);

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
