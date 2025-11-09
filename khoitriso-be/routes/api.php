<?php

use Illuminate\Support\Facades\Route;

// Public health endpoint
Route::get('system/health', [\App\Http\Controllers\SystemController::class, 'health']);
// Public system settings (no auth required)
Route::get('system/settings/public', [\App\Http\Controllers\SystemController::class, 'publicSettings']);

// Language endpoints (public)
Route::get('language', [\App\Http\Controllers\LanguageController::class, 'getCurrent']);
Route::get('language/supported', [\App\Http\Controllers\LanguageController::class, 'getSupported']);
Route::post('language/set', [\App\Http\Controllers\LanguageController::class, 'setLanguage']);
Route::get('language/translations', [\App\Http\Controllers\LanguageController::class, 'getTranslations']);
Route::get('language/translations/all', [\App\Http\Controllers\LanguageController::class, 'getAllTranslations']);

// Public courses and books (no auth required)
Route::get('courses', [\App\Http\Controllers\CourseController::class, 'index']);
Route::get('courses/{id}', [\App\Http\Controllers\CourseController::class, 'show']);
Route::get('books', [\App\Http\Controllers\BookController::class, 'index']);
Route::get('books/{id}', [\App\Http\Controllers\BookController::class, 'show'])->where('id', '[0-9]+');
Route::get('categories', [\App\Http\Controllers\CategoryController::class, 'index']);
Route::get('categories/{id}', [\App\Http\Controllers\CategoryController::class, 'show']);

// Search (public)
Route::get('search', [\App\Http\Controllers\SearchController::class, 'search']);
Route::get('search/suggestions', [\App\Http\Controllers\SearchController::class, 'suggestions']);

Route::get('test/config', function () {
    try {
        $uploadWorkerBaseUrl = config('services.upload_worker.base_url');
        $jwtKey = config('services.upload_worker.jwt_key');
        $backendJwtKey = config('services.upload_worker.backend_jwt_key');
        
        // Test JWT generation
        $testPayload = ['test' => 'value', 'iat' => time(), 'exp' => time() + 3600];
        $testToken = null;
        $jwtError = null;
        try {
            $testToken = \Firebase\JWT\JWT::encode($testPayload, $jwtKey, 'HS256');
        } catch (\Exception $e) {
            $jwtError = $e->getMessage();
        }
        
        return response()->json([
            'success' => true,
            'upload_worker' => [
                'base_url' => $uploadWorkerBaseUrl ? 'SET' : 'NOT SET',
                'base_url_value' => $uploadWorkerBaseUrl,
                'jwt_key' => $jwtKey ? 'SET' : 'NOT SET',
                'jwt_key_length' => $jwtKey ? strlen($jwtKey) : 0,
                'backend_jwt_key' => $backendJwtKey ? 'SET' : 'NOT SET',
                'jwt_test' => $testToken ? 'SUCCESS' : 'FAILED',
                'jwt_error' => $jwtError,
            ],
            'env' => [
                'UPLOAD_WORKER_BASE_URL' => env('UPLOAD_WORKER_BASE_URL') ? 'SET' : 'NOT SET',
                'UPLOAD_WORKER_JWT_KEY' => env('UPLOAD_WORKER_JWT_KEY') ? 'SET' : 'NOT SET',
                'UPLOAD_WORKER_BACKEND_JWT_KEY' => env('UPLOAD_WORKER_BACKEND_JWT_KEY') ? 'SET' : 'NOT SET',
            ],
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
        ], 500);
    }
});

