
# UMaT Connect: Project Report & Summary

## 1. Project Overview

**UMaT Connect** is a modern, responsive web application designed to bridge the communication and information gap within the University of Mines and Technology (UMaT). It serves as a centralized hub for students, staff, and administrators, streamlining access to vital academic information such as timetables, announcements, and university contacts. The application prioritizes a seamless, mobile-first user experience, drawing inspiration from familiar social media layouts to ensure ease of use and rapid adoption.

The core mission of UMaT Connect is to enhance campus life by providing a single, reliable source of truth for academic scheduling and communication, thereby reducing confusion and improving efficiency for all members of the university community.

## 2. Core Features

The application is built around several key features that cater to the specific needs of its user base:

*   **Role-Based Access Control**: The application provides a tailored experience for three distinct user roles: **Students**, **Staff**, and **Administrators**. Each role has a unique set of permissions and a customized interface, ensuring users only see information and tools relevant to them.

*   **Dynamic Information Feed**: The homepage features a dynamic feed of posts and announcements from staff and administrators. An intelligent audience selection system ensures that posts are only visible to the intended recipients (e.g., specific departments, levels, or individuals), making communication targeted and effective.

*   **Interactive Post & Commenting System**: Staff and administrators can create posts with text and file attachments. All users can engage with posts through a nested commenting and reply system, fostering a collaborative environment.

*   **Comprehensive Timetable Management**: This is the cornerstone of the application, with three distinct timetable modules:
    *   **Class Timetable**: Administrators can upload a master Excel file for the entire university. The system intelligently parses this file, distributes the schedule, and provides personalized views for students and staff.
    *   **Exams Timetable**: A dedicated module for uploading, parsing, and distributing final examination schedules.
    *   **Special Resit Timetable**: A specialized workflow for managing special resit exams, including student course selection and personalized schedule generation.

*   **Live Schedule Modifications**: Staff members have the ability to make real-time updates to their class schedules. They can:
    *   Confirm or cancel upcoming lectures.
    *   Schedule new makeup classes or quizzes in available time slots, which immediately blocks that slot for all other users to prevent clashes.

*   **Free Classroom Finder**: A utility for staff and students to find empty classrooms on any given day, based on the live, master timetable.

*   **User Profile Management**: Users can update their personal information, including their name, department, phone number, and profile picture.

*   **Notification System**: A robust notification system alerts users to important events, such as new posts, comments on their posts, replies to their comments, and the distribution of new timetables.

## 3. User Roles & Permissions

### A. Student

The student experience is focused on receiving and interacting with academic information.

*   **View Personalized Timetables**: View class, exam, and resit schedules filtered specifically for their level and department.
*   **Engage with Posts**: View announcements from staff/admins and comment on them.
*   **Receive Notifications**: Get alerted about new posts, timetable distributions, and interactions on their comments.
*   **Select Resit Courses**: Register for special resit exams to generate a personal schedule.
*   **Find Free Rooms**: Check for available classrooms for study groups or other activities.
*   **Manage Profile**: Update their personal details.

### B. Staff (Lecturers)

Staff members are content creators and managers of their own schedules.

*   **Create Posts**: Author and publish announcements to a selected audience of students, staff, or other individuals.
*   **Manage Class Schedule**:
    *   View their personalized class timetable.
    *   Confirm or cancel their scheduled classes.
    *   Schedule new makeup classes or quizzes in available slots.
*   **View Exam Duties**: Check their assigned roles (Examiner, Invigilator) for final exams and resits.
*   **Engage with Community**: Comment on any post and reply to comments.
*   **Manage Profile**: Update their personal and professional details.

### C. Administrator

The administrator role has the highest level of control, focusing on university-wide data management and system configuration.

*   **Full Timetable Management**:
    *   Upload, parse, and distribute the master Class, Exams, and Special Resit timetables from Excel files.
    *   Review and edit any entry in any timetable before and after distribution.
    *   Monitor timetable data for invalid or unassigned entries.
*   **Faculty & Department Management**: Create, edit, move, and delete university faculties and their corresponding departments.
*   **Create University-Wide Posts**: Publish official announcements to any audience within the university.
*   **Oversee All Content**: Has the ability to view all posts and comments across the platform.
*   **Application Reset**: A utility to reset the application's state to its default for demonstration purposes.

## 4. Technical Architecture

*   **Frontend**: Built with **Next.js** and **React**, providing a fast, server-rendered application.
*   **UI Components**: Utilizes **ShadCN UI** and **Tailwind CSS** for a modern, responsive, and accessible user interface.
*   **State Management**: A local-first approach using **React Context** combined with `localStorage`. This simulates a multi-user environment without requiring a live database, making it perfect for demonstrations. All application data (users, posts, timetables) is persisted in the browser.
*   **Data Parsing**: Robust server-side functions (`actions.ts`) powered by the **xlsx** library handle the complex logic of parsing various Excel timetable formats.
*   **AI & SMS (Future-Ready)**: The project is structured to include AI features with **Genkit** and SMS functionality via **Twilio**, though these are currently stubbed and not fully implemented in the present rollback state.

