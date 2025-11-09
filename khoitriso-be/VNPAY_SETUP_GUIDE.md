# Hướng dẫn đăng ký và cấu hình VNPay

## 1. Đăng ký tài khoản VNPay

### Bước 1: Truy cập trang đăng ký
- **Sandbox (Môi trường test)**: https://sandbox.vnpayment.vn/merchantv2/
- **Production (Môi trường thật)**: https://www.vnpay.vn/

### Bước 2: Đăng ký tài khoản
1. Truy cập https://sandbox.vnpayment.vn/merchantv2/
2. Click vào **"Đăng ký"** hoặc **"Register"**
3. Điền đầy đủ thông tin:
   - Email
   - Mật khẩu
   - Tên công ty/doanh nghiệp
   - Số điện thoại
   - Địa chỉ
   - Website
   - Mô tả ngành nghề
4. Xác nhận email để kích hoạt tài khoản

### Bước 3: Đăng nhập
- Sau khi kích hoạt tài khoản, đăng nhập vào hệ thống
- URL: https://sandbox.vnpayment.vn/merchantv2/

## 2. Lấy thông tin cấu hình

### Bước 1: Vào phần Quản lý Website
1. Sau khi đăng nhập, vào menu **"Quản lý Website"** hoặc **"Website Management"**
2. Click **"Thêm Website"** hoặc **"Add Website"** nếu chưa có website nào

### Bước 2: Tạo Website mới
Điền thông tin website:
- **Tên website**: Tên hiển thị (ví dụ: "Khởi Trí Số")
- **URL website**: URL của website (ví dụ: `http://localhost:3000` hoặc domain thật)
- **IPN URL**: URL nhận callback từ VNPay
  - Format: `http://your-domain.com/api/orders/vnpay/callback`
  - Ví dụ: `http://localhost:8000/api/orders/vnpay/callback` (cho local)
  - Ví dụ: `https://yourdomain.com/api/orders/vnpay/callback` (cho production)

### Bước 3: Lấy thông tin
Sau khi tạo website, bạn sẽ nhận được:

1. **TMN Code (Terminal ID)**
   - Là mã định danh website của bạn
   - Ví dụ: `2QXUI4J4`
   - Tìm ở: **Quản lý Website** → Chọn website → **TMN Code**

2. **Hash Secret (Secret Key)**
   - Là khóa bí mật để tạo chữ ký
   - Ví dụ: `RAOJSXWYFBMZUNRTDAPQSCVKIGLHOEP`
   - Tìm ở: **Quản lý Website** → Chọn website → **Secret Key**
   - **Lưu ý**: Click vào nút **"Hiển thị"** hoặc **"Show"** để xem Secret Key

## 3. Cấu hình trong file .env

Thêm các dòng sau vào file `.env` của backend:

```env
# VNPay Configuration
VNPAY_TMN_CODE=2QXUI4J4
VNPAY_HASH_SECRET=RAOJSXWYFBMZUNRTDAPQSCVKIGLHOEP
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:8000/api/orders/vnpay/callback
```

### Giải thích các tham số:

- **VNPAY_TMN_CODE**: Terminal ID bạn nhận được từ VNPay
- **VNPAY_HASH_SECRET**: Secret Key bạn nhận được từ VNPay
- **VNPAY_URL**: 
  - Sandbox: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
  - Production: `https://www.vnpay.vn/paymentv2/vpcpay.html`
- **VNPAY_RETURN_URL**: 
  - URL callback sau khi thanh toán
  - **Local**: `http://localhost:8000/api/orders/vnpay/callback`
  - **Production**: `https://yourdomain.com/api/orders/vnpay/callback`
  - **Lưu ý**: URL này phải khớp với IPN URL bạn đã đăng ký trên VNPay

## 4. Test thanh toán

### Sandbox (Môi trường test)
VNPay cung cấp các thẻ test để test thanh toán:

**Thẻ ATM nội địa:**
- Số thẻ: `9704198526191432198`
- Tên chủ thẻ: `NGUYEN VAN A`
- Ngày phát hành: `07/15`
- Mã OTP: `123456`

