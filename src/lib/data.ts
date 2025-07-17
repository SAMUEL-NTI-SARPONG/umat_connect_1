
export type UserRole = 'student' | 'lecturer' | 'administrator';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  level: number;
  phone: string;
  profileImage: string;
}

export const users: User[] = [
  {
    id: 1,
    name: 'Student User',
    email: 'student.user@st.umat.edu.gh',
    role: 'student' as UserRole,
    department: 'Computer Science And Engineering',
    level: 100,
    phone: '+233244567890',
    profileImage: 'https://placehold.co/100x100/7986CB/FFFFFF/png',
  },
  {
    id: 2,
    name: 'Dr. Yaw Mensah',
    email: 'yaw.mensah@umat.edu.gh',
    role: 'lecturer' as UserRole,
    department: 'Computer Science And Engineering',
    level: 0, // Not applicable
    phone: '+233201234567',
    profileImage: 'https://placehold.co/100x100/673AB7/FFFFFF/png',
  },
  {
    id: 3,
    name: 'Admin Office',
    email: 'admin@umat.edu.gh',
    role: 'administrator' as UserRole,
    department: 'Administration',
    level: 0, // Not applicable
    phone: '+233312012345',
    profileImage: 'https://placehold.co/100x100/EDE7F6/311B92/png',
  },
  {
    id: 4,
    name: 'Alice',
    email: 'alice@st.umat.edu.gh',
    role: 'student' as UserRole,
    department: 'Geomatic Engineering',
    level: 200,
    phone: '+233555555555',
    profileImage: 'https://placehold.co/100x100/C5CAE9/3F51B5/png',
  },
    {
    id: 5,
    name: 'Dr. Adwoa Ansa',
    email: 'adwoa.ansa@umat.edu.gh',
    role: 'lecturer' as UserRole,
    department: 'Geomatic Engineering',
    level: 0, // Not applicable
    phone: '+233278889999',
    profileImage: 'https://placehold.co/100x100/9FA8DA/FFFFFF/png',
  },
  {
    id: 6,
    name: 'Dr. Kweku Ampah',
    email: 'kweku.ampah@umat.edu.gh',
    role: 'lecturer' as UserRole,
    department: 'Electrical and Electronic Engineering',
    level: 0,
    phone: '+233261112222',
    profileImage: 'https://placehold.co/100x100/B2DFDB/00796B/png'
  }
];

export const departments = [
  'Mining Engineering',
  'Minerals Engineering',
  'Mechanical Engineering',
  'Electrical and Electronic Engineering',
  'Renewable Energy Engineering',
  'Telecommunication Engineering',
  'Plant and Maintenance Engineering',
  'Cyber Security',
  'Computer Science And Engineering',
  'Information Systems and Technology',
  'Mathematics',
  'Statistical Data Science',
  'Logistics and Transport Management',
  'Economics and Industrial Organisation',
  'Geomatic Engineering',
  'Geological Engineering',
  'Spatial Planning',
  'Environmental and Safety Engineering',
  'Land Administration and Information Systems',
  'Petroleum Engineering',
  'Natural Gas Engineering',
  'Petroleum Geosciences and Engineering',
  'Petroleum Refining and Petrochemical Engineering',
  'Chemical Engineering',
];

export const faculties: { name: string; departments: string[] }[] = [
    {
        name: 'Faculty of Mining and Minerals Engineering',
        departments: [
            'Mining Engineering',
            'Minerals Engineering',
        ]
    },
    {
        name: 'Faculty of Engineering',
        departments: [
            'Mechanical Engineering',
            'Electrical and Electronic Engineering',
            'Renewable Energy Engineering',
            'Telecommunication Engineering',
            'Plant and Maintenance Engineering',
        ]
    },
    {
        name: 'Faculty of Computing and Mathematical Sciences',
        departments: [
            'Cyber Security',
            'Computer Science And Engineering',
            'Information Systems and Technology',
            'Mathematics',
            'Statistical Data Science',
        ]
    },
    {
        name: 'Faculty of Integrated Management Studies',
        departments: [
            'Logistics and Transport Management',
            'Economics and Industrial Organisation',
        ]
    },
    {
        name: 'Faculty of Geosciences and Environmental Studies',
        departments: [
            'Geomatic Engineering',
            'Geological Engineering',
            'Spatial Planning',
            'Environmental and Safety Engineering',
            'Land Administration and Information Systems',
        ]
    },
    {
        name: 'School of Petroleum Studies',
        departments: [
            'Petroleum Engineering',
            'Natural Gas Engineering',
            'Petroleum Geosciences and Engineering',
            'Petroleum Refining and Petrochemical Engineering',
            'Chemical Engineering',
        ]
    }
];


export const posts: any[] = [];

export const timetable = {
  student: [],
  lecturer: [],
  administrator: [],
};
