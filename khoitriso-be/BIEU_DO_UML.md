# 2.3. Phân tích yêu cầu

## 2.3.1. Quản lý khóa học và bài giảng

### Hình 2.1: Sơ đồ Use case quản lý khóa học và bài giảng

```plantuml
@startuml
left to right direction
actor "Học viên" as Student
actor "Giảng viên" as Instructor
actor "Quản trị viên" as Admin

rectangle "Hệ thống Khởi Trí Số" {
  usecase "Xem danh sách khóa học" as UC1
  usecase "Xem chi tiết khóa học" as UC2
  usecase "Xem bài giảng miễn phí" as UC3
  usecase "Tạo khóa học" as UC4
  usecase "Chỉnh sửa khóa học" as UC5
  usecase "Upload bài giảng video" as UC6
  usecase "Tạo tài liệu học tập" as UC7
  usecase "Sắp xếp bài giảng" as UC8
  usecase "Phê duyệt khóa học" as UC9
  usecase "Từ chối khóa học" as UC10
  usecase "Xuất bản khóa học" as UC11
  usecase "Theo dõi tiến độ học tập" as UC12
}

Student --> UC1
Student --> UC2
Student --> UC3
Student --> UC12

Instructor --> UC1
Instructor --> UC2
Instructor --> UC4
Instructor --> UC5
Instructor --> UC6
Instructor --> UC7
Instructor --> UC8
Instructor --> UC11

Admin --> UC1
Admin --> UC2
Admin --> UC4
Admin --> UC5
Admin --> UC9
Admin --> UC10
Admin --> UC11

@enduml
```

### Hình 2.2: Sơ đồ hoạt động quy trình tạo và phê duyệt khóa học

```plantuml
@startuml
start
:Giảng viên đăng nhập;
:Chọn "Tạo khóa học mới";
:Nhập thông tin khóa học\n(Tiêu đề, mô tả, giá, danh mục);
:Upload hình ảnh đại diện\n(qua Cloudflare Workers);
:Thêm bài giảng;
repeat
  :Nhập thông tin bài giảng;
  :Upload video bài giảng\n(qua Cloudflare Workers);
  :Thêm tài liệu đính kèm\n(PDF, Word, Excel, PowerPoint);
  :Đánh dấu bài đầu tiên là miễn phí;
repeat while (Còn bài giảng?) is (Có)
-> Không;
:Hoàn tất tạo khóa học;
:Gửi yêu cầu phê duyệt;
:Quản trị viên xem xét;
if (Khóa học hợp lệ?) then (Có)
  :Phê duyệt khóa học;
  :Giảng viên xuất bản;
  :Khóa học hiển thị công khai;
  stop
else (Không)
  :Từ chối với lý do;
  :Giảng viên chỉnh sửa;
  :Gửi lại phê duyệt;
  stop
endif

@enduml
```

### Hình 2.3: Sơ đồ tuần tự các bước trong quy trình học viên xem khóa học

```plantuml
@startuml
actor "Học viên" as Student
participant "Frontend" as FE
participant "Backend API" as API
participant "Database" as DB
participant "Cloudflare R2" as R2

Student -> FE: Truy cập trang khóa học
FE -> API: GET /api/courses
API -> DB: Lấy danh sách khóa học
DB --> API: Danh sách khóa học
API --> FE: Trả về danh sách
FE --> Student: Hiển thị danh sách

Student -> FE: Chọn khóa học
FE -> API: GET /api/courses/{id}
API -> DB: Lấy chi tiết khóa học
DB --> API: Thông tin khóa học
API --> FE: Trả về chi tiết
FE --> Student: Hiển thị chi tiết

Student -> FE: Xem bài giảng đầu tiên (miễn phí)
FE -> API: GET /api/lessons/{id}
API -> DB: Lấy thông tin bài giảng
DB --> API: Thông tin bài giảng
API --> FE: Trả về thông tin
FE -> R2: Lấy video bài giảng
R2 --> FE: Video file
FE --> Student: Phát video

Student -> FE: Tải tài liệu đính kèm
FE -> API: GET /api/lessons/{id}/materials
API -> DB: Lấy danh sách tài liệu
DB --> API: Danh sách tài liệu
API --> FE: Trả về danh sách
FE -> R2: Lấy file tài liệu
R2 --> FE: File tài liệu
FE --> Student: Tải xuống

@enduml
```

