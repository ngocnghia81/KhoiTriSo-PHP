<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lớp học trực tuyến đã được lên lịch</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Khởi Trí Số</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Nền tảng giáo dục trực tuyến</p>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Chào {{ $userName }}!</h2>
        
        <p>Lớp học trực tuyến mới đã được lên lịch cho khóa học <strong>{{ $course->title }}</strong> của bạn.</p>
        
        <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #667eea;">📚 Thông tin lớp học:</h3>
            <p style="margin: 10px 0;"><strong>Tiêu đề:</strong> {{ $liveClass->title }}</p>
            <p style="margin: 10px 0;"><strong>Khóa học:</strong> {{ $course->title }}</p>
            <p style="margin: 10px 0;"><strong>Thời gian:</strong> {{ $scheduledDate }} lúc {{ $scheduledTime }}</p>
            <p style="margin: 10px 0;"><strong>Thời lượng:</strong> {{ $liveClass->duration_minutes }} phút</p>
            @if($liveClass->description)
            <p style="margin: 10px 0;"><strong>Mô tả:</strong> {{ $liveClass->description }}</p>
            @endif
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>⏰ Lưu ý:</strong> Vui lòng chuẩn bị sẵn sàng trước giờ học để tham gia đúng giờ.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $liveClass->meeting_url }}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Xem chi tiết lớp học</a>
        </div>
        
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666;">
            <p style="margin: 5px 0;">Bạn nhận được email này vì bạn đã đăng ký khóa học <strong>{{ $course->title }}</strong>.</p>
            <p style="margin: 5px 0;">Chúng tôi sẽ gửi thêm một thông báo khi lớp học bắt đầu.</p>
        </div>
    </div>
</body>
</html>

