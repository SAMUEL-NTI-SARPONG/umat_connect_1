
export type UserRole = 'student' | 'staff' | 'administrator';

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
    role: 'staff' as UserRole,
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
    role: 'staff' as UserRole,
    department: 'Geomatic Engineering',
    level: 0, // Not applicable
    phone: '+233278889999',
    profileImage: 'https://placehold.co/100x100/9FA8DA/FFFFFF/png',
  },
  {
    id: 6,
    name: 'Dr. Kweku Ampah',
    email: 'kweku.ampah@umat.edu.gh',
    role: 'staff' as UserRole,
    department: 'Electrical and Electronic Engineering',
    level: 0,
    phone: '+233261112222',
    profileImage: 'https://placehold.co/100x100/B2DFDB/00796B/png'
  }
];

export const allDepartments = [
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

export const initialDepartmentMap = new Map([
    // Faculty of mining and minerals
    ['MN', 'Mining Engineering'],
    ['MR', 'Minerals Engineering'],
    // Faculty of Engineering
    ['MC', 'Mechanical Engineering'],
    ['EL', 'Electrical and Electronic Engineering'],
    ['RN', 'Renewable Energy Engineering'],
    ['TC', 'Telecommunication Engineering'],
    ['PM', 'Plant and Maintenance Engineering'],
    // Faculty of computing and mathematical sciences
    ['CY', 'Cyber Security'],
    ['CE', 'Computer Science And Engineering'],
    ['IS', 'Information Systems and Technology'],
    ['MA', 'Mathematics'],
    ['SD', 'Statistical Data Science'],
    // Faculty of integrate management studies
    ['LT', 'Logistics and Transport Management'],
    ['EC', 'Economics and Industrial Organisation'],
    // Faculty of geosciences and environmental studies
    ['GM', 'Geomatic Engineering'],
    ['GL', 'Geological Engineering'],
    ['SP', 'Spatial Planning'],
    ['ES', 'Environmental and Safety Engineering'],
    ['LA', 'Land Administration and Information Systems'],
    // School of Petroleum studies
    ['PE', 'Petroleum Engineering'],
    ['NG', 'Natural Gas Engineering'],
    ['PG', 'Petroleum Geosciences and Engineering'],
    ['RP', 'Petroleum Refining and Petrochemical Engineering'],
    ['CH', 'Chemical Engineering'],
  ]);

export const initialFaculties: { name: string; departments: { name: string, initial: string }[] }[] = [
    {
        name: 'Faculty of Mining and Minerals Engineering',
        departments: [
            { name: 'Mining Engineering', initial: 'MN' },
            { name: 'Minerals Engineering', initial: 'MR' },
        ]
    },
    {
        name: 'Faculty of Engineering',
        departments: [
            { name: 'Mechanical Engineering', initial: 'MC' },
            { name: 'Electrical and Electronic Engineering', initial: 'EL' },
            { name: 'Renewable Energy Engineering', initial: 'RN' },
            { name: 'Telecommunication Engineering', initial: 'TC' },
            { name: 'Plant and Maintenance Engineering', initial: 'PM' },
        ]
    },
    {
        name: 'Faculty of Computing and Mathematical Sciences',
        departments: [
            { name: 'Cyber Security', initial: 'CY' },
            { name: 'Computer Science And Engineering', initial: 'CE' },
            { name: 'Information Systems and Technology', initial: 'IS' },
            { name: 'Mathematics', initial: 'MA' },
            { name: 'Statistical Data Science', initial: 'SD' },
        ]
    },
    {
        name: 'Faculty of Integrated Management Studies',
        departments: [
            { name: 'Logistics and Transport Management', initial: 'LT' },
            { name: 'Economics and Industrial Organisation', initial: 'EC' },
        ]
    },
    {
        name: 'Faculty of Geosciences and Environmental Studies',
        departments: [
            { name: 'Geomatic Engineering', initial: 'GM' },
            { name: 'Geological Engineering', initial: 'GL' },
            { name: 'Spatial Planning', initial: 'SP' },
            { name: 'Environmental and Safety Engineering', initial: 'ES' },
            { name: 'Land Administration and Information Systems', initial: 'LA' },
        ]
    },
    {
        name: 'School of Petroleum Studies',
        departments: [
            { name: 'Petroleum Engineering', initial: 'PE' },
            { name: 'Natural Gas Engineering', initial: 'NG' },
            { name: 'Petroleum Geosciences and Engineering', initial: 'PG' },
            { name: 'Petroleum Refining and Petrochemical Engineering', initial: 'RP' },
            { name: 'Chemical Engineering', initial: 'CH' },
        ]
    }
];


export const posts: any[] = [];

export const timetable = {
  student: [],
  lecturer: [],
  administrator: [],
};