## 2.3.2. Quản lý sách điện tử

### Hình 2.4: Sơ đồ Use case quản lý sách điện tử

```plantuml
@startuml
left to right direction
actor "Học viên" as Student
actor "Tác giả" as Author
actor "Quản trị viên" as Admin

rectangle "Hệ thống Khởi Trí Số" {
  usecase "Xem danh sách sách" as UC1
  usecase "Xem chi tiết sách" as UC2
  usecase "Đọc sách điện tử" as UC3
  usecase "Làm câu hỏi chương" as UC4
  usecase "Tạo sách điện tử" as UC5
  usecase "Chỉnh sửa sách" as UC6
  usecase "Tạo chương sách" as UC7
  usecase "Tạo câu hỏi cho chương" as UC8
  usecase "Tạo mã kích hoạt" as UC9
  usecase "Kích hoạt sách bằng mã" as UC10
  usecase "Phê duyệt sách" as UC11
  usecase "Xuất bản sách" as UC12
}

Student --> UC1
Student --> UC2
Student --> UC3
Student --> UC4
Student --> UC10

Author --> UC1
Author --> UC2
Author --> UC5
Author --> UC6
Author --> UC7
Author --> UC8
Author --> UC12

Admin --> UC1
Admin --> UC2
Admin --> UC5
Admin --> UC6
Admin --> UC7
Admin --> UC8
Admin --> UC9
Admin --> UC11
Admin --> UC12

@enduml
```

### Hình 2.5: Sơ đồ hoạt động quy trình tạo và đọc sách điện tử

```plantuml
@startuml
start
:Quản trị viên/Tác giả đăng nhập;
:Chọn "Tạo sách mới";
:Nhập thông tin sách\n(Tiêu đề, mô tả, giá, danh mục);
:Hệ thống tự động tạo ISBN;
:Upload hình ảnh bìa\n(qua Cloudflare Workers);
:Thêm chương sách;
repeat
  :Nhập nội dung chương\n(với rich text editor);
  :Hỗ trợ LaTeX cho công thức toán;
  :Thêm câu hỏi cho chương;
  repeat
    :Tạo câu hỏi trắc nghiệm/tự luận;
    :Thêm đáp án và lời giải\n(LaTeX, video, file);
    :Gán điểm số và mức độ khó;
  repeat while (Còn câu hỏi?) is (Có)
  -> Không;
repeat while (Còn chương?) is (Có)
-> Không;
:Hoàn tất tạo sách;
:Gửi yêu cầu phê duyệt;
:Quản trị viên phê duyệt;
:Xuất bản sách;
:Học viên mua sách;
if (Thanh toán thành công?) then (Có)
  :Hệ thống tự động tạo mã kích hoạt;
  :Gán mã cho học viên;
  :Học viên kích hoạt sách;
  :Học viên đọc sách và làm câu hỏi;
  stop
else (Không)
  :Đơn hàng chờ thanh toán;
  stop
endif

@enduml
```

### Hình 2.6: Sơ đồ tuần tự quy trình học viên mua và kích hoạt sách

