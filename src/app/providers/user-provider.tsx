
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
    id: string;
    recipientId: number;
    actorId: number;
    type: 'comment_on_post' | 'reply_to_comment' | 'exam_timetable';
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

// Interface for staff account data
interface StaffAccount {
  surname: string;
  firstname: string;
  otherName?: string;
  title?: string;
  id: string;
}

// Improved Levenshtein distance with early termination
function levenshteinDistance(a: string, b: string, maxDistance?: number): number {
  if (Math.abs(a.length - b.length) > (maxDistance || Infinity)) {
    return maxDistance || Infinity;
  }

  const matrix: number[][] = Array(a.length + 1)
    .fill(0)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    let minRowValue = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
      minRowValue = Math.min(minRowValue, matrix[i][j]);
    }
    
    // Early termination if minimum distance in row exceeds threshold
    if (maxDistance && minRowValue > maxDistance) {
      return maxDistance + 1;
    }
  }
  
  return matrix[a.length][b.length];
}

// Enhanced name normalization
function normalizeName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  // Common academic titles (more comprehensive)
  const titles = [
    'DR', 'PROF', 'PROFESSOR', 'ASSOC PROF', 'ASSOCIATE PROFESSOR', 
    'ASST PROF', 'ASSISTANT PROFESSOR', 'MR', 'MS', 'MRS', 'MISS',
    'ENGR', 'ENGINEER', 'REV', 'REVEREND', 'HON', 'HONORABLE'
  ];
  
  let normalized = name.toLowerCase().trim();
  
  // Remove titles (fixed regex escaping)
  titles.forEach((title) => {
    const regex = new RegExp(`\\b${title.toLowerCase()}\\b`, 'gi');
    normalized = normalized.replace(regex, '');
  });
  
  // Remove common punctuation and normalize spaces
  normalized = normalized
    .replace(/[.,;:'"()[\\]{}]/g, '') // Remove punctuation
    .replace(/[-_]/g, ' ') // Convert dashes and underscores to spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim();
    
  return normalized;
}

// Enhanced timetable name parsing
function parseTimetableName(name: string): { 
  surname: string; 
  firstname?: string; 
  otherName?: string;
  initials?: string[];
} {
  const normalized = normalizeName(name);
  if (!normalized) return { surname: '' };
  
  const parts = normalized.split(' ').filter(part => part.length > 0);
  
  if (parts.length === 0) return { surname: '' };
  if (parts.length === 1) return { surname: parts[0] };
  
  // Identify initials (single characters or characters followed by period)
  const initials: string[] = [];
  const fullNames: string[] = [];
  
  parts.forEach(part => {
    const cleanPart = part.replace('.', '');
    if (cleanPart.length === 1) {
      initials.push(cleanPart.toUpperCase());
    } else {
      fullNames.push(cleanPart);
    }
  });
  
  // Handle different name patterns
  let surname = '';
  let firstname = '';
  let otherName = '';
  
  if (fullNames.length >= 1) {
    // Last full name is typically the surname
    surname = fullNames[fullNames.length - 1];
    
    if (fullNames.length >= 2) {
      // First full name is typically the firstname
      firstname = fullNames[0];
      
      // Middle names
      if (fullNames.length > 2) {
        otherName = fullNames.slice(1, -1).join(' ');
      }
    }
    
    // Add initials to otherName if we have them
    if (initials.length > 0) {
      if (otherName) {
        otherName = `${initials.join(' ')} ${otherName}`;
      } else {
        otherName = initials.join(' ');
      }
    }
  } else if (initials.length >= 2) {
    // Only initials available - last one is surname initial
    surname = initials[initials.length - 1];
    firstname = initials[0];
    if (initials.length > 2) {
      otherName = initials.slice(1, -1).join(' ');
    }
  }
  
  return {
    surname,
    ...(firstname && { firstname }),
    ...(otherName && { otherName }),
    initials
  };
}

// Enhanced similarity calculation
function calculateNameSimilarity(parsed: ReturnType<typeof parseTimetableName>, staff: StaffAccount): number {
  const staffSurname = normalizeName(staff.surname);
  const staffFirstname = staff.firstname ? normalizeName(staff.firstname) : '';
  const staffOtherName = staff.otherName ? normalizeName(staff.otherName) : '';
  
  if (!parsed.surname || !staffSurname) return 0;
  
  // Surname similarity (most important)
  const surnameDistance = levenshteinDistance(parsed.surname, staffSurname, 3);
  const surnameSimilarity = surnameDistance <= 3 ? 
    1 - surnameDistance / Math.max(parsed.surname.length, staffSurname.length) : 0;
  
  // If surname similarity is too low, don't bother with other calculations
  if (surnameSimilarity < 0.6) return 0;
  
  let firstnameSimilarity = 0;
  if (parsed.firstname && staffFirstname) {
    if (parsed.firstname.length === 1) {
      // Initial matching
      firstnameSimilarity = parsed.firstname.toLowerCase() === staffFirstname[0].toLowerCase() ? 1 : 0;
    } else {
      const firstnameDistance = levenshteinDistance(parsed.firstname, staffFirstname, 2);
      firstnameSimilarity = firstnameDistance <= 2 ? 
        1 - firstnameDistance / Math.max(parsed.firstname.length, staffFirstname.length) : 0;
    }
  } else if (!parsed.firstname && !staffFirstname) {
    firstnameSimilarity = 0.5; // Neutral when both missing
  }
  
  let otherNameSimilarity = 0;
  if (parsed.otherName && staffOtherName) {
    // Handle multiple initials or names in otherName
    const parsedOthers = parsed.otherName.split(' ');
    const staffOthers = staffOtherName.split(' ');
    
    let matches = 0;
    let total = Math.max(parsedOthers.length, staffOthers.length);
    
    for (const parsedOther of parsedOthers) {
      for (const staffOther of staffOthers) {
        if (parsedOther.length === 1 || staffOther.length === 1) {
          // Initial matching
          if (parsedOther[0].toLowerCase() === staffOther[0].toLowerCase()) {
            matches++;
            break;
          }
        } else {
          // Full name matching
          const distance = levenshteinDistance(parsedOther, staffOther, 2);
          if (distance <= 1) {
            matches += 1 - distance / Math.max(parsedOther.length, staffOther.length);
            break;
          }
        }
      }
    }
    
    otherNameSimilarity = total > 0 ? matches / total : 0;
  } else if (!parsed.otherName && !staffOtherName) {
    otherNameSimilarity = 0.5; // Neutral when both missing
  }
  
  // Weighted scoring with adaptive weights
  let surnameWeight = 0.7;
  let firstnameWeight = 0.25;
  let otherNameWeight = 0.05;
  
  // Adjust weights if we have limited information
  if (!parsed.firstname || !staffFirstname) {
    surnameWeight = 0.8;
    firstnameWeight = 0.1;
    otherNameWeight = 0.1;
  }
  
  if (!parsed.otherName || !staffOtherName) {
    surnameWeight = 0.75;
    firstnameWeight = 0.25;
    otherNameWeight = 0;
  }
  
  return surnameWeight * surnameSimilarity + 
         firstnameWeight * firstnameSimilarity + 
         otherNameWeight * otherNameSimilarity;
}

// Enhanced name matching with multiple threshold levels
function matchLecturerNames(
  timetableName: string,
  staffDatabase: StaffAccount[]
): { matchedAccount: StaffAccount | null; confidence: number; matchType: string }[] {
  if (!timetableName || !staffDatabase || staffDatabase.length === 0) {
    return [{ matchedAccount: null, confidence: 0, matchType: 'no_data' }];
  }
  
  const results: { matchedAccount: StaffAccount | null; confidence: number; matchType: string }[] = [];
  
  // Handle multiple lecturers (co-lecturers)
  const coLecturers = timetableName.split(/[\/&,]/).map(name => name.trim()).filter(name => name.length > 0);
  
  for (const lecturerName of coLecturers) {
    if (!lecturerName) {
      results.push({ matchedAccount: null, confidence: 0, matchType: 'empty_name' });
      continue;
    }
    
    const parsed = parseTimetableName(lecturerName);
    let bestMatch: StaffAccount | null = null;
    let bestScore = 0;
    let matchType = 'no_match';
    
    // First pass: Look for high-confidence matches
    for (const staff of staffDatabase) {
      const score = calculateNameSimilarity(parsed, staff);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = staff;
      }
    }
    
    // Determine match type and confidence threshold
    if (bestScore >= 0.9) {
      matchType = 'high_confidence';
    } else if (bestScore >= 0.75) {
      matchType = 'medium_confidence';
    } else if (bestScore >= 0.6) {
      matchType = 'low_confidence';
    } else {
      bestMatch = null;
      matchType = 'no_match';
      bestScore = 0;
    }
    
    results.push({ 
      matchedAccount: bestMatch, 
      confidence: bestScore,
      matchType 
    });
  }
  
  return results;
}

