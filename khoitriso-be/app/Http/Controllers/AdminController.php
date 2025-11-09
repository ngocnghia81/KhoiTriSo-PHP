<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\User;
use App\Models\Course;
use App\Models\Book;
use App\Models\BookChapter;
use App\Mail\InstructorAccountCreated;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Admin Controller
 */
class AdminController extends BaseController
{
    public function listUsers(Request $request): JsonResponse
    {
        try {
            $q = User::query();
            
            // Filter by role from database
            if ($request->filled('role')) {
                $q->where('role', $request->query('role'));
            }
            
            if ($request->filled('isActive')) {
                $isActive = filter_var($request->query('isActive'), FILTER_VALIDATE_BOOLEAN);
                $q->whereRaw('is_active = ' . ($isActive ? 'true' : 'false'));
            }
            if ($s = $request->query('search')) {
                $q->where(function ($w) use ($s) {
                    $w->where('name','like',"%$s%")
                      ->orWhere('email','like',"%$s%")
                      ->orWhere('username','like',"%$s%");
                });
            }
            
            // Filter by emailVerified
            if ($request->filled('emailVerified')) {
                $emailVerified = filter_var($request->query('emailVerified'), FILTER_VALIDATE_BOOLEAN);
                if ($emailVerified) {
                    $q->whereNotNull('email_verified_at');
                } else {
                    $q->whereNull('email_verified_at');
                }
            }
            
            // Order by
            $orderBy = $request->query('orderBy', 'created_at');
            $orderDir = $request->query('orderDir', 'desc');
            if (in_array($orderBy, ['name', 'email', 'created_at', 'last_login'])) {
                $q->orderBy($orderBy, $orderDir);
            } else {
                $q->orderBy('created_at', 'desc');
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $users = $q->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'username' => $user->username ?? $user->name,
                        'role' => $user->role ?? 'student',
                        'isActive' => $user->is_active ?? true,
                        'emailVerified' => (bool) $user->email_verified_at,
                        'lastLogin' => $user->last_login ? (is_string($user->last_login) ? $user->last_login : $user->last_login->toISOString()) : null,
                        'createdAt' => is_string($user->created_at) ? $user->created_at : $user->created_at->toISOString(),
                    ];
                });
            