```plantuml
@startuml
actor "Học viên" as Student
participant "Frontend" as FE
participant "Backend API" as API
participant "Database" as DB
participant "VNPay" as VNPay

Student -> FE: Xem danh sách sách
FE -> API: GET /api/books
API -> DB: Lấy danh sách sách
DB --> API: Danh sách sách
API --> FE: Trả về danh sách
FE --> Student: Hiển thị danh sách

Student -> FE: Chọn sách và thêm vào giỏ hàng
FE -> API: POST /api/cart
API -> DB: Thêm vào giỏ hàng
DB --> API: Thành công
API --> FE: Cập nhật giỏ hàng
FE --> Student: Hiển thị giỏ hàng

Student -> FE: Thanh toán
FE -> API: POST /api/orders
API -> DB: Tạo đơn hàng
DB --> API: Đơn hàng đã tạo
API -> VNPay: Tạo URL thanh toán
VNPay --> API: Payment URL
API --> FE: Trả về Payment URL
FE --> Student: Chuyển hướng đến VNPay

VNPay -> API: Callback thanh toán
API -> DB: Xác thực và cập nhật đơn hàng
API -> DB: Tạo mã kích hoạt
API -> DB: Gán mã cho học viên
API -> FE: Redirect về trang đơn hàng
FE --> Student: Hiển thị kết quả thanh toán

Student -> FE: Kích hoạt sách bằng mã
FE -> API: POST /api/books/activate
API -> DB: Kiểm tra mã kích hoạt
DB --> API: Mã hợp lệ
API -> DB: Kích hoạt sách cho học viên
DB --> API: Thành công
API --> FE: Trả về thông tin sách
FE --> Student: Chuyển đến trang đọc sách

@enduml
```

## 2.3.3. Quản lý đơn hàng và thanh toán

### Hình 2.7: Sơ đồ Use case quản lý đơn hàng và thanh toán

```plantuml
@startuml
left to right direction
actor "Học viên" as Student
actor "Quản trị viên" as Admin

rectangle "Hệ thống Khởi Trí Số" {
  usecase "Xem giỏ hàng" as UC1
  usecase "Thêm vào giỏ hàng" as UC2
  usecase "Xóa khỏi giỏ hàng" as UC3
  usecase "Áp dụng mã giảm giá" as UC4
  usecase "Tạo đơn hàng" as UC5
  usecase "Thanh toán qua VNPay" as UC6
  usecase "Xem lịch sử đơn hàng" as UC7
  usecase "Xem chi tiết đơn hàng" as UC8
  usecase "Hủy đơn hàng" as UC9
  usecase "Xem tất cả đơn hàng" as UC10
  usecase "Lọc đơn hàng" as UC11
  usecase "Xem báo cáo doanh thu" as UC12
}

Student --> UC1
Student --> UC2
Student --> UC3
Student --> UC4
Student --> UC5
Student --> UC6
Student --> UC7
Student --> UC8
Student --> UC9

Admin --> UC7
Admin --> UC8
Admin --> UC10
Admin --> UC11
Admin --> UC12

@enduml
```

### Hình 2.8: Sơ đồ hoạt động quy trình đặt hàng và thanh toán

```plantuml
@startuml
start
:Học viên đăng nhập;
:Thêm khóa học/sách vào giỏ hàng;
:Kiểm tra giỏ hàng;
if (Có sản phẩm?) then (Có)
  :Nhập mã giảm giá (nếu có);
  :Hệ thống kiểm tra mã giảm giá;
  if (Mã hợp lệ?) then (Có)
    :Tính toán giảm giá;
    :Cập nhật tổng tiền;
  else (Không)
    :Thông báo mã không hợp lệ;
  endif
  :Chọn phương thức thanh toán;
  :Tạo đơn hàng;
  if (Thanh toán qua VNPay?) then (Có)
    :Tạo payment URL;
    :Chuyển hướng đến VNPay;
    :Học viên thanh toán;
    :VNPay callback;
    if (Thanh toán thành công?) then (Có)
      :Cập nhật trạng thái đơn hàng;
      :Kích hoạt khóa học/sách;
      :Tạo mã kích hoạt (nếu là sách);
      :Gửi thông báo xác nhận;
      :Tính toán chiết khấu;
      :Lưu thông tin doanh thu;
      stop
    else (Thất bại)
      :Cập nhật trạng thái đơn hàng;
      :Thông báo lỗi;
      stop
    endif
  else (Thanh toán khác)
    :Xử lý thanh toán;
    stop
  endif
else (Không)
  :Thông báo giỏ hàng trống;
  stop
endif

@enduml
```

