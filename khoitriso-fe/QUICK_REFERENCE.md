# ⚡ Quick Reference Card

## 🎯 Common Tasks

### 1. Translation
```tsx
import { useTranslation } from '@/contexts/LanguageContext';

const { t, tError } = useTranslation();

t('common.save')              // "Lưu"
t('course.title')             // "Khóa học"
tError('USER_NOT_FOUND')      // "Không tìm thấy người dùng"
```

### 2. API Call
```tsx
import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

const response = await httpClient.get('courses');
if (!isSuccess(response)) {
  const error = handleApiError(response);
  throw new Error(error);
}
const data = extractData(response);
```

### 3. Toast
```tsx
import { useToast } from '@/hooks/useToast';

const toast = useToast();
toast.success('Success!');
toast.error('Error!');
```

### 4. Language Switcher
```tsx
import { CompactLanguageSwitcher } from '@/components/LanguageSwitcher';

<CompactLanguageSwitcher />
```

---

## 📦 HTTP Methods

```tsx
// GET
httpClient.get('path')

// POST
httpClient.post('path', body)

// PUT
httpClient.put('path', body)

// DELETE
httpClient.delete('path')

// Form Upload
httpClient.postForm('path', formData)
```

---

## 🔍 Response Helpers

```tsx
// Check success
isSuccess(response)

// Extract data
extractData(response)

// Extract error
extractError(response)

// Handle error
handleApiError(response)

// Validation errors
extractValidationErrors(response)
getFieldError(errors, 'email')
```

---

## 📝 Translation Keys

### Common
- `common.save`, `common.cancel`, `common.delete`
- `common.loading`, `common.success`, `common.error`

### Navigation
- `nav.home`, `nav.courses`, `nav.books`
- `nav.cart`, `nav.profile`, `nav.dashboard`

### Auth
- `auth.login`, `auth.register`, `auth.logout`
- `auth.email`, `auth.password`

### Course
- `course.title`, `course.instructor`, `course.enroll`
- `course.price`, `course.rating`

### Errors
- `errors.USER_NOT_FOUND`
- `errors.INVALID_CREDENTIALS`
- `errors.VALIDATION_ERROR`

---

## 🎨 Response Types

```typescript
// Success
{ success: true, message: string, data: T }

// Error
{ success: false, messageCode: string, message: string }

// Paginated
{ success: true, message: string, data: T[], pagination: {...} }

// Validation Error
{ success: false, messageCode: 'VALIDATION_ERROR', errors: [...] }
```

---

## ✅ Complete Example

```tsx
'use client';

import { useState } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/useToast';
import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export default function MyPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get('courses');
      
      if (!isSuccess(response)) {
        toast.error(handleApiError(response));
        return;
      }
      
      setData(extractData(response) || []);
      toast.success(t('success.SUCCESS'));
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h1>{t('course.title')}</h1>
      <button onClick={fetchData}>
        {loading ? t('common.loading') : t('common.load')}
      </button>
    </div>
  );
}
```

---

## 🔗 Links

- **Full Guide**: [FRONTEND_INTEGRATION_GUIDE.md](FRONTEND_INTEGRATION_GUIDE.md)
- **Backend**: `khoitriso-be/RESPONSE_FORMAT.md`
- **Types**: `src/types/api.ts`
- **Translations**: `src/locales/vi.ts`, `src/locales/en.ts`

