<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\User;
use App\Models\Course;
use App\Mail\InstructorAccountCreated;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;

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
            \Log::error('Error in admin listUsers: ' . $e->getMessage());
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
            \Log::error('Error in admin updateUser: ' . $e->getMessage());
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
                    \Log::info('Phone column does not exist in users table, skipping phone field');
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
                
                \Log::info('Instructor account created and email sent', [
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
            \Log::error('Error in admin createInstructor: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
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
            \Log::error('Error in admin resetInstructorPassword: ' . $e->getMessage());
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
            \Log::error('Error in admin listCourses: ' . $e->getMessage());
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
                \Log::info('Books table does not have rating column, skipping book rating calculation');
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
            \Log::error('Error in admin getInstructor: ' . $e->getMessage());
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
            \Log::error('Error in admin getInstructorCourses: ' . $e->getMessage());
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
            \Log::error('Error in admin getInstructorBooks: ' . $e->getMessage());
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
            \Log::error('Error in admin getCourseEnrollments: ' . $e->getMessage());
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
            \Log::error('Error in admin getBookPurchases: ' . $e->getMessage());
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
            \Log::error('Error in admin toggleInstructorStatus: ' . $e->getMessage());
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
            \Log::error('Error in admin getUser: ' . $e->getMessage());
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
            \Log::error('Error in admin getUserCourses: ' . $e->getMessage());
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
            \Log::error('Error in admin getUserBooks: ' . $e->getMessage());
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
            \Log::error('Error in admin toggleUserStatus: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