### Hình 2.9: Sơ đồ tuần tự quy trình thanh toán qua VNPay

```plantuml
@startuml
actor "Học viên" as Student
participant "Frontend" as FE
participant "Backend API" as API
participant "Database" as DB
participant "VNPay Service" as VNPay
participant "VNPay Gateway" as Gateway

Student -> FE: Chọn "Thanh toán"
FE -> API: POST /api/orders\n(couponCode, paymentMethod)
API -> DB: Kiểm tra mã giảm giá
DB --> API: Thông tin mã giảm giá
API -> API: Tính toán tổng tiền
API -> DB: Tạo đơn hàng
DB --> API: Đơn hàng đã tạo
API -> VNPay: Tạo payment URL
VNPay -> VNPay: Tạo hash signature
VNPay --> API: Payment URL
API --> FE: Trả về Payment URL
FE --> Student: Chuyển hướng đến VNPay

Student -> Gateway: Thanh toán
Gateway -> Gateway: Xử lý thanh toán
Gateway -> API: GET /api/orders/vnpay/callback\n(vnp_Amount, vnp_ResponseCode, ...)
API -> VNPay: Xác thực signature
VNPay --> API: Signature hợp lệ
API -> DB: Cập nhật trạng thái đơn hàng = "Đã thanh toán"
API -> DB: Xử lý order items
API -> DB: Kích hoạt khóa học cho học viên
API -> DB: Tạo mã kích hoạt sách (nếu có)
API -> DB: Tính toán và lưu chiết khấu
API -> DB: Gửi thông báo
API --> Gateway: Redirect về frontend
Gateway --> Student: Hiển thị kết quả thanh toán

@enduml
```

## 2.3.4. Quản lý câu hỏi và đánh giá

### Hình 2.10: Sơ đồ Use case quản lý câu hỏi và đánh giá

```plantuml
@startuml
left to right direction
actor "Học viên" as Student
actor "Giảng viên" as Instructor
actor "Quản trị viên" as Admin

rectangle "Hệ thống Khởi Trí Số" {
  usecase "Làm bài tập" as UC1
  usecase "Xem kết quả bài làm" as UC2
  usecase "Xem lời giải chi tiết" as UC3
  usecase "Tạo câu hỏi" as UC4
  usecase "Tạo bài tập" as UC5
  usecase "Chấm điểm tự động" as UC6
  usecase "Chấm điểm thủ công" as UC7
  usecase "Xem danh sách bài nộp" as UC8
  usecase "Xem chi tiết bài nộp" as UC9
  usecase "Xem báo cáo thống kê" as UC10
}

Student --> UC1
Student --> UC2
Student --> UC3

Instructor --> UC4
Instructor --> UC5
Instructor --> UC6
Instructor --> UC7
Instructor --> UC8
Instructor --> UC9
Instructor --> UC10

Admin --> UC4
Admin --> UC5
Admin --> UC8
Admin --> UC9
Admin --> UC10

@enduml
```

### Hình 2.11: Sơ đồ hoạt động quy trình làm bài tập và chấm điểm

