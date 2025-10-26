# Multi-Language Response System - Usage Guide

## Tổng quan

Hệ thống đa ngôn ngữ cho Laravel backend tương tự NestJS, hỗ trợ:
- Response format chuẩn cho tất cả API
- Message codes để quản lý messages
- Đa ngôn ngữ (vi, en)
- Không throw exception mà trả về response với status code

## Cấu trúc

```
khoitriso-be/
├── app/
│   ├── Constants/
│   │   └── MessageCode.php          # Định nghĩa message codes
│   ├── Services/
│   │   └── MessageService.php       # Service xử lý messages
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── BaseController.php   # Base controller với helper methods
│   │   │   └── ExampleController.php # Ví dụ sử dụng
│   │   ├── Responses/
│   │   │   └── ResponseBuilder.php  # Builder tạo response
│   │   └── Middleware/
│   │       └── LocalizationMiddleware.php # Middleware set locale
├── config/
│   └── messages.php                 # Message templates (vi, en)
└── bootstrap/
    └── app.php                      # Exception handler
```

## 1. Cách sử dụng trong Controller

### Bước 1: Extend BaseController

```php
<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use Illuminate\Http\Request;

class UserController extends BaseController
{
    // Your methods here
}
```

### Bước 2: Sử dụng helper methods

#### Success Response

```php
public function index(Request $request)
{
    $users = User::all();
    
    // Trả về success response
    return $this->success(
        $users,                              // Data
        MessageCode::USER_LIST_SUCCESS       // Message code
    );
}
```

Response:
```json
{
    "success": true,
    "messageCode": "USER_LIST_SUCCESS",
    "message": "Lấy danh sách người dùng thành công", // hoặc "User list retrieved successfully"
    "data": [...]
}
```

#### Paginated Response

```php
public function index(Request $request)
{
    $page = $request->input('page', 1);
    $limit = $request->input('limit', 10);
    
    $query = User::query();
    $total = $query->count();
    $users = $query->skip(($page - 1) * $limit)->take($limit)->get();
    
    return $this->paginated(
        $users->toArray(),
        $page,
        $limit,
        $total,
        MessageCode::USER_LIST_SUCCESS
    );
}
```

Response:
```json
{
    "success": true,
    "messageCode": "USER_LIST_SUCCESS",
    "message": "Lấy danh sách người dùng thành công",
    "data": [...],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 100,
        "totalPages": 10,
        "hasNextPage": true,
        "hasPreviousPage": false
    }
}
```

#### Error Response

```php
public function show(Request $request, $id)
{
    $user = User::find($id);
    
    if (!$user) {
        // Trả về error response thay vì throw exception
        return $this->error(
            MessageCode::USER_NOT_FOUND,
            null,    // Custom message (optional)
            null,    // Error code (optional)
            404      // HTTP status code
        );
    }
    
    return $this->success($user, MessageCode::USER_DETAIL_SUCCESS);
}
```

Response (Error):
```json
{
    "success": false,
    "messageCode": "USER_NOT_FOUND",
    "message": "Không tìm thấy người dùng"
}
```

#### Validation Error

```php
public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
    ]);
    
    if ($validator->fails()) {
        $errors = [];
        foreach ($validator->errors()->toArray() as $field => $messages) {
            $errors[] = [
                'field' => $field,
                'messages' => $messages,
            ];
        }
        
        return $this->validationError($errors);
    }
    
    // Create user...
    return $this->success($user, MessageCode::USER_CREATED_SUCCESS);
}
```

Response (Validation Error):
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

#### Not Found Error

```php
public function show($id)
{
    $user = User::find($id);
    
    if (!$user) {
        return $this->notFound('User');
    }
    
    return $this->success($user, MessageCode::USER_DETAIL_SUCCESS);
}
```

#### Unauthorized & Forbidden

```php
public function update(Request $request, $id)
{
    $user = User::find($id);
    
    if (!$user) {
        return $this->notFound('User');
    }
    
    // Check authentication
    if (!auth()->check()) {
        return $this->unauthorized();
    }
    
    // Check authorization
    if (auth()->id() !== $user->id) {
        return $this->forbidden();
    }
    
    // Update user...
    return $this->success($user, MessageCode::USER_UPDATED_SUCCESS);
}
```

### Bước 3: Try-Catch pattern (không throw exception)

```php
public function store(Request $request)
{
    try {
        // Validate
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
        ]);
        
        if ($validator->fails()) {
            $errors = [];
            foreach ($validator->errors()->toArray() as $field => $messages) {
                $errors[] = [
                    'field' => $field,
                    'messages' => $messages,
                ];
            }
            return $this->validationError($errors);
        }
        
        // Business logic
        $user = User::create($request->all());
        
        if (!$user) {
            return $this->error(
                MessageCode::INTERNAL_SERVER_ERROR,
                null,
                null,
                500
            );
        }
        
        return $this->success($user, MessageCode::USER_CREATED_SUCCESS);
        
    } catch (\Exception $e) {
        \Log::error('Error creating user: ' . $e->getMessage());
        return $this->internalError();
    }
}
```