Route::get('test/db', function () {
    try {
        $dbName = config('database.connections.pgsql.database');
        $dbHost = parse_url(config('database.connections.pgsql.url'), PHP_URL_HOST) 
            ?: config('database.connections.pgsql.host');
        
        $userCount = \App\Models\User::count();
        $adminCount = \App\Models\User::where('role', 'admin')->count();
        $instructorCount = \App\Models\User::where('role', 'instructor')->count();
        $studentCount = \App\Models\User::where('role', 'student')->count();
        
        $testUsers = \App\Models\User::select('id', 'name', 'email', 'role')
            ->whereIn('email', [
                'admin@khoitriso.edu.vn',
                'instructor@khoitriso.edu.vn',
                'student@gmail.com'
            ])
            ->get();
        
        return response()->json([
            'success' => true,
            'database' => [
                'name' => $dbName,
                'host' => $dbHost,
                'connection' => 'OK'
            ],
            'stats' => [
                'total_users' => $userCount,
                'admins' => $adminCount,
                'instructors' => $instructorCount,
                'students' => $studentCount,
            ],
            'test_users' => $testUsers,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
        ], 500);
    }
});

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
    Route::post('google/token-login', [\App\Http\Controllers\OauthController::class, 'googleTokenLogin']);
    Route::get('facebook', [\App\Http\Controllers\OauthController::class, 'studentFacebook']);
    Route::get('facebook/callback', [\App\Http\Controllers\OauthController::class, 'studentFacebookCallback']);

    // Admin/Instructor
    Route::post('admin/register', [\App\Http\Controllers\AuthController::class, 'register']);
    Route::post('admin/login', [\App\Http\Controllers\AuthController::class, 'login']);
    Route::post('admin/forgot-password', [\App\Http\Controllers\AuthController::class, 'forgotPassword']);
    Route::post('admin/reset-password', [\App\Http\Controllers\AuthController::class, 'resetPassword']);
});

