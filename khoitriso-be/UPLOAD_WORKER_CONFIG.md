# Upload Worker Configuration Guide

## JWT Keys Configuration

Có 2 loại JWT key cần cấu hình:

### 1. UPLOAD_WORKER_JWT_KEY (JWT_KEY)
- **Mục đích**: Dùng để tạo JWT token cho việc upload file từ frontend
- **Sử dụng**: Frontend upload file → Backend tạo JWT với key này → Worker verify JWT
- **Phải khớp**: Key này trong backend `.env` PHẢI KHỚP với JWT key trong Cloudflare Worker

### 2. UPLOAD_WORKER_BACKEND_JWT_KEY (JWT_BACKEND_KEY)
- **Mục đích**: Dùng để backend quản lý file (delete, confirm, get info, etc.)
- **Sử dụng**: Backend gọi API Worker để quản lý file
- **Phải khớp**: Key này trong backend `.env` PHẢI KHỚP với backend JWT key trong Cloudflare Worker

## Cấu hình trong .env

Thêm vào file `.env` của backend:

```env
# Upload Worker Configuration
UPLOAD_WORKER_BASE_URL=https://khoitriso-upload-worker.quang159258.workers.dev
UPLOAD_WORKER_JWT_KEY=your-jwt-key-for-upload-min-32-chars
UPLOAD_WORKER_BACKEND_JWT_KEY=your-backend-jwt-key-min-32-chars
```

## Kiểm tra cấu hình

Gọi API: `GET /api/test/config` để kiểm tra:
- JWT keys có được set chưa
- JWT key length
- Test JWT generation

## Lưu ý quan trọng

⚠️ **UPLOAD_WORKER_JWT_KEY trong backend PHẢI KHỚP với JWT_KEY trong Cloudflare Worker**

Nếu không khớp, sẽ gặp lỗi:
- `signature verification failed`
- `MISSING_TOKEN`
- `500 Internal Server Error`

## Debug

1. Kiểm tra JWT key trong backend: `GET /api/test/config`
2. Xem log trong `storage/logs/laravel.log` để debug JWT generation
3. Đảm bảo Worker dùng cùng JWT key để verify

