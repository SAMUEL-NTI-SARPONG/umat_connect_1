
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
    id: string;
    recipientId: number;
    actorId: number;
    type: 'reply_to_post' | 'reply_to_comment';
    postId: number;
    commentId: number; // The new reply's ID
    replyContent: string; // The full text of the new reply
    parentContent: string; // A snippet of the content being replied to
    isRead: boolean;
    timestamp: string;
};

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
  emptySlots: EmptySlot[];
  setEmptySlots: (slots: EmptySlot[]) => void;
  posts: Post[];
  addPost: (postData: { content: string; attachedFile: AttachedFile | null, audience: number[] }) => void;
  deletePost: (postId: number) => void;
  addComment: (postId: number, text: string) => void;
  addReply: (postId: number, parentCommentId: number, text: string, attachedFile?: AttachedFile | null) => void;
  lecturerSchedules: TimetableEntry[];
  addLecturerSchedule: (entry: Omit<TimetableEntry, 'id' | 'status' | 'lecturer'>) => void;
  reviewedSchedules: number[];
  markScheduleAsReviewed: (userId: number) => void;
  rejectedEntries: RejectedEntries;
  rejectScheduleEntry: (userId: number, entryId: number) => void;
  unrejectScheduleEntry: (userId: number, entryId: number) => void;
  notifications: Notification[];
  markNotificationAsRead: (notificationId: string) => void;
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
    // Catch quota exceeded errors
    if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn(`LocalStorage quota exceeded for key “${key}”. Data could not be saved.`);
    } else {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
  }
};

