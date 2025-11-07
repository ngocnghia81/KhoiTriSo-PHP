# Cấu hình Email cho Gmail

Để gửi email tự động khi tạo tài khoản giảng viên, bạn cần cấu hình mail trong file `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=ngocnghia1999nn@gmail.com
MAIL_PASSWORD=pfrd wlyq ccjl uoiq
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=ngocnghia1999nn@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

## Lưu ý:

1. **Mật khẩu ứng dụng Gmail**: `pfrd wlyq ccjl uoiq`
   - Đây là mật khẩu ứng dụng (App Password), không phải mật khẩu tài khoản Gmail
   - Để tạo mật khẩu ứng dụng mới: https://myaccount.google.com/apppasswords

2. **Cấu hình Gmail**:
   - Bật "Cho phép ứng dụng kém an toàn" hoặc sử dụng mật khẩu ứng dụng
   - Port 587 cho TLS hoặc 465 cho SSL

3. **Kiểm tra cấu hình**:
   ```bash
   php artisan tinker
   Mail::raw('Test email', function ($message) {
       $message->to('your-email@example.com')
               ->subject('Test');
   });
   ```

## Troubleshooting:

- Nếu không gửi được email, kiểm tra log: `storage/logs/laravel.log`
- Đảm bảo mật khẩu ứng dụng đúng (không có khoảng trắng)
- Kiểm tra firewall/antivirus có chặn kết nối SMTP không