This structure makes the application fully self-contained and demonstrable in any environment without backend dependencies, while being architected for easy expansion into a full-stack, production-ready system.

---

## 5. Non-Technical Feature Breakdown

This section describes how each major feature works from a user's perspective and gives a high-level overview of the code that makes it possible.

### A. State Management & "Local-First" Backend

*   **How it Works**: The entire application runs in the user's browser without needing a traditional database or server. When a user logs in, creates a post, or uploads a timetable, all that data is saved directly to their browser's `localStorage`. This means the application state persists even if they close the tab or refresh the page. This approach simulates a full multi-user experience, making it perfect for demonstrations where a live internet connection or backend server isn't guaranteed.
*   **The Code Behind It**:
    *   The core of this system is the **`UserProvider`** component (`src/app/providers/user-provider.tsx`). It acts as a central brain for the application, holding all the data (users, posts, timetables) in its state.
    *   It uses a custom hook, `useLocalStorageState`, which automatically saves any changes in this data to the browser's `localStorage`.
    *   Every other component in the application accesses or modifies data by calling functions provided by `UserProvider` (e.g., `addPost`, `login`, `updateUser`). This ensures all data is managed consistently from one central place.

### B. Timetable Management

*   **How it Works**:
    1.  An **Administrator** goes to the "Manage Timetable" page.
    2.  They click "Upload" and select an Excel file for the Class, Exams, or Resit timetable.
    3.  The application reads the file, intelligently parses its contents (even with complex merged cells or varied layouts), and displays a preview of the extracted data.
    4.  The admin can review, edit, or delete individual entries before finalizing.
    5.  Once satisfied, the admin clicks "Distribute." This makes the timetable officially "live" and visible to all relevant students and staff, and sends them a notification.
    6.  **Students** see a personalized view of their schedules, filtered by their level and department.
    7.  **Staff** see their assigned classes and can manage their status (e.g., confirm or cancel a class).
*   **The Code Behind It**:
    *   **File Upload**: The UI in `src/app/timetable/page.tsx` captures the file and sends it to special "server action" functions in `src/app/timetable/actions.ts`.
    *   **Parsing**: The `actions.ts` file contains powerful functions (`handleFileUpload`, `handleExamsUpload`, `handleSpecialResitUpload`) that use the `xlsx` library to read the Excel file's raw data. These functions contain the complex logic to understand the structure, process merged cells, and extract meaningful data.
    *   **State Update**: The parsed data is sent back to the `UserProvider`, which stores it in the application's state (`masterSchedule`, `examsTimetable`, etc.).
    *   **Distribution & Filtering**: The "Distribute" button sets a simple boolean flag (e.g., `isClassTimetableDistributed`) to `true`. UI components then use this flag to decide whether to show the data. The personalized views for students and staff are achieved by filtering the master data based on the logged-in user's properties (like `user.level` and `user.department`).

### C. Post & Comment System

*   **How it Works**:
    1.  A **Staff** member or **Administrator** clicks the "Create Post" button.
    2.  They write their message and can optionally attach a file.
    3.  They select a specific audience for the post (e.g., all Level 200 students, all staff in the Engineering faculty, or even specific individuals).
    4.  When they publish, the post appears on the home feed, but *only* for the users in the selected audience.
    5.  Any user who can see the post can add comments. Users can also reply to other comments, creating nested discussion threads.
*   **The Code Behind It**:
    *   **Post Creation**: The `CreatePost` component (`src/components/home/create-post.tsx`) opens a dialog. The `AudienceSelectionDialog` component (`src/components/home/audience-selection-dialog.tsx`) provides the UI for filtering and selecting users.
    *   **Data Handling**: When the post is confirmed, the `addPost` function in `UserProvider` is called. It creates a new post object, including the array of `audience` user IDs, and adds it to the main `posts` list.
    *   **Targeted Feed**: The Home page (`src/app/page.tsx`) filters the global `posts` list. It checks if the current user's ID is included in the `post.audience` array. If it is (or if the user is an admin), the post is displayed.
    *   **Comments**: The `CommentSection` within `src/components/home/post-card.tsx` handles the logic for adding new comments and replies. It calls `addComment` or `addReply` in the `UserProvider`, which finds the correct post and comment to update.

---

## 6. Detailed Technical Report

This section provides a deeper technical analysis of the application's architecture and feature implementation.

### A. Core Architecture: React Context & `localStorage`

The application's state management is centralized in `src/app/providers/user-provider.tsx`. This file defines a React Context (`UserContext`) that provides both state and action functions to the entire component tree.