export function UserProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [masterSchedule, setMasterScheduleState] = useState<TimetableEntry[] | null>([]);
  const [lecturerSchedules, setLecturerSchedules] = useState<TimetableEntry[]>([]);
  const [emptySlots, setEmptySlotsState] = useState<EmptySlot[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviewedSchedules, setReviewedSchedules] = useState<number[]>([]);
  const [rejectedEntries, setRejectedEntries] = useState<RejectedEntries>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize state from localStorage on mount
  useEffect(() => {
    setAllUsers(getFromStorage('allUsers', defaultUsers));
    setMasterScheduleState(getFromStorage('masterSchedule', null));
    setEmptySlotsState(getFromStorage('emptySlots', []));
    setPosts(getFromStorage('posts', []));
    setLecturerSchedules(getFromStorage('lecturerSchedules', []));
    setReviewedSchedules(getFromStorage('reviewedSchedules', []));
    setRejectedEntries(getFromStorage('rejectedEntries', {}));
    setNotifications(getFromStorage('notifications', []));

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
    // When a new schedule is set, reset the review status and rejections for all lecturers.
    setReviewedSchedules([]);
    saveToStorage('reviewedSchedules', []);
    setRejectedEntries({});
    saveToStorage('rejectedEntries', {});
    toast({ title: "Timetable Updated", description: "The new master schedule has been distributed." });
  }, [toast]);
  
  const setEmptySlots = useCallback((slots: EmptySlot[]) => {
    setEmptySlotsState(slots);
    saveToStorage('emptySlots', slots);
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
    
    setPosts(prevPosts => {
        const updatedPosts = [newPost, ...prevPosts];
        saveToStorage('posts', updatedPosts);
        return updatedPosts;
    });

    toast({ title: 'Post Created', description: 'Your post has been successfully published.' });

  }, [user, toast]);

  const deletePost = useCallback((postId: number) => {
    setPosts(prevPosts => {
      const updatedPosts = prevPosts.filter(p => p.id !== postId);
      saveToStorage('posts', updatedPosts);
      return updatedPosts;
    });
    toast({ title: 'Post Deleted', description: 'Your post has been removed.' });
  }, [toast]);
  
  const addComment = useCallback((postId: number, text: string) => {
    if (!user) return;
    
    const newComment: Comment = {
      id: Date.now(),
      authorId: user.id,
      text,
      timestamp: new Date().toISOString(),
      replies: [],
    };
    
    let newNotifications: Notification[] = [];

    setPosts(prevPosts => {
      const updatedPosts = prevPosts.map(p => {
        if (p.id === postId) {
          // Notify post author if they are not the one commenting
          if (p.authorId !== user.id) {
            const notification: Notification = {
              id: `${Date.now()}-post-${p.id}`,
              recipientId: p.authorId,
              actorId: user.id,
              type: 'reply_to_post',
              postId: p.id,
              commentId: newComment.id,
              replyContent: text,
              parentContent: p.content,
              isRead: false,
              timestamp: new Date().toISOString(),
            };
            newNotifications.push(notification);
          }
          return { ...p, comments: [...p.comments, newComment] };
        }
        return p;
      });
      saveToStorage('posts', updatedPosts);
      return updatedPosts;
    });
    
    if (newNotifications.length > 0) {
        setNotifications(prev => {
            const updatedNotifications = [...prev, ...newNotifications];
            saveToStorage('notifications', updatedNotifications);
            return updatedNotifications;
        });
    }

  }, [user]);

  const addReply = useCallback((postId: number, parentCommentId: number, text: string, attachedFile?: AttachedFile | null) => {
    if (!user) return;

    const newReply: Comment = {
      id: Date.now(),
      authorId: user.id,
      text,
      timestamp: new Date().toISOString(),
      replies: [],
      attachedFile: attachedFile || null,
    };
    
    const newNotifications: Notification[] = [];

    setPosts(prevPosts => {
        const updatedPosts = JSON.parse(JSON.stringify(prevPosts)); // Deep copy
        const post = updatedPosts.find((p: Post) => p.id === postId);

        if (post) {
            let parentComment: Comment | null = null;
            // Recursive function to find the parent comment
            const findParentComment = (comments: Comment[]): Comment | null => {
                for (const comment of comments) {
                    if (comment.id === parentCommentId) {
                        return comment;
                    }
                    if (comment.replies && comment.replies.length > 0) {
                        const found = findParentComment(comment.replies);
                        if (found) return found;
                    }
                }
                return null;
            };

            parentComment = findParentComment(post.comments);
            
            if (parentComment) {
                parentComment.replies.push(newReply);

                // Notify author of parent comment if they are not the one replying
                if (parentComment.authorId !== user.id) {
                    const notification: Notification = {
                      id: `${Date.now()}-comment-${parentComment.id}`,
                      recipientId: parentComment.authorId,
                      actorId: user.id,
                      type: 'reply_to_comment',
                      postId: post.id,
                      commentId: newReply.id,
                      replyContent: text,
                      parentContent: parentComment.text,
                      isRead: false,
                      timestamp: new Date().toISOString(),
                    };
                    newNotifications.push(notification);
                }
            }
        }
        
        saveToStorage('posts', updatedPosts);
        return updatedPosts;
    });

    if (newNotifications.length > 0) {
        setNotifications(prev => {
            const updatedNotifications = [...prev, ...newNotifications];
            saveToStorage('notifications', updatedNotifications);
            return updatedNotifications;
        });
    }

  }, [user]);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
        const updated = prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
        saveToStorage('notifications', updated);
        return updated;
    });
  }, []);

  const addLecturerSchedule = useCallback((entry: Omit<TimetableEntry, 'id' | 'status' | 'lecturer'>) => {
    if (!user || user.role !== 'lecturer') return;
    
    const newEntry: TimetableEntry = {
      ...entry,
      id: Date.now(), // Unique ID
      status: 'confirmed', // Lecturer-added events are confirmed by default
      lecturer: user.name,
    };
    
    setLecturerSchedules(prev => {
      const updatedSchedules = [...prev, newEntry];
      saveToStorage('lecturerSchedules', updatedSchedules);
      return updatedSchedules;
    });
    
    toast({ title: 'Class Added', description: 'The new class has been added to the schedule.' });

  }, [user, toast]);
  
  const markScheduleAsReviewed = useCallback((userId: number) => {
    setReviewedSchedules(prev => {
        const updated = [...new Set([...prev, userId])];
        saveToStorage('reviewedSchedules', updated);
        return updated;
    });
    toast({ title: "Schedule Confirmed", description: "Thank you for reviewing your schedule." });
  }, [toast]);
  
  const rejectScheduleEntry = useCallback((userId: number, entryId: number) => {
    setRejectedEntries(prev => {
      const userRejections = prev[userId] || [];
      const newRejections = { ...prev, [userId]: [...new Set([...userRejections, entryId])] };
      saveToStorage('rejectedEntries', newRejections);
      return newRejections;
    });
  }, []);
  
  const unrejectScheduleEntry = useCallback((userId: number, entryId: number) => {
    setRejectedEntries(prev => {
      const userRejections = prev[userId] || [];
      const newRejections = { ...prev, [userId]: userRejections.filter(id => id !== entryId) };
      saveToStorage('rejectedEntries', newRejections);
      return newRejections;
    });
  }, []);


  const resetState = () => {
    logout(); // Log out current user
    
    // Clear localStorage
    window.localStorage.removeItem('allUsers');
    window.localStorage.removeItem('masterSchedule');
    window.localStorage.removeItem('emptySlots');
    window.localStorage.removeItem('posts');
    window.localStorage.removeItem('lecturerSchedules');
    window.localStorage.removeItem('reviewedSchedules');
    window.localStorage.removeItem('rejectedEntries');
    window.localStorage.removeItem('notifications');

    
    // Reset state to defaults
    setAllUsers(defaultUsers);
    setMasterScheduleState(null);
    setEmptySlotsState([]);
    setPosts([]);
    setLecturerSchedules([]);
    setReviewedSchedules([]);
    setRejectedEntries({});
    setNotifications([]);

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
    posts,
    addPost,
    deletePost,
    addComment,
    addReply,
    lecturerSchedules,
    addLecturerSchedule,
    reviewedSchedules,
    markScheduleAsReviewed,
    rejectedEntries,
    rejectScheduleEntry,
    unrejectScheduleEntry,
    notifications,
    markNotificationAsRead,
  }), [user, allUsers, masterSchedule, emptySlots, posts, lecturerSchedules, reviewedSchedules, rejectedEntries, notifications, setMasterSchedule, setEmptySlots, addPost, deletePost, addComment, addReply, addLecturerSchedule, markScheduleAsReviewed, rejectScheduleEntry, unrejectScheduleEntry, markNotificationAsRead]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
