<?php

return [
    // Authentication
    'auth' => [
        'failed' => 'These credentials do not match our records.',
        'password' => 'The password is incorrect.',
        'throttle' => 'Too many login attempts. Please try again in :seconds seconds.',
        'login_success' => 'Login successful!',
        'logout_success' => 'Logout successful!',
        'register_success' => 'Registration successful!',
        'unauthorized' => 'Unauthorized access.',
        'token_invalid' => 'Invalid token.',
        'token_expired' => 'Token expired.',
        'email_verified' => 'Email verified successfully!',
        'verification_sent' => 'Verification link sent to your email.',
        'password_reset_sent' => 'Password reset link sent.',
        'password_reset_success' => 'Password reset successfully!',
        'password_changed' => 'Password changed successfully!',
    ],

    // Validation
    'validation' => [
        'required' => 'The :attribute field is required.',
        'email' => 'The :attribute must be a valid email address.',
        'min' => [
            'string' => 'The :attribute must be at least :min characters.',
        ],
        'max' => [
            'string' => 'The :attribute must not exceed :max characters.',
        ],
        'confirmed' => 'The :attribute confirmation does not match.',
        'unique' => 'The :attribute already exists.',
        'exists' => 'The :attribute does not exist.',
        'in' => 'The :attribute is invalid.',
        'numeric' => 'The :attribute must be a number.',
        'array' => 'The :attribute must be an array.',
        'boolean' => 'The :attribute must be true or false.',
        'date' => 'The :attribute is not a valid date.',
        'image' => 'The :attribute must be an image.',
        'mimes' => 'The :attribute must be a file of type: :values.',
    ],

    // Courses
    'course' => [
        'created' => 'Course created successfully!',
        'updated' => 'Course updated successfully!',
        'deleted' => 'Course deleted successfully!',
        'not_found' => 'Course not found.',
        'enrolled' => 'Enrolled in course successfully!',
        'already_enrolled' => 'You are already enrolled in this course.',
        'enrollment_failed' => 'Course enrollment failed.',
    ],

    // Lessons
    'lesson' => [
        'created' => 'Lesson created successfully!',
        'updated' => 'Lesson updated successfully!',
        'deleted' => 'Lesson deleted successfully!',
        'not_found' => 'Lesson not found.',
        'completed' => 'Lesson completed!',
    ],

    // Books
    'book' => [
        'created' => 'Book created successfully!',
        'updated' => 'Book updated successfully!',
        'deleted' => 'Book deleted successfully!',
        'not_found' => 'Book not found.',
        'activated' => 'Book activated successfully!',
        'activation_failed' => 'Invalid or already used activation code.',
        'activation_expired' => 'Activation code expired.',
    ],

    // Forum
    'forum' => [
        'question_created' => 'Question created successfully!',
        'question_updated' => 'Question updated successfully!',
        'question_deleted' => 'Question deleted successfully!',
        'question_not_found' => 'Question not found.',
        'answer_created' => 'Answer created successfully!',
        'answer_updated' => 'Answer updated successfully!',
        'answer_deleted' => 'Answer deleted successfully!',
        'answer_accepted' => 'Answer accepted!',
        'comment_created' => 'Comment created successfully!',
        'comment_updated' => 'Comment updated successfully!',
        'comment_deleted' => 'Comment deleted successfully!',
        'vote_added' => 'Vote added!',
        'vote_removed' => 'Vote removed!',
        'vote_updated' => 'Vote updated!',
        'bookmarked' => 'Question bookmarked!',
        'bookmark_removed' => 'Bookmark removed!',
        'category_created' => 'Category created successfully!',
        'category_updated' => 'Category updated successfully!',
        'category_deleted' => 'Category deleted successfully!',
        'tag_created' => 'Tag created successfully!',
        'tag_updated' => 'Tag updated successfully!',
        'tag_deleted' => 'Tag deleted successfully!',
        'question_closed' => 'This question is closed.',
        'only_owner_accept' => 'Only the question owner can accept answers.',
        'cannot_delete_category' => 'Cannot delete category with questions.',
    ],

    // Orders
    'order' => [
        'created' => 'Order created successfully!',
        'updated' => 'Order updated successfully!',
        'cancelled' => 'Order cancelled successfully!',
        'not_found' => 'Order not found.',
        'payment_success' => 'Payment successful!',
        'payment_failed' => 'Payment failed.',
    ],

    // Coupons
    'coupon' => [
        'valid' => 'Coupon is valid!',
        'invalid' => 'Invalid coupon code.',
        'expired' => 'Coupon expired.',
        'used' => 'You have already used this coupon.',
        'limit_reached' => 'Coupon usage limit reached.',
    ],

    // Cart
    'cart' => [
        'added' => 'Added to cart!',
        'updated' => 'Cart updated!',
        'removed' => 'Removed from cart!',
        'cleared' => 'Cart cleared!',
        'empty' => 'Cart is empty.',
    ],

    // Wishlist
    'wishlist' => [
        'added' => 'Added to wishlist!',
        'removed' => 'Removed from wishlist!',
        'cleared' => 'Wishlist cleared!',
    ],

    // Assignments
    'assignment' => [
        'created' => 'Assignment created successfully!',
        'updated' => 'Assignment updated successfully!',
        'deleted' => 'Assignment deleted successfully!',
        'started' => 'Assignment started!',
        'submitted' => 'Assignment submitted successfully!',
        'not_found' => 'Assignment not found.',
    ],

    // Reviews
    'review' => [
        'created' => 'Review created successfully!',
        'updated' => 'Review updated successfully!',
        'deleted' => 'Review deleted successfully!',
    ],

    // Certificates
    'certificate' => [
        'generated' => 'Certificate generated successfully!',
        'not_found' => 'Certificate not found.',
        'verified' => 'Certificate is valid!',
        'invalid' => 'Invalid certificate.',
    ],

    // Notifications
    'notification' => [
        'marked_read' => 'Marked as read!',
        'marked_all_read' => 'All notifications marked as read!',
    ],

    // Upload
    'upload' => [
        'success' => 'Upload successful!',
        'failed' => 'Upload failed.',
        'invalid_type' => 'Invalid file type.',
        'too_large' => 'File too large.',
    ],

    // General
    'success' => 'Success!',
    'error' => 'An error occurred.',
    'not_found' => 'Not found.',
    'created' => 'Created successfully!',
    'updated' => 'Updated successfully!',
    'deleted' => 'Deleted successfully!',
    'saved' => 'Saved successfully!',
];
