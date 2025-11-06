# 🚀 Frontend Integration Guide - Multi-Language System

## 📊 OVERVIEW

Frontend Next.js đã được tích hợp hoàn chỉnh với **Laravel Backend Multi-Language Response System**.

### ✅ What's Implemented

- ✅ Multi-language support (Vietnamese, English)
- ✅ Type-safe API responses
- ✅ Automatic Accept-Language header
- ✅ Error handling with messageCode
- ✅ Toast notifications
- ✅ Language switcher UI
- ✅ Error display utilities
- ✅ Validation error handling

---

## 🏗️ ARCHITECTURE

### File Structure
```
khoitriso-fe/
├── src/
│   ├── types/
│   │   └── api.ts                    ✅ Backend response types
│   ├── locales/
│   │   ├── index.ts                  ✅ Locale config
│   │   ├── vi.ts                     ✅ Vietnamese translations
│   │   └── en.ts                     ✅ English translations
│   ├── contexts/
│   │   └── LanguageContext.tsx       ✅ Language provider
│   ├── hooks/
│   │   └── useToast.ts               ✅ Toast hook
│   ├── lib/
│   │   ├── http-client.ts            ✅ Enhanced HTTP client
│   │   └── error-handler.ts          ✅ Error handler
│   ├── components/
│   │   └── LanguageSwitcher.tsx      ✅ Language switcher
│   └── services/
│       ├── auth.new.ts               ✅ Example service
│       └── [other services]          ⏳ To be updated
```

---

## 🎯 QUICK START

### 1. Use Translation in Components

```tsx
'use client';

import { useTranslation } from '@/contexts/LanguageContext';

export function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('course.title')}</h1>
      <p>{t('course.instructor')}: John Doe</p>
      <button>{t('course.enroll')}</button>
    </div>
  );
}
```

### 2. Call API with Error Handling

```tsx
'use client';

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/contexts/LanguageContext';

export function CourseList() {
  const { t } = useTranslation();
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  
  const fetchCourses = async () => {
    try {
      const response = await httpClient.get('courses');
      
      if (!isSuccess(response)) {
        const errorMessage = handleApiError(response);
        toast.error(errorMessage);
        return;
      }
      
      const data = extractData(response);
      setCourses(data || []);
      
    } catch (error) {
      toast.error(t('errors.UNKNOWN_ERROR'));
    }
  };
  
  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

### 3. Add Language Switcher

```tsx
import { CompactLanguageSwitcher } from '@/components/LanguageSwitcher';

export function Header() {
  return (
    <header>
      <nav>
        {/* Other nav items */}
        <CompactLanguageSwitcher />
      </nav>
    </header>
  );
}
```

---

## 📝 DETAILED USAGE

### Language System

#### Get Translation
```tsx
const { t, tError } = useTranslation();

// Simple translation
t('common.save')                    // "Lưu" or "Save"

// Nested translation
t('course.instructor')              // "Giảng viên" or "Instructor"

// Error translation (from backend messageCode)
tError('USER_NOT_FOUND')            // "Không tìm thấy người dùng" or "User not found"

// With parameters
t('pagination.showing', { from: 1, to: 10, total: 100 })
```

#### Change Language
```tsx
const { language, setLanguage } = useLanguage();

// Change language
setLanguage('en');  // or 'vi'

// Get current language
console.log(language); // 'vi' or 'en'
```

---

### HTTP Client

#### Basic Requests
```tsx
import { httpClient, extractData, isSuccess } from '@/lib/http-client';

// GET request
const response = await httpClient.get('courses');