## 2. Custom Messages với Parameters

### Thêm message template với params

Trong `config/messages.php`:

```php
'vi' => [
    'USER_WELCOME' => 'Xin chào {name}, chào mừng bạn đến với {appName}!',
],
'en' => [
    'USER_WELCOME' => 'Hello {name}, welcome to {appName}!',
],
```

### Sử dụng trong controller

```php
public function welcome(Request $request)
{
    $message = $this->getMessage('USER_WELCOME', [
        'name' => $request->user()->name,
        'appName' => 'KhoiTriSo',
    ]);
    
    return $this->success(
        ['user' => $request->user()],
        'USER_WELCOME',
        $message
    );
}
```

## 3. Thêm Message Code mới

### Bước 1: Thêm constant trong `MessageCode.php`

```php
const SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED';
```

### Bước 2: Thêm messages trong `config/messages.php`

```php
'vi' => [
    MessageCode::SUBSCRIPTION_EXPIRED => 'Gói đăng ký đã hết hạn',
],
'en' => [
    MessageCode::SUBSCRIPTION_EXPIRED => 'Subscription has expired',
],
```

### Bước 3: Sử dụng trong controller

```php
if ($user->subscription->isExpired()) {
    return $this->error(
        MessageCode::SUBSCRIPTION_EXPIRED,
        null,
        null,
        403
    );
}
```

## 4. Language Detection

Hệ thống tự động detect language từ header `Accept-Language`:

### Request với tiếng Việt
```
GET /api/users
Accept-Language: vi-VN,vi;q=0.9,en;q=0.8
```

Response:
```json
{
    "success": true,
    "messageCode": "USER_LIST_SUCCESS",
    "message": "Lấy danh sách người dùng thành công",
    "data": [...]
}
```

### Request với tiếng Anh
```
GET /api/users
Accept-Language: en-US,en;q=0.9
```

Response:
```json
{
    "success": true,
    "messageCode": "USER_LIST_SUCCESS",
    "message": "User list retrieved successfully",
    "data": [...]
}
```

## 5. Middleware (Optional)

Để sử dụng LocalizationMiddleware, đăng ký trong `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->api(append: [
        \App\Http\Middleware\LocalizationMiddleware::class,
    ]);
})
```

## 6. Exception Handling

Tất cả exceptions được tự động catch và trả về response format chuẩn:

- `ValidationException` → Validation Error Response (422)
- `AuthenticationException` → Unauthorized Response (401)
- `AuthorizationException` → Forbidden Response (403)
- `ModelNotFoundException` → Not Found Response (404)
- `QueryException` → Database Error Response (500)
- Other exceptions → Internal Server Error Response (500)

## 7. Best Practices

### ✅ DO

```php
// Trả về error response thay vì throw exception
if (!$user) {
    return $this->error(MessageCode::USER_NOT_FOUND, null, null, 404);
}

// Sử dụng message codes có sẵn
return $this->success($data, MessageCode::SUCCESS);

// Try-catch và trả về response
try {
    // Logic
} catch (\Exception $e) {
    \Log::error($e->getMessage());
    return $this->internalError();
}
```

### ❌ DON'T

```php
// Đừng throw exception trong controller
if (!$user) {
    throw new \Exception('User not found'); // ❌
}

// Đừng trả về response không có format chuẩn
return response()->json(['data' => $user]); // ❌

// Đừng hardcode messages
return response()->json([
    'message' => 'Thành công'  // ❌
]);
```

## 8. Response Format Summary

### Success Response
```json
{
    "success": true,
    "messageCode": "SUCCESS",
    "message": "Thành công",
    "data": {...}
}
```

### Paginated Response
```json
{
    "success": true,
    "messageCode": "SUCCESS",
    "message": "Thành công",
    "data": [...],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 100,
        "totalPages": 10,
        "hasNextPage": true,
        "hasPreviousPage": false
    }
}
```

### Error Response
```json
{
    "success": false,
    "messageCode": "NOT_FOUND",
    "message": "Không tìm thấy"
}
```

### Validation Error Response
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

## 9. Testing

```bash
# Test với tiếng Việt
curl -H "Accept-Language: vi" http://localhost:8000/api/users

# Test với tiếng Anh
curl -H "Accept-Language: en" http://localhost:8000/api/users

# Test error
curl -H "Accept-Language: vi" http://localhost:8000/api/users/999999
```

## 10. Supported Languages

Hiện tại hỗ trợ:
- `vi` - Tiếng Việt (mặc định)
- `en` - English

Để thêm ngôn ngữ mới, cập nhật `config/messages.php`:

```php
'supported' => ['vi', 'en', 'ja'], // Thêm 'ja' cho tiếng Nhật

'ja' => [
    MessageCode::SUCCESS => '成功',
    // Add other messages...
],
```

