
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
import { initialFaculties, initialDepartmentMap, allDepartments as initialAllDepartments, type User } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase/client';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, updateDoc, arrayUnion, serverTimestamp, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Howl } from 'howler';

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
  url: string; // This will now be a Firebase Storage URL
}

export type Comment = {
  id: string;
  authorId: string; // Firebase user UID
  text: string;
  timestamp: any; // Firestore Timestamp
  replies: Comment[];
  attachedFile?: AttachedFile | null;
};

export type Post = {
  id: string;
  authorId: string; // Firebase user UID
  timestamp: any; // Firestore Timestamp
  content: string;
  attachedFile?: AttachedFile | null;
  comments: Comment[];
  audience: string[]; // Array of user UIDs
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
    recipientId: string; // Firebase user UID
    actorId: string; // Firebase user UID
    type: NotificationType;
    postId?: string;
    commentId?: string;
    isRead: boolean;
    timestamp: any; // Firestore Timestamp
};

export type RejectedEntries = Record<string, string[]>; // user UID -> array of entry IDs

export interface SpecialResitEntry {
    id: number;
    date: string | null;
    courseCode: string | null;
    courseName: string | null;
    department: string | null;
    numberOfStudents: number;
    room: string | null;
    examiner: string | null;
    session: string | null;
  }

  export interface DistributedResitSchedule {
    lecturer: string;
    courses: SpecialResitEntry[];
  }

  export interface SpecialResitTimetable {
    venue: string;
    notice?: string;
    isDistributed: boolean;
    sheets: {
      sheetName: string;
      entries: DistributedResitSchedule[];
    }[];
  }

export type StudentResitSelections = Record<string, number[]>; // user UID -> array of entry IDs

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

export const isLecturerMatchWithUsers = (entryLecturerName: string, staffUser: User): boolean => {
    if (!entryLecturerName || typeof entryLecturerName !== 'string' || !staffUser) return false;
    if (entryLecturerName === staffUser.name) return true;
    const staffNameParts = staffUser.name.toLowerCase().split(' ').filter(p => p.length > 2);
    return staffNameParts.some(part => entryLecturerName.toLowerCase().includes(part));
};

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
  signup: (userData: Omit<User, 'id'>, password?: string) => void;
  updateUser: (updatedUser: User) => void;
  resetState: () => void;
  masterSchedule: TimetableEntry[] | null;
  setMasterSchedule: (data: TimetableEntry[] | null) => void;
  isClassTimetableDistributed: boolean;
  distributeClassTimetable: () => { success: boolean; message: string };
  updateScheduleStatus: (updatedEntry: TimetableEntry) => void;
  posts: Post[];
  addPost: (postData: { content: string; attachedFile: AttachedFile | null, audience: string[] }) => void;
  deletePost: (postId: string) => void;
  addComment: (postId: string, text: string, attachedFile: AttachedFile | null) => Promise<void>;
  addReply: (postId: string, parentCommentId: string, text: string, attachedFile: AttachedFile | null) => Promise<void>;
  staffSchedules: TimetableEntry[];
  addStaffSchedule: (entry: Omit<TimetableEntry, 'id' | 'lecturer'>) => void;
  reviewedSchedules: string[];
  markScheduleAsReviewed: (userId: string) => void;
  rejectedEntries: RejectedEntries;
  rejectScheduleEntry: (userId: string, entryId: string) => void;
  unrejectScheduleEntry: (userId: string, entryId: string) => void;
  notifications: Notification[];
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
  distributeExamsTimetable: () => { success: boolean, message: string, studentCount?: number };
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

