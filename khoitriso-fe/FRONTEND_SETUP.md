# 🚀 Frontend Setup & Integration Guide

## 📋 Overview

This guide explains how to set up and use the Khởi Trí Số frontend with API integration and internationalization.

## 🔧 Installation

### 1. Install Dependencies

```bash
cd khoitriso-fe
npm install
```

This will install:
- **next-intl** - Internationalization for Next.js
- **axios** - HTTP client for API requests
- All other required dependencies

### 2. Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 🌍 Internationalization (i18n)

### Configuration

The i18n system is configured with:
- **Supported Languages**: Vietnamese (vi), English (en)
- **Default Language**: Vietnamese (vi)
- **Translation Files**: `messages/vi.json`, `messages/en.json`

### Using Translations in Components

#### Client Components

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();

  return (
    <div>
      <h1>{t('common.appName')}</h1>
      <p>{t('common.welcome')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

#### Server Components

```tsx
import { getTranslations } from 'next-intl/server';

export default async function MyServerComponent() {
  const t = await getTranslations();

  return (
    <div>
      <h1>{t('common.appName')}</h1>
    </div>
  );
}
```

#### With Namespaces

```tsx
// Use specific namespace
const t = useTranslations('course');

<h1>{t('title')}</h1> // "Khóa học" or "Courses"
<p>{t('description')}</p>
```

#### With Parameters

```tsx
const t = useTranslations('validation');

<p>{t('min', { min: 5 })}</p> // "Tối thiểu 5 ký tự"
```

### Language Switcher Component

Already created in `src/components/LanguageSwitcher.tsx`:

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Header() {
  return (
    <header>
      <nav>
        {/* Your navigation */}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
```

### Navigation with i18n

Use the internationalized navigation functions:

```tsx
import { Link, useRouter, usePathname } from '@/i18n/routing';

export default function MyComponent() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div>
      {/* Link component */}
      <Link href="/courses">Courses</Link>

      {/* Programmatic navigation */}
      <button onClick={() => router.push('/courses')}>
        Go to Courses
      </button>

      {/* Current pathname */}
      <p>Current path: {pathname}</p>
    </div>
  );
}
```

## 📡 API Integration

### API Client

The API client is configured in `src/lib/api.ts` with:
- Automatic token management
- Request/response interceptors
- Error handling
- Language header injection
- Token refresh on 401

### Using API Client

#### Basic Requests

```tsx
import { api } from '@/lib/api';

// GET request
const response = await api.get('/courses');
if (response.success) {
  console.log(response.data);
}

// POST request
const response = await api.post('/courses', {
  title: 'New Course',
  description: 'Course description'
});

// PUT request
const response = await api.put('/courses/123', {
  title: 'Updated Title'
});

// DELETE request
const response = await api.delete('/courses/123');
```

#### With Type Safety

```tsx
interface Course {
  id: number;
  title: string;
  description: string;
}

const response = await api.get<Course[]>('/courses');
if (response.success && response.data) {
  const courses: Course[] = response.data;
  // TypeScript knows the type!
}
```

#### File Upload

```tsx
const formData = new FormData();
formData.append('image', file);

const response = await api.upload('/upload/image', formData, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});
```

#### Error Handling

```tsx
const response = await api.post('/courses', data);

if (!response.success) {
  // Handle error
  console.error(response.message);
  
  // Validation errors
  if (response.errors) {
    Object.entries(response.errors).forEach(([field, messages]) => {
      console.error(`${field}: ${messages.join(', ')}`);
    });
  }
}
```

### React Hooks for API

Create custom hooks for better reusability:

#### useApi Hook

```tsx
// src/hooks/useApi.ts
import { useState, useCallback } from 'react';
import { api, ApiResponse } from '@/lib/api';

export function useApi<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const request = useCallback(async (
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    payload?: any
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);

    const response = await api[method]<T>(url, payload);

    if (response.success && response.data) {
      setData(response.data);
    } else {
      setError(response.message || 'An error occurred');
    }

    setLoading(false);
    return response;
  }, []);

  const get = useCallback((url: string) => request('get', url), [request]);
  const post = useCallback((url: string, data?: any) => request('post', url, data), [request]);
  const put = useCallback((url: string, data?: any) => request('put', url, data), [request]);
  const del = useCallback((url: string) => request('delete', url), [request]);

  return { loading, error, data, get, post, put, delete: del };
}
```

#### Usage

```tsx
'use client';

