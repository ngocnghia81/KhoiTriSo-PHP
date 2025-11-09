# Hướng dẫn sử dụng Trang Phê duyệt

## Đã hoàn thành ✅

### Backend
- ✅ API endpoints cho approve/reject/publish/unpublish courses
- ✅ API endpoints cho approve/reject/publish/unpublish books
- ✅ Xử lý boolean đúng cho PostgreSQL (DB::raw('true'/'false'))

### Frontend
- ✅ Trang phê duyệt tại `/dashboard/approvals`
- ✅ Tích hợp API thực tế (không còn mock data)
- ✅ Bộ lọc: Tất cả / Chờ duyệt / Đã duyệt / Từ chối
- ✅ Thống kê số lượng theo trạng thái
- ✅ Các nút hành động: Phê duyệt, Từ chối, Xuất bản, Gỡ xuất bản
- ✅ Modal nhập lý do khi từ chối

## Cách sử dụng

### 1. Chạy Backend
```bash
cd d:\Study\PHP\KhoiTriSo-PHP\KhoiTriSo-PHP\khoitriso-be
php artisan serve
```

### 2. Chạy Frontend
```bash
cd d:\Study\PHP\KhoiTriSo-PHP\KhoiTriSo-PHP\khoitriso-fe
npm run dev
```

### 3. Truy cập trang phê duyệt
Mở trình duyệt và truy cập:
```
http://localhost:3000/dashboard/approvals
```

### 4. Quy trình phê duyệt

#### Với khóa học chờ duyệt (approval_status = 0):
1. **Phê duyệt**: Click nút "Phê duyệt" màu xanh
   - Khóa học chuyển sang trạng thái "Đã duyệt" (approval_status = 1)
   - Sau khi phê duyệt, có thể xuất bản

2. **Từ chối**: Click nút "Từ chối" màu đỏ
   - Hiện modal nhập lý do từ chối
   - Khóa học chuyển sang trạng thái "Từ chối" (approval_status = 2)

#### Với khóa học đã duyệt (approval_status = 1):
1. **Xuất bản**: Click nút "Xuất bản" màu xanh dương
   - Khóa học được đặt `is_published = true`
   - Hiển thị trên trang công khai

2. **Gỡ xuất bản**: Nếu đã xuất bản, click "Gỡ xuất bản" màu cam
   - Khóa học được đặt `is_published = false`
   - Ẩn khỏi trang công khai

### 5. Bộ lọc
- **Tất cả**: Hiển thị tất cả khóa học
- **Chờ duyệt**: Chỉ hiển thị khóa học chờ phê duyệt (cần xử lý)
- **Đã duyệt**: Khóa học đã được phê duyệt (có thể xuất bản)
- **Từ chối**: Khóa học bị từ chối

## Ghi chú quan trọng

### Business Rules
- ⚠️ **Chỉ có thể xuất bản khóa học đã được phê duyệt** (approval_status = 1)
- ⚠️ Nếu cố xuất bản khóa học chưa phê duyệt, sẽ báo lỗi: "Khóa học phải được phê duyệt trước khi xuất bản"

### Database Status
- **approval_status**:
  - `0` = Chờ duyệt (Pending)
  - `1` = Đã duyệt (Approved)
  - `2` = Từ chối (Rejected)
- **is_published**:
  - `true` = Đã xuất bản (hiển thị công khai)
  - `false` = Chưa xuất bản (ẩn)

## Kiểm tra dữ liệu trong Database

Chạy script sau để xem trạng thái khóa học:
```bash
cd d:\Study\PHP\KhoiTriSo-PHP\KhoiTriSo-PHP\khoitriso-be
php test_admin_approval.php
```

Hoặc dùng artisan tinker:
```bash
php artisan tinker
```
Sau đó gõ:
```php
Course::select('id', 'title', 'approval_status', 'is_published')->get();
```

## Mở rộng (Tương lai)

Hiện tại trang chỉ hỗ trợ **Courses**. Để thêm **Books**:

1. Backend đã có sẵn API endpoints:
   - `PUT /api/admin/books/{id}/approve`
   - `PUT /api/admin/books/{id}/reject`
   - `PUT /api/admin/books/{id}/publish`
   - `PUT /api/admin/books/{id}/unpublish`

2. Frontend đã có service functions trong `src/services/admin.ts`:
   - `approveBook()`
   - `rejectBook()`
   - `publishBook()`
   - `unpublishBook()`

3. Cần thêm:
   - API list books với filter approval_status
   - UI section hiển thị danh sách sách trong `/dashboard/approvals`