// Function to convert a User object to a StaffAccount object
const userToStaffAccount = (user: User): StaffAccount => {
  const name = user.name || '';
  const parts = name.split(' ').filter(Boolean);
  let title = '';
  const titles = ['Prof.', 'Professor', 'Dr.', 'Doctor', 'Mr.', 'Mrs.', 'Ms.', 'Miss', 'Engr.'];
  if (parts.length > 0 && titles.includes(parts[0])) {
    title = parts.shift() || '';
  }
  const surname = parts.pop() || '';
  const firstname = parts.shift() || '';
  const otherName = parts.join(' ');
  return {
    id: String(user.id),
    title,
    firstname,
    surname,
    otherName,
  };
};

export const isLecturerMatch = (entryLecturerName: string, staffUser: User): boolean => {
    if (!entryLecturerName || typeof entryLecturerName !== 'string' || !staffUser) return false;
    
    const staffAccount = userToStaffAccount(staffUser);
    const allStaffAsAccounts = defaultUsers.filter(u => u.role === 'staff').map(userToStaffAccount);

    const matches = matchLecturerNames(entryLecturerName, allStaffAsAccounts);

    // Check if any of the matches is a medium or high confidence match to the specific staffUser
    return matches.some(match => 
        match.matchedAccount?.id === staffAccount.id &&
        (match.matchType === 'high_confidence' || match.matchType === 'medium_confidence')
    );
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
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => void;
  clearAllNotifications: () => Promise<void>;
  specialResitTimetable: SpecialResitTimetable | null;
  setSpecialResitTimetable: (data: SpecialResitTimetable | null) => void;
  distributeSpecialResitTimetable: () => void;
  studentResitSelections: StudentResitSelections;
  updateStudentResitSelection: (entryIds: number[]) => void;
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
  const [masterSchedule, setMasterScheduleState] = useState<TimetableEntry[] | null>(null);
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
    try {
        const storedUserId = sessionStorage.getItem('userId');
        if (storedUserId) {
          const foundUser = defaultUsers.find(u => u.id === parseInt(storedUserId, 10));
          if (foundUser) {
            setUser(foundUser);
          }
        }
    } catch (error) {
        console.error("Failed to read from sessionStorage:", error);
    }
  }, []);

  // Load data from localStorage on initial render
  useEffect(() => {
    const loadFromStorage = (key: string, setter: (data: any) => void) => {
        try {
            const storedData = localStorage.getItem(key);
            if (storedData && typeof storedData === 'string') {
                const parsedData = JSON.parse(storedData);
                // Basic validation to ensure it's not just an empty object
                if (parsedData && Object.keys(parsedData).length > 0) {
                    setter(parsedData);
                }
            }
        } catch(e) {
            console.error(`Failed to parse ${key} from localStorage:`, e);
            // Optionally, remove the corrupted data
            localStorage.removeItem(key);
        }
    };
    
    loadFromStorage('specialResitSchedule', setSpecialResitTimetableState);
    loadFromStorage('studentResitSelections', setStudentResitSelections);
    loadFromStorage('examsTimetable', setExamsTimetableState);
  }, []);

  const login = (userId: number) => {
    const foundUser = allUsers.find(u => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
      try {
        sessionStorage.setItem('userId', String(userId));
      } catch (error) {
          console.error("Failed to write to sessionStorage:", error);
      }
    }
  };

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
  }, [user, toast]);
  
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
    const updateSchedule = (schedule: TimetableEntry[] | null) => {
        if (!schedule) return null;
        return schedule.map(e => e.id === entryId ? { ...e, status } : e);
    }

    setMasterScheduleState(updateSchedule);
    setStaffSchedules(prev => updateSchedule(prev) || []);
  }, []);
  
  const setEmptySlots = useCallback((slots: EmptySlot[]) => {
    setEmptySlotsState(slots);
  }, []);

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

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `${notificationData.type}-${notificationData.recipientId}-${Date.now()}`,
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

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
  }, [user, addNotification, toast]);

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
                  
                  if (parentComment.authorId !== user.id) {
                      addNotification({
                          recipientId: parentComment.authorId,
                          actorId: user.id,
                          type: 'reply_to_comment',
                          postId: postId,
                          commentId: newReply.id,
                      });
                  }
                  
                  if (post.authorId !== user.id && post.authorId !== parentComment.authorId) {
                      addNotification({
                          recipientId: post.authorId,
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
  }, [user, addNotification, toast]);


  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
  }, []);

  const clearAllNotifications = useCallback(async () => {
    if (!user) return;
    setNotifications(prev => prev.map(n => n.recipientId === user.id ? { ...n, isRead: true } : n));
    toast({ title: 'Notifications Cleared', description: 'All your notifications have been marked as read.' });
  }, [user?.id, toast]);

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
    try {
        if (data) {
          localStorage.setItem('specialResitSchedule', JSON.stringify(data));
        } else {
          localStorage.removeItem('specialResitSchedule');
        }
    } catch (error) {
        console.error("Failed to write to localStorage:", error);
    }
  }, []);

  const distributeSpecialResitTimetable = useCallback(() => {
    setSpecialResitTimetableState(prev => {
        if (!prev) return null;
        const distributedData = { ...prev, isDistributed: true };
        try {
            localStorage.setItem('specialResitSchedule', JSON.stringify(distributedData));
        } catch (error) {
            console.error("Failed to write to localStorage:", error);
        }
        toast({ title: "Timetable Distributed", description: "The special resit timetable is now live for students and staff." });
        return distributedData;
    });
  }, [toast]);
  
  const setExamsTimetable = useCallback((data: ExamsTimetable | null) => {
    setExamsTimetableState(data);
    try {
        if (data) {
          localStorage.setItem('examsTimetable', JSON.stringify(data));
        } else {
          localStorage.removeItem('examsTimetable');
        }
    } catch (error) {
        console.error("Failed to write to localStorage:", error);
    }
  }, []);

  const distributeExamsTimetable = useCallback(() => {
    if (!examsTimetable) {
      toast({ title: "Error", description: "No exam timetable available to distribute.", variant: "destructive" });
      return;
    }
    if (!examsTimetable.exams?.length && !examsTimetable.practicals?.length) {
      toast({ title: "Error", description: "Exam timetable contains no entries.", variant: "destructive" });
      return;
    }

    setExamsTimetableState(prev => {
        if (!prev) return null; // Should not happen due to checks above but good practice
        
        const distributedData = { ...prev, isDistributed: true };
        try {
            localStorage.setItem('examsTimetable', JSON.stringify(distributedData));
        } catch (error) {
            console.error("Failed to write to localStorage:", error);
        }

        const allExams = [...(distributedData.exams || []), ...(distributedData.practicals || [])];
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
        
        toast({ 
          title: "Exams Timetable Distributed", 
          description: `The exams timetable is now live for ${studentsWithSchedules.length} students and relevant staff.`
        });
        
        return distributedData;
    });
  }, [examsTimetable, allUsers, user, addNotification, toast]);

  const updateStudentResitSelection = useCallback((entryIds: number[]) => {
    if (!user) return;
    setStudentResitSelections(prev => {
        const newState = { ...prev, [user.id]: entryIds };
        try {
            localStorage.setItem('studentResitSelections', JSON.stringify(newState));
        } catch (error) {
            console.error("Failed to write to localStorage:", error);
        }
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
        try {
            localStorage.removeItem('specialResitSchedule');
            localStorage.removeItem('studentResitSelections');
            localStorage.removeItem('examsTimetable');
        } catch (error) {
            console.error("Failed to clear localStorage:", error);
        }
    }

    toast({ title: "Application Reset", description: "All data has been reset to its initial state." });
    window.location.reload();
  };

  const contextValue = useMemo(() => ({
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
  }), [
      user, allUsers, updateUser, masterSchedule, isClassTimetableDistributed, emptySlots, posts, staffSchedules, reviewedSchedules,
      rejectedEntries, notifications, specialResitTimetable, studentResitSelections, examsTimetable, faculties, departmentMap, allDepartments,
      distributeClassTimetable, distributeExamsTimetable, distributeSpecialResitTimetable, addPost, deletePost, addComment, addReply,
      addStaffSchedule, markScheduleAsReviewed, rejectScheduleEntry, unrejectScheduleEntry, fetchNotifications, markNotificationAsRead,
      addNotification, clearAllNotifications, updateStudentResitSelection, addFaculty, updateFaculty, deleteFaculty, addDepartment,
      updateDepartment, moveDepartment, deleteDepartment, toast, setMasterSchedule, setEmptySlots, setSpecialResitTimetable, setExamsTimetable,
      updateScheduleStatus
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