            return $this->paginated($users->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            Log::error('Error in admin listUsers: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function updateUser(int $id, Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'role' => ['nullable','string','in:admin,instructor,student'],
                'isActive' => ['nullable','boolean'],
                'emailVerified' => ['nullable','boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            $u = User::find($id);
            
            if (!$u) {
                return $this->notFound('User');
            }
            
            $u->is_active = array_key_exists('isActive', $data) ? (bool)$data['isActive'] : $u->is_active;
            
            if (array_key_exists('role', $data)) {
                $u->role = $data['role'];
            }
            
            if (array_key_exists('emailVerified', $data) && $data['emailVerified']) {
                $u->email_verified_at = now();
            }
            
            $u->save();
            
            return $this->success($u);

        } catch (\Exception $e) {
            Log::error('Error in admin updateUser: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function createInstructor(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => ['required','string','email','max:100','unique:users,email'],
                'fullName' => ['required','string','max:100'],
                'phone' => ['nullable','string','max:20'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            // Generate random password
            $password = bin2hex(random_bytes(8)); // 16 character password
            
            // Generate username from email
            $username = explode('@', $data['email'])[0];
            
            // Check if username exists, append number if needed
            $originalUsername = $username;
            $counter = 1;
            while (User::where('username', $username)->exists()) {
                $username = $originalUsername . $counter;
                $counter++;
            }
            
            DB::beginTransaction();
            
            try {
                // Use DB::table for PostgreSQL compatibility
                $userData = [
                    'name' => $data['fullName'],
                    'username' => $username,
                    'email' => $data['email'],
                    'password' => Hash::make($password),
                    'role' => 'instructor',
                    'is_active' => DB::raw('true'),
                    'email_verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                
                // Only add phone if column exists (check schema)
                try {
                    $hasPhoneColumn = DB::selectOne("
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'phone'
                    ");
                    if ($hasPhoneColumn && !empty($data['phone'])) {
                        $userData['phone'] = $data['phone'];
                    }
                    } catch (\Exception $e) {
                    // Column doesn't exist, skip phone
                    Log::info('Phone column does not exist in users table, skipping phone field');
                }
                
                $userId = DB::table('users')->insertGetId($userData);
                
                $u = User::find($userId);
                
                // Send email with password
                Mail::to($data['email'])->send(new InstructorAccountCreated(
                    $data['email'],
                    $password,
                    $data['fullName']
                ));
                
                DB::commit();
                
                Log::info('Instructor account created and email sent', [
                    'email' => $data['email'],
                    'user_id' => $u->id
                ]);
                
                return $this->success([
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'username' => $u->username,
                    'role' => $u->role,
                    'message' => 'Tài khoản giảng viên đã được tạo và email đã được gửi'
                ]);
                
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Error in admin createInstructor: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    public function resetInstructorPassword(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'instructorId' => ['required','integer','exists:users,id'],
                'newPassword' => ['required','string','min:8'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            $u = User::find($data['instructorId']);
            
            if (!$u) {
                return $this->notFound('Instructor');
            }
            
            $u->password = Hash::make($data['newPassword']);
            $u->save();
            
            return $this->success(null);

        } catch (\Exception $e) {
            Log::error('Error in admin resetInstructorPassword: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function listCourses(Request $request): JsonResponse
    {
        try {
            $q = Course::with(['instructor:id,name,email', 'category:id,name']);
            
            // Filter by status
            if ($request->filled('status')) {
                $status = $request->query('status');
                if ($status === 'active') {
                    $q->whereRaw('is_active = true');
                } elseif ($status === 'inactive') {
                    $q->whereRaw('is_active = false');
                }
            }
            
            // Filter by approval status
            if ($request->filled('approvalStatus')) {
                $q->where('approval_status', $request->integer('approvalStatus'));
            }
            
            // Search
            if ($s = $request->query('search')) {
                $q->where(function ($w) use ($s) {
                    $w->where('title', 'like', "%$s%")
                      ->orWhere('description', 'like', "%$s%");
                });
            }
            
            // Filter by instructor
            if ($request->filled('instructorId')) {
                $q->where('instructor_id', $request->integer('instructorId'));
            }
            
            // Filter by category
            if ($request->filled('categoryId')) {
                $q->where('category_id', $request->integer('categoryId'));
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $courses = $q->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($course) {
                    return [
                        'id' => $course->id,
                        'title' => $course->title,
                        'description' => $course->description,
                        'thumbnail' => $course->thumbnail,
                        'price' => $course->price,
                        'isFree' => $course->is_free,
                        'isActive' => $course->is_active,
                        'isPublished' => $course->is_published,
                        'approvalStatus' => $course->approval_status,
                        'rating' => $course->rating,
                        'totalStudents' => $course->total_students,
                        'instructor' => $course->instructor ? [
                            'id' => $course->instructor->id,
                            'name' => $course->instructor->name,
                            'email' => $course->instructor->email,
                        ] : null,
                        'category' => $course->category ? [
                            'id' => $course->category->id,
                            'name' => $course->category->name,
                        ] : null,
                        'createdAt' => is_string($course->created_at) ? $course->created_at : $course->created_at->toISOString(),
                        'updatedAt' => is_string($course->updated_at) ? $course->updated_at : $course->updated_at->toISOString(),
                    ];
                });
            
            return $this->paginated($courses->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            Log::error('Error in admin listCourses: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get instructor details with stats
     */
    public function getInstructor(int $id, Request $request): JsonResponse
    {
        try {
            $instructor = User::where('id', $id)->where('role', 'instructor')->first();
            
            if (!$instructor) {
                return $this->notFound('Instructor');
            }
            
            // Get courses count
            $coursesCount = Course::where('instructor_id', $id)
                ->whereRaw('is_active = true')
                ->count();
            
            // Get books count
            $booksCount = \App\Models\Book::where('author_id', $id)
                ->whereRaw('is_active = true')
                ->count();
            
            // Get total students (from enrollments)
            $totalStudents = \App\Models\CourseEnrollment::whereHas('course', function($q) use ($id) {
                $q->where('instructor_id', $id)->whereRaw('is_active = true');
            })
            ->whereRaw('is_active = true')
            ->distinct('user_id')
            ->count('user_id');
            
            // Get average rating from courses
            $avgCourseRating = Course::where('instructor_id', $id)
                ->whereRaw('is_active = true')
                ->whereNotNull('rating')
                ->avg('rating');
            
            // Get average rating from books (if rating column exists)
            // Note: Books table may not have rating column, so we'll skip it for now
            $avgBookRating = null;
            try {
                $avgBookRating = \App\Models\Book::where('author_id', $id)
                    ->whereRaw('is_active = true')
                    ->whereNotNull('rating')
                    ->avg('rating');
                } catch (\Exception $e) {
                // Rating column doesn't exist in books table
                Log::info('Books table does not have rating column, skipping book rating calculation');
            }
            
            // Calculate overall rating
            $overallRating = 0;
            $ratingCount = 0;
            if ($avgCourseRating) {
                $overallRating += $avgCourseRating;
                $ratingCount++;
            }
            if ($avgBookRating) {
                $overallRating += $avgBookRating;
                $ratingCount++;
            }
            if ($ratingCount > 0) {
                $overallRating = $overallRating / $ratingCount;
            }
            
            $data = [
                'id' => $instructor->id,
                'name' => $instructor->name,
                'email' => $instructor->email,
                'username' => $instructor->username ?? $instructor->name,
                'avatar' => $instructor->avatar,
                'isActive' => $instructor->is_active ?? true,
                'createdAt' => is_string($instructor->created_at) ? $instructor->created_at : $instructor->created_at->toISOString(),
                'stats' => [
                    'coursesCount' => $coursesCount,
                    'booksCount' => $booksCount,
                    'totalStudents' => $totalStudents,
                    'avgCourseRating' => round($avgCourseRating ?? 0, 2),
                    'avgBookRating' => round($avgBookRating ?? 0, 2),
                    'overallRating' => round($overallRating, 2),
                ],
            ];
            
            return $this->success($data);
            
        } catch (\Exception $e) {
            Log::error('Error in admin getInstructor: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get instructor's courses
     */
    public function getInstructorCourses(int $id, Request $request): JsonResponse
    {
        try {
            $instructor = User::where('id', $id)->where('role', 'instructor')->first();
            
            if (!$instructor) {
                return $this->notFound('Instructor');
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $q = Course::where('instructor_id', $id)
                ->with(['category:id,name'])
                ->whereRaw('is_active = true');
            
            $total = $q->count();
            $courses = $q->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($course) {
                    // Get enrollment count
                    $enrollmentCount = \App\Models\CourseEnrollment::where('course_id', $course->id)
                        ->whereRaw('is_active = true')
                        ->count();
                    
                    return [
                        'id' => $course->id,
                        'title' => $course->title,
                        'description' => $course->description,
                        'thumbnail' => $course->thumbnail,
                        'price' => $course->price,
                        'isFree' => $course->is_free,
                        'rating' => $course->rating,
                        'totalStudents' => $enrollmentCount,
                        'category' => $course->category ? [
                            'id' => $course->category->id,
                            'name' => $course->category->name,
                        ] : null,
                        'createdAt' => is_string($course->created_at) ? $course->created_at : $course->created_at->toISOString(),
                    ];
                });
            
            return $this->paginated($courses->toArray(), $page, $pageSize, $total);
            
        } catch (\Exception $e) {
            Log::error('Error in admin getInstructorCourses: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get instructor's books
     */
    public function getInstructorBooks(int $id, Request $request): JsonResponse
    {
        try {
            $instructor = User::where('id', $id)->where('role', 'instructor')->first();
            
            if (!$instructor) {
                return $this->notFound('Instructor');
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $q = \App\Models\Book::where('author_id', $id)
                ->with(['category:id,name'])
                ->whereRaw('is_active = true');
            
            $total = $q->count();
            $books = $q->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($book) {
                    // Get purchase count (users who have this book)
                    $purchaseCount = \App\Models\UserBook::whereHas('activationCode', function($q) use ($book) {
                        $q->where('book_id', $book->id);
                    })
                    ->whereRaw('is_active = true')
                    ->distinct('user_id')
                    ->count('user_id');
                    
                    return [
                        'id' => $book->id,
                        'title' => $book->title,
                        'description' => $book->description,
                        'coverImage' => $book->cover_image,
                        'price' => $book->price,
                        'rating' => isset($book->rating) ? $book->rating : null,
                        'totalQuestions' => $book->total_questions,
                        'purchaseCount' => $purchaseCount,
                        'category' => $book->category ? [
                            'id' => $book->category->id,
                            'name' => $book->category->name,
                        ] : null,
                        'createdAt' => is_string($book->created_at) ? $book->created_at : $book->created_at->toISOString(),
                    ];
                });
            
            return $this->paginated($books->toArray(), $page, $pageSize, $total);
            
        } catch (\Exception $e) {
            Log::error('Error in admin getInstructorBooks: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get course enrollments (students who enrolled)
     */
    public function getCourseEnrollments(int $id, Request $request): JsonResponse
    {
        try {
            $course = Course::find($id);
            
            if (!$course) {
                return $this->notFound('Course');
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $q = \App\Models\CourseEnrollment::where('course_id', $id)
                ->whereRaw('is_active = true')
                ->with(['user:id,name,email,avatar']);
            
            $total = $q->count();
            $enrollments = $q->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->orderBy('enrolled_at', 'desc')
                ->get()
                ->map(function ($enrollment) {
                    return [
                        'id' => $enrollment->id,
                        'user' => $enrollment->user ? [
                            'id' => $enrollment->user->id,
                            'name' => $enrollment->user->name,
                            'email' => $enrollment->user->email,
                            'avatar' => $enrollment->user->avatar,
                        ] : null,
                        'progressPercentage' => $enrollment->progress_percentage ?? 0,
                        'enrolledAt' => is_string($enrollment->enrolled_at) ? $enrollment->enrolled_at : $enrollment->enrolled_at->toISOString(),
                        'completedAt' => $enrollment->completed_at ? (is_string($enrollment->completed_at) ? $enrollment->completed_at : $enrollment->completed_at->toISOString()) : null,
                    ];
                });
            
            return $this->paginated($enrollments->toArray(), $page, $pageSize, $total);
            
        } catch (\Exception $e) {
            Log::error('Error in admin getCourseEnrollments: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get book purchases (users who purchased the book)
     */
    public function getBookPurchases(int $id, Request $request): JsonResponse
    {
        try {
            $book = \App\Models\Book::find($id);
            
            if (!$book) {
                return $this->notFound('Book');
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $q = \App\Models\UserBook::whereHas('activationCode', function($q) use ($id) {
                $q->where('book_id', $id);
            })
            ->whereRaw('is_active = true')
            ->with(['user:id,name,email,avatar', 'activationCode:id,activation_code']);
            
            $total = $q->count();
            $purchases = $q->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($userBook) {
                    return [
                        'id' => $userBook->id,
                        'user' => $userBook->user ? [
                            'id' => $userBook->user->id,
                            'name' => $userBook->user->name,
                            'email' => $userBook->user->email,
                            'avatar' => $userBook->user->avatar,
                        ] : null,
                        'activationCode' => $userBook->activationCode ? $userBook->activationCode->activation_code : null,
                        'purchasedAt' => is_string($userBook->created_at) ? $userBook->created_at : $userBook->created_at->toISOString(),
                        'expiresAt' => $userBook->expires_at ? (is_string($userBook->expires_at) ? $userBook->expires_at : $userBook->expires_at->toISOString()) : null,
                    ];
                });
            
            return $this->paginated($purchases->toArray(), $page, $pageSize, $total);
            
        } catch (\Exception $e) {
            Log::error('Error in admin getBookPurchases: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Toggle instructor account status (lock/unlock)
     */
    public function toggleInstructorStatus(int $id, Request $request): JsonResponse
    {
        try {
            $instructor = User::where('id', $id)->where('role', 'instructor')->first();
            
            if (!$instructor) {
                return $this->notFound('Instructor');
            }
            
            $instructor->is_active = !$instructor->is_active;
            $instructor->save();
            
            return $this->success([
                'id' => $instructor->id,
                'isActive' => $instructor->is_active,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error in admin toggleInstructorStatus: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get user details with stats
     */
    public function getUser(int $id, Request $request): JsonResponse
    {
        try {
            $user = User::find($id);
            
            if (!$user) {
                return $this->notFound('User');
            }
            
            // Get enrolled courses count
            $coursesCount = \App\Models\CourseEnrollment::where('user_id', $id)
                ->whereRaw('is_active = true')
                ->count();
            
            // Get purchased books count
            $booksCount = \App\Models\UserBook::where('user_id', $id)
                ->whereRaw('is_active = true')
                ->count();
            
            // Get total spent (from paid orders)
            $totalSpent = (float) DB::table('orders')
                ->where('user_id', $id)
                ->where('status', 2) // Paid
                ->sum('final_amount');
            
            // Get total orders
            $totalOrders = (int) DB::table('orders')
                ->where('user_id', $id)
                ->count();
            
            $data = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username ?? $user->name,
                'avatar' => $user->avatar,
                'role' => $user->role ?? 'student',
                'isActive' => $user->is_active ?? true,
                'emailVerified' => (bool) $user->email_verified_at,
                'lastLogin' => $user->last_login ? (is_string($user->last_login) ? $user->last_login : $user->last_login->toISOString()) : null,
                'createdAt' => is_string($user->created_at) ? $user->created_at : $user->created_at->toISOString(),
                'stats' => [
                    'coursesCount' => $coursesCount,
                    'booksCount' => $booksCount,
                    'totalSpent' => $totalSpent,
                    'totalOrders' => $totalOrders,
                ],
            ];
            
            return $this->success($data);
            
        } catch (\Exception $e) {
            Log::error('Error in admin getUser: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get user's enrolled courses
     */
    public function getUserCourses(int $id, Request $request): JsonResponse
    {
        try {
            $user = User::find($id);
            
            if (!$user) {
                return $this->notFound('User');
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $q = \App\Models\CourseEnrollment::where('user_id', $id)
                ->whereRaw('is_active = true')
                ->with(['course' => function($query) {
                    $query->with(['instructor:id,name,email', 'category:id,name'])
                          ->whereRaw('is_active = true');
                }]);
            
            $total = $q->count();
            $enrollments = $q->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->orderBy('enrolled_at', 'desc')
                ->get()
                ->map(function ($enrollment) {
                    if (!$enrollment->course) return null;
                    
                    return [
                        'id' => $enrollment->course->id,
                        'title' => $enrollment->course->title,
                        'description' => $enrollment->course->description,
                        'thumbnail' => $enrollment->course->thumbnail,
                        'price' => $enrollment->course->price,
                        'isFree' => $enrollment->course->is_free,
                        'rating' => $enrollment->course->rating,
                        'progressPercentage' => $enrollment->progress_percentage ?? 0,
                        'enrolledAt' => is_string($enrollment->enrolled_at) ? $enrollment->enrolled_at : $enrollment->enrolled_at->toISOString(),
                        'completedAt' => $enrollment->completed_at ? (is_string($enrollment->completed_at) ? $enrollment->completed_at : $enrollment->completed_at->toISOString()) : null,
                        'instructor' => $enrollment->course->instructor ? [
                            'id' => $enrollment->course->instructor->id,
                            'name' => $enrollment->course->instructor->name,
                            'email' => $enrollment->course->instructor->email,
                        ] : null,
                        'category' => $enrollment->course->category ? [
                            'id' => $enrollment->course->category->id,
                            'name' => $enrollment->course->category->name,
                        ] : null,
                    ];
                })
                ->filter()
                ->values();
            
            return $this->paginated($enrollments->toArray(), $page, $pageSize, $total);
            
        } catch (\Exception $e) {
            Log::error('Error in admin getUserCourses: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get user's purchased books
     */
    public function getUserBooks(int $id, Request $request): JsonResponse
    {
        try {
            $user = User::find($id);
            
            if (!$user) {
                return $this->notFound('User');
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $q = \App\Models\UserBook::where('user_id', $id)
                ->whereRaw('is_active = true')
                ->with(['activationCode.book' => function($query) {
                    $query->with(['category:id,name', 'author:id,name'])
                          ->whereRaw('is_active = true');
                }]);
            
            $total = $q->count();
            $userBooks = $q->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($userBook) {
                    if (!$userBook->activationCode || !$userBook->activationCode->book) return null;
                    
                    $book = $userBook->activationCode->book;
                    
                    return [
                        'id' => $book->id,
                        'title' => $book->title,
                        'description' => $book->description,
                        'coverImage' => $book->cover_image,
                        'price' => $book->price,
                        'totalQuestions' => $book->total_questions,
                        'activationCode' => $userBook->activationCode->activation_code,
                        'purchasedAt' => is_string($userBook->created_at) ? $userBook->created_at : $userBook->created_at->toISOString(),
                        'expiresAt' => $userBook->expires_at ? (is_string($userBook->expires_at) ? $userBook->expires_at : $userBook->expires_at->toISOString()) : null,
                        'category' => $book->category ? [
                            'id' => $book->category->id,
                            'name' => $book->category->name,
                        ] : null,
                        'author' => $book->author ? [
                            'id' => $book->author->id,
                            'name' => $book->author->name,
                        ] : null,
                    ];
                })
                ->filter()
                ->values();
            
            return $this->paginated($userBooks->toArray(), $page, $pageSize, $total);
            
        } catch (\Exception $e) {
            Log::error('Error in admin getUserBooks: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Toggle user account status (lock/unlock)
     */
    public function toggleUserStatus(int $id, Request $request): JsonResponse
    {
        try {
            $user = User::find($id);
            
            if (!$user) {
                return $this->notFound('User');
            }
            
            $user->is_active = !$user->is_active;
            $user->save();
            
            return $this->success([
                'id' => $user->id,
                'isActive' => $user->is_active,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error in admin toggleUserStatus: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Approve course
     */
    public function approveCourse(int $id, Request $request): JsonResponse
    {
        try {
            $course = Course::find($id);
            
            if (!$course) {
                return $this->notFound('Course');
            }
            
            $course->approval_status = 1; // Approved
            $course->save();
            
            return $this->success([
                'id' => $course->id,
                'approvalStatus' => $course->approval_status,
                'message' => 'Khóa học đã được phê duyệt'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error in admin approveCourse: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Reject course
     */
    public function rejectCourse(int $id, Request $request): JsonResponse
    {
        try {
            $course = Course::find($id);
            
            if (!$course) {
                return $this->notFound('Course');
            }
            
            // Validate rejection reason
            $validator = Validator::make($request->all(), [
                'reason' => ['nullable', 'string', 'max:1000']
            ]);
            
            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }
            
            $course->approval_status = 2; // Rejected
            
            // Store rejection reason in review_notes if provided
            if ($request->filled('reason')) {
                $course->review_notes = $request->input('reason');
            }
            
            $course->save();
            
            return $this->success([
                'id' => $course->id,
                'approvalStatus' => $course->approval_status,
                'reviewNotes' => $course->review_notes,
                'message' => 'Khóa học đã bị từ chối'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error in admin rejectCourse: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Publish course
     */
    public function publishCourse(int $id, Request $request): JsonResponse
    {
        try {
            $course = Course::find($id);
            
            if (!$course) {
                return $this->notFound('Course');
            }
            
            // Check if course is approved first
            if ($course->approval_status !== 1) {
                return $this->error('COURSE_NOT_APPROVED', null, 'Khóa học phải được phê duyệt trước khi xuất bản', 400);
            }
            
            $course->is_published = DB::raw('true');
            $course->save();
            
            return $this->success([
                'id' => $course->id,
                'isPublished' => true,
                'message' => 'Khóa học đã được xuất bản'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error in admin publishCourse: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Unpublish course
     */
    public function unpublishCourse(int $id, Request $request): JsonResponse
    {
        try {
            $course = Course::find($id);
            if (!$course) {
                return $this->notFound('Course');
            }
            // Update trực tiếp kiểu boolean cho PostgreSQL
            Course::where('id', $id)->update(['is_published' => DB::raw('false')]);
            return $this->success([
                'id' => $course->id,
                'isPublished' => false,
                'message' => 'Khóa học đã được gỡ xuất bản'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error in admin unpublishCourse: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Approve book
     */
    public function approveBook(int $id, Request $request): JsonResponse
    {
        try {
            $book = \App\Models\Book::find($id);

            if (!$book) {
                return $this->notFound('Book');
            }

            $book->approval_status = 1; // Approved
            $book->save();

            return $this->success([
                'id' => $book->id,
                'approvalStatus' => $book->approval_status,
                'message' => 'Sách đã được phê duyệt'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in admin approveBook: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Reject book
     */
    public function rejectBook(int $id, Request $request): JsonResponse
    {
        try {
            $book = \App\Models\Book::find($id);

            if (!$book) {
                return $this->notFound('Book');
            }

            // Validate rejection reason
            $validator = Validator::make($request->all(), [
                'reason' => ['nullable', 'string', 'max:1000']
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $book->approval_status = 2; // Rejected

            if ($request->filled('reason')) {
                $book->review_notes = $request->input('reason');
            }

            $book->save();

            return $this->success([
                'id' => $book->id,
                'approvalStatus' => $book->approval_status,
                'reviewNotes' => $book->review_notes,
                'message' => 'Sách đã bị từ chối'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in admin rejectBook: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Publish book
     */
    public function publishBook(int $id, Request $request): JsonResponse
    {
        try {
            $book = \App\Models\Book::find($id);

            if (!$book) {
                return $this->notFound('Book');
            }

            if ($book->approval_status !== 1) {
                return $this->error('BOOK_NOT_APPROVED', null, 'Sách phải được phê duyệt trước khi xuất bản', 400);
            }

            $book->is_published = DB::raw('true');
            $book->save();

            return $this->success([
                'id' => $book->id,
                'isPublished' => true,
                'message' => 'Sách đã được xuất bản'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in admin publishBook: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Unpublish book
     */
    public function unpublishBook(int $id, Request $request): JsonResponse
    {
        try {
            $book = \App\Models\Book::find($id);

            if (!$book) {
                return $this->notFound('Book');
            }

            $book->is_published = DB::raw('false');
            $book->save();

            return $this->success([
                'id' => $book->id,
                'isPublished' => false,
                'message' => 'Sách đã được gỡ xuất bản'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in admin unpublishBook: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Create book (Admin only)
     */
    public function createBook(Request $request): JsonResponse
    {
        try {
            // Check if user is admin
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền tạo sách');
            }

            $validator = Validator::make($request->all(), [
                'title' => ['required', 'string', 'max:200'],
                'description' => ['required', 'string'],
                'isbn' => ['nullable', 'string', 'max:20', 'unique:books,isbn'],
                'coverImage' => ['required', 'string', 'max:255'],
                'price' => ['required', 'numeric', 'min:0'],
                'categoryId' => ['nullable', 'integer', function ($attribute, $value, $fail) {
                    if ($value !== null && !\App\Models\Category::where('id', $value)->exists()) {
                        $fail('The selected category does not exist.');
                    }
                }],
                'ebookFile' => ['nullable', 'string', 'max:255'],
                'staticPagePath' => ['nullable', 'string'],
                'language' => ['nullable', 'string', 'max:10'],
                'publicationYear' => ['nullable', 'integer', 'min:1900', 'max:' . date('Y')],
                'edition' => ['nullable', 'string', 'max:50'],
                'authorId' => ['nullable', 'integer', 'exists:users,id'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

               // Generate unique ISBN if not provided
               // Format must be <= 20 characters (database constraint: varchar(20))
               $isbn = $data['isbn'] ?? null;
               if (!$isbn) {
                   do {
                       // Format: {timestamp}{random} (max 20 chars)
                       // timestamp = 10 digits, random = 6 chars = 16 total
                       $timestamp = time();
                       $random = strtoupper(substr(md5(uniqid(rand(), true)), 0, 6));
                       $isbn = "{$timestamp}{$random}"; // 16 characters
                   } while (Book::where('isbn', $isbn)->exists());
               }

               // Determine author_id and verify user exists
               $authorId = isset($data['authorId']) ? (int) $data['authorId'] : (int) $user->id;
               
               // Verify author exists (for foreign key constraint)
               // Use DB::table() with explicit type casting for PostgreSQL compatibility
               $authorExists = \DB::table('users')
                   ->whereRaw('id = CAST(? AS BIGINT)', [$authorId])
                   ->exists();
               
               if (!$authorExists) {
                   return $this->error(
                       \App\Constants\MessageCode::VALIDATION_ERROR,
                       "Author with ID {$authorId} does not exist",
                       null,
                       400
                   );
               }
            
            // Prepare data for create, ensuring proper types for PostgreSQL
            // Note: is_active must be boolean, not integer for PostgreSQL
            $bookData = [
                'title' => (string) $data['title'],
                'description' => (string) $data['description'],
                'isbn' => (string) $isbn,
                'cover_image' => (string) $data['coverImage'],
                'price' => (float) $data['price'],
                'ebook_file' => (string) ($data['ebookFile'] ?? ''),
                'static_page_path' => (string) ($data['staticPagePath'] ?? ''),
                'author_id' => $authorId,
                'approval_status' => 3, // Approved by default for admin
                'language' => (string) ($data['language'] ?? 'vi'),
                'is_active' => true, // Will be cast by model
                'created_by' => (string) ($user->name ?? $user->email),
            ];
            
            // Only set nullable fields if provided
            if (isset($data['publicationYear']) && $data['publicationYear'] !== null) {
                $bookData['publication_year'] = (int) $data['publicationYear'];
            }
            
            if (isset($data['edition']) && $data['edition'] !== null && $data['edition'] !== '') {
                $bookData['edition'] = (string) $data['edition'];
            }
            
            // Only set category_id if provided (avoid null binding issues)
            if (isset($data['categoryId']) && $data['categoryId'] !== null) {
                $categoryId = (int) $data['categoryId'];
                // Verify category exists (for foreign key constraint)
                // Use DB::table() with explicit type casting for PostgreSQL compatibility
                $categoryExists = \DB::table('categories')
                    ->whereRaw('id = CAST(? AS BIGINT)', [$categoryId])
                    ->exists();
                
                if (!$categoryExists) {
                    return $this->error(
                        \App\Constants\MessageCode::VALIDATION_ERROR,
                        "Category with ID {$categoryId} does not exist",
                        null,
                        400
                    );
                }
                $bookData['category_id'] = $categoryId;
            }
            
            \Log::debug('Creating book with data', [
                'bookData' => $bookData,
                'authorId' => $authorId,
                'authorExists' => \App\Models\User::where('id', $authorId)->exists(),
            ]);
            
            // Use DB transaction for PostgreSQL compatibility
            // PostgreSQL requires explicit boolean casting, so use DB::table() with raw SQL
            try {
                $book = \DB::transaction(function () use ($bookData) {
                    // Build columns and values with explicit boolean casting for PostgreSQL
                    $columns = array_keys($bookData);
                    $placeholders = [];
                    $values = [];
                    
                    foreach ($bookData as $col => $value) {
                        if ($col === 'is_active') {
                            // PostgreSQL boolean literal
                            $placeholders[] = $value ? 'true' : 'false';
                        } elseif (in_array($col, ['author_id', 'category_id']) && $value !== null) {
                            // Cast foreign keys to BIGINT
                            $placeholders[] = "CAST(? AS BIGINT)";
                            $values[] = $value;
                        } else {
                            $placeholders[] = '?';
                            $values[] = $value;
                        }
                    }
                    
                    // Add timestamps
                    $columns[] = 'created_at';
                    $columns[] = 'updated_at';
                    $now = now()->format('Y-m-d H:i:s');
                    $placeholders[] = '?';
                    $placeholders[] = '?';
                    $values[] = $now;
                    $values[] = $now;
                    
                    $sql = "INSERT INTO books (" . implode(', ', array_map(fn($c) => "\"{$c}\"", $columns)) . ") VALUES (" . implode(', ', $placeholders) . ") RETURNING id";
                    
                    $result = \DB::selectOne($sql, $values);
                    return Book::find($result->id);
                });
            } catch (\Illuminate\Database\QueryException $e) {
                \Log::error('Database error creating book', [
                    'error' => $e->getMessage(),
                    'sql' => $e->getSql(),
                    'bindings' => $e->getBindings(),
                    'bookData' => $bookData,
                ]);
                throw $e;
            }

            $book->load(['category:id,name', 'author:id,name,email']);

            return $this->success([
                'id' => $book->id,
                'title' => $book->title,
                'description' => $book->description,
                'isbn' => $book->isbn,
                'coverImage' => $book->cover_image,
                'price' => $book->price,
                'category' => $book->category ? [
                    'id' => $book->category->id,
                    'name' => $book->category->name,
                ] : null,
                'author' => $book->author ? [
                    'id' => $book->author->id,
                    'name' => $book->author->name,
                    'email' => $book->author->email,
                ] : null,
                'ebookFile' => $book->ebook_file,
                'staticPagePath' => $book->static_page_path,
                'language' => $book->language,
                'publicationYear' => $book->publication_year,
                'edition' => $book->edition,
                'approvalStatus' => $book->approval_status,
                'isActive' => $book->is_active,
                'createdAt' => is_string($book->created_at) ? $book->created_at : $book->created_at->toISOString(),
            ], 'Tạo sách thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin createBook: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Create chapter for book (Admin only)
     */
    public function createChapter(int $bookId, Request $request): JsonResponse
    {
        try {
            // Check if user is admin
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền tạo chương');
            }

            // Check if book exists
            $book = Book::find($bookId);
            if (!$book) {
                return $this->notFound('Book');
            }

            $validator = Validator::make($request->all(), [
                'title' => ['required', 'string', 'max:200'],
                'description' => ['required', 'string'],
                'orderIndex' => ['nullable', 'integer', 'min:1'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

            // If orderIndex not provided, get the next order index
            $orderIndex = $data['orderIndex'] ?? null;
            if ($orderIndex === null) {
                $maxOrder = BookChapter::where('book_id', $bookId)->max('order_index');
                $orderIndex = ($maxOrder ?? 0) + 1;
            } else {
                // Check if order index already exists
                $existingChapter = BookChapter::where('book_id', $bookId)
                    ->where('order_index', $orderIndex)
                    ->first();
                if ($existingChapter) {
                    return $this->error(
                        MessageCode::VALIDATION_ERROR,
                        "Thứ tự chương {$orderIndex} đã tồn tại. Vui lòng chọn thứ tự khác.",
                        null,
                        400,
                        $request
                    );
                }
            }

            $chapter = BookChapter::create([
                'book_id' => $bookId,
                'title' => $data['title'],
                'description' => $data['description'],
                'order_index' => $orderIndex,
                'created_by' => $user->name ?? $user->email,
            ]);

            return $this->success([
                'id' => $chapter->id,
                'bookId' => $chapter->book_id,
                'title' => $chapter->title,
                'description' => $chapter->description,
                'orderIndex' => $chapter->order_index,
                'createdAt' => is_string($chapter->created_at) ? $chapter->created_at : $chapter->created_at->toISOString(),
            ], 'Tạo chương thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin createChapter: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * List books for admin with filters, search, and pagination
     * GET /api/admin/books
     */
    public function listBooks(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem danh sách sách');
            }

            $query = Book::query()->with(['category:id,name', 'author:id,name,email']);

            // Search
            if ($request->filled('search')) {
                $search = $request->string('search');
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'ilike', "%{$search}%")
                      ->orWhere('description', 'ilike', "%{$search}%")
                      ->orWhere('isbn', 'ilike', "%{$search}%");
                });
            }

            // Filters
            if ($request->filled('categoryId')) {
                $query->where('category_id', $request->integer('categoryId'));
            }

            if ($request->filled('isActive')) {
                $query->whereRaw('is_active = ?', [$request->boolean('isActive')]);
            }

            if ($request->filled('approvalStatus')) {
                $query->where('approval_status', $request->integer('approvalStatus'));
            }

            if ($request->filled('authorId')) {
                $query->where('author_id', $request->integer('authorId'));
            }

            // Sorting
            $sortBy = $request->string('sortBy', 'created_at')->toString();
            $sortOrder = $request->string('sortOrder', 'desc')->toString();
            $allowedSorts = ['created_at', 'updated_at', 'title', 'price', 'publication_year'];
            if (in_array($sortBy, $allowedSorts)) {
                $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
            } else {
                $query->orderBy('created_at', 'desc');
            }

            // Pagination
            $perPage = min(max(1, (int) $request->query('perPage', 20)), 100);
            $page = max(1, (int) $request->query('page', 1));
            $result = $query->paginate($perPage, ['*'], 'page', $page);

            return $this->success([
                'data' => $result->items(),
                'pagination' => [
                    'current_page' => $result->currentPage(),
                    'last_page' => $result->lastPage(),
                    'per_page' => $result->perPage(),
                    'total' => $result->total(),
                    'from' => $result->firstItem(),
                    'to' => $result->lastItem(),
                ],
            ], 'Lấy danh sách sách thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin listBooks: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get book detail for admin
     * GET /api/admin/books/{id}
     */
    public function getBook(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem chi tiết sách');
            }

            $book = Book::with(['category:id,name', 'author:id,name,email', 'chapters' => function ($q) {
                $q->orderBy('order_index');
            }])->find($id);

            if (!$book) {
                return $this->notFound('Book');
            }

            return $this->success($book, 'Lấy thông tin sách thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin getBook: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Update book for admin
     * PUT /api/admin/books/{id}
     */
    public function updateBook(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền cập nhật sách');
            }

            $book = Book::find($id);
            if (!$book) {
                return $this->notFound('Book');
            }

            $validator = Validator::make($request->all(), [
                'title' => ['sometimes', 'required', 'string', 'max:200'],
                'description' => ['sometimes', 'required', 'string'],
                'isbn' => ['nullable', 'string', 'max:20', 'unique:books,isbn,' . $id],
                'coverImage' => ['sometimes', 'string', 'max:255'],
                'price' => ['sometimes', 'required', 'numeric', 'min:0'],
                'categoryId' => ['nullable', 'integer', function ($attribute, $value, $fail) {
                    if ($value !== null && !\App\Models\Category::where('id', $value)->exists()) {
                        $fail('The selected category does not exist.');
                    }
                }],
                'language' => ['nullable', 'string', 'max:10'],
                'publicationYear' => ['nullable', 'integer', 'min:1900', 'max:' . date('Y')],
                'edition' => ['nullable', 'string', 'max:50'],
                'authorId' => ['nullable', 'integer', 'exists:users,id'],
                'isActive' => ['nullable', 'boolean'],
                'approvalStatus' => ['nullable', 'integer', 'in:1,2,3'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

            // Prepare update data
            $updateData = [];
            if (isset($data['title'])) $updateData['title'] = (string) $data['title'];
            if (isset($data['description'])) $updateData['description'] = (string) $data['description'];
            if (isset($data['isbn'])) $updateData['isbn'] = (string) $data['isbn'];
            if (isset($data['coverImage'])) $updateData['cover_image'] = (string) $data['coverImage'];
            if (isset($data['price'])) $updateData['price'] = (float) $data['price'];
            if (isset($data['categoryId'])) {
                if ($data['categoryId'] === null) {
                    $updateData['category_id'] = null;
                } else {
                    $categoryId = (int) $data['categoryId'];
                    if (!\App\Models\Category::where('id', $categoryId)->exists()) {
                        return $this->error(
                            MessageCode::VALIDATION_ERROR,
                            "Category with ID {$categoryId} does not exist",
                            null,
                            400
                        );
                    }
                    $updateData['category_id'] = $categoryId;
                }
            }
            if (isset($data['language'])) $updateData['language'] = (string) $data['language'];
            if (isset($data['publicationYear'])) $updateData['publication_year'] = (int) $data['publicationYear'];
            if (isset($data['edition'])) $updateData['edition'] = (string) $data['edition'];
            if (isset($data['authorId'])) {
                $authorId = (int) $data['authorId'];
                if (!\App\Models\User::where('id', $authorId)->exists()) {
                    return $this->error(
                        MessageCode::VALIDATION_ERROR,
                        "Author with ID {$authorId} does not exist",
                        null,
                        400
                    );
                }
                $updateData['author_id'] = $authorId;
            }
            if (isset($data['isActive'])) {
                // Use raw SQL for boolean in PostgreSQL
                $updateData['is_active'] = \DB::raw($data['isActive'] ? 'true' : 'false');
            }
            if (isset($data['approvalStatus'])) $updateData['approval_status'] = (int) $data['approvalStatus'];

            $updateData['updated_by'] = $user->name ?? $user->email;

            // Update book
            $book->update($updateData);
            $book->refresh();
            $book->load(['category:id,name', 'author:id,name,email']);

            return $this->success($book, 'Cập nhật sách thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin updateBook: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Delete book for admin
     * DELETE /api/admin/books/{id}
     */
    public function deleteBook(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xóa sách');
            }

            $book = Book::find($id);
            if (!$book) {
                return $this->notFound('Book');
            }

            // Check if book has chapters or other related data
            $chapterCount = BookChapter::where('book_id', $id)->count();
            if ($chapterCount > 0) {
                return $this->error(
                    MessageCode::VALIDATION_ERROR,
                    "Không thể xóa sách vì sách có {$chapterCount} chương. Vui lòng xóa các chương trước.",
                    null,
                    400
                );
            }

            $book->delete();

            return $this->success(null, 'Xóa sách thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin deleteBook: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get chapter questions (Admin only - no ownership check)
     * GET /api/admin/books/{bookId}/chapters/{chapterId}/questions
     */
    public function getChapterQuestions(int $bookId, int $chapterId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem câu hỏi');
            }

            // Verify chapter exists and belongs to book
            $chapter = BookChapter::where('id', $chapterId)
                ->where('book_id', $bookId)
                ->first();
            
            if (!$chapter) {
                return $this->notFound('Chapter');
            }

            // Get questions for this chapter (context_type = 2 for book_chapter)
            // Debug: Log query parameters
            \Log::info('Admin getChapterQuestions - bookId: ' . $bookId . ', chapterId: ' . $chapterId);
            
            // Check total questions for this chapter (without is_active filter)
            $totalQuestions = \App\Models\Question::where('context_type', 2)
                ->where('context_id', $chapterId)
                ->count();
            \Log::info('Total questions for chapter ' . $chapterId . ': ' . $totalQuestions);
            
            // Get questions with is_active filter (PostgreSQL compatible)
            // For admin, we can show all questions (active and inactive) for debugging
            $questions = \App\Models\Question::where('context_type', 2)
                ->where('context_id', $chapterId)
                ->where('is_active', true) // Use direct boolean comparison instead of whereRaw
                ->with(['options', 'bookSolutions'])
                ->orderBy('order_index')
                ->get();
            
            \Log::info('Active questions found: ' . $questions->count());
            
            // If no active questions found, check for inactive ones (for debugging)
            if ($questions->count() === 0) {
                $inactiveQuestions = \App\Models\Question::where('context_type', 2)
                    ->where('context_id', $chapterId)
                    ->where('is_active', false)
                    ->count();
                \Log::info('Inactive questions for chapter ' . $chapterId . ': ' . $inactiveQuestions);
                
                // Also check if there are any questions at all (regardless of is_active)
                $allQuestions = \App\Models\Question::where('context_type', 2)
                    ->where('context_id', $chapterId)
                    ->count();
                \Log::info('All questions (active + inactive) for chapter ' . $chapterId . ': ' . $allQuestions);
            }

            // Format questions with solutions (same format as BookController)
            $formattedQuestions = $questions->map(function($question) {
                $solution = $question->bookSolutions->first();
                
                return [
                    'id' => $question->id,
                    'content' => $question->question_content,
                    'type' => $question->question_type, // 1 = multiple choice, 2 = essay
                    'difficulty' => $question->difficulty_level,
                    'points' => $question->default_points,
                    'explanation' => $question->explanation_content,
                    'image' => $question->question_image,
                    'video_url' => $question->video_url,
                    'order_index' => $question->order_index,
                    'options' => $question->options->map(function($option) {
                        return [
                            'id' => $option->id,
                            'content' => $option->option_content,
                            'image' => $option->option_image,
                            'is_correct' => $option->is_correct,
                            'points' => $option->points_value,
                            'explanation' => $option->explanation_text,
                            'order_index' => $option->order_index,
                        ];
                    })->sortBy('order_index')->values(),
                    'solution' => $solution ? [
                        'id' => $solution->id,
                        'type' => $solution->solution_type, // 1 = video, 2 = text, 3 = latex, 4 = image
                        'content' => $solution->content,
                        'video_url' => $solution->video_url,
                        'image_url' => $solution->image_url,
                        'latex_content' => $solution->latex_content,
                    ] : null,
                ];
            });

            return $this->success([
                'chapter' => [
                    'id' => $chapter->id,
                    'title' => $chapter->title,
                    'description' => $chapter->description,
                    'order_index' => $chapter->order_index,
                ],
                'questions' => $formattedQuestions,
            ], 'Lấy danh sách câu hỏi thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin getChapterQuestions: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Create questions for chapter (Admin only)
     * POST /api/admin/books/{bookId}/chapters/{chapterId}/questions
     */
    public function createChapterQuestions(int $bookId, int $chapterId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền tạo câu hỏi');
            }

            // Verify chapter exists and belongs to book
            $chapter = BookChapter::where('id', $chapterId)
                ->where('book_id', $bookId)
                ->first();
            
            if (!$chapter) {
                return $this->notFound('Chapter');
            }

            $validator = Validator::make($request->all(), [
                'questions' => ['required', 'array', 'min:1'],
                'questions.*.content' => ['required', 'string'],
                'questions.*.type' => ['required', 'string', 'in:multiple_choice,essay'],
                'questions.*.options' => ['required_if:questions.*.type,multiple_choice', 'array', 'min:2'],
                'questions.*.options.*.text' => ['required_with:questions.*.options', 'string'],
                'questions.*.options.*.isCorrect' => ['required_with:questions.*.options', 'boolean'],
                'questions.*.explanation' => ['nullable', 'string'],
                'questions.*.correctAnswer' => ['nullable', 'string'],
                'questions.*.solutionVideo' => ['nullable', 'string', 'url'],
                'questions.*.solutionType' => ['nullable', 'string', 'in:text,video,latex'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            $createdQuestions = [];

            \DB::beginTransaction();

            try {
                foreach ($data['questions'] as $index => $questionData) {
                    // Get next order index
                    $maxOrder = \App\Models\Question::where('context_type', 2)
                        ->where('context_id', $chapterId)
                        ->max('order_index');
                    $orderIndex = ($maxOrder ?? 0) + 1;

                    // Create question
                    $question = \App\Models\Question::create([
                        'context_type' => 2, // book_chapter
                        'context_id' => $chapterId,
                        'question_content' => (string) $questionData['content'],
                        'question_type' => $questionData['type'] === 'multiple_choice' ? 1 : 2,
                        'difficulty_level' => 2, // Default medium
                        'points' => json_encode([]),
                        'default_points' => 1.0,
                        'explanation_content' => $questionData['explanation'] ?? null,
                        'order_index' => $orderIndex,
                        'is_active' => \DB::raw('true'),
                        'created_by' => $user->name ?? $user->email,
                    ]);

                    // Create options for multiple choice
                    if ($questionData['type'] === 'multiple_choice' && isset($questionData['options'])) {
                        foreach ($questionData['options'] as $optIndex => $optionData) {
                            \App\Models\QuestionOption::create([
                                'question_id' => $question->id,
                                'option_content' => (string) $optionData['text'],
                                'is_correct' => \DB::raw($optionData['isCorrect'] ? 'true' : 'false'),
                                'order_index' => $optIndex + 1,
                                'points_value' => $optionData['isCorrect'] ? 1.0 : 0.0,
                                'created_by' => $user->name ?? $user->email,
                            ]);
                        }
                    }

                    // Create solution if provided
                    $solutionType = $questionData['solutionType'] ?? 'text';
                    $hasSolution = false;
                    
                    if ($solutionType === 'video' && !empty($questionData['solutionVideo'])) {
                        // Video solution
                        \App\Models\BookQuestionSolution::create([
                            'question_id' => $question->id,
                            'solution_type' => 1, // Video
                            'content' => 'Video giải thích',
                            'video_url' => (string) $questionData['solutionVideo'],
                            'latex_content' => null,
                            'image_url' => null,
                            'order_index' => 1,
                            'is_active' => \DB::raw('true'),
                            'created_by' => $user->name ?? $user->email,
                        ]);
                        $hasSolution = true;
                    } elseif ($solutionType === 'latex' && !empty($questionData['explanation'])) {
                        // LaTeX solution
                        \App\Models\BookQuestionSolution::create([
                            'question_id' => $question->id,
                            'solution_type' => 3, // LaTeX
                            'content' => (string) $questionData['explanation'],
                            'latex_content' => (string) $questionData['explanation'],
                            'video_url' => null,
                            'image_url' => null,
                            'order_index' => 1,
                            'is_active' => \DB::raw('true'),
                            'created_by' => $user->name ?? $user->email,
                        ]);
                        $hasSolution = true;
                    } elseif ($solutionType === 'text' && !empty($questionData['explanation'])) {
                        // Text solution
                        \App\Models\BookQuestionSolution::create([
                            'question_id' => $question->id,
                            'solution_type' => 2, // Text
                            'content' => (string) $questionData['explanation'],
                            'latex_content' => null,
                            'video_url' => null,
                            'image_url' => null,
                            'order_index' => 1,
                            'is_active' => \DB::raw('true'),
                            'created_by' => $user->name ?? $user->email,
                        ]);
                        $hasSolution = true;
                    }
                    
                    // Also set explanation_content in question if provided
                    if (!empty($questionData['explanation']) && $solutionType !== 'video') {
                        $question->explanation_content = (string) $questionData['explanation'];
                        $question->save();
                    }

                    $createdQuestions[] = [
                        'id' => $question->id,
                        'content' => $question->question_content,
                        'type' => $question->question_type === 1 ? 'multiple_choice' : 'essay',
                    ];
                }

                // Update book total_questions
                $totalQuestions = \App\Models\Question::where('context_type', 2)
                    ->whereIn('context_id', BookChapter::where('book_id', $bookId)->pluck('id'))
                    ->count();
                
                Book::where('id', $bookId)->update(['total_questions' => $totalQuestions]);

                \DB::commit();

                return $this->success([
                    'questions' => $createdQuestions,
                    'count' => count($createdQuestions),
                ], 'Tạo câu hỏi thành công', $request);

            } catch (\Exception $e) {
                \DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            \Log::error('Error in admin createChapterQuestions: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }
}