// VNPay Callback (public - no auth required, it's a webhook)
Route::get('orders/vnpay/callback', [\App\Http\Controllers\OrderController::class, 'vnpayCallback']);
Route::post('orders/vnpay/callback', [\App\Http\Controllers\OrderController::class, 'vnpayCallback']);

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
    Route::post('categories', [\App\Http\Controllers\CategoryController::class, 'store']);
    Route::put('categories/{id}', [\App\Http\Controllers\CategoryController::class, 'update']);
    Route::delete('categories/{id}', [\App\Http\Controllers\CategoryController::class, 'destroy']);

    // Courses (protected routes)
    Route::get('my-courses', [\App\Http\Controllers\CourseController::class, 'myLearning']);
    Route::post('courses', [\App\Http\Controllers\CourseController::class, 'store']);
    // Enroll route must be before courses/{id} to avoid route conflict
    Route::post('courses/{id}/enroll', [\App\Http\Controllers\CourseController::class, 'enroll']);
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

    // Books (protected routes)
    Route::post('books', [\App\Http\Controllers\BookController::class, 'store']);
    Route::put('books/{id}', [\App\Http\Controllers\BookController::class, 'update']);
    Route::delete('books/{id}', [\App\Http\Controllers\BookController::class, 'destroy']);
    Route::post('books/activate', [\App\Http\Controllers\BookController::class, 'activate']);
    Route::get('books/my-books', [\App\Http\Controllers\BookController::class, 'myBooks']);
    Route::get('books/{id}/chapters', [\App\Http\Controllers\BookController::class, 'chapters']);
    Route::get('books/{bookId}/chapters/{chapterId}/questions', [\App\Http\Controllers\BookController::class, 'chapterQuestions']);

    // Cart
    Route::get('cart', [\App\Http\Controllers\CartController::class, 'index']);
    Route::post('cart', [\App\Http\Controllers\CartController::class, 'store']);
    Route::put('cart/{id}', [\App\Http\Controllers\CartController::class, 'update']);
    Route::delete('cart/{id}', [\App\Http\Controllers\CartController::class, 'destroy']);
    Route::delete('cart', [\App\Http\Controllers\CartController::class, 'clear']);

    // Orders
    Route::get('orders', [\App\Http\Controllers\OrderController::class, 'index']);
    Route::get('orders/{id}', [\App\Http\Controllers\OrderController::class, 'show']);
    Route::post('orders', [\App\Http\Controllers\OrderController::class, 'store']);
    Route::post('orders/{id}/cancel', [\App\Http\Controllers\OrderController::class, 'cancel']);
    Route::post('orders/{id}/pay', [\App\Http\Controllers\OrderController::class, 'pay']);
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

    // Notes
    Route::get('lessons/{id}/notes', [\App\Http\Controllers\NoteController::class, 'list']);
    Route::post('lessons/{id}/notes', [\App\Http\Controllers\NoteController::class, 'store']);
    Route::put('notes/{id}', [\App\Http\Controllers\NoteController::class, 'update']);
    Route::delete('notes/{id}', [\App\Http\Controllers\NoteController::class, 'destroy']);

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
    Route::post('upload/presign', [\App\Http\Controllers\UploadController::class, 'presign']);
    Route::post('upload/confirm/{fileKey}', [\App\Http\Controllers\UploadController::class, 'confirm'])->where('fileKey', '.*');
    Route::get('upload/info/{fileKey}', [\App\Http\Controllers\UploadController::class, 'info'])->where('fileKey', '.*');
    Route::delete('upload/{fileKey}', [\App\Http\Controllers\UploadController::class, 'delete'])->where('fileKey', '.*');
    Route::post('upload/batch-delete', [\App\Http\Controllers\UploadController::class, 'batchDelete']);
    
    // Legacy upload endpoints (direct upload)
    Route::post('upload/image', [\App\Http\Controllers\UploadController::class, 'image']);
    Route::post('upload/video', [\App\Http\Controllers\UploadController::class, 'video']);
    Route::post('upload/ebook', [\App\Http\Controllers\UploadController::class, 'ebook']);

    // Static Pages (public for viewing, protected for management)
    Route::get('static-pages/{slug}', [\App\Http\Controllers\StaticPageController::class, 'showBySlug']);

    // Instructor endpoints (require instructor or admin role)
    Route::middleware('role.instructor')->group(function () {
        Route::get('instructor/dashboard', [\App\Http\Controllers\InstructorController::class, 'dashboard']);
        Route::get('instructor/courses', [\App\Http\Controllers\InstructorController::class, 'courses']);
        Route::get('instructor/books', [\App\Http\Controllers\InstructorController::class, 'books']);
        Route::get('instructor/students', [\App\Http\Controllers\InstructorController::class, 'students']);
        Route::get('instructor/orders', [\App\Http\Controllers\InstructorController::class, 'orders']);
    });

    // Admin endpoints (require admin role)
    Route::middleware('role.admin')->group(function () {
        Route::get('admin/users', [\App\Http\Controllers\AdminController::class, 'listUsers']);
        Route::get('admin/users/{id}', [\App\Http\Controllers\AdminController::class, 'getUser']);
        Route::put('admin/users/{id}', [\App\Http\Controllers\AdminController::class, 'updateUser']);
        Route::put('admin/users/{id}/toggle-status', [\App\Http\Controllers\AdminController::class, 'toggleUserStatus']);
        Route::get('admin/users/{id}/courses', [\App\Http\Controllers\AdminController::class, 'getUserCourses']);
        Route::get('admin/users/{id}/books', [\App\Http\Controllers\AdminController::class, 'getUserBooks']);
        Route::post('admin/create-instructor', [\App\Http\Controllers\AdminController::class, 'createInstructor']);
        Route::post('admin/reset-instructor-password', [\App\Http\Controllers\AdminController::class, 'resetInstructorPassword']);
        Route::get('admin/courses', [\App\Http\Controllers\AdminController::class, 'listCourses']);
        Route::get('admin/reports/revenue', [\App\Http\Controllers\AdminReportController::class, 'revenueReport']);
        Route::get('admin/reports/total-revenue', [\App\Http\Controllers\AdminReportController::class, 'adminTotalRevenue']);
        Route::get('admin/reports/instructor-revenue', [\App\Http\Controllers\AdminReportController::class, 'instructorRevenue']);
        Route::get('admin/commissions/stats', [\App\Http\Controllers\AdminReportController::class, 'commissionStats']);
        Route::get('admin/commissions/pending-payouts', [\App\Http\Controllers\AdminReportController::class, 'pendingPayouts']);
        Route::get('admin/commissions/top-instructors', [\App\Http\Controllers\AdminReportController::class, 'topInstructors']);
        Route::get('admin/commissions/recent-transactions', [\App\Http\Controllers\AdminReportController::class, 'recentTransactions']);
        Route::get('admin/commissions/payout-history', [\App\Http\Controllers\AdminReportController::class, 'payoutHistory']);
        Route::get('admin/approvals/courses', [\App\Http\Controllers\AdminController::class, 'pendingCourses']);
        Route::get('admin/approvals/books', [\App\Http\Controllers\AdminController::class, 'pendingBooks']);
        Route::put('admin/courses/{id}/approve', [\App\Http\Controllers\AdminController::class, 'approveCourse']);
        Route::put('admin/courses/{id}/reject', [\App\Http\Controllers\AdminController::class, 'rejectCourse']);
        Route::put('admin/courses/{id}/publish', [\App\Http\Controllers\AdminController::class, 'publishCourse']);
        Route::put('admin/courses/{id}/unpublish', [\App\Http\Controllers\AdminController::class, 'unpublishCourse']);
        Route::put('admin/books/{id}/approve', [\App\Http\Controllers\AdminController::class, 'approveBook']);
        Route::put('admin/books/{id}/reject', [\App\Http\Controllers\AdminController::class, 'rejectBook']);
        Route::put('admin/books/{id}/publish', [\App\Http\Controllers\AdminController::class, 'publishBook']);
        Route::put('admin/books/{id}/unpublish', [\App\Http\Controllers\AdminController::class, 'unpublishBook']);
        Route::get('admin/instructors/{id}', [\App\Http\Controllers\AdminController::class, 'getInstructor']);
        Route::get('admin/instructors/{id}/courses', [\App\Http\Controllers\AdminController::class, 'getInstructorCourses']);
        Route::get('admin/instructors/{id}/books', [\App\Http\Controllers\AdminController::class, 'getInstructorBooks']);
        Route::put('admin/instructors/{id}/toggle-status', [\App\Http\Controllers\AdminController::class, 'toggleInstructorStatus']);
        Route::get('admin/courses/{id}/enrollments', [\App\Http\Controllers\AdminController::class, 'getCourseEnrollments']);
        Route::get('admin/courses/{courseId}/revenue', [\App\Http\Controllers\AdminController::class, 'getCourseRevenue']);
        Route::get('admin/courses/revenue', [\App\Http\Controllers\AdminController::class, 'getAllCoursesRevenue']);
        Route::get('admin/books/{id}/purchases', [\App\Http\Controllers\AdminController::class, 'getBookPurchases']);
        Route::get('admin/books/{bookId}/revenue', [\App\Http\Controllers\AdminController::class, 'getBookRevenue']);
        Route::get('admin/books/revenue', [\App\Http\Controllers\AdminController::class, 'getAllBooksRevenue']);
        Route::get('admin/revenue/total', [\App\Http\Controllers\AdminController::class, 'getTotalRevenue']);
        Route::get('admin/orders', [\App\Http\Controllers\AdminController::class, 'listOrders']);
        Route::get('admin/orders/{id}', [\App\Http\Controllers\AdminController::class, 'getOrder']);
    
        // Admin Coupons
        Route::get('admin/coupons', [\App\Http\Controllers\AdminCouponController::class, 'index']);
        Route::get('admin/coupons/{id}', [\App\Http\Controllers\AdminCouponController::class, 'show']);
        Route::post('admin/coupons', [\App\Http\Controllers\AdminCouponController::class, 'store']);
        Route::put('admin/coupons/{id}', [\App\Http\Controllers\AdminCouponController::class, 'update']);
        Route::delete('admin/coupons/{id}', [\App\Http\Controllers\AdminCouponController::class, 'destroy']);
        
        // Admin Books Management
        Route::get('admin/books', [\App\Http\Controllers\AdminController::class, 'listBooks']);
        Route::get('admin/books/{id}', [\App\Http\Controllers\AdminController::class, 'getBook']);
        Route::post('admin/books', [\App\Http\Controllers\AdminController::class, 'createBook']);
        Route::put('admin/books/{id}', [\App\Http\Controllers\AdminController::class, 'updateBook']);
        Route::delete('admin/books/{id}', [\App\Http\Controllers\AdminController::class, 'deleteBook']);
        Route::post('admin/books/{bookId}/chapters', [\App\Http\Controllers\AdminController::class, 'createChapter']);
        Route::get('admin/books/{bookId}/chapters/{chapterId}/questions', [\App\Http\Controllers\AdminController::class, 'getChapterQuestions']);
        Route::post('admin/books/{bookId}/chapters/{chapterId}/questions', [\App\Http\Controllers\AdminController::class, 'createChapterQuestions']);

        // Admin Courses Management
        Route::get('admin/courses/{id}', [\App\Http\Controllers\AdminController::class, 'getCourse']);
        Route::post('admin/courses', [\App\Http\Controllers\AdminController::class, 'createCourse']);
        Route::put('admin/courses/{id}', [\App\Http\Controllers\AdminController::class, 'updateCourse']);
        Route::delete('admin/courses/{id}', [\App\Http\Controllers\AdminController::class, 'deleteCourse']);

        // Admin Lessons Management
        Route::get('admin/lessons/{id}', [\App\Http\Controllers\AdminController::class, 'getLesson']);
        Route::post('admin/courses/{courseId}/lessons', [\App\Http\Controllers\AdminController::class, 'createLesson']);
        Route::put('admin/lessons/{id}', [\App\Http\Controllers\AdminController::class, 'updateLesson']);
        Route::delete('admin/lessons/{id}', [\App\Http\Controllers\AdminController::class, 'deleteLesson']);

        // Admin Lesson Materials
        Route::post('admin/lessons/{lessonId}/materials', [\App\Http\Controllers\AdminController::class, 'uploadLessonMaterial']);
        Route::delete('admin/materials/{id}', [\App\Http\Controllers\AdminController::class, 'deleteLessonMaterial']);

        // Admin Lesson Q&A
        Route::get('admin/lessons/{lessonId}/discussions', [\App\Http\Controllers\AdminController::class, 'getLessonDiscussions']);
        Route::post('admin/lessons/{lessonId}/discussions/{discussionId}/reply', [\App\Http\Controllers\AdminController::class, 'replyToDiscussion']);

        // Admin Lesson Assignments
        Route::get('admin/lessons/{lessonId}/assignments', [\App\Http\Controllers\AdminController::class, 'getLessonAssignments']);
        Route::post('admin/lessons/{lessonId}/assignments', [\App\Http\Controllers\AdminController::class, 'createLessonAssignment']);
        Route::post('admin/assignments/{assignmentId}/questions', [\App\Http\Controllers\AdminController::class, 'createAssignmentQuestion']);
        Route::get('admin/assignments/{assignmentId}/attempts', [\App\Http\Controllers\AdminController::class, 'getAssignmentAttempts']);
        Route::get('admin/attempts/{attemptId}', [\App\Http\Controllers\AdminController::class, 'getAttemptDetails']);
        Route::post('admin/attempts/{attemptId}/grade', [\App\Http\Controllers\AdminController::class, 'gradeAttempt']);
        
        // Admin Static Pages Management
        Route::get('admin/static-pages', [\App\Http\Controllers\StaticPageController::class, 'index']);
        Route::post('admin/static-pages', [\App\Http\Controllers\StaticPageController::class, 'store']);
        Route::get('admin/static-pages/{id}', [\App\Http\Controllers\StaticPageController::class, 'show']);
        Route::put('admin/static-pages/{id}', [\App\Http\Controllers\StaticPageController::class, 'update']);
        Route::delete('admin/static-pages/{id}', [\App\Http\Controllers\StaticPageController::class, 'destroy']);

        // Admin System Settings
        Route::get('system/settings', [\App\Http\Controllers\SystemController::class, 'settings']);
        Route::put('system/settings', [\App\Http\Controllers\SystemController::class, 'updateSettings']);
        Route::get('system/stats', [\App\Http\Controllers\SystemController::class, 'stats']);

        // Admin Analytics
        Route::get('analytics/dashboard', [\App\Http\Controllers\AnalyticsController::class, 'dashboard']);
        Route::get('analytics/courses/{id}', [\App\Http\Controllers\AnalyticsController::class, 'course']);
        Route::get('analytics/instructor/{id}', [\App\Http\Controllers\AnalyticsController::class, 'instructor']);
    });

    // Forum (MongoDB-backed)
    Route::prefix('forum-api')->group(function () {
        Route::get('questions', [\App\Http\Controllers\ForumController::class, 'list']);
        Route::get('questions/{id}', [\App\Http\Controllers\ForumController::class, 'get']);
        Route::post('questions', [\App\Http\Controllers\ForumController::class, 'create']);
        Route::put('questions/{id}', [\App\Http\Controllers\ForumController::class, 'update']);
        Route::delete('questions/{id}', [\App\Http\Controllers\ForumController::class, 'delete']);
        Route::post('questions/{id}/vote', [\App\Http\Controllers\ForumController::class, 'vote']);

        Route::get('questions/{id}/answers', [\App\Http\Controllers\ForumController::class, 'listAnswers']);
        Route::post('questions/{id}/answers', [\App\Http\Controllers\ForumController::class, 'addAnswer']);
        Route::put('questions/{id}/answers/{answerId}', [\App\Http\Controllers\ForumController::class, 'updateAnswer']);
        Route::delete('questions/{id}/answers/{answerId}', [\App\Http\Controllers\ForumController::class, 'deleteAnswer']);
        Route::post('questions/{id}/answers/{answerId}/vote', [\App\Http\Controllers\ForumController::class, 'voteAnswer']);
        Route::post('questions/{id}/answers/{answerId}/accept', [\App\Http\Controllers\ForumController::class, 'acceptAnswer']);

        Route::get('tags', [\App\Http\Controllers\ForumController::class, 'tags']);
    });
});