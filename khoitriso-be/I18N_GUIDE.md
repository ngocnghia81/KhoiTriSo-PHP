# 🌍 Internationalization (i18n) Setup Guide

## 📋 Overview

This guide explains how to use the internationalization (i18n) system in the Khởi Trí Số API.

## 🚀 Supported Languages

- **Vietnamese (vi)** - Tiếng Việt 🇻🇳
- **English (en)** - English 🇬🇧

## 🔧 Configuration

### Backend Configuration

The i18n system is configured in:
- **Middleware**: `app/Http/Middleware/SetLocale.php`
- **Translations**: `lang/vi/messages.php` and `lang/en/messages.php`
- **Controller**: `app/Http/Controllers/LanguageController.php`

### Environment Variables

```env
APP_LOCALE=vi
APP_FALLBACK_LOCALE=en
```

## 📡 API Endpoints

### Get Current Language

```http
GET /api/language
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current": "vi",
    "default": "vi",
    "fallback": "en",
    "supported": [
      {
        "code": "vi",
        "name": "Tiếng Việt",
        "name_en": "Vietnamese",
        "flag": "🇻🇳",
        "direction": "ltr"
      },
      {
        "code": "en",
        "name": "English",
        "name_en": "English",
        "flag": "🇬🇧",
        "direction": "ltr"
      }
    ]
  }
}
```

### Get Supported Languages

```http
GET /api/language/supported
```

### Set Language

```http
POST /api/language/set
Content-Type: application/json

{
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Success!",
  "data": {
    "language": "en"
  }
}
```

### Get Translations

```http
GET /api/language/translations?namespace=messages
```

**Response:**
```json
{
  "success": true,
  "data": {
    "locale": "vi",
    "translations": {
      "auth": {
        "failed": "Thông tin đăng nhập không chính xác.",
        "login_success": "Đăng nhập thành công!",
        ...
      },
      "course": {
        "created": "Khóa học được tạo thành công!",
        ...
      },
      ...
    }
  }
}
```

### Get All Translations

```http
GET /api/language/translations/all?namespace=messages
```

**Response:**
```json
{
  "success": true,
  "data": {
    "translations": {
      "vi": { ... },
      "en": { ... }
    },
    "supported_languages": ["vi", "en"]
  }
}
```

## 🎯 Using i18n in API

### 1. Set Language via Header

```http
GET /api/courses
Accept-Language: vi
```

or

```http
GET /api/courses
Accept-Language: en
```

### 2. Set Language via Query Parameter

```http
GET /api/courses?lang=vi
```

### 3. Set Language via Cookie

After calling `POST /api/language/set`, a cookie named `locale` will be set and used for subsequent requests.

### Priority Order

1. **Accept-Language** header
2. **lang** query parameter
3. **locale** cookie
4. Default locale from config

## 💻 Using Translations in Controllers

### Basic Usage

```php
// Simple message
return response()->json([
    'message' => __('messages.success')
]);

// With parameters
return response()->json([
    'message' => __('messages.auth.throttle', ['seconds' => 60])
]);
```

### Nested Translations

```php
// Course messages
__('messages.course.created') // "Khóa học được tạo thành công!" (vi)
__('messages.course.not_found') // "Course not found." (en)

// Forum messages
__('messages.forum.question_created')
__('messages.forum.answer_accepted')
__('messages.forum.vote_added')
```

### Example in Controller

```php
public function createQuestion(Request $request)
{
    try {
        // Create question...
        
        return response()->json([
            'success' => true,
            'message' => __('messages.forum.question_created'),
            'data' => $question
        ], 201);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => __('messages.error'),
            'error' => $e->getMessage()
        ], 500);
    }
}
```

## 📝 Adding New Translations

### 1. Add to Vietnamese (lang/vi/messages.php)

```php
return [
    'book' => [
        'purchased' => 'Đã mua sách thành công!',
        'reading' => 'Đang đọc sách...',
    ],
];
```

### 2. Add to English (lang/en/messages.php)

```php
return [
    'book' => [
        'purchased' => 'Book purchased successfully!',
        'reading' => 'Reading book...',
    ],
];
```

### 3. Use in Controller

```php
return response()->json([
    'message' => __('messages.book.purchased')
]);
```

## 🌐 Translation Categories

### Authentication (`auth`)
- Login, logout, register
- Password reset
- Email verification
- Token management

### Validation (`validation`)
- Field validation errors
- Format validation
- Required fields
- Unique constraints

### Courses (`course`)
- CRUD operations
- Enrollment
- Progress tracking

