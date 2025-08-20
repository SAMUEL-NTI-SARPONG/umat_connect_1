
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
