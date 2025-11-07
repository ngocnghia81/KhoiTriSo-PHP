<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tài khoản giảng viên đã được tạo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Khởi Trí Số</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Nền tảng giáo dục trực tuyến</p>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Chào mừng {{ $name }}!</h2>
        
        <p>Yêu cầu làm giảng viên của bạn đã được chấp nhận. Tài khoản giảng viên đã được tạo thành công.</p>
        
        <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #667eea;">Thông tin đăng nhập:</h3>
            <p style="margin: 10px 0;"><strong>Email:</strong> {{ $email }}</p>
            <p style="margin: 10px 0;"><strong>Mật khẩu:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 3px; font-size: 16px; letter-spacing: 2px;">{{ $password }}</code></p>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Lưu ý quan trọng:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
                <li>Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên</li>
                <li>Không chia sẻ thông tin đăng nhập với người khác</li>
                <li>Nếu bạn không yêu cầu tài khoản này, vui lòng liên hệ quản trị viên</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.url') }}/auth/login" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đăng nhập ngay</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email: 
            <a href="mailto:support@khoitriso.com" style="color: #667eea;">support@khoitriso.com</a>
        </p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© {{ date('Y') }} Khởi Trí Số. Tất cả quyền được bảo lưu.</p>
    </div>
</body>
</html>