*   **State Management**: `UserProvider` uses the `useState` and `useCallback` hooks extensively. The key pattern is the `useLocalStorageState` custom hook, which is a wrapper around `useState`. It initializes its state from `localStorage` (via `getFromStorage`) and uses a `useEffect` hook to persist any changes back to `localStorage` (via `saveToStorage`). This makes data persistence automatic.
*   **Data Structures**: Key data types like `User`, `Post`, `Comment`, `TimetableEntry`, `ExamsTimetable`, and `Notification` are all defined within this provider. This serves as a single source of truth for the application's data schema.
*   **Actions (Functions)**: All state mutations are handled by functions exported from the context (e.g., `updateUser`, `addPost`, `setMasterSchedule`). These functions are wrapped in `useCallback` for performance optimization, preventing unnecessary re-renders in child components. Components do not modify state directly; they call these actions, embodying a Flux-like architecture.
*   **Connection**: Any component that needs to read data or trigger an action uses the `useUser()` hook. For example, `src/app/login/page.tsx` calls `login(userId)`, and `src/components/home/post-card.tsx` calls `addComment(postId, text)`. This creates a clear, one-way data flow and decouples components from the state management implementation.

### B. Timetable Parsing & Handling

This is the most complex data processing logic in the application, handled by Next.js Server Actions.

*   **File**: `src/app/timetable/actions.ts`
*   **Technology**: It uses the `xlsx` library to read and parse `.xlsx` and `.xls` files directly on the server, avoiding complex client-side processing.
*   **Workflow**:
    1.  The `AdminTimetableView` component in `src/app/timetable/page.tsx` captures the file upload event.
    2.  It reads the file as a Base64 encoded string and passes it to a server action (e.g., `handleFileUpload`).
    3.  The server action decodes the string into a `Buffer`.
    4.  `XLSX.read(fileBuffer)` parses the raw file.
    5.  The core logic then iterates through sheets (`workbook.SheetNames`) and rows (`XLSX.utils.sheet_to_json`).
*   **Key Logic (`parseUniversitySchedule`)**:
    *   **Merged Cells**: The parser reads the `!merges` property from the sheet object provided by `xlsx`. When it encounters a cell, it checks if it's the start of a merged region (`merge.s.r === row && merge.s.c === col`). If so, it calculates the `mergeSpan` to determine how many time slots the class covers. It then skips the subsequent cells in that merge to avoid duplication.
    *   **Course/Lecturer Splitting**: It splits cell content by newlines (`\n`) and commas (`,`). It then uses a simple heuristic: if a line contains a pattern like `[A-Z]{2,}\s+[\d]`, it's treated as a course code; otherwise, it's assumed to be part of the lecturer's name.
    *   **Department & Level Mapping**: After initial parsing, a post-processing step uses regular expressions (`.match(/\d+/)` for level, `/\b([A-Z]{2,})\b/g` for initials) to extract department initials and the year number from the course code string. It then looks up the full department name from `initialDepartmentMap`.
*   **Connection**: The parsed data, a clean JSON array, is returned to the client-side `AdminTimetableView`, which then calls `setMasterSchedule` (or `setExamsTimetable`, etc.) from the `UserProvider` to update the global state.

### C. Audience-Targeted Content Feed

The filtering of posts is a client-side operation designed for performance and simplicity within the local-first architecture.

*   **File**: `src/app/page.tsx`
*   **Implementation**: The `HomePageContent` component uses the `useMemo` hook to create a `filteredPosts` array.
*   **Logic**:
    *   The `useMemo` hook's dependency array is `[posts, user]`, so the filtering logic only re-runs when the list of posts or the current user changes.
    *   Inside the memoized function, it filters the global `posts` array from `UserProvider`.
    *   A post is included if:
        1.  The current user is an administrator (`user.role === 'administrator'`).
        2.  The current user is the author of the post (`post.authorId === user.id`).
        3.  The `post.audience` array (which contains user IDs) includes the current user's ID (`post.audience.includes(user.id)`).
*   **Connection**: The `addPost` function in `UserProvider` is responsible for creating the post object with the `audience` array correctly populated from the `AudienceSelectionDialog`. The home page then passively reads this data, ensuring a clean separation of concerns.

### D. Component Architecture & UI

*   **ShadCN UI**: The project is built on a foundation of components from `src/components/ui`. These are unstyled, accessible primitives (e.g., Dialog, Button, Card) that are then styled using **Tailwind CSS**.
*   **Compound Components**: Features are broken down into logical components. For example, the "Departments" page (`src/app/departments/page.tsx`) uses `FacultyCard`, which in turn uses `DepartmentActions`, which opens a `DepartmentDialog`. This composition makes the codebase modular and easier to manage.
*   **Responsive Design**: The UI uses Tailwind's responsive prefixes (e.g., `md:`, `sm:`) to adapt layouts for different screen sizes. A key example is the main navigation: on desktop, it's a persistent `AppSidebar`, but on mobile, it becomes a `BottomNavbar` for better ergonomics. The `useIsMobile` hook (`src/hooks/use-mobile.ts`) assists in conditionally rendering these components.
*   **Conditional Rendering**: The application heavily relies on conditional rendering based on `user.role`. For instance, `src/app/timetable/page.tsx` has three distinct views (`StudentTimetableView`, `StaffTimetableView`, `AdminTimetableView`) and renders the appropriate one based on the logged-in user's role. This is a simple yet effective way to implement Role-Based Access Control on the frontend.
