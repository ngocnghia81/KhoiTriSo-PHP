<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lớp học trực tuyến đang bắt đầu</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔴 Lớp học đang bắt đầu!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Khởi Trí Số</p>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Chào {{ $userName }}!</h2>
        
        <p>Lớp học trực tuyến <strong>{{ $liveClass->title }}</strong> của khóa học <strong>{{ $course->title }}</strong> đang bắt đầu ngay bây giờ!</p>
        
        <div style="background: #fee; border-left: 4px solid #e74c3c; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #e74c3c;">🔴 Tham gia ngay:</h3>
            <p style="margin: 10px 0;"><strong>Tiêu đề:</strong> {{ $liveClass->title }}</p>
            <p style="margin: 10px 0;"><strong>Khóa học:</strong> {{ $course->title }}</p>
            <p style="margin: 10px 0;"><strong>Meeting ID:</strong> {{ $liveClass->meeting_id }}</p>
            @if($liveClass->meeting_password)
            <p style="margin: 10px 0;"><strong>Mật khẩu:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 3px; font-size: 16px;">{{ $liveClass->meeting_password }}</code></p>
            @endif
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>⏰ Lưu ý:</strong> Lớp học đã bắt đầu, vui lòng tham gia ngay để không bỏ lỡ nội dung quan trọng.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $liveClass->meeting_url }}" style="display: inline-block; background: #e74c3c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">🚀 Tham gia lớp học ngay</a>
        </div>
        
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666;">
            <p style="margin: 5px 0;">Bạn nhận được email này vì bạn đã đăng ký khóa học <strong>{{ $course->title }}</strong>.</p>
        </div>
    </div>
</body>
</html>

