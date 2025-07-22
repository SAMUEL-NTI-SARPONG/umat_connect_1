
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
import { db } from '@/lib/firebase/client';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';


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

export interface SpecialResitEntry {
  date: string;
  course_no: string;
  course_name: string;
  department: string;
  number: number;
  room: string;
  examiner: string;
  session: string;
}

// Maps userId to an array of rejected entry IDs
export type RejectedEntries = Record<number, number[]>;

interface UserContextType {
  user: User | null;
  allUsers: User[];
  login: (userId: number) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  resetState: () => void;
  masterSchedule: TimetableEntry[] | null;
  setMasterSchedule: (data: TimetableEntry[] | null) => void;
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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(defaultUsers);
  const [masterSchedule, setMasterScheduleState] = useState<TimetableEntry[] | null>([]);
  const [staffSchedules, setStaffSchedules] = useState<TimetableEntry[]>([]);
  const [emptySlots, setEmptySlotsState] = useState<EmptySlot[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviewedSchedules, setReviewedSchedules] = useState<number[]>([]);
  const [rejectedEntries, setRejectedEntries] = useState<RejectedEntries>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
    setReviewedSchedules([]);
    setRejectedEntries({});
    toast({ title: "Timetable Updated", description: "The new master schedule has been distributed." });
  }, [toast]);

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
    if (!user) return;
    try {
      const q = query(collection(db, 'notifications'), where('recipientId', '==', user.id));
      const querySnapshot = await getDocs(q);
      const fetchedNotifications: Notification[] = [];
      querySnapshot.forEach(doc => {
        fetchedNotifications.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(fetchedNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error("Error fetching notifications: ", error);
      toast({ variant: 'destructive', description: "Could not fetch notifications." });
    }
  }, [user, toast]);

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
    
    // Create notification
    if (postAuthorId && postAuthorId !== user.id) {
        const newNotification: Omit<Notification, 'id'> = {
            recipientId: postAuthorId,
            actorId: user.id,
            type: 'comment_on_post',
            postId: postId,
            commentId: newComment.id,
            isRead: false,
            timestamp: newComment.timestamp,
        };
        setNotifications(prev => [ { ...newNotification, id: String(Date.now()) }, ...prev]);
        await addDoc(collection(db, 'notifications'), newNotification);
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

      const notificationsToAdd: Omit<Notification, 'id'>[] = [];
      
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
            ...notificationsToAdd.map(n => ({...n, id: String(Date.now())})),
            ...prev
          ]);
          for (const notification of notificationsToAdd) {
              await addDoc(collection(db, 'notifications'), notification);
          }
      }
  }, [user]);


  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
        const notifRef = doc(db, 'notifications', notificationId);
        await updateDoc(notifRef, { isRead: true });
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    } catch (error) {
        console.error("Error updating notification: ", error);
        toast({ variant: 'destructive', description: "Could not mark notification as read." });
    }
  }, [toast]);

  const clearAllNotifications = useCallback(async () => {
    if (!user) return;
    try {
        const notifsToUpdate = notifications.filter(n => n.recipientId === user.id && !n.isRead);
        for (const notif of notifsToUpdate) {
            const notifRef = doc(db, 'notifications', notif.id);
            await updateDoc(notifRef, { isRead: true });
        }
        setNotifications(prev => prev.map(n => n.recipientId === user.id ? { ...n, isRead: true } : n));
        toast({ title: 'Notifications Cleared', description: 'All your notifications have been marked as read.' });
    } catch (error) {
        console.error("Error clearing notifications: ", error);
        toast({ variant: 'destructive', description: "Could not clear all notifications." });
    }
  }, [user, notifications, toast]);

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

  const resetState = () => {
    logout();
    setAllUsers(defaultUsers);
    setMasterScheduleState(null);
    setEmptySlotsState([]);
    setPosts([]);
    setStaffSchedules([]);
    setReviewedSchedules([]);
    setRejectedEntries({});
    setNotifications([]);
    
    // Clear local storage for resit data as well
    if (typeof window !== 'undefined') {
        localStorage.removeItem('specialResitSchedule');
        localStorage.removeItem('studentResitSelections');
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
  }), [user, allUsers, updateUser, resetState, masterSchedule, setMasterSchedule, updateScheduleStatus, emptySlots, setEmptySlots, posts, addPost, deletePost, addComment, addReply, staffSchedules, addStaffSchedule, reviewedSchedules, markScheduleAsReviewed, rejectScheduleEntry, unrejectScheduleEntry, notifications, fetchNotifications, markNotificationAsRead, clearAllNotifications, login, logout]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

    