```plantuml
@startuml
start
:Giảng viên tạo bài tập;
:Thêm câu hỏi vào bài tập;
repeat
  if (Loại câu hỏi?) then (Trắc nghiệm)
    :Tạo câu hỏi trắc nghiệm;
    :Thêm các lựa chọn;
    :Đánh dấu đáp án đúng;
  else (Tự luận)
    :Tạo câu hỏi tự luận;
    :Thêm hướng dẫn chấm điểm;
  endif
  :Thêm lời giải (LaTeX, video, file);
  :Gán điểm số;
repeat while (Còn câu hỏi?) is (Có)
-> Không;
:Xuất bản bài tập;
:Học viên làm bài tập;
:Học viên trả lời câu hỏi;
:Học viên nộp bài;
:Hệ thống chấm điểm tự động\n(câu hỏi trắc nghiệm);
if (Có câu hỏi tự luận?) then (Có)
  :Giảng viên chấm điểm thủ công;
  :Thêm nhận xét;
else (Không)
endif
:Hệ thống tính điểm tổng;
:Lưu kết quả;
:Học viên xem kết quả;
:Học viên xem lời giải chi tiết;
stop

@enduml
```

### Hình 2.12: Sơ đồ tuần tự quy trình học viên làm bài tập

```plantuml
@startuml
actor "Học viên" as Student
participant "Frontend" as FE
participant "Backend API" as API
participant "Database" as DB

Student -> FE: Chọn bài tập
FE -> API: GET /api/assignments/{id}
API -> DB: Lấy thông tin bài tập và câu hỏi
DB --> API: Thông tin bài tập
API --> FE: Trả về bài tập
FE --> Student: Hiển thị bài tập

Student -> FE: Bắt đầu làm bài
FE -> API: POST /api/assignments/{id}/attempts
API -> DB: Tạo attempt mới
DB --> API: Attempt đã tạo
API --> FE: Trả về attempt ID
FE --> Student: Hiển thị câu hỏi

loop Cho mỗi câu hỏi
  Student -> FE: Trả lời câu hỏi
  FE -> API: POST /api/attempts/{id}/answers
  API -> DB: Lưu câu trả lời
  DB --> API: Đã lưu
  API --> FE: Xác nhận
end

Student -> FE: Nộp bài
FE -> API: POST /api/attempts/{id}/submit
API -> DB: Cập nhật trạng thái attempt
API -> API: Chấm điểm tự động\n(câu hỏi trắc nghiệm)
API -> DB: Lưu điểm số
DB --> API: Đã lưu
API --> FE: Trả về kết quả
FE --> Student: Hiển thị điểm số

Student -> FE: Xem lời giải chi tiết
FE -> API: GET /api/attempts/{id}
API -> DB: Lấy thông tin attempt và câu trả lời
DB --> API: Thông tin chi tiết
API --> FE: Trả về thông tin
FE --> Student: Hiển thị lời giải\n(với LaTeX renderer)

@enduml
```

## 2.3.5. Quản lý lớp học trực tuyến

### Hình 2.13: Sơ đồ Use case quản lý lớp học trực tuyến

```plantuml
@startuml
left to right direction
actor "Học viên" as Student
actor "Giảng viên" as Instructor
actor "Quản trị viên" as Admin

rectangle "Hệ thống Khởi Trí Số" {
  usecase "Xem lịch lớp học" as UC1
  usecase "Tham gia lớp học" as UC2
  usecase "Xem thông tin lớp học" as UC3
  usecase "Tạo lớp học" as UC4
  usecase "Chỉnh sửa lớp học" as UC5
  usecase "Hủy lớp học" as UC6
  usecase "Bắt đầu lớp học" as UC7
  usecase "Kết thúc lớp học" as UC8
  usecase "Xem lịch sử lớp học" as UC9
  usecase "Nhận thông báo lớp học" as UC10
}

Student --> UC1
Student --> UC2
Student --> UC3
Student --> UC9
Student --> UC10

Instructor --> UC1
Instructor --> UC3
Instructor --> UC4
Instructor --> UC5
Instructor --> UC6
Instructor --> UC7
Instructor --> UC8
Instructor --> UC9

Admin --> UC1
Admin --> UC3
Admin --> UC4
Admin --> UC5
Admin --> UC6
Admin --> UC9

@enduml
```

### Hình 2.14: Sơ đồ hoạt động quy trình tạo và tham gia lớp học trực tuyến

