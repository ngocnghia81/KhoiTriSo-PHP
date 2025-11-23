<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bài tập mới - Khởi Trí Số</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .assignment-card {
            background: white;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .info-row {
            margin: 10px 0;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 5px;
        }
        .info-label {
            font-weight: bold;
            color: #667eea;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background: #5568d3;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📝 Bài tập mới</h1>
        <p>Khởi Trí Số</p>
    </div>
    
    <div class="content">
        <p>Xin chào <strong>{{ $userName }}</strong>,</p>
        
        <p>Giảng viên đã tạo <strong>{{ $assignmentTypeName }}</strong> mới cho bạn trong khóa học:</p>
        
        <div class="assignment-card">
            <h2 style="margin-top: 0; color: #667eea;">{{ $assignment->title }}</h2>
            
            <div class="info-row">
                <span class="info-label">Khóa học:</span> {{ $course->title }}
            </div>
            
            <div class="info-row">
                <span class="info-label">Bài học:</span> {{ $lesson->title }}
            </div>
            
            <div class="info-row">
                <span class="info-label">Loại bài tập:</span> {{ $assignmentTypeName }}
            </div>
            
            @if($assignment->time_limit)
            <div class="info-row">
                <span class="info-label">Thời gian làm bài:</span> {{ $assignment->time_limit }} phút
            </div>
            @endif
            
            @if($dueDateFormatted)
            <div class="info-row">
                <span class="info-label">Hạn nộp:</span> {{ $dueDateFormatted }}
            </div>
            @endif
            
            @if($assignment->max_attempts)
            <div class="info-row">
                <span class="info-label">Số lần làm tối đa:</span> {{ $assignment->max_attempts }}
            </div>
            @endif
            
            @if($assignment->description)
            <div style="margin-top: 15px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
                <strong>Mô tả:</strong>
                <div style="margin-top: 10px;">{!! nl2br(e($assignment->description)) !!}</div>
            </div>
            @endif
        </div>
        
        <div style="text-align: center;">
            <a href="{{ config('app.frontend_url', 'http://localhost:3000') }}/assignments/{{ $assignment->id }}" class="button">
                Làm bài tập ngay
            </a>
        </div>
        
        <p style="margin-top: 30px;">
            Chúc bạn làm bài tốt! 🎯
        </p>
    </div>
    
    <div class="footer">
        <p>Email này được gửi tự động từ hệ thống Khởi Trí Số</p>
        <p>Nếu bạn không muốn nhận email này, vui lòng liên hệ với quản trị viên.</p>
    </div>
</body>
</html>