// POST request
const response = await httpClient.post('auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

// PUT request
const response = await httpClient.put('profile', data);

// DELETE request
const response = await httpClient.delete('cart/1');
```

#### Handle Response
```tsx
// Check if success
if (isSuccess(response)) {
  const data = extractData(response);
  console.log(data);
}

// Extract error
import { extractError } from '@/lib/http-client';

if (!isSuccess(response)) {
  const error = extractError(response);
  console.log(error.messageCode); // 'USER_NOT_FOUND'
  console.log(error.message);     // "Không tìm thấy người dùng"
}
```

---

### Error Handling

#### Simple Error Handling
```tsx
import { handleApiError } from '@/lib/error-handler';

const errorMessage = handleApiError(response);
toast.error(errorMessage);
```

#### Validation Errors
```tsx
import { extractValidationErrors, getFieldError } from '@/lib/error-handler';

const validationErrors = extractValidationErrors(response);

// Get error for specific field
const emailError = getFieldError(validationErrors, 'email');
if (emailError) {
  console.log(emailError); // "Email đã được sử dụng"
}

// Display all errors
Object.entries(validationErrors).forEach(([field, messages]) => {
  console.log(`${field}: ${messages.join(', ')}`);
});
```

#### Check Error Types
```tsx
import { 
  isValidationError, 
  isUnauthorized, 
  isForbidden, 
  isNotFound 
} from '@/lib/error-handler';

if (isUnauthorized(response)) {
  // Redirect to login
  router.push('/auth/login');
}

if (isValidationError(response)) {
  // Show validation errors
  const errors = extractValidationErrors(response);
  // Display errors in form
}
```

---

### Toast Notifications

```tsx
import { useToast } from '@/hooks/useToast';

const toast = useToast();

// Success toast
toast.success('Đăng nhập thành công!');

// Error toast
toast.error('Có lỗi xảy ra');

// Warning toast
toast.warning('Vui lòng xác nhận email');

// Info toast
toast.info('Thông báo mới');

// Custom duration (default 3000ms)
toast.success('Message', 5000);
```

---

### Complete Service Example

```tsx
/**
 * Courses Service
 */
import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

// Get all courses with pagination
export async function getCourses(params: {
  page?: number;
  limit?: number;
  category?: number;
  search?: string;
}) {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  
  const response = await httpClient.get(`courses?${queryString}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

// Get course by ID
export async function getCourse(id: number) {
  const response = await httpClient.get(`courses/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

// Enroll in course
export async function enrollCourse(courseId: number) {
  const response = await httpClient.post(`courses/${courseId}/enroll`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

// Get my enrolled courses
export async function getMyCourses(params?: { page?: number; limit?: number }) {
  const queryString = params ? `?${new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString()}` : '';
  
  const response = await httpClient.get(`courses/my-courses${queryString}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}
```

---

### Complete Component Example

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/useToast';
import { getCourses } from '@/services/courses';

interface Course {
  id: number;
  title: string;
  instructor: string;
  price: number;
  thumbnail: string;
}

export default function CoursesPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  useEffect(() => {
    loadCourses();
  }, [page]);
  
  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses({ page, limit: 12 });
      
      setCourses(data.data || []);
      setTotal(data.pagination?.total || 0);
      
    } catch (error: any) {
      toast.error(error.message || t('errors.UNKNOWN_ERROR'));
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div>{t('common.loading')}</div>;
  }
  
  return (
    <div>
      <h1>{t('course.allCourses')}</h1>
      
      <div className="grid grid-cols-3 gap-4">
        {courses.map((course) => (
          <div key={course.id} className="border p-4 rounded">
            <img src={course.thumbnail} alt={course.title} />
            <h3>{course.title}</h3>
            <p>{t('course.instructor')}: {course.instructor}</p>
            <p>{t('course.price')}: {course.price} VNĐ</p>
            <button className="btn">
              {t('course.enroll')}
            </button>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      <div className="flex gap-2 mt-4">
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          {t('pagination.previous')}
        </button>
        <span>{t('pagination.page')} {page}</span>
        <button 
          onClick={() => setPage(p => p + 1)}
          disabled={courses.length === 0}
        >
          {t('pagination.next')}
        </button>
      </div>
    </div>
  );
}
```

---

## 🎨 RESPONSE TYPES

### Success Response
```typescript
interface ApiSuccessResponse<T> {
  success: true;
  message: string;          // "Thành công" or "Success"
  data: T;
}
```

### Error Response
```typescript
interface ApiErrorResponse {
  success: false;
  messageCode: string;      // e.g., "USER_NOT_FOUND"
  message: string;          // Translated message
  errorCode?: string;
}
```

### Paginated Response
```typescript
interface ApiPaginatedResponse<T> {
  success: true;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

### Validation Error Response
```typescript
interface ApiValidationErrorResponse {
  success: false;
  messageCode: 'VALIDATION_ERROR';
  message: string;
  errors: Array<{
    field: string;
    messages: string[];
  }>;
}
```

---

## 📋 MIGRATION CHECKLIST

### For Each Service File

1. ✅ Import new HTTP client
```tsx
import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';
```

2. ✅ Update API calls
```tsx
// OLD
const res = await http.get('courses');
if (!res.ok) throw new Error('Failed');
return res.data;

// NEW
const response = await httpClient.get('courses');
if (!isSuccess(response)) {
  throw new Error(handleApiError(response));
}
return extractData(response);
```

3. ✅ Handle errors properly
```tsx
try {
  const data = await getCourses();
  return data;
} catch (error: any) {
  toast.error(error.message);
}
```

### For Each Component

1. ✅ Add translation hook
```tsx
import { useTranslation } from '@/contexts/LanguageContext';
const { t, tError } = useTranslation();
```

2. ✅ Replace hardcoded strings
```tsx
// OLD
<button>Enroll</button>

// NEW
<button>{t('course.enroll')}</button>
```

3. ✅ Add toast for errors
```tsx
import { useToast } from '@/hooks/useToast';
const toast = useToast();

// On error
toast.error(error.message);

// On success
toast.success(t('success.CREATED_SUCCESS'));
```

---

## 🎯 MESSAGE CODES

All message codes from backend are available in `src/types/api.ts`:

```typescript
// Auth
INVALID_CREDENTIALS
TOKEN_EXPIRED
EMAIL_ALREADY_EXISTS

// User
USER_NOT_FOUND
USER_INACTIVE

// Course
COURSE_NOT_FOUND
ALREADY_ENROLLED

// Book
BOOK_NOT_FOUND
INVALID_ACTIVATION_CODE

// Cart & Order
CART_ITEM_EXISTS
ORDER_CANNOT_CANCEL

// Generic
VALIDATION_ERROR
NOT_FOUND
UNAUTHORIZED
FORBIDDEN
INTERNAL_ERROR
```

---

## 🌍 ADDING NEW TRANSLATIONS

### Step 1: Add to Vietnamese (src/locales/vi.ts)
```typescript
export const vi = {
  // ...existing
  myNewSection: {
    title: 'Tiêu đề mới',
    description: 'Mô tả mới',
  },
};
```

### Step 2: Add to English (src/locales/en.ts)
```typescript
export const en: TranslationKeys = {
  // ...existing
  myNewSection: {
    title: 'New Title',
    description: 'New Description',
  },
};
```

### Step 3: Use in Component
```tsx
t('myNewSection.title')
```

---

## ✅ STATUS

### Completed
- ✅ Multi-language system
- ✅ HTTP client with Accept-Language
- ✅ Error handling
- ✅ Toast system
- ✅ Language switcher
- ✅ Type definitions
- ✅ Example service (auth.new.ts)
- ✅ Root layout integration

### To Do
- ⏳ Update remaining service files
- ⏳ Add language switcher to Header
- ⏳ Update all components with translations
- ⏳ Test all features

---

## 🚀 NEXT STEPS

1. **Update Services**: Update all service files in `src/services/` to use new HTTP client
2. **Update Components**: Replace hardcoded strings with `t()` function
3. **Add Language Switcher**: Add to Header/Nav component
4. **Test**: Test all features with both languages

---

## 📚 REFERENCES

- **Backend Guide**: `khoitriso-be/RESPONSE_FORMAT.md`
- **Backend Status**: `khoitriso-be/FINAL_STATUS.md`
- **Types**: `src/types/api.ts`
- **Translations**: `src/locales/vi.ts`, `src/locales/en.ts`

---

**Status**: ✅ **Frontend Integration 80% Complete**  
**Date**: 2025-10-18  
**Remaining**: Update all services and components

