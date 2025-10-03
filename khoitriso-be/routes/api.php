<?php

use Illuminate\Support\Facades\Route;

// Public health endpoint
Route::get('system/health', [\App\Http\Controllers\SystemController::class, 'health']);

Route::prefix('auth')->group(function () {
    Route::post('register', [\App\Http\Controllers\AuthController::class, 'register']);
    Route::post('login', [\App\Http\Controllers\AuthController::class, 'login']);
    Route::post('refresh', [\App\Http\Controllers\AuthController::class, 'refresh']);
    Route::post('forgot-password', [\App\Http\Controllers\AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [\App\Http\Controllers\AuthController::class, 'resetPassword']);
    Route::post('verify-email', [\App\Http\Controllers\AuthController::class, 'verifyEmail']);
    Route::post('resend-verification', [\App\Http\Controllers\AuthController::class, 'resendVerification']);

    // OAuth Students
    Route::get('google', [\App\Http\Controllers\OauthController::class, 'studentGoogle']);
    Route::get('google/callback', [\App\Http\Controllers\OauthController::class, 'studentGoogleCallback']);
    Route::get('facebook', [\App\Http\Controllers\OauthController::class, 'studentFacebook']);
    Route::get('facebook/callback', [\App\Http\Controllers\OauthController::class, 'studentFacebookCallback']);

    // Admin/Instructor
    Route::post('admin/register', [\App\Http\Controllers\AuthController::class, 'register']);
    Route::post('admin/login', [\App\Http\Controllers\AuthController::class, 'login']);
    Route::post('admin/forgot-password', [\App\Http\Controllers\AuthController::class, 'forgotPassword']);
    Route::post('admin/reset-password', [\App\Http\Controllers\AuthController::class, 'resetPassword']);
    Route::put('admin/change-password', [\App\Http\Controllers\AuthController::class, 'logout']);
});

Route::middleware('auth:sanctum')->group(function () {
    // OAuth management & sessions
    Route::get('auth/oauth/providers', [\App\Http\Controllers\OauthController::class, 'providers']);
    Route::post('auth/oauth/link', [\App\Http\Controllers\OauthController::class, 'link']);
    Route::post('auth/oauth/unlink', [\App\Http\Controllers\OauthController::class, 'unlink']);
    Route::get('auth/sessions', [\App\Http\Controllers\OauthController::class, 'sessions']);
    Route::delete('auth/sessions/{sessionId}', [\App\Http\Controllers\OauthController::class, 'terminateSession']);
    Route::delete('auth/sessions/terminate-all', [\App\Http\Controllers\OauthController::class, 'terminateAll']);

    // Student complete/check profile
    Route::post('auth/student/complete-profile', [\App\Http\Controllers\OauthController::class, 'studentCompleteProfile']);
    Route::get('auth/student/check-profile', [\App\Http\Controllers\OauthController::class, 'studentCheckProfile']);
    Route::post('auth/logout', [\App\Http\Controllers\AuthController::class, 'logout']);
    Route::get('users/profile', [\App\Http\Controllers\UserController::class, 'profile']);
    Route::put('users/profile', [\App\Http\Controllers\UserController::class, 'updateProfile']);
    Route::put('users/change-password', [\App\Http\Controllers\UserController::class, 'changePassword']);

    // Categories (admin-protected later when roles wired)
    Route::get('categories', [\App\Http\Controllers\CategoryController::class, 'index']);
    Route::post('categories', [\App\Http\Controllers\CategoryController::class, 'store']);
    Route::get('categories/{id}', [\App\Http\Controllers\CategoryController::class, 'show']);
    Route::put('categories/{id}', [\App\Http\Controllers\CategoryController::class, 'update']);
    Route::delete('categories/{id}', [\App\Http\Controllers\CategoryController::class, 'destroy']);

    // Courses
    Route::get('courses', [\App\Http\Controllers\CourseController::class, 'index']);
    Route::get('courses/{id}', [\App\Http\Controllers\CourseController::class, 'show']);
    Route::post('courses', [\App\Http\Controllers\CourseController::class, 'store']);
    Route::put('courses/{id}', [\App\Http\Controllers\CourseController::class, 'update']);
    Route::delete('courses/{id}', [\App\Http\Controllers\CourseController::class, 'destroy']);

    // Lessons
    Route::get('courses/{courseId}/lessons', [\App\Http\Controllers\LessonController::class, 'byCourse']);
    Route::get('lessons/{id}', [\App\Http\Controllers\LessonController::class, 'show']);
    Route::post('lessons', [\App\Http\Controllers\LessonController::class, 'store']);
    Route::put('lessons/{id}', [\App\Http\Controllers\LessonController::class, 'update']);
    Route::delete('lessons/{id}', [\App\Http\Controllers\LessonController::class, 'destroy']);
    Route::post('lessons/{id}/progress', [\App\Http\Controllers\ProgressController::class, 'updateLesson']);
    Route::get('lessons/{id}/video-progress', [\App\Http\Controllers\ProgressController::class, 'getVideo']);
    Route::post('lessons/{id}/video-progress', [\App\Http\Controllers\ProgressController::class, 'updateVideo']);

    // Books
    Route::get('books', [\App\Http\Controllers\BookController::class, 'index']);
    Route::get('books/{id}', [\App\Http\Controllers\BookController::class, 'show']);
    Route::post('books', [\App\Http\Controllers\BookController::class, 'store']);
    Route::put('books/{id}', [\App\Http\Controllers\BookController::class, 'update']);
    Route::delete('books/{id}', [\App\Http\Controllers\BookController::class, 'destroy']);
    Route::post('books/activate', [\App\Http\Controllers\BookController::class, 'activate']);
    Route::get('books/my-books', [\App\Http\Controllers\BookController::class, 'myBooks']);
    Route::get('books/{id}/chapters', [\App\Http\Controllers\BookController::class, 'chapters']);

    // Cart
    Route::get('cart', [\App\Http\Controllers\CartController::class, 'index']);
    Route::post('cart', [\App\Http\Controllers\CartController::class, 'store']);
    Route::delete('cart/{id}', [\App\Http\Controllers\CartController::class, 'destroy']);
    Route::delete('cart/clear', [\App\Http\Controllers\CartController::class, 'clear']);

    // Orders
    Route::get('orders', [\App\Http\Controllers\OrderController::class, 'index']);
    Route::get('orders/{id}', [\App\Http\Controllers\OrderController::class, 'show']);
    Route::post('orders', [\App\Http\Controllers\OrderController::class, 'store']);
    Route::put('orders/{id}/cancel', [\App\Http\Controllers\OrderController::class, 'cancel']);
    Route::post('orders/{id}/payment-callback', [\App\Http\Controllers\OrderController::class, 'paymentCallback']);

    // Coupons
    Route::post('coupons/validate', [\App\Http\Controllers\CouponController::class, 'validateCode']);
    Route::get('coupons', [\App\Http\Controllers\CouponController::class, 'index']);

    // Assignments & attempts
    Route::get('assignments', [\App\Http\Controllers\AssignmentController::class, 'index']);
    Route::get('assignments/{id}', [\App\Http\Controllers\AssignmentController::class, 'show']);
    Route::post('assignments', [\App\Http\Controllers\AssignmentController::class, 'store']);
    Route::put('assignments/{id}', [\App\Http\Controllers\AssignmentController::class, 'update']);
    Route::delete('assignments/{id}', [\App\Http\Controllers\AssignmentController::class, 'destroy']);
    Route::post('assignments/{id}/start', [\App\Http\Controllers\AssignmentController::class, 'start']);
    Route::post('assignments/{id}/submit', [\App\Http\Controllers\AssignmentController::class, 'submit']);
    Route::get('assignments/{id}/attempts', [\App\Http\Controllers\AssignmentController::class, 'attempts']);

    // Unified questions
    Route::get('questions', [\App\Http\Controllers\QuestionController::class, 'index']);
    Route::post('questions', [\App\Http\Controllers\QuestionController::class, 'store']);
    Route::get('questions/{id}', [\App\Http\Controllers\QuestionController::class, 'show']);
    Route::put('questions/{id}', [\App\Http\Controllers\QuestionController::class, 'update']);
    Route::delete('questions/{id}', [\App\Http\Controllers\QuestionController::class, 'destroy']);
    Route::get('questions/{id}/options', [\App\Http\Controllers\QuestionController::class, 'options']);
    Route::post('questions/{id}/options', [\App\Http\Controllers\QuestionController::class, 'addOption']);
    Route::put('questions/{questionId}/options/{optionId}', [\App\Http\Controllers\QuestionController::class, 'updateOption']);
    Route::delete('questions/{questionId}/options/{optionId}', [\App\Http\Controllers\QuestionController::class, 'deleteOption']);

    // Live classes
    Route::get('live-classes', [\App\Http\Controllers\LiveClassController::class, 'index']);
    Route::get('live-classes/{id}', [\App\Http\Controllers\LiveClassController::class, 'show']);
    Route::post('live-classes', [\App\Http\Controllers\LiveClassController::class, 'store']);
    Route::put('live-classes/{id}', [\App\Http\Controllers\LiveClassController::class, 'update']);
    Route::delete('live-classes/{id}', [\App\Http\Controllers\LiveClassController::class, 'destroy']);
    Route::post('live-classes/{id}/join', [\App\Http\Controllers\LiveClassController::class, 'join']);
    Route::post('live-classes/{id}/leave', [\App\Http\Controllers\LiveClassController::class, 'leave']);

    // Wishlist
    Route::get('wishlist', [\App\Http\Controllers\WishlistController::class, 'index']);
    Route::post('wishlist', [\App\Http\Controllers\WishlistController::class, 'store']);
    Route::delete('wishlist/{id}', [\App\Http\Controllers\WishlistController::class, 'destroy']);
    Route::delete('wishlist/clear', [\App\Http\Controllers\WishlistController::class, 'clear']);

    // Discussions
    Route::get('lessons/{id}/discussions', [\App\Http\Controllers\DiscussionController::class, 'list']);
    Route::post('lessons/{id}/discussions', [\App\Http\Controllers\DiscussionController::class, 'store']);
    Route::put('discussions/{id}', [\App\Http\Controllers\DiscussionController::class, 'update']);
    Route::delete('discussions/{id}', [\App\Http\Controllers\DiscussionController::class, 'destroy']);
    Route::post('discussions/{id}/like', [\App\Http\Controllers\DiscussionController::class, 'like']);
    Route::get('discussions/{id}/replies', [\App\Http\Controllers\DiscussionController::class, 'replies']);
    Route::post('discussions/{id}/replies', [\App\Http\Controllers\DiscussionController::class, 'reply']);

    // Learning paths
    Route::get('learning-paths', [\App\Http\Controllers\LearningPathController::class, 'index']);
    Route::get('learning-paths/{id}', [\App\Http\Controllers\LearningPathController::class, 'show']);
    Route::post('learning-paths', [\App\Http\Controllers\LearningPathController::class, 'store']);
    Route::put('learning-paths/{id}', [\App\Http\Controllers\LearningPathController::class, 'update']);
    Route::delete('learning-paths/{id}', [\App\Http\Controllers\LearningPathController::class, 'destroy']);
    Route::get('learning-paths/{id}/courses', [\App\Http\Controllers\LearningPathController::class, 'courses']);
    Route::post('learning-paths/{id}/courses', [\App\Http\Controllers\LearningPathController::class, 'addCourse']);
    Route::post('learning-paths/{id}/enroll', [\App\Http\Controllers\LearningPathController::class, 'enroll']);
    Route::get('learning-paths/my-paths', [\App\Http\Controllers\LearningPathController::class, 'myPaths']);

    // Certificates
    Route::get('certificates', [\App\Http\Controllers\CertificateController::class, 'index']);
    Route::get('certificates/{id}', [\App\Http\Controllers\CertificateController::class, 'show']);
    Route::post('certificates/generate', [\App\Http\Controllers\CertificateController::class, 'generate']);
    Route::get('certificates/{id}/download', [\App\Http\Controllers\CertificateController::class, 'download']);
    Route::get('certificates/verify/{number}', [\App\Http\Controllers\CertificateController::class, 'verify']);

    // Reviews
    Route::get('reviews', [\App\Http\Controllers\ReviewController::class, 'index']);
    Route::post('reviews', [\App\Http\Controllers\ReviewController::class, 'store']);
    Route::put('reviews/{id}', [\App\Http\Controllers\ReviewController::class, 'update']);
    Route::delete('reviews/{id}', [\App\Http\Controllers\ReviewController::class, 'destroy']);
    Route::post('reviews/{id}/helpful', [\App\Http\Controllers\ReviewController::class, 'helpful']);

    // Notifications
    Route::get('notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::put('notifications/{id}/mark-read', [\App\Http\Controllers\NotificationController::class, 'markRead']);
    Route::put('notifications/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllRead']);
    Route::post('notifications', [\App\Http\Controllers\NotificationController::class, 'store']);

    // Users
    Route::post('users/upload-avatar', [\App\Http\Controllers\UserController::class, 'uploadAvatar']);
    Route::get('users/{id}', [\App\Http\Controllers\UserController::class, 'getById']);
    Route::get('users/search', [\App\Http\Controllers\UserController::class, 'search']);

    // Uploads
    Route::post('upload/image', [\App\Http\Controllers\UploadController::class, 'image']);
    Route::post('upload/video', [\App\Http\Controllers\UploadController::class, 'video']);
    Route::post('upload/document', [\App\Http\Controllers\UploadController::class, 'document']);
    Route::post('upload/ebook', [\App\Http\Controllers\UploadController::class, 'ebook']);

    // Search
    Route::get('search', [\App\Http\Controllers\SearchController::class, 'search']);
    Route::get('search/suggestions', [\App\Http\Controllers\SearchController::class, 'suggestions']);

    // System (health is public, below are protected)
    Route::get('system/settings', [\App\Http\Controllers\SystemController::class, 'settings']);
    Route::put('system/settings', [\App\Http\Controllers\SystemController::class, 'updateSettings']);
    Route::get('system/stats', [\App\Http\Controllers\SystemController::class, 'stats']);

    // Analytics
    Route::get('analytics/dashboard', [\App\Http\Controllers\AnalyticsController::class, 'dashboard']);
    Route::get('analytics/courses/{id}', [\App\Http\Controllers\AnalyticsController::class, 'course']);
    Route::get('analytics/instructor/{id}', [\App\Http\Controllers\AnalyticsController::class, 'instructor']);

    // Admin
    Route::get('admin/users', [\App\Http\Controllers\AdminController::class, 'listUsers']);
    Route::put('admin/users/{id}', [\App\Http\Controllers\AdminController::class, 'updateUser']);
    Route::post('admin/create-instructor', [\App\Http\Controllers\AdminController::class, 'createInstructor']);
    Route::post('admin/reset-instructor-password', [\App\Http\Controllers\AdminController::class, 'resetInstructorPassword']);
});


