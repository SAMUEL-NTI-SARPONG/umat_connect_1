
export type UserRole = 'student' | 'lecturer' | 'administrator';

export const users = [
  {
    id: 1,
    name: 'Student User',
    email: 'student.user@st.umat.edu.gh',
    role: 'student' as UserRole,
    department: 'Computer Science',
    phone: '+233 24 456 7890',
    profileImage: 'https://placehold.co/100x100/7986CB/FFFFFF/png',
  },
  {
    id: 2,
    name: 'Dr. Yaw Mensah',
    email: 'yaw.mensah@umat.edu.gh',
    role: 'lecturer' as UserRole,
    department: 'Computer Science',
    phone: '+233 20 123 4567',
    profileImage: 'https://placehold.co/100x100/673AB7/FFFFFF/png',
  },
  {
    id: 3,
    name: 'Admin Office',
    email: 'admin@umat.edu.gh',
    role: 'administrator' as UserRole,
    department: 'Administration',
    phone: '+233 31 201 2345',
    profileImage: 'https://placehold.co/100x100/EDE7F6/311B92/png',
  },
  {
    id: 4,
    name: 'Alice',
    email: 'alice@st.umat.edu.gh',
    role: 'student' as UserRole,
    department: 'Geomatic Engineering',
    phone: '+233 55 555 5555',
    profileImage: 'https://placehold.co/100x100/C5CAE9/3F51B5/png',
  },
    {
    id: 5,
    name: 'Dr. Adwoa Ansa',
    email: 'adwoa.ansa@umat.edu.gh',
    role: 'lecturer' as UserRole,
    department: 'Geomatic Engineering',
    phone: '+233 27 888 9999',
    profileImage: 'https://placehold.co/100x100/9FA8DA/FFFFFF/png',
  },
];

export const posts = [
  {
    id: 1,
    authorId: 2, // Dr. Yaw Mensah
    timestamp: '2 hours ago',
    content: 'Reminder: The assignment deadline for COEN 457 is this Friday. No extensions will be granted. Please submit via the university portal.',
    imageUrl: 'https://placehold.co/600x400/EDE7F6/311B92/png',
    comments: [
      { author: 'Alice', text: 'Thank you for the reminder, Dr. Mensah!' },
    ],
  },
  {
    id: 2,
    authorId: 3, // Admin Office
    timestamp: '8 hours ago',
    content: 'The final examination timetable for the second semester has been released. Please check your student dashboards for your personal schedule.',
    comments: [],
  },
  {
    id: 3,
    authorId: 5, // Dr. Adwoa Ansa
    timestamp: 'Yesterday',
    content: 'Guest lecture on "Modern GIS Applications" will be held tomorrow at the main auditorium. All Geomatic Engineering students are encouraged to attend.',
    comments: [],
  },
];

export const timetable = {
  student: [
    {
      day: 'Monday',
      course: 'COEN 457: Software Engineering',
      time: '10:00 AM - 12:00 PM',
      location: 'Room C15',
      status: 'confirmed',
    },
    {
      day: 'Monday',
      course: 'MATH 251: Calculus II',
      time: '1:00 PM - 3:00 PM',
      location: 'Auditorium A',
      status: 'undecided',
    },
    {
      day: 'Wednesday',
      course: 'PHYS 164: Electromagnetism',
      time: '3:00 PM - 5:00 PM',
      location: 'Lab 3B',
      status: 'canceled',
    },
  ],
  lecturer: [
     {
      day: 'Monday',
      course: 'COEN 457: Software Engineering',
      time: '10:00 AM - 12:00 PM',
      location: 'Room C15',
      status: 'confirmed',
    },
    {
      day: 'Tuesday',
      course: 'COEN 363: Computer Architecture',
      time: '3:00 PM - 5:00 PM',
      location: 'Room C11',
      status: 'undecided',
    },
  ],
  administrator: [], // Admins don't have a personal schedule in this context
};