```plantuml
@startuml
start
:Giảng viên đăng nhập;
:Chọn "Tạo lớp học mới";
:Chọn khóa học liên kết;
:Nhập thông tin lớp học\n(Tiêu đề, mô tả, thời gian);
:Nhập thông tin phòng họp\n(URL, ID, mật khẩu);
:Thiết lập số lượng người tham gia tối đa;
:Thiết lập tùy chọn\n(Chat, ghi lại buổi học);
:Lưu lớp học;
:Hệ thống lấy danh sách học viên\nđã đăng ký khóa học;
:Hệ thống gửi thông báo và email\ncho tất cả học viên;
:Thông báo được lưu trong hệ thống;
:Hệ thống lên lịch gửi thông báo nhắc nhở\n(15 phút trước khi bắt đầu);
:Đến thời gian nhắc nhở;
:Hệ thống gửi thông báo nhắc nhở;
:Đến thời gian lớp học;
:Học viên nhận thông báo;
:Học viên tham gia lớp học;
:Giảng viên bắt đầu lớp học;
:Giảng viên kết thúc lớp học;
if (Có ghi lại?) then (Có)
  :Lưu link ghi lại buổi học;
else (Không)
endif
stop

@enduml
```

### Hình 2.15: Sơ đồ tuần tự quy trình tạo và gửi thông báo lớp học

```plantuml
@startuml
actor "Giảng viên" as Instructor
participant "Frontend" as FE
participant "Backend API" as API
participant "Database" as DB
participant "Email Service" as Email
participant "Notification Service" as Notif
participant "Scheduler" as Sched

Instructor -> FE: Tạo lớp học mới
FE -> API: POST /api/live-classes
API -> DB: Lưu thông tin lớp học
DB --> API: Lớp học đã tạo
API -> DB: Lấy danh sách học viên\nđã đăng ký khóa học
DB --> API: Danh sách học viên
API -> DB: Tạo thông báo cho từng học viên
DB --> API: Thông báo đã tạo
API -> Email: Gửi email thông báo
Email --> API: Đã gửi
API -> Notif: Gửi in-app notification
Notif --> API: Đã gửi
API --> FE: Trả về thông tin lớp học
FE --> Instructor: Hiển thị thành công

Sched -> Sched: Chạy mỗi phút
Sched -> API: Kiểm tra lớp học sắp bắt đầu\n(15 phút trước)
API -> DB: Tìm lớp học sắp bắt đầu
DB --> API: Danh sách lớp học
loop Cho mỗi lớp học
  API -> DB: Lấy danh sách học viên
  DB --> API: Danh sách học viên
  loop Cho mỗi học viên
    API -> DB: Kiểm tra đã gửi thông báo nhắc nhở?
    alt Chưa gửi
      API -> DB: Tạo thông báo nhắc nhở
      API -> Email: Gửi email nhắc nhở
      API -> Notif: Gửi in-app notification
    end
  end
end

@enduml
```

## 2.3.6. Quản lý báo cáo và thống kê

### Hình 2.16: Sơ đồ Use case quản lý báo cáo và thống kê

```plantuml
@startuml
left to right direction
actor "Giảng viên" as Instructor
actor "Quản trị viên" as Admin

rectangle "Hệ thống Khởi Trí Số" {
  usecase "Xem báo cáo doanh thu Admin" as UC1
  usecase "Xem báo cáo doanh thu Giảng viên" as UC2
  usecase "Xem báo cáo doanh thu Chi tiết" as UC3
  usecase "Xem báo cáo doanh thu Tổng hợp" as UC4
  usecase "Xem thống kê người dùng đăng ký" as UC5
  usecase "Xem phân tích hiệu suất khóa học" as UC6
  usecase "Lọc báo cáo theo thời gian" as UC7
  usecase "Xuất báo cáo" as UC8
}

Instructor --> UC2
Instructor --> UC6

Admin --> UC1
Admin --> UC2
Admin --> UC3
Admin --> UC4
Admin --> UC5
Admin --> UC6
Admin --> UC7
Admin --> UC8

@enduml
```