**Thẻ quốc tế:**
- Số thẻ: `4111111111111111`
- Tên chủ thẻ: `NGUYEN VAN A`
- Ngày hết hạn: `07/15`
- CVV: `123`

### Kiểm tra
1. Tạo order với payment method = `vnpay`
2. Hệ thống sẽ redirect đến trang thanh toán VNPay
3. Sử dụng thẻ test để thanh toán
4. Sau khi thanh toán, VNPay sẽ redirect về `VNPAY_RETURN_URL`
5. Kiểm tra order đã được cập nhật status = 2 (Paid)

## 5. Chuyển sang Production

Khi sẵn sàng chuyển sang môi trường thật:

1. **Đăng ký tài khoản Production**
   - Truy cập: https://www.vnpay.vn/
   - Đăng ký tài khoản thương mại
   - Cung cấp các giấy tờ pháp lý (Giấy phép kinh doanh, CMND/CCCD, v.v.)

2. **Cập nhật .env**
   ```env
   VNPAY_URL=https://www.vnpay.vn/paymentv2/vpcpay.html
   VNPAY_RETURN_URL=https://yourdomain.com/api/orders/vnpay/callback
   ```

3. **Lấy TMN Code và Hash Secret mới** từ tài khoản Production

4. **Cập nhật lại .env** với thông tin Production

## 6. Lưu ý quan trọng

1. **Bảo mật Secret Key**
   - Không commit Secret Key vào Git
   - Thêm `.env` vào `.gitignore`
   - Chỉ chia sẻ Secret Key cho người có quyền

2. **URL Callback**
   - URL callback phải là HTTPS trong production
   - URL phải khớp chính xác với IPN URL đã đăng ký
   - VNPay sẽ gửi callback về URL này sau khi thanh toán

3. **Xử lý Callback**
   - Luôn verify chữ ký (signature) từ VNPay
   - Kiểm tra response code = '00' mới coi là thành công
   - Xử lý các trường hợp lỗi (response code khác '00')

4. **Logging**
   - Log tất cả callback từ VNPay để debug
   - Log các lỗi xác thực chữ ký
   - Log các giao dịch thành công/thất bại

## 7. Troubleshooting

### Lỗi: "Invalid signature"
- Kiểm tra Secret Key có đúng không
- Kiểm tra cách tạo chữ ký trong code
- Đảm bảo thứ tự các tham số khi tạo hash

### Lỗi: "Order not found"
- Kiểm tra order_code có đúng không
- Kiểm tra vnp_TxnRef trong callback có khớp với order_code không

### Callback không được gọi
- Kiểm tra URL callback có đúng không
- Kiểm tra server có accessible từ internet không (cho production)
- Kiểm tra firewall có chặn request từ VNPay không

### Thanh toán thành công nhưng order không cập nhật
- Kiểm tra log callback
- Kiểm tra xem có lỗi trong processOrderItems không
- Kiểm tra database transaction có rollback không

## 8. Tài liệu tham khảo

- **VNPay Sandbox**: https://sandbox.vnpayment.vn/merchantv2/
- **VNPay Production**: https://www.vnpay.vn/
- **Tài liệu API**: https://sandbox.vnpayment.vn/apis/
- **Hỗ trợ**: support@vnpay.vn

## 9. Ví dụ cấu hình hoàn chỉnh

### File .env (Backend)
```env
# VNPay Sandbox Configuration
VNPAY_TMN_CODE=2QXUI4J4
VNPAY_HASH_SECRET=RAOJSXWYFBMZUNRTDAPQSCVKIGLHOEP
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:8000/api/orders/vnpay/callback

# Hoặc cho production
# VNPAY_URL=https://www.vnpay.vn/paymentv2/vpcpay.html
# VNPAY_RETURN_URL=https://yourdomain.com/api/orders/vnpay/callback
```

### Kiểm tra cấu hình
Sau khi cấu hình, bạn có thể test bằng cách:
1. Tạo một order với payment method = 'vnpay'
2. Kiểm tra response có `paymentUrl` không
3. Truy cập `paymentUrl` để xem trang thanh toán VNPay
4. Sử dụng thẻ test để thanh toán
5. Kiểm tra callback có được gọi không

