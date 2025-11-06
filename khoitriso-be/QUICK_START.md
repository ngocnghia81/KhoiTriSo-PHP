# Quick Start - Multi-Language Response System

## 🚀 Setup (Đã hoàn tất)

Hệ thống đã được setup sẵn với:
- ✅ Message codes trong `app/Constants/MessageCode.php`
- ✅ Message templates (vi/en) trong `config/messages.php`
- ✅ MessageService để xử lý messages
- ✅ ResponseBuilder để tạo response chuẩn
- ✅ BaseController với helper methods
- ✅ Exception handler tự động catch exceptions
- ✅ LocalizationMiddleware (optional)

## 📝 Cách sử dụng nhanh

### 1. Tạo Controller mới

```php
<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class YourController extends BaseController  // Extend BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            // Your logic here
            $data = [/* your data */];
            
            // Return success response
            return $this->success($data, MessageCode::SUCCESS);
            
        } catch (\Exception $e) {
            \Log::error('Error: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
```

### 2. Response Examples

#### Success
```php
// Success với message mặc định ("Thành công" hoặc "Success")
return $this->success($data);

// Hoặc với custom message
return $this->success($data, 'Custom message');
```

#### Paginated
```php
// Paginated với message mặc định
return $this->paginated($items, $page, $limit, $total);

// Hoặc với custom message
return $this->paginated($items, $page, $limit, $total, 'Custom message');
```

#### Error
```php
return $this->error(MessageCode::NOT_FOUND, null, null, 404);
```

#### Validation Error
```php
if ($validator->fails()) {
    $errors = [];
    foreach ($validator->errors()->toArray() as $field => $messages) {
        $errors[] = ['field' => $field, 'messages' => $messages];
    }
    return $this->validationError($errors);
}
```

#### Not Found
```php
if (!$user) {
    return $this->notFound('User');
}
```

#### Unauthorized / Forbidden
```php
if (!auth()->check()) {
    return $this->unauthorized();
}

if (!$user->can('update', $resource)) {
    return $this->forbidden();
}
```

### 3. Test với curl

```bash
# Tiếng Việt (mặc định)
curl -H "Accept-Language: vi" http://localhost:8000/api/users

# Tiếng Anh
curl -H "Accept-Language: en" http://localhost:8000/api/users

# Test error
curl -H "Accept-Language: vi" http://localhost:8000/api/users/999999
```

### 4. Response Format

#### Success Response
```json
{
    "success": true,
    "message": "Thành công",
    "data": [...]
}
```

**Note:** Success response chỉ trả message đơn giản, KHÔNG có messageCode

#### Error Response
```json
{
    "success": false,
    "messageCode": "USER_NOT_FOUND",
    "message": "Không tìm thấy người dùng"
}
```

**Note:** Error response mới có messageCode để biết lỗi cụ thể

#### Validation Error Response
```json
{
    "success": false,
    "messageCode": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "errors": [
        {
            "field": "email",
            "messages": ["Email không hợp lệ"]
        }
    ]
}
```

## 🎯 Best Practices

### ✅ DO
```php
// Success response đơn giản
if ($user) {
    return $this->success($user);
}

// Error response với message code cụ thể
if (!$user) {
    return $this->error(MessageCode::USER_NOT_FOUND, null, null, 404);
}

// Wrap trong try-catch
try {
    // Logic
    return $this->success($data);
} catch (\Exception $e) {
    \Log::error($e->getMessage());
    return $this->internalError();
}
```

### ❌ DON'T
```php
// Đừng throw exception
if (!$user) {
    throw new \Exception('User not found'); // ❌
}

// Đừng return response không có format chuẩn
return response()->json(['data' => $user]); // ❌
```

## 📚 Xem thêm

- Chi tiết đầy đủ: `MULTI_LANGUAGE_USAGE.md`
- Ví dụ code: `app/Http/Controllers/ExampleController.php`
- Controller đã update: `app/Http/Controllers/UserController.php`

## 🔧 Add Message Code mới

### 1. Thêm constant
`app/Constants/MessageCode.php`:
```php
const YOUR_NEW_MESSAGE = 'YOUR_NEW_MESSAGE';
```

### 2. Thêm messages
`config/messages.php`:
```php
'vi' => [
    MessageCode::YOUR_NEW_MESSAGE => 'Message tiếng Việt',
],
'en' => [
    MessageCode::YOUR_NEW_MESSAGE => 'English message',
],
```

### 3. Sử dụng
```php
return $this->success($data, MessageCode::YOUR_NEW_MESSAGE);
```

## 🌍 Supported Languages

- `vi` - Tiếng Việt (mặc định)
- `en` - English

## ✨ Features

- ✅ Đa ngôn ngữ tự động từ `Accept-Language` header
- ✅ Response format chuẩn cho tất cả API
- ✅ Message codes dễ quản lý
- ✅ Không throw exception, trả về response
- ✅ Tự động catch exceptions
- ✅ Validation errors format chuẩn
- ✅ Pagination support
- ✅ Easy to extend

## 📞 Need Help?

Xem `MULTI_LANGUAGE_USAGE.md` cho hướng dẫn chi tiết!

