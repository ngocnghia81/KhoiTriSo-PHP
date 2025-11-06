/**
 * Vietnamese Translations
 */

export const vi = {
  // Common
  common: {
    loading: 'Đang tải...',
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Sửa',
    add: 'Thêm',
    search: 'Tìm kiếm',
    filter: 'Lọc',
    submit: 'Gửi',
    back: 'Quay lại',
    next: 'Tiếp theo',
    previous: 'Trước',
    confirm: 'Xác nhận',
    success: 'Thành công',
    error: 'Lỗi',
    warning: 'Cảnh báo',
    info: 'Thông tin',
    yes: 'Có',
    no: 'Không',
  },

  // Navigation
  nav: {
    home: 'Trang chủ',
    courses: 'Khóa học',
    books: 'Sách',
    forum: 'Diễn đàn',
    about: 'Giới thiệu',
    contact: 'Liên hệ',
    cart: 'Giỏ hàng',
    profile: 'Hồ sơ',
    dashboard: 'Bảng điều khiển',
    logout: 'Đăng xuất',
    login: 'Đăng nhập',
    register: 'Đăng ký',
  },

  // Auth
  auth: {
    login: 'Đăng nhập',
    register: 'Đăng ký',
    logout: 'Đăng xuất',
    email: 'Email',
    password: 'Mật khẩu',
    confirmPassword: 'Xác nhận mật khẩu',
    forgotPassword: 'Quên mật khẩu?',
    rememberMe: 'Ghi nhớ đăng nhập',
    alreadyHaveAccount: 'Đã có tài khoản?',
    dontHaveAccount: 'Chưa có tài khoản?',
    loginSuccess: 'Đăng nhập thành công',
    registerSuccess: 'Đăng ký thành công',
    logoutSuccess: 'Đăng xuất thành công',
  },

  // Error Messages (from backend messageCode)
  errors: {
    // Generic
    VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
    NOT_FOUND: 'Không tìm thấy',
    UNAUTHORIZED: 'Chưa đăng nhập',
    FORBIDDEN: 'Không có quyền truy cập',
    INTERNAL_ERROR: 'Lỗi hệ thống',
    BAD_REQUEST: 'Yêu cầu không hợp lệ',
    
    // Auth
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
    TOKEN_EXPIRED: 'Phiên đăng nhập hết hạn',
    TOKEN_INVALID: 'Token không hợp lệ',
    EMAIL_ALREADY_EXISTS: 'Email đã được sử dụng',
    
    // User
    USER_NOT_FOUND: 'Không tìm thấy người dùng',
    USER_INACTIVE: 'Tài khoản chưa được kích hoạt',
    EMAIL_NOT_VERIFIED: 'Email chưa được xác thực',
    
    // Course
    COURSE_NOT_FOUND: 'Không tìm thấy khóa học',
    ALREADY_ENROLLED: 'Bạn đã đăng ký khóa học này',
    COURSE_FULL: 'Khóa học đã đầy',
    
    // Book
    BOOK_NOT_FOUND: 'Không tìm thấy sách',
    INVALID_ACTIVATION_CODE: 'Mã kích hoạt không hợp lệ',
    ACTIVATION_CODE_ALREADY_USED: 'Mã kích hoạt đã được sử dụng',
    
    // Order
    ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng',
    ORDER_CANNOT_CANCEL: 'Không thể hủy đơn hàng này',
    INVALID_STATUS: 'Trạng thái không hợp lệ',
    
    // Cart
    CART_ITEM_EXISTS: 'Sản phẩm đã có trong giỏ hàng',
    CART_ITEM_NOT_FOUND: 'Không tìm thấy sản phẩm trong giỏ hàng',
    
    // Wishlist
    WISHLIST_ITEM_EXISTS: 'Sản phẩm đã có trong danh sách yêu thích',
    WISHLIST_ITEM_NOT_FOUND: 'Không tìm thấy sản phẩm trong danh sách yêu thích',
    
    // File
    FILE_UPLOAD_ERROR: 'Lỗi tải file lên',
    FILE_TOO_LARGE: 'File quá lớn',
    INVALID_FILE_TYPE: 'Loại file không hợp lệ',
    
    // Payment
    PAYMENT_FAILED: 'Thanh toán thất bại',
    INVALID_COUPON: 'Mã giảm giá không hợp lệ',
    COUPON_EXPIRED: 'Mã giảm giá đã hết hạn',
    
    // Other
    RESOURCE_NOT_FOUND: 'Không tìm thấy tài nguyên',
    PERMISSION_DENIED: 'Không có quyền',
    TOO_MANY_REQUESTS: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
    
    // Default
    UNKNOWN_ERROR: 'Đã xảy ra lỗi',
    NETWORK_ERROR: 'Lỗi kết nối mạng',
  },

  // Success Messages
  success: {
    SUCCESS: 'Thành công',
    CREATED_SUCCESS: 'Tạo mới thành công',
    UPDATED_SUCCESS: 'Cập nhật thành công',
    DELETED_SUCCESS: 'Xóa thành công',
  },

  // Course
  course: {
    title: 'Khóa học',
    allCourses: 'Tất cả khóa học',
    myCourses: 'Khóa học của tôi',
    enrolledCourses: 'Khóa học đã đăng ký',
    instructor: 'Giảng viên',
    duration: 'Thời lượng',
    students: 'Học viên',
    lessons: 'Bài học',
    enroll: 'Đăng ký',
    enrolled: 'Đã đăng ký',
    rating: 'Đánh giá',
    price: 'Giá',
    free: 'Miễn phí',
    addToCart: 'Thêm vào giỏ',
    buyNow: 'Mua ngay',
  },

  // Book
  book: {
    title: 'Sách',
    allBooks: 'Tất cả sách',
    myBooks: 'Sách của tôi',
    author: 'Tác giả',
    publisher: 'Nhà xuất bản',
    pages: 'Trang',
    activationCode: 'Mã kích hoạt',
    enterCode: 'Nhập mã kích hoạt',
    activate: 'Kích hoạt',
    download: 'Tải xuống',
    read: 'Đọc',
  },

  // Cart
  cart: {
    title: 'Giỏ hàng',
    empty: 'Giỏ hàng trống',
    total: 'Tổng cộng',
    subtotal: 'Tạm tính',
    discount: 'Giảm giá',
    checkout: 'Thanh toán',
    continueShopping: 'Tiếp tục mua sắm',
    remove: 'Xóa',
    quantity: 'Số lượng',
  },

  // Order
  order: {
    title: 'Đơn hàng',
    myOrders: 'Đơn hàng của tôi',
    orderHistory: 'Lịch sử đơn hàng',
    orderNumber: 'Mã đơn hàng',
    orderDate: 'Ngày đặt',
    status: 'Trạng thái',
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    cancel: 'Hủy đơn',
  },

  // Forum
  forum: {
    title: 'Diễn đàn',
    askQuestion: 'Đặt câu hỏi',
    answer: 'Trả lời',
    answers: 'câu trả lời',
    views: 'lượt xem',
    votes: 'điểm',
    tags: 'Thẻ',
    recent: 'Gần đây',
    popular: 'Phổ biến',
    unanswered: 'Chưa trả lời',
  },

  // Profile
  profile: {
    title: 'Hồ sơ',
    editProfile: 'Chỉnh sửa hồ sơ',
    changePassword: 'Đổi mật khẩu',
    settings: 'Cài đặt',
    name: 'Tên',
    email: 'Email',
    phone: 'Điện thoại',
    address: 'Địa chỉ',
    bio: 'Giới thiệu',
    avatar: 'Ảnh đại diện',
    uploadAvatar: 'Tải ảnh lên',
  },

  // Pagination
  pagination: {
    page: 'Trang',
    of: 'của',
    showing: 'Hiển thị',
    to: 'đến',
    results: 'kết quả',
    previous: 'Trước',
    next: 'Tiếp',
  },
};

export type TranslationKeys = typeof vi;

