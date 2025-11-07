# Course Content Seeder Documentation

## Overview
`CompleteCourseContentSeeder` tự động tạo nội dung học hoàn chỉnh cho tất cả các khóa học trong hệ thống.

## Dữ liệu được tạo

### 1. Lessons (Bài học)
- **Số lượng**: 8-12 bài học/khóa học
- **Thông tin**:
  - Tiêu đề có cấu trúc: "Bài X: [Chủ đề]"
  - Mô tả chi tiết
  - Nội dung học (HTML format)
  - Video URL
  - Thời lượng: 15-60 phút
  - Thứ tự (lesson_order)
  - 2 bài đầu miễn phí (is_free = true)

### 2. Lesson Materials (Tài liệu học)
- **Số lượng**: 2-4 tài liệu/bài học
- **Loại tài liệu**:
  - PDF: Tài liệu học tập
  - DOCX: Bài giảng chi tiết
  - PPTX: Slide bài giảng
  - XLSX: Bảng tính mẫu
  - MP4: Video bổ trợ

### 3. Assignments (Bài kiểm tra)
- **Số lượng**: 1 assignment/3 bài học
- **Thông tin**:
  - Loại: Quiz (assignment_type = 1)
  - Điểm tối đa: 100
  - Thời gian: 30 phút
  - Số lần làm: 3 lần
  - Điểm đạt: 70%
  - Xáo trộn câu hỏi và đáp án

### 4. Questions (Câu hỏi)
- **Số lượng**: 10 câu/assignment
- **Loại câu hỏi**:
  - Multiple choice (type = 1): 4 đáp án
  - True/False (type = 2): 2 đáp án
- **Độ khó**: Easy (1), Medium (2), Hard (3)
- **Điểm**: 10 điểm/câu
- **Có giải thích chi tiết**

### 5. Question Options (Đáp án)
- Multiple choice: 4 options (A, B, C, D)
- True/False: 2 options (Đúng, Sai)
- Random 1 đáp án đúng
- Điểm: 10.0 nếu đúng, 0.0 nếu sai

## Cách sử dụng

### Chạy seeder riêng lẻ:
```bash
php artisan db:seed --class=CompleteCourseContentSeeder
```

### Chạy tất cả seeders:
```bash
php artisan db:seed
```

### Reset và chạy lại từ đầu:
```bash
php artisan db:wipe
php artisan migrate
php artisan db:seed
```

## Thống kê dữ liệu

Với 10 khóa học, seeder tạo khoảng:
- **97 Lessons** (8-12/course)
- **291 Materials** (2-4/lesson)
- **28 Assignments** (1/3 lessons)
- **280 Questions** (10/assignment)
- **900+ Options** (4/multiple choice, 2/true-false)

## Database Schema

### Lessons Table
```
- id
- course_id (FK)
- title
- description
- lesson_order (thứ tự bài học)
- video_url
- video_duration
- content_text (HTML content)
- static_page_path
- is_published
- is_free (2 bài đầu = true)
```

### Lesson Materials Table
```
- id
- lesson_id (FK)
- title
- file_name
- file_path
- file_type (pdf, docx, pptx, xlsx, mp4)
- file_size
- download_count
```

### Assignments Table
```
- id
- lesson_id (FK, không có course_id)
- title
- description
- assignment_type (1=quiz, 2=assignment, 3=exam)
- max_score
- time_limit
- max_attempts
- show_answers_after (1=immediately, 2=after due, 3=never)
- passing_score
- shuffle_questions
- shuffle_options
```

### Questions Table
```
- id
- context_type (1=assignment, 2=lesson, 3=practice)
- context_id (assignment_id)
- question_content
- question_type (1=multiple choice, 2=true/false, 3=short answer)
- difficulty_level (1=easy, 2=medium, 3=hard)
- points (JSON)
- default_points
- explanation_content
- order_index
```

### Question Options Table
```
- id
- question_id (FK)
- option_content
- is_correct
- order_index
- points_value
```

## Lưu ý quan trọng

1. **Không có course_id trong assignments**: Assignments chỉ liên kết qua lesson_id
2. **Question context**: Sử dụng context_type và context_id thay vì trực tiếp assignment_id
3. **Lesson order**: Sử dụng lesson_order thay vì order_index
4. **Free lessons**: 2 bài đầu của mỗi khóa học được đánh dấu miễn phí
5. **Video URLs**: Hiện tại là placeholder, cần thay bằng URL thực

## Tích hợp với Frontend

Frontend có thể:
- Lấy danh sách lessons theo thứ tự: `orderBy('lesson_order')`
- Hiển thị video player với video_url
- Download materials từ file_path
- Lấy assignments của lesson
- Hiển thị quiz với questions và options
- Track progress qua video_duration
- Phân biệt free/paid lessons

## Mở rộng

Có thể thêm:
- UserVideoProgress: Track xem video
- CourseEnrollments: Đăng ký khóa học
- UserAssignmentAttempts: Lịch sử làm bài
- UserAssignmentAnswers: Đáp án của học viên
- Reviews: Đánh giá khóa học

## Verification Script

Chạy script kiểm tra:
```bash
php check_course_data.php
```

Output:
- Thông tin chi tiết 1 khóa học
- Danh sách 5 bài học đầu
- Tổng số dữ liệu trong database
