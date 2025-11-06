# Response Format - Laravel API

## 📝 Quy tắc đơn giản

### ✅ Thành công → Message đơn giản
Khi API thành công, chỉ trả về message "Thành công" hoặc "Success", KHÔNG có messageCode

### ❌ Thất bại → Message code cụ thể  
Khi API thất bại, trả về messageCode cụ thể để biết lỗi gì

---

## 🎯 Response Format

### 1. Success Response

```json
{
    "success": true,
    "message": "Thành công",
    "data": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
    }
}
```

**Đặc điểm:**
- ✅ `success: true`
- ✅ `message`: "Thành công" (vi) hoặc "Success" (en)
- ✅ `data`: Dữ liệu trả về
- ❌ KHÔNG có `messageCode`

**Code:**
```php
return $this->success($data);
```

---

### 2. Paginated Response

```json
{
    "success": true,
    "message": "Thành công",
    "data": [
        { "id": 1, "name": "Item 1" },
        { "id": 2, "name": "Item 2" }
    ],
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

**Đặc điểm:**
- ✅ `success: true`
- ✅ `message`: "Thành công" (vi) hoặc "Success" (en)
- ✅ `data`: Array dữ liệu
- ✅ `pagination`: Thông tin phân trang
- ❌ KHÔNG có `messageCode`

**Code:**
```php
return $this->paginated($data, $page, $limit, $total);
```

---

### 3. Error Response

```json
{
    "success": false,
    "messageCode": "USER_NOT_FOUND",
    "message": "Không tìm thấy người dùng"
}
```

**Đặc điểm:**
- ❌ `success: false`
- ✅ `messageCode`: Code cụ thể (VD: `USER_NOT_FOUND`, `VALIDATION_ERROR`)
- ✅ `message`: Message chi tiết theo ngôn ngữ
- ❌ KHÔNG có `data`

**Code:**
```php
return $this->error(MessageCode::USER_NOT_FOUND, null, null, 404);
```

---

### 4. Validation Error Response

```json
{
    "success": false,
    "messageCode": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "errors": [
        {
            "field": "email",
            "messages": ["Email không hợp lệ"]
        },
        {
            "field": "password",
            "messages": ["Mật khẩu phải có ít nhất 8 ký tự"]
        }
    ]
}
```

**Đặc điểm:**
- ❌ `success: false`
- ✅ `messageCode`: "VALIDATION_ERROR"
- ✅ `message`: Message tổng quan
- ✅ `errors`: Array chi tiết lỗi từng field

**Code:**
```php
$errors = [];
foreach ($validator->errors()->toArray() as $field => $messages) {
    $errors[] = ['field' => $field, 'messages' => $messages];
}
return $this->validationError($errors);
```

---

### 5. Unauthorized Response

```json
{
    "success": false,
    "messageCode": "UNAUTHORIZED",
    "message": "Không có quyền truy cập"
}
```

**Code:**
```php
return $this->unauthorized();
```

---

### 6. Forbidden Response

```json
{
    "success": false,
    "messageCode": "FORBIDDEN",
    "message": "Bị cấm truy cập"
}
```

**Code:**
```php
return $this->forbidden();
```

---

### 7. Not Found Response

```json
{
    "success": false,
    "messageCode": "NOT_FOUND",
    "message": "User not found"
}
```

**Code:**
```php
return $this->notFound('User');
```

---

## 📊 So sánh

| Loại | success | messageCode | message | data |
|------|---------|-------------|---------|------|
| **Success** | ✅ true | ❌ Không có | ✅ "Thành công" | ✅ Có |
| **Paginated** | ✅ true | ❌ Không có | ✅ "Thành công" | ✅ Có + pagination |
| **Error** | ❌ false | ✅ Có | ✅ Chi tiết | ❌ Không có |
| **Validation** | ❌ false | ✅ "VALIDATION_ERROR" | ✅ Chi tiết | ❌ Không có (có errors) |

---

## 🌍 Multi-Language

Message tự động thay đổi theo header `Accept-Language`:

### Tiếng Việt
```bash
curl -H "Accept-Language: vi" http://localhost:8000/api/users
```

Response:
```json
{
    "success": true,
    "message": "Thành công",
    "data": [...]
}
```

### English
```bash
curl -H "Accept-Language: en" http://localhost:8000/api/users
```

Response:
```json
{
    "success": true,
    "message": "Success",
    "data": [...]
}
```

---

## 💡 Tại sao?

### Success → Không cần messageCode
- Thành công thì chỉ cần biết "OK, done!"
- Frontend chỉ cần check `success: true` và lấy `data`
- Đơn giản, clean, dễ đọc

### Error → Cần messageCode
- Error cần biết chính xác lỗi gì
- Frontend có thể xử lý từng loại lỗi khác nhau
- VD: `USER_NOT_FOUND` → show "User không tồn tại"
- VD: `UNAUTHORIZED` → redirect to login
- VD: `VALIDATION_ERROR` → highlight input fields

---

## 🔧 Usage trong Controller

```php
class UserController extends BaseController
{
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::find($id);
            
            // Error: Trả về message code cụ thể
            if (!$user) {
                return $this->notFound('User');
            }
            
            // Success: Chỉ trả message đơn giản
            return $this->success($user);
            
        } catch (\Exception $e) {
            \Log::error('Error: ' . $e->getMessage());
            
            // Error: Trả về message code cụ thể
            return $this->internalError();
        }
    }
}
```

---

## ✨ Summary

**Nhớ:**
1. ✅ **Success** = Message đơn giản, KHÔNG có messageCode
2. ❌ **Error** = Message code cụ thể + Message chi tiết
3. 🌍 Multi-language tự động từ `Accept-Language` header
4. 🎯 Format nhất quán cho tất cả API

**Happy Coding! 🚀**

