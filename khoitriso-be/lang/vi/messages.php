<?php

return [
    // Authentication
    'auth' => [
        'failed' => 'Thông tin đăng nhập không chính xác.',
        'password' => 'Mật khẩu không đúng.',
        'throttle' => 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau :seconds giây.',
        'login_success' => 'Đăng nhập thành công!',
        'logout_success' => 'Đăng xuất thành công!',
        'register_success' => 'Đăng ký thành công!',
        'unauthorized' => 'Không có quyền truy cập.',
        'token_invalid' => 'Token không hợp lệ.',
        'token_expired' => 'Token đã hết hạn.',
        'email_verified' => 'Email đã được xác thực!',
        'verification_sent' => 'Link xác thực đã được gửi đến email của bạn.',
        'password_reset_sent' => 'Link đặt lại mật khẩu đã được gửi.',
        'password_reset_success' => 'Đặt lại mật khẩu thành công!',
        'password_changed' => 'Đổi mật khẩu thành công!',
    ],

    // Validation
    'validation' => [
        'required' => 'Trường :attribute là bắt buộc.',
        'email' => 'Email không đúng định dạng.',
        'min' => [
            'string' => ':attribute phải có ít nhất :min ký tự.',
        ],
        'max' => [
            'string' => ':attribute không được vượt quá :max ký tự.',
        ],
        'confirmed' => 'Xác nhận :attribute không khớp.',
        'unique' => ':attribute đã tồn tại.',
        'exists' => ':attribute không tồn tại.',
        'in' => ':attribute không hợp lệ.',
        'numeric' => ':attribute phải là số.',
        'array' => ':attribute phải là mảng.',
        'boolean' => ':attribute phải là true hoặc false.',
        'date' => ':attribute không phải là ngày hợp lệ.',
        'image' => ':attribute phải là ảnh.',
        'mimes' => ':attribute phải có định dạng: :values.',
    ],

    // Courses
    'course' => [
        'created' => 'Khóa học được tạo thành công!',
        'updated' => 'Khóa học được cập nhật thành công!',
        'deleted' => 'Khóa học được xóa thành công!',
        'not_found' => 'Không tìm thấy khóa học.',
        'enrolled' => 'Đăng ký khóa học thành công!',
        'already_enrolled' => 'Bạn đã đăng ký khóa học này rồi.',
        'enrollment_failed' => 'Đăng ký khóa học thất bại.',
    ],

    // Lessons
    'lesson' => [
        'created' => 'Bài học được tạo thành công!',
        'updated' => 'Bài học được cập nhật thành công!',
        'deleted' => 'Bài học được xóa thành công!',
        'not_found' => 'Không tìm thấy bài học.',
        'completed' => 'Hoàn thành bài học!',
    ],

    // Books
    'book' => [
        'created' => 'Sách được tạo thành công!',
        'updated' => 'Sách được cập nhật thành công!',
        'deleted' => 'Sách được xóa thành công!',
        'not_found' => 'Không tìm thấy sách.',
        'activated' => 'Kích hoạt sách thành công!',
        'activation_failed' => 'Mã kích hoạt không hợp lệ hoặc đã được sử dụng.',
        'activation_expired' => 'Mã kích hoạt đã hết hạn.',
    ],

    // Forum
    'forum' => [
        'question_created' => 'Câu hỏi được tạo thành công!',
        'question_updated' => 'Câu hỏi được cập nhật thành công!',
        'question_deleted' => 'Câu hỏi được xóa thành công!',
        'question_not_found' => 'Không tìm thấy câu hỏi.',
        'answer_created' => 'Câu trả lời được tạo thành công!',
        'answer_updated' => 'Câu trả lời được cập nhật thành công!',
        'answer_deleted' => 'Câu trả lời được xóa thành công!',
        'answer_accepted' => 'Đã chấp nhận câu trả lời!',
        'comment_created' => 'Bình luận được tạo thành công!',
        'comment_updated' => 'Bình luận được cập nhật thành công!',
        'comment_deleted' => 'Bình luận được xóa thành công!',
        'vote_added' => 'Đã vote!',
        'vote_removed' => 'Đã bỏ vote!',
        'vote_updated' => 'Đã cập nhật vote!',
        'bookmarked' => 'Đã lưu câu hỏi!',
        'bookmark_removed' => 'Đã bỏ lưu câu hỏi!',
        'category_created' => 'Danh mục được tạo thành công!',
        'category_updated' => 'Danh mục được cập nhật thành công!',
        'category_deleted' => 'Danh mục được xóa thành công!',
        'tag_created' => 'Tag được tạo thành công!',
        'tag_updated' => 'Tag được cập nhật thành công!',
        'tag_deleted' => 'Tag được xóa thành công!',
        'question_closed' => 'Câu hỏi này đã đóng.',
        'only_owner_accept' => 'Chỉ người tạo câu hỏi mới có thể chấp nhận câu trả lời.',
        'cannot_delete_category' => 'Không thể xóa danh mục có câu hỏi.',
    ],

    // Orders
    'order' => [
        'created' => 'Đơn hàng được tạo thành công!',
        'updated' => 'Đơn hàng được cập nhật thành công!',
        'cancelled' => 'Đơn hàng đã được hủy.',
        'not_found' => 'Không tìm thấy đơn hàng.',
        'payment_success' => 'Thanh toán thành công!',
        'payment_failed' => 'Thanh toán thất bại.',
    ],

    // Coupons
    'coupon' => [
        'valid' => 'Mã giảm giá hợp lệ!',
        'invalid' => 'Mã giảm giá không hợp lệ.',
        'expired' => 'Mã giảm giá đã hết hạn.',
        'used' => 'Bạn đã sử dụng mã giảm giá này rồi.',
        'limit_reached' => 'Mã giảm giá đã hết lượt sử dụng.',
    ],

    // Cart
    'cart' => [
        'added' => 'Đã thêm vào giỏ hàng!',
        'updated' => 'Giỏ hàng được cập nhật!',
        'removed' => 'Đã xóa khỏi giỏ hàng!',
        'cleared' => 'Giỏ hàng đã được xóa!',
        'empty' => 'Giỏ hàng trống.',
    ],

    // Wishlist
    'wishlist' => [
        'added' => 'Đã thêm vào danh sách yêu thích!',
        'removed' => 'Đã xóa khỏi danh sách yêu thích!',
        'cleared' => 'Danh sách yêu thích đã được xóa!',
    ],

    // Assignments
    'assignment' => [
        'created' => 'Bài tập được tạo thành công!',
        'updated' => 'Bài tập được cập nhật thành công!',
        'deleted' => 'Bài tập được xóa thành công!',
        'started' => 'Bắt đầu làm bài tập!',
        'submitted' => 'Nộp bài thành công!',
        'not_found' => 'Không tìm thấy bài tập.',
    ],

    // Reviews
    'review' => [
        'created' => 'Đánh giá được tạo thành công!',
        'updated' => 'Đánh giá được cập nhật thành công!',
        'deleted' => 'Đánh giá được xóa thành công!',
    ],

    // Certificates
    'certificate' => [
        'generated' => 'Chứng chỉ được tạo thành công!',
        'not_found' => 'Không tìm thấy chứng chỉ.',
        'verified' => 'Chứng chỉ hợp lệ!',
        'invalid' => 'Chứng chỉ không hợp lệ.',
    ],

    // Notifications
    'notification' => [
        'marked_read' => 'Đã đánh dấu đã đọc!',
        'marked_all_read' => 'Đã đánh dấu tất cả đã đọc!',
    ],

    // Upload
    'upload' => [
        'success' => 'Tải lên thành công!',
        'failed' => 'Tải lên thất bại.',
        'invalid_type' => 'Loại file không hợp lệ.',
        'too_large' => 'File quá lớn.',
    ],

    // General
    'success' => 'Thành công!',
    'error' => 'Có lỗi xảy ra.',
    'not_found' => 'Không tìm thấy.',
    'created' => 'Tạo thành công!',
    'updated' => 'Cập nhật thành công!',
    'deleted' => 'Xóa thành công!',
    'saved' => 'Lưu thành công!',
];