### Lessons (`lesson`)
- CRUD operations
- Completion status

### Books (`book`)
- CRUD operations
- Activation codes
- Reading progress

### Forum (`forum`)
- Questions, answers, comments
- Votes and bookmarks
- Categories and tags
- Moderation actions

### Orders (`order`)
- Order management
- Payment status
- Cancellation

### Coupons (`coupon`)
- Validation
- Usage limits
- Expiration

### Cart & Wishlist
- Add, remove, clear
- Item management

### Assignments
- CRUD operations
- Submission
- Grading

### Reviews
- CRUD operations
- Ratings

### Certificates
- Generation
- Verification
- Download

### Upload
- File uploads
- Validation
- Size limits

### General
- Success messages
- Error messages
- CRUD operations

## 🧪 Testing i18n

### Test with cURL

```bash
# Vietnamese
curl -H "Accept-Language: vi" http://localhost:8000/api/courses

# English
curl -H "Accept-Language: en" http://localhost:8000/api/courses

# Set language
curl -X POST http://localhost:8000/api/language/set \
  -H "Content-Type: application/json" \
  -d '{"language":"en"}'
```

### Test with Postman

1. Create a new request
2. Add header: `Accept-Language: vi` or `Accept-Language: en`
3. Send request
4. Check response messages

## 🎨 Frontend Integration

### Fetch Translations

```javascript
// Get current language
const response = await fetch('/api/language');
const { data } = await response.json();
console.log(data.current); // 'vi' or 'en'

// Get all translations
const response = await fetch('/api/language/translations/all');
const { data } = await response.json();
const translations = data.translations;

// Use in frontend
const t = translations[currentLang];
console.log(t.auth.login_success);
```

### Set Language

```javascript
// Set language
await fetch('/api/language/set', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ language: 'en' })
});

// Cookie will be set automatically
// Subsequent requests will use the selected language
```

### Language Switcher Component

```javascript
const LanguageSwitcher = () => {
  const [currentLang, setCurrentLang] = useState('vi');

  const changeLanguage = async (lang) => {
    await fetch('/api/language/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang })
    });
    setCurrentLang(lang);
    window.location.reload(); // Reload to apply translations
  };

  return (
    <div>
      <button onClick={() => changeLanguage('vi')}>🇻🇳 VI</button>
      <button onClick={() => changeLanguage('en')}>🇬🇧 EN</button>
    </div>
  );
};
```

## 📊 Best Practices

### 1. Always Use Translation Keys

❌ **Bad:**
```php
return response()->json(['message' => 'Success!']);
```

✅ **Good:**
```php
return response()->json(['message' => __('messages.success')]);
```

### 2. Group Related Translations

```php
// Group by feature
'forum' => [
    'question_created' => '...',
    'question_updated' => '...',
    'question_deleted' => '...',
]
```

### 3. Use Descriptive Keys

❌ **Bad:**
```php
'msg1' => 'Success',
'msg2' => 'Error',
```

✅ **Good:**
```php
'success' => 'Success',
'error' => 'An error occurred',
```

### 4. Keep Translations Consistent

- Use same terminology across all messages
- Maintain consistent tone
- Follow grammar rules

### 5. Provide Context in Keys

```php
'book.activated' => 'Book activated successfully',
'code.activated' => 'Activation code applied',
'user.activated' => 'User account activated',
```

## 🔄 Adding New Languages

### 1. Create Language Files

```bash
mkdir lang/fr
cp lang/en/messages.php lang/fr/messages.php
# Translate content to French
```

### 2. Update Middleware

```php
$supportedLocales = ['vi', 'en', 'fr'];
```

### 3. Update LanguageController

```php
private function getSupportedLanguages()
{
    return [
        // ... existing languages
        [
            'code' => 'fr',
            'name' => 'Français',
            'name_en' => 'French',
            'flag' => '🇫🇷',
            'direction' => 'ltr',
        ],
    ];
}
```

### 4. Update Validation

```php
$request->validate([
    'language' => 'required|in:vi,en,fr'
]);
```

## ✅ Checklist

- [x] Middleware configured
- [x] Translation files created (vi, en)
- [x] Language Controller implemented
- [x] API routes added
- [x] Documentation written
- [ ] Frontend integration
- [ ] Testing completed
- [ ] Additional languages (optional)

## 🎉 Done!

Your API now supports internationalization! 🌍

Users can:
- ✅ Set their preferred language
- ✅ Get error messages in their language
- ✅ Receive success messages in their language
- ✅ Switch languages anytime
- ✅ Get translations for frontend use

Happy translating! 🚀
