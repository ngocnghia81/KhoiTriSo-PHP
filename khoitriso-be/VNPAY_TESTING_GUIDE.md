# Hướng dẫn Test Thanh toán VNPay

## 1. Chuẩn bị môi trường Test

### Bước 1: Đăng ký tài khoản VNPay Sandbox
1. Truy cập: https://sandbox.vnpayment.vn/merchantv2/
2. Đăng ký tài khoản mới hoặc đăng nhập
3. Lấy **TMN Code** và **Hash Secret** từ phần Quản lý Website

### Bước 2: Cấu hình .env
Thêm vào file `.env` của backend:

```env
# VNPay Sandbox Configuration
VNPAY_TMN_CODE=your_tmn_code_here
VNPAY_HASH_SECRET=your_hash_secret_here
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:8000/api/orders/vnpay/callback
```

**Lưu ý**: 
- Thay `your_tmn_code_here` và `your_hash_secret_here` bằng giá trị thực từ VNPay
- `VNPAY_RETURN_URL` phải khớp với IPN URL đã đăng ký trên VNPay

## 2. Quy trình Test Thanh toán

### Bước 1: Thêm sản phẩm vào giỏ hàng
1. Đăng nhập vào hệ thống (role: student)
2. Chọn khóa học hoặc sách muốn mua
3. Click "Thêm vào giỏ hàng" hoặc "Mua ngay"

### Bước 2: Vào trang Checkout
1. Truy cập: http://localhost:3000/checkout
2. Kiểm tra giỏ hàng hiển thị đúng sản phẩm
3. Chọn phương thức thanh toán: **VNPay**
4. (Tùy chọn) Nhập mã giảm giá nếu có
5. Click **"Thanh toán với VNPay"**

### Bước 3: Thanh toán trên VNPay Sandbox
Sau khi click "Thanh toán với VNPay", hệ thống sẽ redirect đến trang thanh toán VNPay.

#### Sử dụng thẻ test:

**Thẻ ATM nội địa:**
- **Số thẻ**: `9704198526191432198`
- **Tên chủ thẻ**: `NGUYEN VAN A`
- **Ngày phát hành**: `07/15`
- **Mã OTP**: `123456`

**Thẻ quốc tế (Visa/Mastercard):**
- **Số thẻ**: `4111111111111111`
- **Tên chủ thẻ**: `NGUYEN VAN A`
- **Ngày hết hạn**: `07/15`
- **CVV**: `123`

**Thẻ quốc tế (Mastercard):**
- **Số thẻ**: `5555555555554444`
- **Tên chủ thẻ**: `NGUYEN VAN A`
- **Ngày hết hạn**: `07/15`
- **CVV**: `123`

### Bước 4: Xác nhận thanh toán
1. Điền thông tin thẻ test
2. Nhập OTP: `123456`
3. Click "Xác nhận thanh toán"

### Bước 5: Kiểm tra kết quả
Sau khi thanh toán thành công, VNPay sẽ redirect về:
- **URL**: `http://localhost:8000/api/orders/vnpay/callback`
- **Sau đó redirect**: `http://localhost:3000/orders/{orderId}?status=success`

**Kiểm tra:**
1. Order đã được cập nhật status = 2 (Paid)
2. User đã được enroll vào khóa học (nếu mua course)
3. Mã kích hoạt đã được tạo (nếu mua book)
4. Transaction ID đã được lưu

## 3. Test các trường hợp lỗi

### Test thanh toán thất bại
1. Sử dụng thẻ test với số tiền không đủ
2. Hoặc hủy thanh toán trên trang VNPay
3. Kiểm tra order status = 3 (Failed)

### Test với số tiền khác nhau
- Test với số tiền nhỏ: 10,000 VND
- Test với số tiền lớn: 1,000,000 VND
- Test với số tiền có số thập phân: 99,999.50 VND

## 4. Kiểm tra Logs

