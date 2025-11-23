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
  usecase "Xem khóa học" as UC1
  usecase "Học bài giảng" as UC2
  usecase "Quản lý khóa học" as UC3
  usecase "Quản lý bài giảng" as UC4
  usecase "Phê duyệt khóa học" as UC5
}

Student --> UC1
Student --> UC2

Instructor --> UC1
Instructor --> UC3
Instructor --> UC4

Admin --> UC1
Admin --> UC3
Admin --> UC4
Admin --> UC5

@enduml
```

### Hình 2.2: Sơ đồ hoạt động quy trình tạo và phê duyệt khóa học

```plantuml
@startuml
start
:Giảng viên tạo khóa học\nvà thêm bài giảng;
:Upload video và tài liệu;
:Gửi yêu cầu phê duyệt;
:Quản trị viên xem xét;
if (Khóa học hợp lệ?) then (Có)
  :Phê duyệt và xuất bản;
  stop
else (Không)
  :Từ chối và yêu cầu chỉnh sửa;
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

Student -> FE: Xem danh sách khóa học
FE -> API: GET /api/courses
API -> DB: Lấy dữ liệu
DB --> API: Dữ liệu khóa học
API --> FE: Trả về
FE --> Student: Hiển thị

Student -> FE: Xem bài giảng
FE -> API: GET /api/lessons/{id}
API -> DB: Lấy thông tin bài giảng
DB --> API: Thông tin bài giảng
API --> FE: Trả về
FE -> R2: Lấy video
R2 --> FE: Video file
FE --> Student: Phát video

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
  usecase "Xem và đọc sách" as UC1
  usecase "Kích hoạt sách" as UC2
  usecase "Quản lý sách" as UC3
  usecase "Quản lý chương và câu hỏi" as UC4
  usecase "Phê duyệt sách" as UC5
}

Student --> UC1
Student --> UC2

Author --> UC1
Author --> UC3
Author --> UC4

Admin --> UC1
Admin --> UC3
Admin --> UC4
Admin --> UC5

@enduml
```

### Hình 2.5: Sơ đồ hoạt động quy trình tạo và đọc sách điện tử

```plantuml
@startuml
start
:Tác giả tạo sách\nvà thêm chương với câu hỏi;
:Gửi yêu cầu phê duyệt;
:Quản trị viên phê duyệt;
:Xuất bản sách;
:Học viên mua sách;
if (Thanh toán thành công?) then (Có)
  :Hệ thống tạo mã kích hoạt;
  :Học viên kích hoạt và đọc sách;
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

Student -> FE: Thêm sách vào giỏ và thanh toán
FE -> API: POST /api/orders
API -> DB: Tạo đơn hàng
API -> VNPay: Tạo URL thanh toán
VNPay --> API: Payment URL
API --> FE: Payment URL
FE --> Student: Chuyển đến VNPay

VNPay -> API: Callback thanh toán
API -> DB: Cập nhật đơn hàng\nvà tạo mã kích hoạt
API --> FE: Kết quả thanh toán
FE --> Student: Hiển thị kết quả

Student -> FE: Kích hoạt sách
FE -> API: POST /api/books/activate
API -> DB: Kích hoạt sách
API --> FE: Thành công
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
  usecase "Quản lý giỏ hàng" as UC1
  usecase "Thanh toán" as UC2
  usecase "Xem đơn hàng" as UC3
  usecase "Quản lý đơn hàng" as UC4
  usecase "Xem báo cáo" as UC5
}

Student --> UC1
Student --> UC2
Student --> UC3

Admin --> UC3
Admin --> UC4
Admin --> UC5

@enduml
```

### Hình 2.8: Sơ đồ hoạt động quy trình đặt hàng và thanh toán

```plantuml
@startuml
start
:Học viên thêm sản phẩm vào giỏ hàng;
:Áp dụng mã giảm giá (nếu có);
:Tạo đơn hàng và thanh toán qua VNPay;
if (Thanh toán thành công?) then (Có)
  :Kích hoạt khóa học/sách;
  :Tạo mã kích hoạt (nếu là sách);
  :Tính toán chiết khấu;
  stop
else (Thất bại)
  :Cập nhật trạng thái đơn hàng;
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
participant "VNPay Gateway" as Gateway

Student -> FE: Thanh toán
FE -> API: POST /api/orders
API -> DB: Tạo đơn hàng
API -> Gateway: Tạo payment URL
Gateway --> API: Payment URL
API --> FE: Payment URL
FE --> Student: Chuyển đến VNPay