import { useApi } from '@/hooks/useApi';
import { useEffect } from 'react';

interface Course {
  id: number;
  title: string;
}

export default function CoursesPage() {
  const { loading, error, data, get } = useApi<Course[]>();

  useEffect(() => {
    get('/courses');
  }, [get]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data?.map(course => (
        <div key={course.id}>{course.title}</div>
      ))}
    </div>
  );
}
```

### Forum API Integration

```tsx
// Get questions
const response = await api.get('/forum/questions', {
  params: {
    page: 1,
    perPage: 20,
    sortBy: 'recent',
    categoryId: 'category-id',
    tags: 'tag1,tag2',
    search: 'search term'
  }
});

// Create question
const response = await api.post('/forum/questions', {
  title: 'How to solve this problem?',
  content: 'Detailed question content...',
  categoryId: 'category-id',
  categoryName: 'Math',
  tags: ['algebra', 'math-12']
});

// Get question details
const response = await api.get('/forum/questions/question-id');

// Create answer
const response = await api.post('/forum/questions/question-id/answers', {
  content: 'Answer content...'
});

// Vote
const response = await api.post('/forum/votes', {
  targetId: 'target-id',
  targetType: 1, // 1: Question, 2: Answer, 3: Comment
  voteType: 1 // 1: Up, -1: Down
});

// Bookmark
const response = await api.post('/forum/bookmarks', {
  questionId: 'question-id'
});

// Get bookmarks
const response = await api.get('/forum/bookmarks');
```

## 🎨 Creating API Service Modules

Organize API calls into service modules:

```tsx
// src/services/courseService.ts
import { api } from '@/lib/api';