export function UserProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Timetable states remain local until "distributed" (written to a single document)
  const [masterSchedule, setMasterSchedule] = useState<TimetableEntry[] | null>(null);
  const [isClassTimetableDistributed, setClassTimetableDistributed] = useState<boolean>(false);
  const [staffSchedules, setStaffSchedules] = useState<TimetableEntry[]>([]);
  const [specialResitTimetable, setSpecialResitTimetable] = useState<SpecialResitTimetable | null>(null);
  const [examsTimetable, setExamsTimetable] = useState<ExamsTimetable | null>(null);
  
  // App settings state
  const [faculties, setFaculties] = useState<Faculty[]>(initialFaculties);
  const [departmentMap, setDepartmentMap] = useState<Map<string, string>>(initialDepartmentMap);
  const [allDepartments, setAllDepartments] = useState<string[]>(initialAllDepartments);
  
  // Other local states
  const [playingAlarm, setPlayingAlarm] = useState<Howl | null>(null);
  const [timetableMetadata, setTimetableMetadata] = useState<TimetableMetadata | undefined>(undefined);
  
  // These are now just placeholders as their state is part of the timetable documents
  const [reviewedSchedules, setReviewedSchedules] = useState<string[]>([]);
  const [rejectedEntries, setRejectedEntries] = useState<RejectedEntries>({});
  const [studentResitSelections, setStudentResitSelections] = useState<StudentResitSelections>({});

  // Fetch all users once
  useEffect(() => {
    const q = collection(db, 'users');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setAllUsers(usersData);
    });
    return () => unsubscribe();
  }, []);
  
  // Fetch all posts once
  useEffect(() => {
    const q = collection(db, 'posts');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() } as User);
        } else {
          setUser(null); // Should not happen if signup is correct
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Notifications listener
  useEffect(() => {
    if (user) {
        const q = query(collection(db, 'notifications'), where('recipientId', '==', user.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(notifsData);
        });
        return () => unsubscribe();
    }
  }, [user]);

  const login = async (email: string, password?: string) => {
    if (!password) {
        toast({ title: "Login Failed", description: "Password is required.", variant: "destructive" });
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Login Successful", description: "Welcome back!" });
    } catch (error: any) {
        toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const signup = async (userData: Omit<User, 'id'>, password?: string) => {
    if (!password) {
      toast({ title: "Signup Failed", description: "A password is required.", variant: "destructive" });
      return;
    }
    try {
        const { email, ...rest } = userData;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser: User = {
            id: userCredential.user.uid,
            ...userData,
        };
        await setDoc(doc(db, "users", userCredential.user.uid), rest);
        toast({ title: "Account Created", description: "Welcome to UMaT Connect! Please log in." });
    } catch (error: any) {
        toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
    }
  };
  
  const updateUser = async (updatedUser: User) => {
    if (!user) return;
    try {
        const userDocRef = doc(db, "users", updatedUser.id);
        const { id, ...dataToSave } = updatedUser;
        await updateDoc(userDocRef, dataToSave);
        setUser(updatedUser); // Update local state immediately
        toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
    } catch (error: any) {
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  };
  
  const addNotification = async (notificationData: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            ...notificationData,
            isRead: false,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error adding notification: ", error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
        await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
    } catch (error) {
        console.error("Error marking notification as read: ", error);
    }
  };
  
  const clearAllNotifications = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
        if (!n.isRead) {
            const docRef = doc(db, 'notifications', n.id);
            batch.update(docRef, { isRead: true });
        }
    });
    await batch.commit();
    toast({ title: 'Notifications Cleared' });
  };
  
  const addPost = async (postData: { content: string; attachedFile: AttachedFile | null, audience: string[] }) => {
    if (!user) return;
    try {
        const postRef = await addDoc(collection(db, 'posts'), {
            authorId: user.id,
            timestamp: serverTimestamp(),
            content: postData.content,
            attachedFile: postData.attachedFile,
            audience: postData.audience,
            comments: [],
        });
        toast({ title: 'Post Created', description: 'Your post has been successfully published.' });

        postData.audience.forEach(recipientId => {
          if(recipientId !== user.id) {
            addNotification({
                recipientId: recipientId,
                actorId: user.id,
                type: 'new_post',
                postId: postRef.id,
            });
          }
        });
    } catch(error: any) {
        toast({ title: "Post Failed", description: error.message, variant: "destructive" });
    }
  };
  
  const deletePost = async (postId: string) => {
    try {
        await deleteDoc(doc(db, 'posts', postId));
        toast({ title: 'Post Deleted' });
    } catch(error: any) {
        toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    }
  };

  const addComment = async (postId: string, text: string, attachedFile: AttachedFile | null) => {
      if (!user) return;
      if (!text.trim() && !attachedFile) {
          toast({ title: "Cannot post empty comment", variant: "destructive" });
          return;
      }
      try {
        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);
        if (!postDoc.exists()) throw new Error("Post not found");
        
        const postData = postDoc.data();
        const newComment = {
            id: doc(collection(db, 'posts', postId, 'comments')).id, // Generate a unique ID
            authorId: user.id,
            text,
            timestamp: serverTimestamp(),
            replies: [],
            attachedFile,
        };

        await updateDoc(postRef, {
            comments: arrayUnion(newComment)
        });

        if (postData.authorId && postData.authorId !== user.id) {
            addNotification({
                recipientId: postData.authorId,
                actorId: user.id,
                type: 'comment_on_post',
                postId: postId,
                commentId: newComment.id,
            });
        }
      } catch (error: any) {
          toast({ title: "Comment Failed", description: error.message, variant: "destructive" });
      }
  };

  const addReply = async (postId: string, parentCommentId: string, text: string, attachedFile: AttachedFile | null) => {
    // This is more complex with Firestore and requires recursive updates.
    // For now, we will add it as a top-level comment with a note.
    if (!user) return;
    const parentCommentAuthor = posts.flatMap(p => p.comments).find(c => c.id === parentCommentId)?.authorId;
    const parentCommentAuthorName = allUsers.find(u => u.id === parentCommentAuthor)?.name || "a user";
    
    await addComment(postId, `Replying to ${parentCommentAuthorName}: ${text}`, attachedFile);
  };
  
  const distributeTimetable = async (timetableId: string, data: any) => {
    try {
        const timetableRef = doc(db, 'timetables', timetableId);
        await setDoc(timetableRef, { ...data, isDistributed: true });
        
        allUsers.forEach(recipient => {
            if (user && recipient.id !== user.id) {
                addNotification({
                    recipientId: recipient.id,
                    actorId: user.id,
                    type: `${timetableId}_timetable` as NotificationType,
                });
            }
        });

        return { success: true, message: `The ${timetableId} timetable is now live for all users.` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
  }

  // Placeholder functions that will be properly implemented
  const resetState = () => console.log("resetState not implemented");
  const distributeClassTimetable = () => {
    if (!masterSchedule) return { success: false, message: "No data to distribute" };
    return distributeTimetable('class', { schedule: masterSchedule });
  };
  const updateScheduleStatus = (updatedEntry: TimetableEntry) => {
    if (!masterSchedule) return;
    const newSchedule = masterSchedule.map(e => e.id === updatedEntry.id ? updatedEntry : e);
    setMasterSchedule(newSchedule);
    // In a real app, this would also update a specific document in Firestore
  };

  const addStaffSchedule = (entry: Omit<TimetableEntry, 'id' | 'lecturer'>) => console.log("addStaffSchedule not implemented", entry);
  const markScheduleAsReviewed = (userId: string) => console.log("markScheduleAsReviewed not implemented", userId);
  const rejectScheduleEntry = (userId: string, entryId: string) => console.log("rejectScheduleEntry not implemented", userId, entryId);
  const unrejectScheduleEntry = (userId: string, entryId: string) => console.log("unrejectScheduleEntry not implemented", userId, entryId);

  const distributeSpecialResitTimetable = () => {
    if (!specialResitTimetable) return;
    distributeTimetable('resit', specialResitTimetable);
  };
  const updateStudentResitSelection = (entryIds: number[]) => console.log("updateStudentResitSelection not implemented", entryIds);
  const distributeExamsTimetable = () => {
      if (!examsTimetable) return { success: false, message: "No data" };
      distributeTimetable('exam', examsTimetable);
      return { success: true, message: "Exams timetable distributed" };
  };

  const addFaculty = (name: string) => { setFaculties(prev => [...prev, { name, departments: [] }]) };
  const updateFaculty = (oldName: string, newName: string) => { setFaculties(prev => prev.map(f => f.name === oldName ? { ...f, name: newName } : f)) };
  const deleteFaculty = (name: string) => { setFaculties(prev => prev.filter(f => f.name !== name)) };
  const addDepartment = ({ name, initial, facultyName }: { name: string; initial: string; facultyName: string }) => {
    setFaculties(prev => prev.map(f => f.name === facultyName ? { ...f, departments: [...f.departments, { name, initial }] } : f));
  };
  const updateDepartment = ({ oldName, newName, newInitial }: { oldName: string; newName: string; newInitial: string }) => {
     setFaculties(prev => prev.map(f => ({ ...f, departments: f.departments.map(d => d.name === oldName ? { name: newName, initial: newInitial } : d) })));
  };
  const moveDepartment = ({ departmentName, newFacultyName }: { departmentName: string; newFacultyName: string }) => {
    let departmentToMove: Department | null = null;
    let nextFaculties = faculties.map(f => {
        const dept = f.departments.find(d => d.name === departmentName);
        if (dept) {
            departmentToMove = dept;
            return { ...f, departments: f.departments.filter(d => d.name !== departmentName) };
        }
        return f;
    });
    nextFaculties = nextFaculties.map(f => f.name === newFacultyName && departmentToMove ? { ...f, departments: [...f.departments, departmentToMove] } : f);
    setFaculties(nextFaculties);
  };
  const deleteDepartment = (name: string) => {
    setFaculties(prev => prev.map(f => ({...f, departments: f.departments.filter(d => d.name !== name) })));
  };

  const playAlarm = (soundSrc: string) => {
    const sound = new Howl({ src: [soundSrc], loop: true, volume: 0.5 });
    sound.play();
    setPlayingAlarm(sound);
    return sound;
  };

  const stopAlarm = () => {
    playingAlarm?.stop();
    setPlayingAlarm(null);
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
      user, allUsers, posts, notifications, masterSchedule, isClassTimetableDistributed,
      staffSchedules, reviewedSchedules, rejectedEntries, specialResitTimetable,
      studentResitSelections, examsTimetable, faculties, departmentMap, allDepartments,
      playingAlarm, timetableMetadata
    ]);

  return <UserContext.Provider value={contextValue as UserContextType}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
