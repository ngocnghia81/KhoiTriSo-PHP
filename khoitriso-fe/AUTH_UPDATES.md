# Authentication Protection Updates

## Tổng quan
Đã cập nhật logic authentication để ngăn người dùng chưa đăng nhập truy cập các tính năng yêu cầu xác thực.

## Các thay đổi

### 1. Utility Functions (`src/utils/authCheck.ts`)
Tạo các helper functions để xử lý authentication nhất quán:

- `isAuthenticated()`: Kiểm tra user có token hợp lệ
- `requireAuth(message?)`: Yêu cầu đăng nhập với custom message
- `handleApiResponse(response)`: Xử lý 401 response tự động
- `clearAuth()`: Xóa dữ liệu auth từ localStorage
- `redirectToLogin(returnUrl?)`: Redirect đến login với return URL
- `handle401()`: Xử lý 401 error (clear auth + redirect)

### 2. Cart Page (`src/app/cart/page.tsx`)
**Trước:**
- Chỉ check token, không redirect khi chưa đăng nhập
- Hiển thị trang trống nếu không có token

**Sau:**
- ✅ Tự động redirect đến `/auth/login` khi chưa đăng nhập
- ✅ Xử lý 401 response → clear auth data → redirect login
- ✅ Hiển thị confirm dialog với message rõ ràng

### 3. Orders Page (`src/app/orders/page.tsx`)
**Trước:**
- Redirect đến `/login` (sai path)
- Không xử lý 401 response

**Sau:**
- ✅ Redirect đến `/auth/login` (đúng path)
- ✅ Sử dụng `requireAuth()` với message custom
- ✅ Xử lý 401 response tự động

### 4. Books Page (`src/app/books/page.tsx`)
**Hàm `addToCart()`:**
**Trước:**
- Hiện alert đơn giản
- Logic xử lý 401 dài dòng, lặp lại

**Sau:**
- ✅ Sử dụng `requireAuth()` với confirm dialog
- ✅ Sử dụng `handleApiResponse()` để xử lý 401
- ✅ Code ngắn gọn, dễ maintain

### 5. Courses Page (`src/app/courses/page.tsx`)
**Hàm `addToCart()`:**
**Trước:**
- Alert không thân thiện
- Manual check token và xử lý 401

**Sau:**
- ✅ Confirm dialog thân thiện hơn
- ✅ Tự động xử lý authentication
- ✅ Clear auth data khi 401

### 6. Course Detail Page (`src/app/courses/[id]/page.tsx`)
**Hàm `addToCart()`:**
**Trước:**
- Redirect đến `/login` (sai)
- Alert không rõ ràng

**Sau:**
- ✅ Sử dụng utility functions
- ✅ Confirm trước khi redirect đến cart
- ✅ Xử lý 401 tự động

## Hành vi mới

### Khi chưa đăng nhập:

1. **Truy cập `/cart`**:
   - Hiện confirm: "Vui lòng đăng nhập để xem giỏ hàng."
   - Nhấn OK → Redirect đến `/auth/login`

2. **Truy cập `/orders`**:
   - Hiện confirm: "Vui lòng đăng nhập để xem đơn hàng."
   - Nhấn OK → Redirect đến `/auth/login`

3. **Click "Thêm vào giỏ" (books/courses)**:
   - Hiện confirm: "Vui lòng đăng nhập để thêm vào giỏ hàng. Chuyển đến trang đăng nhập?"
   - Nhấn OK → Redirect đến `/auth/login`
   - Nhấn Cancel → Không làm gì

### Khi token hết hạn (401):

1. **Auto clear auth data**: Xóa token, user, refreshToken
2. **Redirect đến login**: Với return URL (nếu có)
3. **Hiện message**: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."

## Benefits

✅ **Consistent UX**: Tất cả trang xử lý auth giống nhau
✅ **Better UX**: Confirm dialog thay vì alert đơn thuần
✅ **Clean Code**: Tái sử dụng utility functions, giảm code lặp
✅ **Maintainable**: Dễ cập nhật logic auth ở 1 nơi
✅ **Secure**: Tự động clear auth data khi 401
✅ **No 401 Errors**: Không còn lỗi 401 trong console

## Testing Checklist

- [ ] Vào `/cart` khi chưa đăng nhập → redirect login
- [ ] Vào `/orders` khi chưa đăng nhập → redirect login
- [ ] Click "Thêm vào giỏ" khi chưa đăng nhập → confirm + redirect
- [ ] API trả về 401 → clear auth + redirect
- [ ] Đăng nhập → có thể thêm vào giỏ hàng bình thường
- [ ] Token hết hạn → tự động logout + redirect

## Notes

- Đã sửa path từ `/login` → `/auth/login` (đúng với routing structure)
- Sử dụng `confirm()` thay vì `alert()` để UX tốt hơn
- Tất cả API calls đều xử lý 401 nhất quán
- Không còn hiện lỗi 401 trong console nữa