### Backend Logs
Kiểm tra file `storage/logs/laravel.log` để xem:
- Payment URL được tạo
- Callback từ VNPay
- Xử lý thanh toán thành công/thất bại

```bash
# Xem logs real-time
tail -f storage/logs/laravel.log
```

### Frontend Console
Mở Developer Tools (F12) để xem:
- Request tạo order
- Payment URL được trả về
- Redirect đến VNPay

## 5. Troubleshooting

### Lỗi: "Invalid signature"
**Nguyên nhân**: Hash Secret không đúng hoặc cách tạo chữ ký sai
**Giải pháp**:
1. Kiểm tra lại Hash Secret trong `.env`
2. Kiểm tra code tạo chữ ký trong `VNPayService.php`
3. Đảm bảo thứ tự các tham số khi tạo hash

### Lỗi: "Order not found"
**Nguyên nhân**: Order code không khớp
**Giải pháp**:
1. Kiểm tra `vnp_TxnRef` trong callback có khớp với `order_code` không
2. Kiểm tra log để xem order_code được tạo như thế nào

### Callback không được gọi
**Nguyên nhân**: URL callback không đúng hoặc không accessible
**Giải pháp**:
1. Kiểm tra `VNPAY_RETURN_URL` trong `.env`
2. Đảm bảo URL khớp với IPN URL đã đăng ký trên VNPay
3. Kiểm tra server có chạy không (localhost:8000)

### Thanh toán thành công nhưng order không cập nhật
**Nguyên nhân**: Lỗi trong quá trình xử lý callback
**Giải pháp**:
1. Kiểm tra log backend
2. Kiểm tra xem có lỗi trong `processOrderItems` không
3. Kiểm tra database transaction có rollback không

## 6. Test Checklist

- [ ] Đăng nhập thành công
- [ ] Thêm sản phẩm vào giỏ hàng
- [ ] Vào trang checkout
- [ ] Chọn VNPay làm phương thức thanh toán
- [ ] Click "Thanh toán với VNPay"
- [ ] Redirect đến trang VNPay thành công
- [ ] Nhập thông tin thẻ test
- [ ] Thanh toán thành công
- [ ] Redirect về trang order detail
- [ ] Order status = 2 (Paid)
- [ ] User được enroll vào course (nếu mua course)
- [ ] Mã kích hoạt được tạo (nếu mua book)
- [ ] Transaction ID được lưu

## 7. Test với Postman/Thunder Client

Nếu muốn test API trực tiếp:

### Tạo Order với VNPay
```http
POST http://localhost:8000/api/orders
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "items": [
    {
      "itemId": 9,
      "itemType": 1,
      "quantity": 1
    }
  ],
  "paymentMethod": "vnpay",
  "couponCode": null
}
```

**Response:**
```json
{
  "success": true,
  "order": { ... },
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
}
```

Copy `paymentUrl` và mở trong browser để test thanh toán.

## 8. Lưu ý quan trọng

1. **Môi trường Sandbox**: Chỉ dùng để test, không có giao dịch thật
2. **Thẻ Test**: Chỉ hoạt động trên sandbox, không dùng được trên production
3. **URL Callback**: Phải là HTTPS trong production
4. **Timeout**: Giao dịch test có thể timeout sau 15 phút
5. **Logs**: Luôn kiểm tra logs để debug khi có vấn đề

## 9. Video hướng dẫn (nếu có)

1. Đăng nhập vào hệ thống
2. Thêm sản phẩm vào giỏ hàng
3. Vào checkout và chọn VNPay
4. Thanh toán với thẻ test
5. Kiểm tra kết quả

## 10. Liên hệ hỗ trợ

Nếu gặp vấn đề:
- **VNPay Support**: support@vnpay.vn
- **Documentation**: https://sandbox.vnpayment.vn/apis/
- **Kiểm tra logs**: `storage/logs/laravel.log`

