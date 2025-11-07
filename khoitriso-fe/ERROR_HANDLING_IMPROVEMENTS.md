# Error Handling Improvements - Authentication

## Vấn đề
- Khi đăng ký, nếu có lỗi validation (422) từ backend, frontend chỉ hiện "Request failed with status code 422"
- Người dùng không hiểu lỗi gì và phải làm gì
- Mật khẩu frontend yêu cầu 6 ký tự nhưng backend yêu cầu 8 ký tự → lỗi validation

## Giải pháp đã thực hiện

### 1. AuthService - Parse Validation Errors (`src/services/authService.ts`)

**Thêm function `parseApiError()`:**
```typescript
const parseApiError = (error: any): { message: string; errors?: Record<string, string[]> } => {
  if (error.response) {
    const { data, status } = error.response;
    
    // Handle 422 Validation Error
    if (status === 422 && data.errors) {
      const errorMessages: Record<string, string[]> = {};
      
      // Backend format: { code: 422, message: "...", errors: [{field, messages}] }
      if (Array.isArray(data.errors)) {
        data.errors.forEach((err: any) => {
          if (err.field && err.messages) {
            errorMessages[err.field] = err.messages;
          }
        });
      }
      
      // Get first error message
      const firstError = data.errors[0];
      const message = firstError?.messages?.[0] || data.message || 'Dữ liệu không hợp lệ';
      
      return { message, errors: errorMessages };
    }
    
    return { 
      message: data.message || `Lỗi ${status}. Vui lòng thử lại.` 
    };
  }
  
  return { 
    message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.' 
  };
};
```

**Cập nhật `register()` và `login()`:**
- Bắt lỗi và parse validation errors từ backend
- Attach `validationErrors` vào Error object
- Throw error với message rõ ràng

### 2. Register Page - Better Error Display

**Sửa validation password:**
```typescript
// Trước: 6 ký tự
else if (formData.password.length < 6) {
  newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
}

// Sau: 8 ký tự (khớp với backend)
else if (formData.password.length < 8) {
  newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
}
```

**Cải thiện error handling:**
```typescript
catch (error: any) {
  // Check if error has validation errors from backend
  if (error.validationErrors) {
    const newErrors: {[key: string]: string} = {};
    
    // Map field names to Vietnamese
    const fieldMessages: {[key: string]: string} = {
      'username': 'Tên đăng nhập',
      'email': 'Email',
      'password': 'Mật khẩu',
    };
    
    Object.entries(error.validationErrors).forEach(([field, messages]) => {
      let message = messages[0];
      
      // Translate common messages
      if (message.includes('has already been taken')) {
        message = `${fieldMessages[field]} đã được sử dụng`;
      } else if (message.includes('must be at least')) {
        message = message.replace('must be at least', 'phải có ít nhất');
        message = message.replace('characters', 'ký tự');
      }
      
      newErrors[field] = message;
    });
    
    setErrors(newErrors);
  }
}
```

**Cải thiện UI hiển thị lỗi:**
```tsx
{(errors.general || apiError) && (
  <div className="rounded-xl bg-red-50 border border-red-200 p-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400">...</svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">
          Có lỗi xảy ra
        </h3>
        <div className="mt-2 text-sm text-red-700">
          {errors.general || apiError}
        </div>
      </div>
    </div>
  </div>
)}
```

### 3. Login Page - Tương tự Register

- Parse validation errors từ backend
- Hiển thị lỗi bằng tiếng Việt
- Clear errors khi user typing

## Kết quả

### Trước:
❌ **Lỗi 422:** "Request failed with status code 422"
❌ **Không rõ ràng:** User không biết sai ở đâu
❌ **Không nhất quán:** Frontend 6 ký tự, backend 8 ký tự

### Sau:
✅ **Lỗi rõ ràng:** "Email đã được sử dụng"
✅ **Tiếng Việt:** "Mật khẩu phải có ít nhất 8 ký tự"
✅ **Chi tiết:** Hiển thị lỗi cho từng field
✅ **Nhất quán:** Frontend và backend cùng validate 8 ký tự
✅ **UX tốt:** Icon + màu đỏ + border để dễ nhận biết

## Các lỗi thường gặp và message

| Backend Error | Frontend Display |
|--------------|------------------|
| `username has already been taken` | "Tên đăng nhập đã được sử dụng" |
| `email has already been taken` | "Email đã được sử dụng" |
| `password must be at least 8 characters` | "Mật khẩu phải có ít nhất 8 ký tự" |
| `email is required` | "Email là bắt buộc" |
| `must be a valid email` | "Email không hợp lệ" |
| Network error | "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng." |
| 500 error | "Lỗi 500. Vui lòng thử lại." |

## Testing

Các trường hợp cần test:

1. ✅ Đăng ký với email đã tồn tại → "Email đã được sử dụng"
2. ✅ Đăng ký với username đã tồn tại → "Tên đăng nhập đã được sử dụng"  
3. ✅ Đăng ký với password < 8 ký tự → "Mật khẩu phải có ít nhất 8 ký tự"
4. ✅ Đăng ký với email không hợp lệ → "Email không hợp lệ"
5. ✅ Login với sai email/password → "Email hoặc mật khẩu không đúng"
6. ✅ Network error → "Không thể kết nối đến server"
7. ✅ Clear error khi user typing trong field
8. ✅ Hiển thị lỗi cho đúng field (email error hiện ở email input)

## Notes

- Tất cả validation messages đã được dịch sang tiếng Việt
- Error display sử dụng Heroicons và Tailwind CSS
- Parse logic có thể mở rộng thêm các error messages khác
- Frontend validation giờ khớp với backend validation rules