export const courseService = {
  getAll: (params?: any) => api.get('/courses', { params }),
  getById: (id: string) => api.get(`/courses/${id}`),
  create: (data: any) => api.post('/courses', data),
  update: (id: string, data: any) => api.put(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
  enroll: (id: string) => api.post(`/courses/${id}/enroll`),
  getMyCourses: () => api.get('/courses/my-courses'),
};

// src/services/forumService.ts
import { api } from '@/lib/api';

export const forumService = {
  // Questions
  getQuestions: (params?: any) => api.get('/forum/questions', { params }),
  getQuestion: (id: string) => api.get(`/forum/questions/${id}`),
  createQuestion: (data: any) => api.post('/forum/questions', data),
  updateQuestion: (id: string, data: any) => api.put(`/forum/questions/${id}`, data),
  deleteQuestion: (id: string) => api.delete(`/forum/questions/${id}`),
  
  // Answers
  getAnswers: (questionId: string) => api.get(`/forum/questions/${questionId}/answers`),
  createAnswer: (questionId: string, data: any) => api.post(`/forum/questions/${questionId}/answers`, data),
  acceptAnswer: (id: string) => api.post(`/forum/answers/${id}/accept`),
  
  // Votes
  vote: (data: any) => api.post('/forum/votes', data),
  
  // Bookmarks
  toggleBookmark: (questionId: string) => api.post('/forum/bookmarks', { questionId }),
  getBookmarks: () => api.get('/forum/bookmarks'),
  
  // Categories & Tags
  getCategories: () => api.get('/forum/categories'),
  getTags: (params?: any) => api.get('/forum/tags', { params }),
  
  // Statistics
  getStats: () => api.get('/forum/stats'),
};
```

Usage:

```tsx
import { courseService } from '@/services/courseService';
import { forumService } from '@/services/forumService';

// In your component
const courses = await courseService.getAll();
const question = await forumService.getQuestion('question-id');
```

## 🔐 Authentication

### Login

```tsx
import { api, authUtils } from '@/lib/api';

const handleLogin = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  
  if (response.success && response.data) {
    authUtils.setToken(response.data.token, response.data.refreshToken);
    authUtils.setUser(response.data.user);
    
    // Redirect to dashboard
    router.push('/dashboard');
  }
};
```

### Register

```tsx
const handleRegister = async (data: any) => {
  const response = await api.post('/auth/register', data);
  
  if (response.success) {
    // Auto login or redirect to login
  }
};
```

### Logout

```tsx
const handleLogout = async () => {
  await api.post('/auth/logout');
  authUtils.logout(); // Clears tokens and redirects
};
```

### Protected Routes

```tsx
// src/middleware.ts or in your layout
import { authUtils } from '@/lib/api';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authUtils.isAuthenticated();
  
  if (!isAuthenticated) {
    redirect('/auth/login');
  }
  
  return <>{children}</>;
}
```

## 🎯 Example: Forum Question Page

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { forumService } from '@/services/forumService';

export default function QuestionPage({ params }: { params: { id: string } }) {
  const t = useTranslations('forum');
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestion();
  }, [params.id]);

  const loadQuestion = async () => {
    setLoading(true);
    const response = await forumService.getQuestion(params.id);
    
    if (response.success && response.data) {
      setQuestion(response.data.question);
    } else {
      setError(response.message || 'Failed to load question');
    }
    
    setLoading(false);
  };

  const handleVote = async (voteType: number) => {
    const response = await forumService.vote({
      targetId: params.id,
      targetType: 1,
      voteType
    });
    
    if (response.success) {
      loadQuestion(); // Reload to get updated votes
    }
  };

  const handleBookmark = async () => {
    const response = await forumService.toggleBookmark(params.id);
    
    if (response.success) {
      loadQuestion(); // Reload to get updated bookmark status
    }
  };

  if (loading) return <div>{t('loading')}</div>;
  if (error) return <div>{error}</div>;
  if (!question) return <div>{t('notFound')}</div>;

  return (
    <div>
      <h1>{question.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: question.content }} />
      
      <div className="flex gap-2">
        <button onClick={() => handleVote(1)}>{t('upvote')}</button>
        <button onClick={() => handleVote(-1)}>{t('downvote')}</button>
        <button onClick={handleBookmark}>
          {question.isBookmarked ? t('unbookmark') : t('bookmark')}
        </button>
      </div>
      
      <div>
        <h2>{t('answers')}</h2>
        {/* Render answers */}
      </div>
    </div>
  );
}
```

## 📝 Adding New Translations

1. Edit `messages/vi.json`:
```json
{
  "myFeature": {
    "title": "Tiêu đề tính năng",
    "description": "Mô tả tính năng"
  }
}
```

2. Edit `messages/en.json`:
```json
{
  "myFeature": {
    "title": "Feature Title",
    "description": "Feature description"
  }
}
```

3. Use in component:
```tsx
const t = useTranslations('myFeature');
<h1>{t('title')}</h1>
```

## 🚀 Running the Application

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## ✅ Checklist

- [x] Install dependencies
- [x] Configure environment variables
- [x] Setup i18n with next-intl
- [x] Create API client with axios
- [x] Create translation files (vi, en)
- [x] Create LanguageSwitcher component
- [x] Setup authentication utilities
- [ ] Create service modules for all API endpoints
- [ ] Implement protected routes
- [ ] Add loading states and error handling
- [ ] Test API integration
- [ ] Test language switching

## 🎉 Done!

Your frontend is now ready with:
- ✅ Internationalization (vi, en)
- ✅ API client with auto token management
- ✅ Language switcher
- ✅ Type-safe API calls
- ✅ Error handling
- ✅ File upload support
- ✅ Authentication utilities

Happy coding! 🚀
