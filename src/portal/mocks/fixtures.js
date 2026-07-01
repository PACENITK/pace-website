export const mockUsers = {
  student: {
    _id: 'u-stu-1',
    role: 'student',
    studentType: 'nitk',
    name: 'Abhijith Student',
    email: 'student@nitk.edu.in',
    profile: {
      cgpa: 8.5,
      branch: 'Civil Engineering',
      year: 3,
      resumeUrl: 'https://drive.google.com/file/d/12345/view'
    }
  },
  professor: {
    _id: 'u-prof-1',
    role: 'professor',
    name: 'Prof. Ramesh Rao',
    email: 'ramesh@nitk.edu.in',
    status: 'approved'
  },
  admin: {
    _id: 'u-admin-1',
    role: 'admin',
    name: 'Asha Hegde (Admin)',
    email: 'admin@nitk.edu.in'
  },
  super_admin: {
    _id: 'u-sa-1',
    role: 'super_admin',
    name: 'Dr. Prasad (Super Admin)',
    email: 'super@nitk.edu.in'
  }
};

export const mockInternships = [
  {
    _id: 'i-1',
    plateId: 'PACE-001',
    title: 'Structural Analysis Intern',
    description: 'Work on computing finite element model parameters for concrete beams under heavy loads. Requires core mechanics knowledge.',
    scope: 'open',
    stipend: '₹12,000 / month',
    duration: '2 Months',
    deadline: '2026-08-30T18:30:00.000Z',
    openings: 3,
    status: 'open',
    professorId: {
      _id: 'u-prof-1',
      name: 'Prof. Ramesh Rao'
    },
    eligibility: {
      branches: ['Civil Engineering'],
      minCGPA: 8.0
    },
    customFields: []
  },
  {
    _id: 'i-2',
    plateId: 'PACE-002',
    title: 'Geotechnical Soil Investigation',
    description: 'Analyze bearing capacity and shear strength properties of coastal soil specimens. Involves both laboratory testing and documentation.',
    scope: 'internal',
    stipend: 'Unpaid (Academic Credit)',
    duration: '1 Month',
    deadline: '2026-09-15T18:30:00.000Z',
    openings: 2,
    status: 'open',
    professorId: {
      _id: 'u-prof-1',
      name: 'Prof. Ramesh Rao'
    },
    eligibility: {
      branches: ['Civil Engineering', 'Mining Engineering'],
      minCGPA: 7.0
    },
    customFields: [
      {
        fieldId: 'cf-1',
        label: 'Preferable Base Location',
        type: 'select',
        options: ['Mangalore', 'Bangalore', 'Remote'],
        required: true
      },
      {
        fieldId: 'cf-2',
        label: 'Why are you interested in geotechnical studies?',
        type: 'textarea',
        required: true
      }
    ]
  },
  {
    _id: 'i-3',
    plateId: 'PACE-003',
    title: 'GIS and Remote Sensing Assistant',
    description: 'Map urban drainage lines using satellite imagery and GIS platforms. Highly computational.',
    scope: 'open',
    stipend: '₹15,000 / month',
    duration: '3 Months',
    deadline: '2026-06-01T18:30:00.000Z', // Past deadline
    openings: 1,
    status: 'closed',
    professorId: {
      _id: 'u-prof-2',
      name: 'Dr. K. Swaminathan'
    },
    eligibility: {
      branches: ['Civil Engineering', 'Computer Science'],
      minCGPA: 8.5
    },
    customFields: [
      {
        fieldId: 'cf-3',
        label: 'Portfolio / GitHub Link',
        type: 'link',
        required: false
      }
    ]
  }
];

export const mockApplications = [
  {
    _id: 'a-1',
    studentId: {
      _id: 'u-stu-1',
      name: 'Abhijith Student',
      email: 'student@nitk.edu.in',
      profile: { cgpa: 8.5, branch: 'Civil Engineering' }
    },
    internshipId: {
      _id: 'i-1',
      plateId: 'PACE-001',
      title: 'Structural Analysis Intern',
      stipend: '₹12,000 / month',
      deadline: '2026-08-30T18:30:00.000Z',
      professorId: { name: 'Prof. Ramesh Rao' }
    },
    status: 'applied',
    coverNote: 'I have completed courses in structural dynamics.',
    resumeUrl: 'https://drive.google.com/file/d/12345/view',
    responses: [],
    eligibilityWarning: false,
    createdAt: '2026-07-01T04:30:00.000Z'
  },
  {
    _id: 'a-2',
    studentId: {
      _id: 'u-stu-1',
      name: 'Abhijith Student',
      email: 'student@nitk.edu.in',
      profile: { cgpa: 8.5, branch: 'Civil Engineering' }
    },
    internshipId: {
      _id: 'i-2',
      plateId: 'PACE-002',
      title: 'Geotechnical Soil Investigation',
      stipend: 'Unpaid (Academic Credit)',
      deadline: '2026-09-15T18:30:00.000Z',
      professorId: { name: 'Prof. Ramesh Rao' }
    },
    status: 'shortlisted',
    coverNote: 'Very interested in lab tests.',
    resumeUrl: 'https://drive.google.com/file/d/12345/view',
    responses: [
      { fieldId: 'cf-1', value: 'Mangalore' },
      { fieldId: 'cf-2', value: 'I want to gain experience in shear strength lab tests.' }
    ],
    eligibilityWarning: false,
    createdAt: '2026-07-01T05:00:00.000Z'
  }
];

export const mockAuditLogs = [
  {
    _id: 'audit-1',
    actorId: { name: 'Dr. Prasad (Super Admin)' },
    action: 'TOGGLE_KILL_SWITCH',
    targetType: 'System',
    metadata: { active: true },
    timestamp: '2026-07-01T06:00:00.000Z'
  },
  {
    _id: 'audit-2',
    actorId: { name: 'Asha Hegde (Admin)' },
    action: 'APPROVE_PROFESSOR',
    targetType: 'User',
    metadata: { email: 'ramesh@nitk.edu.in' },
    timestamp: '2026-07-01T06:10:00.000Z'
  }
];
