export interface Video {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  videoUrl: string;
  videoUrls?: string[];
  thumbnail: string;
  language: string;
  languages?: string[];
  duration: number; // in seconds
  isPublished: boolean;
  isFeatured: boolean;
  tags: string[];
  displayOrder: number;
  views: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  videoCount: number;
}

const initialCategories: Category[] = [
  { id: 'c1', name: 'Self Care', description: 'Videos to help prioritize mental health and wellness', videoCount: 3 },
  { id: 'c2', name: 'Families Thrive', description: 'Guidance and tools for family mental health', videoCount: 2 },
  { id: 'c3', name: 'Crisis Resources', description: 'De-escalation and active listening techniques', videoCount: 1 },
  { id: 'c4', name: 'Community Support', description: 'Peer-led mental health programs', videoCount: 1 },
];

const initialVideos: Video[] = [
  {
    id: 'v1',
    title: 'Movement as Medicine: Exercise & Mental Health',
    description: 'How regular physical activity reshapes the brain, reduces depression, and builds emotional endurance — backed by current research.',
    categoryId: 'c1',
    videoUrl: 'https://example.com/video1.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80',
    language: 'English',
    duration: 390, // 6:30
    isPublished: true,
    isFeatured: true,
    tags: ['exercise', 'mental health'],
    displayOrder: 1,
    views: 12450,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v2',
    title: 'Grief & Growth: Navigating Loss Together',
    description: 'Compassionate guidance for families experiencing bereavement, including how to support grieving children and teens.',
    categoryId: 'c2',
    videoUrl: 'https://example.com/video2.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80',
    language: 'English',
    duration: 532, // 8:52
    isPublished: true,
    isFeatured: false,
    tags: ['grief', 'family'],
    displayOrder: 2,
    views: 4120,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v3',
    title: 'Crisis Intervention: What to Say When It Matters Most',
    description: 'Training for first responders, counselors, and concerned community members on de-escalation and active listening techniques.',
    categoryId: 'c3',
    videoUrl: 'https://example.com/video3.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    language: 'English',
    duration: 678, // 11:18
    isPublished: true,
    isFeatured: false,
    tags: ['crisis', 'support'],
    displayOrder: 3,
    views: 2840,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v4',
    title: 'Sleep Science: Rest Your Way to Better Mental Health',
    description: 'The neuroscience of sleep and actionable strategies for improving sleep quality to boost mood, cognition, and emotional regulation.',
    categoryId: 'c1',
    videoUrl: 'https://example.com/video4.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1511295742362-92c96b5ade36?auto=format&fit=crop&w=400&q=80',
    language: 'English',
    duration: 465, // 7:45
    isPublished: true,
    isFeatured: false,
    tags: ['sleep', 'wellness'],
    displayOrder: 4,
    views: 1850,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v5',
    title: 'The Power of Peer Support',
    description: 'Exploring how peer-led mental health programs reduce stigma and improve outcomes in schools and workplaces.',
    categoryId: 'c4',
    videoUrl: 'https://example.com/video5.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=400&q=80',
    language: 'English',
    duration: 365, // 6:05
    isPublished: true,
    isFeatured: false,
    tags: ['peer', 'community'],
    displayOrder: 5,
    views: 1420,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v6',
    title: 'Raising Resilient Kids in Uncertain Times',
    description: 'How to have honest, age-appropriate conversations with children about anxiety, loss, and change.',
    categoryId: 'c2',
    videoUrl: 'https://example.com/video6.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=400&q=80',
    language: 'English',
    duration: 560, // 9:20
    isPublished: true,
    isFeatured: false,
    tags: ['parenting', 'kids'],
    displayOrder: 6,
    views: 980,
    createdAt: new Date().toISOString(),
  }
];

export const getMockVideos = (): Video[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('mock_videos');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('mock_videos', JSON.stringify(initialVideos));
  }
  return initialVideos;
};

export const saveMockVideos = (videos: Video[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mock_videos', JSON.stringify(videos));
  }
};

export const getMockCategories = (): Category[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('mock_categories');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('mock_categories', JSON.stringify(initialCategories));
  }
  return initialCategories;
};

export const saveMockCategories = (categories: Category[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mock_categories', JSON.stringify(categories));
  }
};

export const getDashboardStats = () => {
  const videos = getMockVideos();
  const calculatedWatchTime = Math.round(videos.reduce((acc, v) => acc + (v.duration * v.views) / 3600, 0));
  return {
    totalVideos: videos.length,
    totalViews: videos.reduce((acc, v) => acc + v.views, 0),
    activeCustomers: 142, // Mocked
    videosWatchedToday: 48, // Mocked
    totalWatchTimeHours: calculatedWatchTime || 128,
  };
};