Student -> Gateway: Thanh toán
Gateway -> API: Callback thanh toán
API -> DB: Xác thực và cập nhật đơn hàng
API -> DB: Kích hoạt khóa học/sách
API -> DB: Tính toán chiết khấu
API --> Gateway: Redirect về frontend
Gateway --> Student: Hiển thị kết quả

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
  usecase "Làm bài tập và xem kết quả" as UC1
  usecase "Tạo bài tập và câu hỏi" as UC2
  usecase "Chấm điểm" as UC3
  usecase "Xem báo cáo" as UC4
}

Student --> UC1

Instructor --> UC2
Instructor --> UC3
Instructor --> UC4

Admin --> UC2
Admin --> UC3
Admin --> UC4

@enduml
```

### Hình 2.11: Sơ đồ hoạt động quy trình làm bài tập và chấm điểm

```plantuml
@startuml
start
:Giảng viên tạo bài tập\nvà thêm câu hỏi;
:Xuất bản bài tập;
:Học viên làm bài và nộp bài;
:Hệ thống chấm điểm tự động\n(câu hỏi trắc nghiệm);
if (Có câu hỏi tự luận?) then (Có)
  :Giảng viên chấm điểm thủ công;
else (Không)
endif
:Học viên xem kết quả và lời giải;
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

Student -> FE: Làm bài tập
FE -> API: GET /api/assignments/{id}
API -> DB: Lấy bài tập
DB --> API: Dữ liệu bài tập
API --> FE: Trả về
FE --> Student: Hiển thị

Student -> FE: Trả lời và nộp bài
FE -> API: POST /api/attempts/{id}/submit
API -> DB: Lưu câu trả lời
API -> API: Chấm điểm tự động
API -> DB: Lưu kết quả
API --> FE: Kết quả
FE --> Student: Hiển thị điểm và lời giải

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
  usecase "Xem và tham gia lớp học" as UC1
  usecase "Quản lý lớp học" as UC2
  usecase "Nhận thông báo" as UC3
}

Student --> UC1
Student --> UC3

Instructor --> UC1
Instructor --> UC2

Admin --> UC1
Admin --> UC2

@enduml
```

### Hình 2.14: Sơ đồ hoạt động quy trình tạo và tham gia lớp học trực tuyến

```plantuml
@startuml
start
:Giảng viên tạo lớp học\nvà nhập thông tin phòng họp;
:Hệ thống gửi thông báo\ncho học viên đã đăng ký;
:Hệ thống gửi thông báo nhắc nhở\n(15 phút trước khi bắt đầu);
:Đến thời gian lớp học;
:Học viên tham gia lớp học;
:Giảng viên bắt đầu và kết thúc lớp học;
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
participant "Email/Notification" as Notif

Instructor -> FE: Tạo lớp học
FE -> API: POST /api/live-classes
API -> DB: Lưu lớp học
API -> DB: Lấy danh sách học viên
API -> DB: Tạo thông báo
API -> Notif: Gửi email và notification
Notif --> API: Đã gửi
API --> FE: Thành công
FE --> Instructor: Hiển thị

note right of API: Scheduler tự động\nkiểm tra và gửi\nthông báo nhắc nhở\n(15 phút trước)

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
  usecase "Xem báo cáo doanh thu" as UC1
  usecase "Xem thống kê người dùng" as UC2
  usecase "Xem phân tích hiệu suất" as UC3
}

Instructor --> UC1
Instructor --> UC3

Admin --> UC1
Admin --> UC2
Admin --> UC3

@enduml
```

### Hình 2.17: Sơ đồ hoạt động quy trình xem báo cáo doanh thu

```plantuml
@startuml
start
:Chọn loại báo cáo\nvà khoảng thời gian;
if (Loại báo cáo?) then (Doanh thu Admin)
  :Tính doanh thu từ admin items\n+ chiết khấu từ giảng viên;
elseif (Doanh thu Giảng viên) then
  :Tính doanh thu gộp,\nchiết khấu, thu nhập thực tế;
else (Doanh thu Chi tiết/Tổng hợp)
  :Tính doanh thu theo\nkhóa học, sách, giảng viên;
endif
:Hiển thị báo cáo và biểu đồ;
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

Admin -> FE: Chọn loại báo cáo và thời gian
FE -> API: GET /api/admin/reports/{type}
API -> DB: Tính toán doanh thu
DB --> API: Dữ liệu doanh thu
API --> FE: Trả về dữ liệu
FE --> Admin: Hiển thị báo cáo và biểu đồ

@enduml
```
