<?php

use App\Constants\MessageCode;

/**
 * Message Templates cho từng ngôn ngữ
 */
return [
    'vi' => [
        // ===== SUCCESS MESSAGES =====
        MessageCode::SUCCESS => 'Thành công',
        MessageCode::CREATED_SUCCESS => 'Tạo mới thành công',
        MessageCode::UPDATED_SUCCESS => 'Cập nhật thành công',
        MessageCode::DELETED_SUCCESS => 'Xóa thành công',

        // ===== AUTH MESSAGES =====
        MessageCode::LOGIN_SUCCESS => 'Đăng nhập thành công',
        MessageCode::LOGOUT_SUCCESS => 'Đăng xuất thành công',
        MessageCode::REGISTER_SUCCESS => 'Đăng ký thành công',
        MessageCode::PASSWORD_RESET_SUCCESS => 'Đặt lại mật khẩu thành công',
        MessageCode::EMAIL_VERIFIED_SUCCESS => 'Xác thực email thành công',
        MessageCode::PROFILE_UPDATED_SUCCESS => 'Cập nhật thông tin thành công',
        MessageCode::PROFILE_RETRIEVED_SUCCESS => 'Lấy thông tin profile thành công',

        // ===== USER MESSAGES =====
        MessageCode::USER_CREATED_SUCCESS => 'Tạo người dùng thành công',
        MessageCode::USER_UPDATED_SUCCESS => 'Cập nhật người dùng thành công',
        MessageCode::USER_DELETED_SUCCESS => 'Xóa người dùng thành công',
        MessageCode::USER_LIST_SUCCESS => 'Lấy danh sách người dùng thành công',
        MessageCode::USER_DETAIL_SUCCESS => 'Lấy thông tin người dùng thành công',

        // ===== COURSE MESSAGES =====
        MessageCode::COURSE_CREATED_SUCCESS => 'Tạo khóa học thành công',
        MessageCode::COURSE_UPDATED_SUCCESS => 'Cập nhật khóa học thành công',
        MessageCode::COURSE_DELETED_SUCCESS => 'Xóa khóa học thành công',
        MessageCode::COURSE_LIST_SUCCESS => 'Lấy danh sách khóa học thành công',
        MessageCode::COURSE_DETAIL_SUCCESS => 'Lấy thông tin khóa học thành công',
        MessageCode::COURSE_ENROLLED_SUCCESS => 'Đăng ký khóa học thành công',

        // ===== LESSON MESSAGES =====
        MessageCode::LESSON_CREATED_SUCCESS => 'Tạo bài học thành công',
        MessageCode::LESSON_UPDATED_SUCCESS => 'Cập nhật bài học thành công',
        MessageCode::LESSON_DELETED_SUCCESS => 'Xóa bài học thành công',
        MessageCode::LESSON_LIST_SUCCESS => 'Lấy danh sách bài học thành công',
        MessageCode::LESSON_DETAIL_SUCCESS => 'Lấy thông tin bài học thành công',
        MessageCode::LESSON_COMPLETED_SUCCESS => 'Hoàn thành bài học thành công',

        // ===== BOOK MESSAGES =====
        MessageCode::BOOK_CREATED_SUCCESS => 'Tạo sách thành công',
        MessageCode::BOOK_UPDATED_SUCCESS => 'Cập nhật sách thành công',
        MessageCode::BOOK_DELETED_SUCCESS => 'Xóa sách thành công',
        MessageCode::BOOK_LIST_SUCCESS => 'Lấy danh sách sách thành công',
        MessageCode::BOOK_DETAIL_SUCCESS => 'Lấy thông tin sách thành công',
        MessageCode::BOOK_ACTIVATED_SUCCESS => 'Kích hoạt sách thành công',

        // ===== CATEGORY MESSAGES =====
        MessageCode::CATEGORY_CREATED_SUCCESS => 'Tạo danh mục thành công',
        MessageCode::CATEGORY_UPDATED_SUCCESS => 'Cập nhật danh mục thành công',
        MessageCode::CATEGORY_DELETED_SUCCESS => 'Xóa danh mục thành công',
        MessageCode::CATEGORY_LIST_SUCCESS => 'Lấy danh sách danh mục thành công',
        MessageCode::CATEGORY_DETAIL_SUCCESS => 'Lấy thông tin danh mục thành công',

        // ===== ORDER MESSAGES =====
        MessageCode::ORDER_CREATED_SUCCESS => 'Tạo đơn hàng thành công',
        MessageCode::ORDER_UPDATED_SUCCESS => 'Cập nhật đơn hàng thành công',
        MessageCode::ORDER_CANCELLED_SUCCESS => 'Hủy đơn hàng thành công',
        MessageCode::ORDER_LIST_SUCCESS => 'Lấy danh sách đơn hàng thành công',
        MessageCode::ORDER_DETAIL_SUCCESS => 'Lấy thông tin đơn hàng thành công',

        // ===== CART MESSAGES =====
        MessageCode::CART_ITEM_ADDED_SUCCESS => 'Thêm vào giỏ hàng thành công',
        MessageCode::CART_ITEM_UPDATED_SUCCESS => 'Cập nhật giỏ hàng thành công',
        MessageCode::CART_ITEM_DELETED_SUCCESS => 'Xóa khỏi giỏ hàng thành công',
        MessageCode::CART_CLEARED_SUCCESS => 'Xóa giỏ hàng thành công',
        MessageCode::CART_LIST_SUCCESS => 'Lấy giỏ hàng thành công',

        // ===== NOTIFICATION MESSAGES =====
        MessageCode::NOTIFICATION_CREATED_SUCCESS => 'Tạo thông báo thành công',
        MessageCode::NOTIFICATION_LIST_SUCCESS => 'Lấy danh sách thông báo thành công',
        MessageCode::NOTIFICATION_READ_SUCCESS => 'Đánh dấu thông báo đã đọc thành công',
        MessageCode::NOTIFICATION_DELETED_SUCCESS => 'Xóa thông báo thành công',

        // ===== FORUM MESSAGES =====
        MessageCode::QUESTION_CREATED_SUCCESS => 'Tạo câu hỏi thành công',
        MessageCode::QUESTION_UPDATED_SUCCESS => 'Cập nhật câu hỏi thành công',
        MessageCode::QUESTION_DELETED_SUCCESS => 'Xóa câu hỏi thành công',
        MessageCode::QUESTION_LIST_SUCCESS => 'Lấy danh sách câu hỏi thành công',
        MessageCode::QUESTION_DETAIL_SUCCESS => 'Lấy thông tin câu hỏi thành công',

        // ===== CERTIFICATE MESSAGES =====
        MessageCode::CERTIFICATE_GENERATED_SUCCESS => 'Tạo chứng chỉ thành công',
        MessageCode::CERTIFICATE_LIST_SUCCESS => 'Lấy danh sách chứng chỉ thành công',
        MessageCode::CERTIFICATE_DETAIL_SUCCESS => 'Lấy thông tin chứng chỉ thành công',

        // ===== ERROR MESSAGES =====
        // Validation Errors
        MessageCode::VALIDATION_ERROR => 'Dữ liệu không hợp lệ',
        MessageCode::INVALID_EMAIL => 'Email không hợp lệ',
        MessageCode::INVALID_PASSWORD => 'Mật khẩu không hợp lệ',
        MessageCode::INVALID_PHONE_NUMBER => 'Số điện thoại không hợp lệ',

        // Authentication Errors
        MessageCode::UNAUTHORIZED => 'Không có quyền truy cập',
        MessageCode::FORBIDDEN => 'Bị cấm truy cập',
        MessageCode::TOKEN_EXPIRED => 'Token đã hết hạn',
        MessageCode::TOKEN_INVALID => 'Token không hợp lệ',
        MessageCode::INVALID_CREDENTIALS => 'Thông tin đăng nhập không chính xác',
        MessageCode::EMAIL_NOT_VERIFIED => 'Email chưa được xác thực',

        // Resource Errors
        MessageCode::NOT_FOUND => 'Không tìm thấy',
        MessageCode::RESOURCE_NOT_FOUND => 'Không tìm thấy tài nguyên',
        MessageCode::USER_NOT_FOUND => 'Không tìm thấy người dùng',
        MessageCode::COURSE_NOT_FOUND => 'Không tìm thấy khóa học',
        MessageCode::LESSON_NOT_FOUND => 'Không tìm thấy bài học',
        MessageCode::BOOK_NOT_FOUND => 'Không tìm thấy sách',
        MessageCode::CATEGORY_NOT_FOUND => 'Không tìm thấy danh mục',
        MessageCode::ORDER_NOT_FOUND => 'Không tìm thấy đơn hàng',
        MessageCode::CART_ITEM_NOT_FOUND => 'Không tìm thấy sản phẩm trong giỏ hàng',

        // Business Logic Errors
        MessageCode::EMAIL_ALREADY_EXISTS => 'Email đã tồn tại',
        MessageCode::ALREADY_ENROLLED => 'Đã đăng ký khóa học này',
        MessageCode::COURSE_FULL => 'Khóa học đã đầy',
        MessageCode::LESSON_NOT_AVAILABLE => 'Bài học chưa khả dụng',
        MessageCode::INSUFFICIENT_BALANCE => 'Số dư không đủ',
        MessageCode::INVALID_ACTIVATION_CODE => 'Mã kích hoạt không hợp lệ',
        MessageCode::ACTIVATION_CODE_ALREADY_USED => 'Mã kích hoạt đã được sử dụng',
        MessageCode::CART_EMPTY => 'Giỏ hàng trống',
        MessageCode::ORDER_CANNOT_CANCEL => 'Không thể hủy đơn hàng',

        // System Errors
        MessageCode::INTERNAL_SERVER_ERROR => 'Lỗi máy chủ nội bộ',
        MessageCode::DATABASE_ERROR => 'Lỗi cơ sở dữ liệu',
        MessageCode::EXTERNAL_SERVICE_ERROR => 'Lỗi dịch vụ bên ngoài',
        MessageCode::FILE_UPLOAD_ERROR => 'Lỗi tải tệp lên',

        // Rate Limiting
        MessageCode::RATE_LIMIT_EXCEEDED => 'Vượt quá giới hạn yêu cầu',
        MessageCode::TOO_MANY_REQUESTS => 'Quá nhiều yêu cầu',
    ],

    'en' => [
        // ===== SUCCESS MESSAGES =====
        MessageCode::SUCCESS => 'Success',
        MessageCode::CREATED_SUCCESS => 'Created successfully',
        MessageCode::UPDATED_SUCCESS => 'Updated successfully',
        MessageCode::DELETED_SUCCESS => 'Deleted successfully',

        // ===== AUTH MESSAGES =====
        MessageCode::LOGIN_SUCCESS => 'Login successful',
        MessageCode::LOGOUT_SUCCESS => 'Logout successful',
        MessageCode::REGISTER_SUCCESS => 'Registration successful',
        MessageCode::PASSWORD_RESET_SUCCESS => 'Password reset successfully',
        MessageCode::EMAIL_VERIFIED_SUCCESS => 'Email verified successfully',
        MessageCode::PROFILE_UPDATED_SUCCESS => 'Profile updated successfully',
        MessageCode::PROFILE_RETRIEVED_SUCCESS => 'Profile retrieved successfully',

        // ===== USER MESSAGES =====
        MessageCode::USER_CREATED_SUCCESS => 'User created successfully',
        MessageCode::USER_UPDATED_SUCCESS => 'User updated successfully',
        MessageCode::USER_DELETED_SUCCESS => 'User deleted successfully',
        MessageCode::USER_LIST_SUCCESS => 'User list retrieved successfully',
        MessageCode::USER_DETAIL_SUCCESS => 'User details retrieved successfully',

        // ===== COURSE MESSAGES =====
        MessageCode::COURSE_CREATED_SUCCESS => 'Course created successfully',
        MessageCode::COURSE_UPDATED_SUCCESS => 'Course updated successfully',
        MessageCode::COURSE_DELETED_SUCCESS => 'Course deleted successfully',
        MessageCode::COURSE_LIST_SUCCESS => 'Course list retrieved successfully',
        MessageCode::COURSE_DETAIL_SUCCESS => 'Course details retrieved successfully',
        MessageCode::COURSE_ENROLLED_SUCCESS => 'Enrolled in course successfully',

        // ===== LESSON MESSAGES =====
        MessageCode::LESSON_CREATED_SUCCESS => 'Lesson created successfully',
        MessageCode::LESSON_UPDATED_SUCCESS => 'Lesson updated successfully',
        MessageCode::LESSON_DELETED_SUCCESS => 'Lesson deleted successfully',
        MessageCode::LESSON_LIST_SUCCESS => 'Lesson list retrieved successfully',
        MessageCode::LESSON_DETAIL_SUCCESS => 'Lesson details retrieved successfully',
        MessageCode::LESSON_COMPLETED_SUCCESS => 'Lesson completed successfully',

        // ===== BOOK MESSAGES =====
        MessageCode::BOOK_CREATED_SUCCESS => 'Book created successfully',
        MessageCode::BOOK_UPDATED_SUCCESS => 'Book updated successfully',
        MessageCode::BOOK_DELETED_SUCCESS => 'Book deleted successfully',
        MessageCode::BOOK_LIST_SUCCESS => 'Book list retrieved successfully',
        MessageCode::BOOK_DETAIL_SUCCESS => 'Book details retrieved successfully',
        MessageCode::BOOK_ACTIVATED_SUCCESS => 'Book activated successfully',

        // ===== CATEGORY MESSAGES =====
        MessageCode::CATEGORY_CREATED_SUCCESS => 'Category created successfully',
        MessageCode::CATEGORY_UPDATED_SUCCESS => 'Category updated successfully',
        MessageCode::CATEGORY_DELETED_SUCCESS => 'Category deleted successfully',
        MessageCode::CATEGORY_LIST_SUCCESS => 'Category list retrieved successfully',
        MessageCode::CATEGORY_DETAIL_SUCCESS => 'Category details retrieved successfully',

        // ===== ORDER MESSAGES =====
        MessageCode::ORDER_CREATED_SUCCESS => 'Order created successfully',
        MessageCode::ORDER_UPDATED_SUCCESS => 'Order updated successfully',
        MessageCode::ORDER_CANCELLED_SUCCESS => 'Order cancelled successfully',
        MessageCode::ORDER_LIST_SUCCESS => 'Order list retrieved successfully',
        MessageCode::ORDER_DETAIL_SUCCESS => 'Order details retrieved successfully',

        // ===== CART MESSAGES =====
        MessageCode::CART_ITEM_ADDED_SUCCESS => 'Item added to cart successfully',
        MessageCode::CART_ITEM_UPDATED_SUCCESS => 'Cart item updated successfully',
        MessageCode::CART_ITEM_DELETED_SUCCESS => 'Cart item deleted successfully',
        MessageCode::CART_CLEARED_SUCCESS => 'Cart cleared successfully',
        MessageCode::CART_LIST_SUCCESS => 'Cart retrieved successfully',

        // ===== NOTIFICATION MESSAGES =====
        MessageCode::NOTIFICATION_CREATED_SUCCESS => 'Notification created successfully',
        MessageCode::NOTIFICATION_LIST_SUCCESS => 'Notifications retrieved successfully',
        MessageCode::NOTIFICATION_READ_SUCCESS => 'Notification marked as read successfully',
        MessageCode::NOTIFICATION_DELETED_SUCCESS => 'Notification deleted successfully',

        // ===== FORUM MESSAGES =====
        MessageCode::QUESTION_CREATED_SUCCESS => 'Question created successfully',
        MessageCode::QUESTION_UPDATED_SUCCESS => 'Question updated successfully',
        MessageCode::QUESTION_DELETED_SUCCESS => 'Question deleted successfully',
        MessageCode::QUESTION_LIST_SUCCESS => 'Question list retrieved successfully',
        MessageCode::QUESTION_DETAIL_SUCCESS => 'Question details retrieved successfully',

        // ===== CERTIFICATE MESSAGES =====
        MessageCode::CERTIFICATE_GENERATED_SUCCESS => 'Certificate generated successfully',
        MessageCode::CERTIFICATE_LIST_SUCCESS => 'Certificate list retrieved successfully',
        MessageCode::CERTIFICATE_DETAIL_SUCCESS => 'Certificate details retrieved successfully',

        // ===== ERROR MESSAGES =====
        // Validation Errors
        MessageCode::VALIDATION_ERROR => 'Validation error',
        MessageCode::INVALID_EMAIL => 'Invalid email',
        MessageCode::INVALID_PASSWORD => 'Invalid password',
        MessageCode::INVALID_PHONE_NUMBER => 'Invalid phone number',

        // Authentication Errors
        MessageCode::UNAUTHORIZED => 'Unauthorized',
        MessageCode::FORBIDDEN => 'Forbidden',
        MessageCode::TOKEN_EXPIRED => 'Token expired',
        MessageCode::TOKEN_INVALID => 'Invalid token',
        MessageCode::INVALID_CREDENTIALS => 'Invalid credentials',
        MessageCode::EMAIL_NOT_VERIFIED => 'Email not verified',

        // Resource Errors
        MessageCode::NOT_FOUND => 'Not found',
        MessageCode::RESOURCE_NOT_FOUND => 'Resource not found',
        MessageCode::USER_NOT_FOUND => 'User not found',
        MessageCode::COURSE_NOT_FOUND => 'Course not found',
        MessageCode::LESSON_NOT_FOUND => 'Lesson not found',
        MessageCode::BOOK_NOT_FOUND => 'Book not found',
        MessageCode::CATEGORY_NOT_FOUND => 'Category not found',
        MessageCode::ORDER_NOT_FOUND => 'Order not found',
        MessageCode::CART_ITEM_NOT_FOUND => 'Cart item not found',

        // Business Logic Errors
        MessageCode::EMAIL_ALREADY_EXISTS => 'Email already exists',
        MessageCode::ALREADY_ENROLLED => 'Already enrolled in this course',
        MessageCode::COURSE_FULL => 'Course is full',
        MessageCode::LESSON_NOT_AVAILABLE => 'Lesson not available',
        MessageCode::INSUFFICIENT_BALANCE => 'Insufficient balance',
        MessageCode::INVALID_ACTIVATION_CODE => 'Invalid activation code',
        MessageCode::ACTIVATION_CODE_ALREADY_USED => 'Activation code already used',
        MessageCode::CART_EMPTY => 'Cart is empty',
        MessageCode::ORDER_CANNOT_CANCEL => 'Cannot cancel order',

        // System Errors
        MessageCode::INTERNAL_SERVER_ERROR => 'Internal server error',
        MessageCode::DATABASE_ERROR => 'Database error',
        MessageCode::EXTERNAL_SERVICE_ERROR => 'External service error',
        MessageCode::FILE_UPLOAD_ERROR => 'File upload error',

        // Rate Limiting
        MessageCode::RATE_LIMIT_EXCEEDED => 'Rate limit exceeded',
        MessageCode::TOO_MANY_REQUESTS => 'Too many requests',
    ],

    // Default language
    'default' => 'vi',

    // Supported languages
    'supported' => ['vi', 'en'],
];