### Hình 2.17: Sơ đồ hoạt động quy trình xem báo cáo doanh thu

```plantuml
@startuml
start
:Quản trị viên/Giảng viên đăng nhập;
:Chọn "Báo cáo & Thống kê";
:Chọn loại báo cáo;
if (Loại báo cáo?) then (Doanh thu Admin)
  :Chọn khoảng thời gian;
  :Hệ thống tính toán:\n- Doanh thu từ admin items\n- Chiết khấu từ giảng viên;
  :Hiển thị tổng doanh thu Admin;
  :Hiển thị breakdown theo loại\n(Khóa học, Sách);
elseif (Doanh thu Giảng viên) then
  :Chọn khoảng thời gian;
  :Hệ thống tính toán cho từng giảng viên:\n- Doanh thu gộp\n- Chiết khấu\n- Thu nhập thực tế;
  :Hiển thị danh sách giảng viên;
  :Hiển thị biểu đồ top 10;
elseif (Doanh thu Chi tiết) then
  :Chọn khoảng thời gian;
  :Chọn loại (Khóa học/Sách/Tất cả);
  :Hệ thống tính toán:\n- Doanh thu gộp\n- Phí nền tảng\n- Thu nhập giảng viên;
  :Hiển thị bảng chi tiết;
else (Doanh thu Tổng hợp)
  :Chọn khoảng thời gian;
  :Hệ thống tính toán:\n- Tổng doanh thu khóa học\n- Tổng doanh thu sách\n- Tổng doanh thu;
  :Hiển thị tổng hợp;
endif
:Xuất báo cáo (nếu cần);
stop

@enduml
```

### Hình 2.18: Sơ đồ tuần tự quy trình xem báo cáo doanh thu

```plantuml
@startuml
actor "Quản trị viên" as Admin
participant "Frontend" as FE
participant "Backend API" as API
participant "Database" as DB

Admin -> FE: Chọn "Báo cáo tổng hợp"
FE -> FE: Hiển thị tabs\n(Admin, Giảng viên, Chi tiết)
Admin -> FE: Chọn tab "Doanh thu Admin"
Admin -> FE: Chọn khoảng thời gian
FE -> API: GET /api/admin/reports/total-revenue\n?from=YYYY-MM-DD&to=YYYY-MM-DD
API -> DB: Tính doanh thu từ admin items
DB --> API: Doanh thu admin items
API -> DB: Tính chiết khấu từ giảng viên
DB --> API: Tổng chiết khấu
API -> API: Tính tổng doanh thu Admin
API -> DB: Tính breakdown theo loại
DB --> API: Breakdown (khóa học, sách)
API --> FE: Trả về dữ liệu
FE --> Admin: Hiển thị summary cards
FE --> Admin: Hiển thị biểu đồ pie chart

Admin -> FE: Chọn tab "Doanh thu Giảng viên"
FE -> API: GET /api/admin/reports/instructor-revenue\n?from=YYYY-MM-DD&to=YYYY-MM-DD
API -> DB: Tính doanh thu theo từng giảng viên
DB --> API: Danh sách giảng viên với doanh thu
API --> FE: Trả về dữ liệu
FE --> Admin: Hiển thị bảng danh sách
FE --> Admin: Hiển thị biểu đồ bar chart

Admin -> FE: Chọn tab "Báo cáo Chi tiết"
FE -> API: GET /api/admin/reports/revenue\n?from=YYYY-MM-DD&to=YYYY-MM-DD&item_type=1
API -> DB: Tính doanh thu chi tiết theo giảng viên
DB --> API: Chi tiết doanh thu
API --> FE: Trả về dữ liệu
FE --> Admin: Hiển thị bảng chi tiết
@enduml
```
