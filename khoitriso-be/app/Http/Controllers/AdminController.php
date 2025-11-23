<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\User;
use App\Models\Course;
use App\Models\Book;
use App\Models\BookChapter;
use App\Models\Order;
use App\Models\Notification;
use App\Models\CourseEnrollment;
use App\Mail\AssignmentCreated;
use App\Mail\InstructorAccountCreated;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;

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
                        'totalLessons' => $course->total_lessons ?? 0,
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
     * Get pending courses for approval
     */
    public function pendingCourses(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'admin') {
                return $this->forbidden();
            }

            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);

            $q = Course::with(['instructor:id,name,email', 'category:id,name'])
                ->where('approval_status', 0); // Pending approval

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
                        'price' => (float) $course->price,
                        'isFree' => (bool) $course->is_free,
                        'approvalStatus' => (int) $course->approval_status,
                        'isPublished' => (bool) $course->is_published,
                        'reviewNotes' => $course->review_notes,
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
            Log::error('Error in admin pendingCourses: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get pending books for approval
     */
    public function pendingBooks(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'admin') {
                return $this->forbidden();
            }

            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);

            $q = Book::with(['author:id,name,email', 'category:id,name'])
                ->where('approval_status', 0); // Pending approval

            $total = $q->count();
            $books = $q->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($book) {
                    return [
                        'id' => $book->id,
                        'title' => $book->title,
                        'description' => $book->description,
                        'isbn' => $book->isbn,
                        'coverImage' => $book->cover_image,
                        'price' => (float) $book->price,
                        'approvalStatus' => (int) $book->approval_status,
                        'isPublished' => (bool) $book->is_published,
                        'reviewNotes' => $book->review_notes,
                        'author' => $book->author ? [
                            'id' => $book->author->id,
                            'name' => $book->author->name,
                            'email' => $book->author->email,
                        ] : null,
                        'category' => $book->category ? [
                            'id' => $book->category->id,
                            'name' => $book->category->name,
                        ] : null,
                        'createdAt' => is_string($book->created_at) ? $book->created_at : $book->created_at->toISOString(),
                        'updatedAt' => is_string($book->updated_at) ? $book->updated_at : $book->updated_at->toISOString(),
                    ];
                });

            return $this->paginated($books->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            Log::error('Error in admin pendingBooks: ' . $e->getMessage());
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
            
            // Update approval status and publish
            DB::statement('UPDATE courses SET approval_status = 1, is_published = true::boolean WHERE id = ?', [$id]);
            $course->refresh();
            
            // Send notification to instructor
            if ($course->instructor_id) {
                Notification::create([
                    'user_id' => $course->instructor_id,
                    'title' => 'Khóa học đã được phê duyệt',
                    'message' => "Khóa học \"{$course->title}\" của bạn đã được phê duyệt và xuất bản thành công.",
                    'type' => 1, // Course approval notification
                    'action_url' => "/courses/{$course->id}",
                    'priority' => 2,
                ]);
            }
            
            return $this->success([
                'id' => $course->id,
                'approvalStatus' => 1,
                'isPublished' => true,
                'message' => 'Khóa học đã được phê duyệt và xuất bản'
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
            
            $reason = $request->input('reason', 'Nội dung không phù hợp với tiêu chuẩn của hệ thống.');
            
            // Update approval status, unpublish, and store rejection reason
            DB::statement('UPDATE courses SET approval_status = 2, is_published = false::boolean, review_notes = ? WHERE id = ?', [$reason, $id]);
            $course->refresh();
            
            // Send notification to instructor with rejection reason
            if ($course->instructor_id) {
                Notification::create([
                    'user_id' => $course->instructor_id,
                    'title' => 'Khóa học bị từ chối',
                    'message' => "Khóa học \"{$course->title}\" của bạn đã bị từ chối. Lý do: {$reason}. Vui lòng chỉnh sửa và gửi lại để được xem xét.",
                    'type' => 1, // Course rejection notification
                    'action_url' => "/dashboard/courses/{$course->id}",
                    'priority' => 3, // High priority
                ]);
            }
            
            return $this->success([
                'id' => $course->id,
                'approvalStatus' => 2,
                'reviewNotes' => $reason,
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

            // Update approval status and publish
            DB::statement('UPDATE books SET approval_status = 1, is_published = true::boolean WHERE id = ?', [$id]);
            $book->refresh();

            // Send notification to author
            if ($book->author_id) {
                Notification::create([
                    'user_id' => $book->author_id,
                    'title' => 'Sách đã được phê duyệt',
                    'message' => "Sách \"{$book->title}\" của bạn đã được phê duyệt và xuất bản thành công.",
                    'type' => 2, // Book approval notification
                    'action_url' => "/books/{$book->id}",
                    'priority' => 2,
                ]);
            }

            return $this->success([
                'id' => $book->id,
                'approvalStatus' => 1,
                'isPublished' => true,
                'message' => 'Sách đã được phê duyệt và xuất bản'
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

            $reason = $request->input('reason', 'Nội dung không phù hợp với tiêu chuẩn của hệ thống.');
            
            // Update approval status, unpublish, and store rejection reason
            DB::statement('UPDATE books SET approval_status = 2, is_published = false::boolean, review_notes = ? WHERE id = ?', [$reason, $id]);
            $book->refresh();

            // Send notification to author with rejection reason
            if ($book->author_id) {
                Notification::create([
                    'user_id' => $book->author_id,
                    'title' => 'Sách bị từ chối',
                    'message' => "Sách \"{$book->title}\" của bạn đã bị từ chối. Lý do: {$reason}. Vui lòng chỉnh sửa và gửi lại để được xem xét.",
                    'type' => 2, // Book rejection notification
                    'action_url' => "/dashboard/books/{$book->id}",
                    'priority' => 3, // High priority
                ]);
            }

            return $this->success([
                'id' => $book->id,
                'approvalStatus' => 2,
                'reviewNotes' => $reason,
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
                'approval_status' => 1, // Approved by default for admin
                'is_published' => true, // Auto-publish for admin
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
                        if (in_array($col, ['is_active', 'is_published'])) {
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
                'is_active' => true,
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
     * Update chapter (Admin only)
     * PUT /api/admin/books/{bookId}/chapters/{chapterId}
     */
    public function updateChapter(int $bookId, int $chapterId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role !== 'admin' && $user->role !== 'instructor')) {
                return $this->forbidden('Chỉ admin và giảng viên mới có quyền cập nhật chương');
            }

            $chapter = BookChapter::with('book')->find($chapterId);
            if (!$chapter) {
                return $this->notFound('Chapter');
            }

            if ($chapter->book_id !== $bookId) {
                return $this->error(MessageCode::VALIDATION_ERROR, 'Chương không thuộc sách này', null, 400, $request);
            }

            // Check if instructor owns the book
            if ($user->role === 'instructor') {
                if (!$chapter->book || $chapter->book->author_id !== $user->id) {
                    return $this->forbidden('Bạn không có quyền cập nhật chương này');
                }
            }

            $validator = Validator::make($request->all(), [
                'title' => ['sometimes', 'required', 'string', 'max:200'],
                'description' => ['sometimes', 'required', 'string'],
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

            // If orderIndex is being changed, check for conflicts
            if (isset($data['orderIndex']) && $data['orderIndex'] != $chapter->order_index) {
                $existingChapter = BookChapter::where('book_id', $bookId)
                    ->where('id', '!=', $chapterId)
                    ->where('order_index', $data['orderIndex'])
                    ->first();
                if ($existingChapter) {
                    return $this->error(
                        MessageCode::VALIDATION_ERROR,
                        "Thứ tự chương {$data['orderIndex']} đã tồn tại. Vui lòng chọn thứ tự khác.",
                        null,
                        400,
                        $request
                    );
                }
            }

            $chapter->fill([
                'title' => $data['title'] ?? $chapter->title,
                'description' => $data['description'] ?? $chapter->description,
                'order_index' => $data['orderIndex'] ?? $chapter->order_index,
                'updated_by' => $user->name ?? $user->email,
            ])->save();

            return $this->success([
                'id' => $chapter->id,
                'bookId' => $chapter->book_id,
                'title' => $chapter->title,
                'description' => $chapter->description,
                'orderIndex' => $chapter->order_index,
                'updatedAt' => is_string($chapter->updated_at) ? $chapter->updated_at : $chapter->updated_at->toISOString(),
            ], 'Cập nhật chương thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin updateChapter: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Delete chapter (Admin only) - Soft delete
     * DELETE /api/admin/books/{bookId}/chapters/{chapterId}
     */
    public function deleteChapter(int $bookId, int $chapterId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role !== 'admin' && $user->role !== 'instructor')) {
                return $this->forbidden('Chỉ admin và giảng viên mới có quyền vô hiệu hóa chương');
            }

            $chapter = BookChapter::with('book')->find($chapterId);
            if (!$chapter) {
                return $this->notFound('Chapter');
            }

            if ($chapter->book_id !== $bookId) {
                return $this->error(MessageCode::VALIDATION_ERROR, 'Chương không thuộc sách này', null, 400, $request);
            }

            // Check if instructor owns the book
            if ($user->role === 'instructor') {
                if (!$chapter->book || $chapter->book->author_id !== $user->id) {
                    return $this->forbidden('Bạn không có quyền vô hiệu hóa chương này');
                }
            }

            // Soft delete: set is_active = false (use direct update with raw SQL for PostgreSQL boolean)
            \DB::table('book_chapters')
                ->where('id', $chapterId)
                ->update([
                    'is_active' => \DB::raw('false'),
                    'updated_at' => now(),
                    'updated_by' => $user->name ?? $user->email,
                ]);

            return $this->success(null, 'Vô hiệu hóa chương thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin deleteChapter: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Restore chapter (Admin only) - Set is_active = true
     * POST /api/admin/books/{bookId}/chapters/{chapterId}/restore
     */
    public function restoreChapter(int $bookId, int $chapterId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role !== 'admin' && $user->role !== 'instructor')) {
                return $this->forbidden('Chỉ admin và giảng viên mới có quyền khôi phục chương');
            }

            $chapter = BookChapter::with('book')->find($chapterId);
            if (!$chapter) {
                return $this->notFound('Chapter');
            }

            if ($chapter->book_id !== $bookId) {
                return $this->error(MessageCode::VALIDATION_ERROR, 'Chương không thuộc sách này', null, 400, $request);
            }

            // Check if instructor owns the book
            if ($user->role === 'instructor') {
                if (!$chapter->book || $chapter->book->author_id !== $user->id) {
                    return $this->forbidden('Bạn không có quyền khôi phục chương này');
                }
            }

            // Restore: set is_active = true
            \DB::table('book_chapters')
                ->where('id', $chapterId)
                ->update([
                    'is_active' => \DB::raw('true'),
                    'updated_at' => now(),
                    'updated_by' => $user->name ?? $user->email,
                ]);

            return $this->success(null, 'Khôi phục chương thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin restoreChapter: ' . $e->getMessage());
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
            
            // Admin can see all books (active and inactive) by default
            // Only filter by isActive if explicitly requested
            // If not specified, show all books

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

            // Handle status parameter (active/inactive) - map to is_active
            if ($request->filled('status')) {
                $status = $request->string('status')->toString();
                if ($status === 'active') {
                    $query->whereRaw('is_active = true');
                } elseif ($status === 'inactive') {
                    $query->whereRaw('is_active = false');
                }
            }

            // Also support isActive parameter (boolean)
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
     * Delete book for admin (Soft delete - set is_active = false)
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

            // Soft delete: set is_active = false (use direct update with raw SQL for PostgreSQL boolean)
            \DB::table('books')
                ->where('id', $id)
                ->update([
                    'is_active' => \DB::raw('false'),
                    'updated_by' => $user->name ?? $user->email,
                    'updated_at' => now(),
                ]);

            return $this->success(null, 'Xóa sách thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin deleteBook: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
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
            // PostgreSQL requires explicit boolean cast
            $questions = \App\Models\Question::where('context_type', 2)
                ->where('context_id', $chapterId)
                ->whereRaw('is_active = true') // PostgreSQL boolean comparison
                ->with(['options', 'bookSolutions'])
                ->orderBy('order_index')
                ->get();
            
            \Log::info('Active questions found: ' . $questions->count());
            
            // If no active questions found, check for inactive ones (for debugging)
            if ($questions->count() === 0) {
                $inactiveQuestions = \App\Models\Question::where('context_type', 2)
                    ->where('context_id', $chapterId)
                    ->whereRaw('is_active = false') // PostgreSQL boolean comparison
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

    /**
     * Delete all questions for a chapter (Admin only)
     * DELETE /api/admin/books/{bookId}/chapters/{chapterId}/questions
     */
    public function deleteChapterQuestions(int $bookId, int $chapterId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role !== 'admin' && $user->role !== 'instructor')) {
                return $this->forbidden('Chỉ admin và giảng viên mới có quyền xóa câu hỏi');
            }

            // Verify chapter exists and belongs to book
            $chapter = BookChapter::where('id', $chapterId)
                ->where('book_id', $bookId)
                ->first();
            
            if (!$chapter) {
                return $this->notFound('Chapter');
            }

            // Check if instructor owns the book
            if ($user->role === 'instructor') {
                if (!$chapter->book || $chapter->book->author_id !== $user->id) {
                    return $this->forbidden('Bạn không có quyền xóa câu hỏi của chương này');
                }
            }

            // Soft delete all questions for this chapter (context_type = 2 for book_chapter)
            $deletedCount = \DB::table('questions')
                ->where('context_type', 2)
                ->where('context_id', $chapterId)
                ->update([
                    'is_active' => \DB::raw('false'),
                    'updated_at' => now(),
                ]);

            return $this->success(['deletedCount' => $deletedCount], "Đã xóa {$deletedCount} câu hỏi", $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin deleteChapterQuestions: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Download Word template for questions (Admin only)
     * GET /api/admin/books/{bookId}/chapters/{chapterId}/questions/template
     */
    public function downloadQuestionTemplate(int $bookId, int $chapterId, Request $request)
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role !== 'admin' && $user->role !== 'instructor')) {
                return $this->forbidden('Chỉ admin và giảng viên mới có quyền tải file mẫu');
            }

            // Verify chapter exists and belongs to book
            $chapter = BookChapter::where('id', $chapterId)
                ->where('book_id', $bookId)
                ->first();
            
            if (!$chapter) {
                return $this->notFound('Chapter');
            }

            // Instead of using PhpWord, create a simple RTF file
            // RTF is more compatible with Word 2016
            $rtfContent = '{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}}
{\\colortbl ;\\red0\\green0\\blue0;}
\\viewkind4\\uc1\\pard\\cf1\\f0\\fs24

{\\b\\fs32 MAU FILE TAO CAU HOI CHO CHUONG SACH}\\par
\\par

{\\b\\fs28 HUONG DAN SU DUNG:}\\par
\\par
1. Moi cau hoi bat dau bang dong "Cau X:" (X la so thu tu)\\par
2. Co 4 loai:\\par
   - [TIEU DE]: Chi la tieu de, khong phai cau hoi (Loai 0)\\par
   - [TRAC NGHIEM]: Cau hoi trac nghiem 1 dap an dung (Loai 1)\\par
   - [NHIEU DAP AN]: Cau hoi trac nghiem nhieu dap an dung (Loai 2)\\par
   - [TU LUAN]: Cau hoi tu luan (Loai 3)\\par
3. Noi dung cau hoi viet ngay sau loai cau hoi\\par
4. Voi cau trac nghiem (Loai 1 va 2):\\par
   - Moi lua chon bat dau bang "A.", "B.", "C.", "D.", ...\\par
   - Danh dau dap an dung bang dau * o TRUOC lua chon: "*A. ..."\\par
   - Vi du: "*A. Dap an dung" hoac "A. Dap an sai"\\par
5. Voi cau tu luan:\\par
   - Dap an mau (neu co) viet sau dong "Dap an:"\\par
6. Giai thich (neu co) viet sau dong "Giai thich:"\\par
\\par
\\par

{\\b\\fs28 VI DU:}\\par
\\par
{\\b Cau 0:}\\par
[TIEU DE]\\par
Chuong 1: Dai so co ban\\par
\\par
{\\b Cau 1:}\\par
[TRAC NGHIEM]\\par
Tinh gia tri cua bieu thuc: 2x + 3 khi x = 5\\par
*A. 13\\par
B. 10\\par
C. 15\\par
D. 20\\par
Giai thich: Thay x = 5 vao bieu thuc ta co 2(5) + 3 = 13\\par
\\par
{\\b Cau 2:}\\par
[NHIEU DAP AN]\\par
Chon cac so nguyen to trong cac so sau:\\par
*A. 2\\par
B. 4\\par
*C. 5\\par
D. 6\\par
*E. 7\\par
Giai thich: So nguyen to la so chi chia het cho 1 va chinh no\\par
\\par
{\\b Cau 3:}\\par
[TU LUAN]\\par
Giai phuong trinh: x^2 - 5x + 6 = 0\\par
Dap an: x = 2 hoac x = 3\\par
Giai thich: Phan tich thanh nhan tu: (x-2)(x-3) = 0\\par
\\par
\\par
{\\b --- BAT DAU DIEN CAU HOI CUA BAN TAI DAY ---}\\par
\\par
\\par
}';

            // Save RTF file
            $tempDir = sys_get_temp_dir();
            if (!is_writable($tempDir)) {
                $tempDir = storage_path('app/temp');
                if (!is_dir($tempDir)) {
                    mkdir($tempDir, 0755, true);
                }
            }
            
            $tempFile = $tempDir . DIRECTORY_SEPARATOR . 'question_template_' . uniqid() . '.rtf';
            
            try {
                // Write RTF content to file
                file_put_contents($tempFile, $rtfContent);
                
                // Verify file was created
                if (!file_exists($tempFile) || filesize($tempFile) === 0) {
                    throw new \Exception('RTF file was not created properly');
                }
                
                \Log::info("RTF template created: {$tempFile}, size: " . filesize($tempFile) . " bytes");

                // Return file as download
                $fileName = "Mau_Cau_Hoi_Chuong_{$chapterId}.rtf";
                
                return response()->download($tempFile, $fileName, [
                    'Content-Type' => 'application/rtf',
                ])->deleteFileAfterSend(true);
                
            } catch (\Exception $e) {
                \Log::error('Error creating RTF file: ' . $e->getMessage());
                if (isset($tempFile) && file_exists($tempFile)) {
                    @unlink($tempFile);
                }
                return $this->error('Không thể tạo file mẫu: ' . $e->getMessage(), 500);
            }

        } catch (\Exception $e) {
            \Log::error('Error in downloadQuestionTemplate: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->error('Lỗi khi tạo file mẫu: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Import questions from Word file (Admin only)
     * POST /api/admin/books/{bookId}/chapters/{chapterId}/questions/import
     */
    public function importQuestionsFromWord(int $bookId, int $chapterId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role !== 'admin' && $user->role !== 'instructor')) {
                return $this->forbidden('Chỉ admin và giảng viên mới có quyền import câu hỏi');
            }

            // Verify chapter exists
            $chapter = BookChapter::where('id', $chapterId)
                ->where('book_id', $bookId)
                ->first();
            
            if (!$chapter) {
                return $this->notFound('Chapter');
            }

            // Validate file - support DOCX, DOC, and RTF
            $validator = Validator::make($request->all(), [
                'file' => ['required', 'file', 'mimes:docx,doc,rtf', 'max:10240'], // Max 10MB
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors()->toArray());
            }

            $file = $request->file('file');
            $filePath = $file->getRealPath();

            // Load Word document
            try {
                $phpWord = IOFactory::load($filePath);
            } catch (\Exception $e) {
                return $this->error('Không thể đọc file Word. Vui lòng kiểm tra định dạng file.', 400);
            }

            // Parse questions from document
            $questions = [];
            $currentQuestion = null;
            $currentType = null;
            $questionNumber = 0;

            foreach ($phpWord->getSections() as $section) {
                foreach ($section->getElements() as $element) {
                    if (method_exists($element, 'getText')) {
                        $text = trim($element->getText());
                        
                        if (empty($text) || strpos($text, '---') !== false || strpos($text, 'HƯỚNG DẪN') !== false) {
                            continue; // Skip instructions and separators
                        }

                        // Check if this is a question header - support both "Câu 1:" and "Câu 1."
                        if (preg_match('/^Câu\s+(\d+)[:\.]?\s*/i', $text, $matches)) {
                            // Save previous question if exists
                            if ($currentQuestion) {
                                // Clean up _in_explanation flag before saving
                                unset($currentQuestion['_in_explanation']);
                                $questions[] = $currentQuestion;
                            }
                            
                            $questionNumber = (int)$matches[1];
                            $currentQuestion = [
                                'content' => '',
                                'type' => null,
                                'options' => [],
                                'explanation' => '',
                                'correctAnswer' => '',
                            ];
                            $currentType = null;
                            
                            // Extract question content from same line if present
                            $remainingText = preg_replace('/^Câu\s+(\d+)[:\.]?\s*/i', '', $text);
                            if (!empty(trim($remainingText))) {
                                $currentQuestion['content'] = trim($remainingText);
                            }
                        }
                        // Check question type
                        elseif (preg_match('/\[TIÊU\s*ĐỀ\]/i', $text)) {
                            if ($currentQuestion) {
                                $currentQuestion['type'] = 'title'; // Loại 0
                                $currentType = 'title';
                            }
                        }
                        elseif (preg_match('/\[TRẮC\s*NGHIỆM\]/i', $text)) {
                            if ($currentQuestion) {
                                $currentQuestion['type'] = 'multiple_choice_single'; // Loại 1
                                $currentType = 'multiple_choice_single';
                            }
                        }
                        elseif (preg_match('/\[NHIỀU\s*ĐÁP\s*ÁN\]/i', $text)) {
                            if ($currentQuestion) {
                                $currentQuestion['type'] = 'multiple_choice_multiple'; // Loại 2
                                $currentType = 'multiple_choice_multiple';
                            }
                        }
                        elseif (preg_match('/\[TỰ\s*LUẬN\]/i', $text)) {
                            if ($currentQuestion) {
                                $currentQuestion['type'] = 'essay'; // Loại 3
                                $currentType = 'essay';
                            }
                        }
                        // Check for options (A., B., C., D., etc.) with * prefix for correct answer
                        // Support both formats: "*A. text" and "A. text"
                        elseif (preg_match('/^(\*)?\s*([A-Z])\.\s*(.+)$/i', $text, $optMatches)) {
                            if ($currentQuestion && ($currentType === 'multiple_choice_single' || $currentType === 'multiple_choice_multiple')) {
                                $isCorrect = !empty($optMatches[1]) && trim($optMatches[1]) === '*';
                                $optionText = trim($optMatches[3]);
                                $currentQuestion['options'][] = [
                                    'text' => $optionText,
                                    'isCorrect' => $isCorrect,
                                ];
                            }
                        }
                        // Check for answer
                        elseif (preg_match('/^Đáp\s*án:/i', $text, $ansMatches)) {
                            $answerText = preg_replace('/^Đáp\s*án:\s*/i', '', $text);
                            if ($currentQuestion && $currentType === 'essay') {
                                $currentQuestion['correctAnswer'] = trim($answerText);
                            }
                        }
                        // Check for explanation - support both "Giải thích:" and "Lời giải"
                        elseif (preg_match('/^(Giải\s*thích|Lời\s*giải):/i', $text, $expMatches)) {
                            $explanationText = preg_replace('/^(Giải\s*thích|Lời\s*giải):\s*/i', '', $text);
                            if ($currentQuestion) {
                                $currentQuestion['explanation'] = trim($explanationText);
                            }
                        }
                        // Also check for standalone "Lời giải" on its own line (common format)
                        elseif (preg_match('/^(Lời\s*giải)$/i', $text)) {
                            // Mark that we're in explanation mode - next lines are explanation
                            if ($currentQuestion) {
                                $currentQuestion['_in_explanation'] = true;
                            }
                        }
                        // Otherwise, add to question content or explanation
                        else {
                            // If we're in explanation mode, add to explanation
                            if ($currentQuestion && !empty($currentQuestion['_in_explanation'])) {
                                if (!empty($currentQuestion['explanation'])) {
                                    $currentQuestion['explanation'] .= ' ';
                                }
                                $currentQuestion['explanation'] .= $text;
                            }
                            elseif ($currentQuestion && $currentType === null) {
                                // Still determining type, add to content
                                if (!empty($currentQuestion['content'])) {
                                    $currentQuestion['content'] .= ' ';
                                }
                                $currentQuestion['content'] .= $text;
                            } elseif ($currentQuestion && $currentType === 'title') {
                                // For title type, content is the title text
                                if (!empty($currentQuestion['content'])) {
                                    $currentQuestion['content'] .= ' ';
                                }
                                $currentQuestion['content'] .= $text;
                            } elseif ($currentQuestion && $currentType === 'essay' && empty($currentQuestion['correctAnswer'])) {
                                // Add to content if not yet set answer
                                if (!empty($currentQuestion['content'])) {
                                    $currentQuestion['content'] .= ' ';
                                }
                                $currentQuestion['content'] .= $text;
                            } elseif ($currentQuestion && ($currentType === 'multiple_choice_single' || $currentType === 'multiple_choice_multiple') && empty($currentQuestion['options'])) {
                                // Add to content if no options yet
                                if (!empty($currentQuestion['content'])) {
                                    $currentQuestion['content'] .= ' ';
                                }
                                $currentQuestion['content'] .= $text;
                            }
                        }
                    }
                }
            }

            // Save last question
            if ($currentQuestion) {
                $questions[] = $currentQuestion;
            }

            // Validate and create questions
            if (empty($questions)) {
                return $this->error('Không tìm thấy câu hỏi nào trong file. Vui lòng kiểm tra định dạng file.', 400);
            }

            $createdQuestions = [];
            \DB::beginTransaction();

            try {
                foreach ($questions as $index => $questionData) {
                    // Skip title type (loại 0) - chỉ là tiêu đề, không phải câu hỏi
                    if ($questionData['type'] === 'title') {
                        continue;
                    }

                    // Validate question
                    if (empty($questionData['content'])) {
                        continue; // Skip invalid questions
                    }

                    // Determine question type if not set
                    if (!$questionData['type']) {
                        if (!empty($questionData['options'])) {
                            // Count correct answers
                            $correctCount = count(array_filter($questionData['options'], function($opt) {
                                return $opt['isCorrect'] ?? false;
                            }));
                            $questionData['type'] = $correctCount > 1 ? 'multiple_choice_multiple' : 'multiple_choice_single';
                        } else {
                            $questionData['type'] = 'essay';
                        }
                    }

                    // Validate multiple choice questions
                    if (($questionData['type'] === 'multiple_choice_single' || $questionData['type'] === 'multiple_choice_multiple')) {
                        if (empty($questionData['options']) || count($questionData['options']) < 2) {
                            continue; // Skip invalid multiple choice
                        }
                        
                        // Validate at least one correct answer
                        $hasCorrect = false;
                        foreach ($questionData['options'] as $opt) {
                            if ($opt['isCorrect'] ?? false) {
                                $hasCorrect = true;
                                break;
                            }
                        }
                        if (!$hasCorrect) {
                            continue; // Skip if no correct answer
                        }
                    }

                    // Get next order index
                    $maxOrder = \App\Models\Question::where('context_type', 2)
                        ->where('context_id', $chapterId)
                        ->max('order_index');
                    $orderIndex = ($maxOrder ?? 0) + 1;

                    // Map question type to database value
                    // 1 = multiple choice (single or multiple), 2 = essay
                    $dbQuestionType = ($questionData['type'] === 'multiple_choice_single' || $questionData['type'] === 'multiple_choice_multiple') ? 1 : 2;

                    // Create question
                    $question = \App\Models\Question::create([
                        'context_type' => 2,
                        'context_id' => $chapterId,
                        'question_content' => $questionData['content'],
                        'question_type' => $dbQuestionType,
                        'difficulty_level' => 2,
                        'points' => json_encode([]),
                        'default_points' => 1.0,
                        'explanation_content' => $questionData['explanation'] ?? null,
                        'order_index' => $orderIndex,
                        'is_active' => \DB::raw('true'),
                        'created_by' => $user->name ?? $user->email,
                    ]);

                    // Create options for multiple choice (both single and multiple)
                    if (($questionData['type'] === 'multiple_choice_single' || $questionData['type'] === 'multiple_choice_multiple') && !empty($questionData['options'])) {
                        foreach ($questionData['options'] as $optIndex => $optionData) {
                            \App\Models\QuestionOption::create([
                                'question_id' => $question->id,
                                'option_content' => $optionData['text'],
                                'is_correct' => \DB::raw($optionData['isCorrect'] ? 'true' : 'false'),
                                'order_index' => $optIndex + 1,
                                'points_value' => $optionData['isCorrect'] ? 1.0 : 0.0,
                                'created_by' => $user->name ?? $user->email,
                            ]);
                        }
                    }

                    // Create solution if provided
                    if (!empty($questionData['explanation'])) {
                        \App\Models\BookQuestionSolution::create([
                            'question_id' => $question->id,
                            'solution_type' => 2, // Text
                            'content' => $questionData['explanation'],
                            'latex_content' => null,
                            'video_url' => null,
                            'image_url' => null,
                            'order_index' => 1,
                            'is_active' => \DB::raw('true'),
                            'created_by' => $user->name ?? $user->email,
                        ]);
                    }

                    // Determine type string for response
                    $typeString = 'essay';
                    if ($question->question_type === 1) {
                        $typeString = $questionData['type'] === 'multiple_choice_multiple' 
                            ? 'multiple_choice_multiple' 
                            : 'multiple_choice_single';
                    }

                    $createdQuestions[] = [
                        'id' => $question->id,
                        'content' => $question->question_content,
                        'type' => $typeString,
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
                ], "Đã import " . count($createdQuestions) . " câu hỏi từ file Word", $request);

            } catch (\Exception $e) {
                \DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            \Log::error('Error in importQuestionsFromWord: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Get course detail for admin
     * GET /api/admin/courses/{id}
     */
    public function getCourse(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem chi tiết khóa học');
            }

            $course = Course::with(['category:id,name', 'instructor:id,name,email', 'lessons' => function ($q) {
                $q->orderBy('lesson_order');
            }])->find($id);

            if (!$course) {
                return $this->notFound('Course');
            }

            return $this->success($course, 'Lấy thông tin khóa học thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin getCourse: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Create course (Admin only)
     * POST /api/admin/courses
     */
    public function createCourse(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền tạo khóa học');
            }

            $validator = Validator::make($request->all(), [
                'title' => ['required', 'string', 'max:200'],
                'description' => ['required', 'string'],
                'thumbnail' => ['nullable', 'string', 'max:255'],
                'instructorId' => ['nullable', 'integer', 'exists:users,id'], // Optional, will default to current user
                'categoryId' => ['required', 'integer', 'exists:categories,id'],
                'level' => ['nullable', 'string', 'in:beginner,intermediate,advanced'],
                'isFree' => ['nullable', 'boolean'],
                'price' => ['nullable', 'numeric', 'min:0'],
                'language' => ['nullable', 'string', 'max:10'],
                'requirements' => ['nullable', 'array'],
                'whatYouWillLearn' => ['nullable', 'array'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

            // Map level string to integer
            $levelMap = [
                'beginner' => 1,
                'intermediate' => 2,
                'advanced' => 3,
            ];
            $level = isset($data['level']) && isset($levelMap[$data['level']]) 
                ? $levelMap[$data['level']] 
                : 1; // Default to beginner (1)

            // Use provided instructorId or default to current user (the creator)
            $instructorId = isset($data['instructorId']) && $data['instructorId'] !== null
                ? (int)$data['instructorId']
                : (int)$user->id;

            // Generate static_page_path from title
            $staticPagePath = \Illuminate\Support\Str::slug($data['title']);

            // Prepare course data with explicit PostgreSQL-compatible types
            $requirementsJson = json_encode($data['requirements'] ?? [], JSON_UNESCAPED_UNICODE);
            $whatYouWillLearnJson = json_encode($data['whatYouWillLearn'] ?? [], JSON_UNESCAPED_UNICODE);
            
            // Use raw SQL with parameter binding for PostgreSQL compatibility
            $isFree = isset($data['isFree']) ? ($data['isFree'] ? 'true' : 'false') : 'false';
            $price = isset($data['price']) ? (float)$data['price'] : 0.0;
            
            $courseId = DB::selectOne("
                INSERT INTO courses (
                    title, static_page_path, description, thumbnail, instructor_id, category_id, level,
                    is_free, price, language, requirements, what_you_will_learn,
                    total_lessons, total_students, rating, total_reviews,
                    is_published, is_active, approval_status, created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?,
                    ?::boolean, ?, ?, ?::json, ?::json,
                    ?, ?, ?, ?,
                    true::boolean, true::boolean, ?, ?, ?
                ) RETURNING id
            ", [
                $data['title'],
                $staticPagePath,
                $data['description'],
                $data['thumbnail'] ?? null,
                $instructorId,
                (int)$data['categoryId'],
                $level,
                $isFree,
                $price,
                $data['language'] ?? 'vi',
                $requirementsJson,
                $whatYouWillLearnJson,
                0,
                0,
                0.0,
                0,
                1, // Approved by default for admin
                now(),
                now(),
            ])->id;
            
            // Load the created course
            $course = Course::find($courseId);

            return $this->success($course, 'Tạo khóa học thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin createCourse: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Update course (Admin only)
     * PUT /api/admin/courses/{id}
     */
    public function updateCourse(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền cập nhật khóa học');
            }

            $course = Course::find($id);
            if (!$course) {
                return $this->notFound('Course');
            }

            $validator = Validator::make($request->all(), [
                'title' => ['sometimes', 'required', 'string', 'max:200'],
                'description' => ['sometimes', 'required', 'string'],
                'thumbnail' => ['nullable', 'string', 'max:255'],
                'instructorId' => ['nullable', 'integer', 'exists:users,id'],
                'categoryId' => ['nullable', 'integer', 'exists:categories,id'],
                'level' => ['nullable', 'string', 'in:beginner,intermediate,advanced'],
                'isFree' => ['nullable', 'boolean'],
                'price' => ['nullable', 'numeric', 'min:0'],
                'language' => ['nullable', 'string', 'max:10'],
                'requirements' => ['nullable', 'array'],
                'whatYouWillLearn' => ['nullable', 'array'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

            // Map level string to integer
            $levelMap = [
                'beginner' => 1,
                'intermediate' => 2,
                'advanced' => 3,
            ];
            $level = isset($data['level']) && isset($levelMap[$data['level']]) 
                ? $levelMap[$data['level']] 
                : ($course->level ?? 1); // Default to existing level or beginner (1)

            $course->fill([
                'title' => $data['title'] ?? $course->title,
                'description' => $data['description'] ?? $course->description,
                'thumbnail' => $data['thumbnail'] ?? $course->thumbnail,
                'instructor_id' => $data['instructorId'] ?? $course->instructor_id,
                'category_id' => $data['categoryId'] ?? $course->category_id,
                'level' => $level,
                'is_free' => isset($data['isFree']) ? (bool)$data['isFree'] : $course->is_free,
                'price' => $data['price'] ?? $course->price,
                'language' => $data['language'] ?? $course->language,
                'requirements' => $data['requirements'] ?? $course->requirements,
                'what_you_will_learn' => $data['whatYouWillLearn'] ?? $course->what_you_will_learn,
            ])->save();

            return $this->success($course, 'Cập nhật khóa học thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin updateCourse: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Delete course (Admin only) - Soft delete (set is_active = false)
     * DELETE /api/admin/courses/{id}
     */
    public function deleteCourse(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xóa khóa học');
            }

            $course = Course::find($id);
            if (!$course) {
                return $this->notFound('Course');
            }

            // Soft delete: set is_active = false (use direct update with raw SQL for PostgreSQL boolean)
            \DB::table('courses')
                ->where('id', $id)
                ->update([
                    'is_active' => \DB::raw('false'),
                    'updated_at' => now(),
                ]);

            return $this->success(null, 'Xóa khóa học thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin deleteCourse: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Get lesson detail for admin
     * GET /api/admin/lessons/{id}
     */
    public function getLesson(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem chi tiết bài học');
            }

            $lesson = \App\Models\Lesson::with(['materials', 'course:id,title'])->find($id);

            if (!$lesson) {
                return $this->notFound('Lesson');
            }

            return $this->success($lesson, 'Lấy thông tin bài học thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin getLesson: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Create lesson (Admin only)
     * POST /api/admin/courses/{courseId}/lessons
     */
    public function createLesson(int $courseId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền tạo bài học');
            }

            // Verify course exists
            $course = Course::find($courseId);
            if (!$course) {
                return $this->notFound('Course');
            }

            $validator = Validator::make($request->all(), [
                'title' => ['required', 'string', 'max:200'],
                'description' => ['required', 'string'],
                'videoUrl' => ['required', 'string', 'max:255'],
                'videoDuration' => ['nullable', 'integer', 'min:0'],
                'contentText' => ['nullable', 'string'],
                'lessonOrder' => ['nullable', 'integer', 'min:0'],
                'isFree' => ['nullable', 'boolean'],
                'isPublished' => ['nullable', 'boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

            // Get next lesson_order if not provided
            $lessonOrder = $data['lessonOrder'] ?? null;
            if ($lessonOrder === null) {
                $maxOrder = \App\Models\Lesson::where('course_id', $courseId)->max('lesson_order');
                $lessonOrder = ($maxOrder === null) ? 0 : ($maxOrder + 1);
            }

            // Auto-set is_free based on lesson_order:
            // - lesson_order = 0: Bài giới thiệu, miễn phí (is_free = true) - người chưa mua có thể xem
            // - lesson_order >= 1: Bài học chính, phải mua (is_free = false) - chỉ người đã mua mới xem được
            $isFree = ($lessonOrder === 0) ? true : false;
            $isPublished = isset($data['isPublished']) ? (bool)$data['isPublished'] : false;
            $videoDuration = isset($data['videoDuration']) && $data['videoDuration'] !== '' 
                ? (int)$data['videoDuration'] 
                : null;

            // Generate static_page_path from title and course_id
            $staticPagePath = "/lessons/course-{$courseId}/lesson-{$lessonOrder}.html";

            // Use raw SQL with explicit PostgreSQL type casting to avoid datatype mismatch errors
            $sql = "
                INSERT INTO lessons (
                    course_id, title, description, video_url, video_duration, 
                    content_text, lesson_order, static_page_path, is_free, is_published, is_active,
                    created_at, updated_at
                ) VALUES (
                    :course_id, :title, :description, :video_url, :video_duration,
                    :content_text, :lesson_order, :static_page_path, :is_free::boolean, :is_published::boolean, true::boolean,
                    NOW(), NOW()
                ) RETURNING id
            ";

            $result = \DB::selectOne($sql, [
                'course_id' => $courseId,
                'title' => $data['title'],
                'description' => $data['description'],
                'video_url' => $data['videoUrl'],
                'video_duration' => $videoDuration,
                'content_text' => $data['contentText'] ?? '',
                'lesson_order' => $lessonOrder,
                'static_page_path' => $staticPagePath,
                'is_free' => $isFree,
                'is_published' => $isPublished,
            ]);

            $lessonId = $result->id;
            $lesson = \App\Models\Lesson::find($lessonId);

            // Update course total_lessons
            $totalLessons = \App\Models\Lesson::where('course_id', $courseId)->count();
            Course::where('id', $courseId)->update(['total_lessons' => $totalLessons]);

            return $this->success($lesson, 'Tạo bài học thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin createLesson: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Update lesson (Admin only)
     * PUT /api/admin/lessons/{id}
     */
    public function updateLesson(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role !== 'admin' && $user->role !== 'instructor')) {
                return $this->forbidden('Chỉ admin và giảng viên mới có quyền cập nhật bài học');
            }

            $lesson = \App\Models\Lesson::with('course')->find($id);
            if (!$lesson) {
                return $this->notFound('Lesson');
            }

            // Check if instructor owns the course
            if ($user->role === 'instructor') {
                if (!$lesson->course || $lesson->course->instructor_id !== $user->id) {
                    return $this->forbidden('Bạn không có quyền cập nhật bài học này');
                }
            }

            $validator = Validator::make($request->all(), [
                'title' => ['sometimes', 'required', 'string', 'max:200'],
                'description' => ['sometimes', 'required', 'string'],
                'videoUrl' => ['sometimes', 'required', 'string', 'max:255'],
                'videoDuration' => ['nullable', 'integer', 'min:0'],
                'contentText' => ['nullable', 'string'],
                'lessonOrder' => ['nullable', 'integer', 'min:1'],
                'isFree' => ['nullable', 'boolean'],
                'isPublished' => ['nullable', 'boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

            $lesson->fill([
                'title' => $data['title'] ?? $lesson->title,
                'description' => $data['description'] ?? $lesson->description,
                'video_url' => $data['videoUrl'] ?? $lesson->video_url,
                'video_duration' => $data['videoDuration'] ?? $lesson->video_duration,
                'content_text' => $data['contentText'] ?? $lesson->content_text,
                'lesson_order' => $data['lessonOrder'] ?? $lesson->lesson_order,
                'is_free' => isset($data['isFree']) ? (bool)$data['isFree'] : $lesson->is_free,
                'is_published' => isset($data['isPublished']) ? (bool)$data['isPublished'] : $lesson->is_published,
            ])->save();

            return $this->success($lesson, 'Cập nhật bài học thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin updateLesson: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Delete lesson (Admin only)
     * DELETE /api/admin/lessons/{id}
     */
    public function deleteLesson(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role !== 'admin' && $user->role !== 'instructor')) {
                return $this->forbidden('Chỉ admin và giảng viên mới có quyền vô hiệu hóa bài học');
            }

            $lesson = \App\Models\Lesson::with('course')->find($id);
            if (!$lesson) {
                return $this->notFound('Lesson');
            }

            // Check if instructor owns the course
            if ($user->role === 'instructor') {
                if (!$lesson->course || $lesson->course->instructor_id !== $user->id) {
                    return $this->forbidden('Bạn không có quyền vô hiệu hóa bài học này');
                }
            }

            // Soft delete: set is_active = false (use direct update with raw SQL for PostgreSQL boolean)
            \DB::table('lessons')
                ->where('id', $id)
                ->update([
                    'is_active' => \DB::raw('false'),
                    'updated_at' => now(),
                    'updated_by' => $user->name ?? $user->email,
                ]);

            // Update course total_lessons (only count active lessons)
            $totalLessons = \App\Models\Lesson::where('course_id', $lesson->course_id)
                ->whereRaw('is_active = true')
                ->count();
            Course::where('id', $lesson->course_id)->update(['total_lessons' => $totalLessons]);

            return $this->success(null, 'Vô hiệu hóa bài học thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin deleteLesson: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Restore lesson (Admin only) - Set is_active = true
     * POST /api/admin/lessons/{id}/restore
     */
    public function restoreLesson(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role !== 'admin' && $user->role !== 'instructor')) {
                return $this->forbidden('Chỉ admin và giảng viên mới có quyền khôi phục bài học');
            }

            $lesson = \App\Models\Lesson::with('course')->find($id);
            if (!$lesson) {
                return $this->notFound('Lesson');
            }

            // Check if instructor owns the course
            if ($user->role === 'instructor') {
                if (!$lesson->course || $lesson->course->instructor_id !== $user->id) {
                    return $this->forbidden('Bạn không có quyền khôi phục bài học này');
                }
            }

            // Restore: set is_active = true
            \DB::table('lessons')
                ->where('id', $id)
                ->update([
                    'is_active' => \DB::raw('true'),
                    'updated_at' => now(),
                    'updated_by' => $user->name ?? $user->email,
                ]);

            // Update course total_lessons (only count active lessons)
            $totalLessons = \App\Models\Lesson::where('course_id', $lesson->course_id)
                ->whereRaw('is_active = true')
                ->count();
            Course::where('id', $lesson->course_id)->update(['total_lessons' => $totalLessons]);

            return $this->success(null, 'Khôi phục bài học thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin restoreLesson: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Upload material for lesson (Admin only)
     * POST /api/admin/lessons/{lessonId}/materials
     */
    public function uploadLessonMaterial(int $lessonId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền upload tài liệu');
            }

            // Verify lesson exists
            $lesson = \App\Models\Lesson::find($lessonId);
            if (!$lesson) {
                return $this->notFound('Lesson');
            }

            $validator = Validator::make($request->all(), [
                'title' => ['required', 'string', 'max:200'],
                'fileUrl' => ['required', 'string', 'max:255'],
                'fileName' => ['required', 'string', 'max:255'],
                'fileType' => ['nullable', 'string', 'max:255'], // Increased to handle long MIME types
                'fileSize' => ['nullable', 'integer', 'min:0'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

            // Extract file extension from fileName - database column only allows 20 chars
            // So we'll use extension instead of full MIME type
            $fileName = $data['fileName'] ?? '';
            $extension = pathinfo($fileName, PATHINFO_EXTENSION);
            
            // Use extension if available, otherwise try to extract from MIME type
            if ($extension) {
                $fileType = strtolower($extension);
            } else {
                // Try to extract extension from MIME type
                $mimeType = $data['fileType'] ?? 'application/octet-stream';
                $fileType = $this->extractExtensionFromMimeType($mimeType);
            }
            
            // Truncate to 20 chars max (database column limit)
            if (strlen($fileType) > 20) {
                $fileType = substr($fileType, 0, 20);
            }

            $material = \App\Models\LessonMaterial::create([
                'lesson_id' => $lessonId,
                'title' => $data['title'],
                'file_name' => $data['fileName'],
                'file_path' => $data['fileUrl'],
                'file_type' => $fileType,
                'file_size' => $data['fileSize'] ?? 0,
                'download_count' => 0,
            ]);

            return $this->success($material, 'Upload tài liệu thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin uploadLessonMaterial: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Extract file extension from MIME type
     */
    private function extractExtensionFromMimeType(string $mimeType): string
    {
        $mimeToExtension = [
            'application/pdf' => 'pdf',
            'application/msword' => 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
            'application/vnd.ms-excel' => 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
            'application/vnd.ms-powerpoint' => 'ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
            'application/zip' => 'zip',
            'application/x-rar-compressed' => 'rar',
            'application/x-7z-compressed' => '7z',
            'video/mp4' => 'mp4',
            'video/quicktime' => 'mov',
            'video/x-msvideo' => 'avi',
            'audio/mpeg' => 'mp3',
            'audio/wav' => 'wav',
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'text/plain' => 'txt',
            'text/html' => 'html',
            'application/json' => 'json',
        ];

        // Try exact match first
        if (isset($mimeToExtension[$mimeType])) {
            return $mimeToExtension[$mimeType];
        }

        // Try partial match (e.g., image/* -> extract subtype)
        if (strpos($mimeType, '/') !== false) {
            $parts = explode('/', $mimeType);
            if (count($parts) === 2) {
                $subtype = explode(';', $parts[1])[0]; // Remove parameters
                $subtype = trim($subtype);
                // Return first 20 chars of subtype as fallback
                return substr($subtype, 0, 20);
            }
        }

        // Default fallback
        return 'bin';
    }

    /**
     * Delete material (Admin only)
     * DELETE /api/admin/materials/{id}
     */
    public function deleteLessonMaterial(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xóa tài liệu');
            }

            $material = \App\Models\LessonMaterial::find($id);
            if (!$material) {
                return $this->notFound('Material');
            }

            $material->delete();

            return $this->success(null, 'Xóa tài liệu thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin deleteLessonMaterial: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Reply to lesson discussion as instructor/admin
     * POST /api/admin/lessons/{lessonId}/discussions/{discussionId}/reply
     */
    public function replyToDiscussion(int $lessonId, int $discussionId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role !== 'admin' && $user->role !== 'instructor')) {
                return $this->forbidden('Chỉ admin hoặc giảng viên mới có quyền trả lời');
            }

            // Verify discussion exists and belongs to lesson
            $parentDiscussion = \App\Models\LessonDiscussion::where('id', $discussionId)
                ->where('lesson_id', $lessonId)
                ->first();

            if (!$parentDiscussion) {
                return $this->notFound('Discussion');
            }

            $validator = Validator::make($request->all(), [
                'content' => ['required', 'string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

            // Create reply with is_instructor = true
            $reply = \App\Models\LessonDiscussion::create([
                'lesson_id' => $lessonId,
                'user_id' => $user->id,
                'parent_id' => $discussionId,
                'content' => $data['content'],
                'is_instructor' => \DB::raw('true'),
                'is_hidden' => \DB::raw('false'),
                'like_count' => 0,
            ]);

            $reply->load('user:id,name,email,avatar');

            return $this->success($reply, 'Trả lời thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin replyToDiscussion: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Get lesson questions/discussions for admin
     * GET /api/admin/lessons/{lessonId}/discussions
     */
    public function getLessonDiscussions(int $lessonId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem danh sách câu hỏi');
            }

            // Verify lesson exists
            $lesson = \App\Models\Lesson::find($lessonId);
            if (!$lesson) {
                return $this->notFound('Lesson');
            }

            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);

            $q = \App\Models\LessonDiscussion::with(['user:id,name,email,avatar'])
                ->where('lesson_id', $lessonId)
                ->whereNull('parent_id'); // Only top-level questions

            $total = $q->count();
            $discussions = $q->orderBy('created_at', 'desc')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get()
                ->map(function ($discussion) {
                    // Load replies for each discussion
                    $replies = \App\Models\LessonDiscussion::with(['user:id,name,email,avatar'])
                        ->where('parent_id', $discussion->id)
                        ->orderBy('created_at', 'asc')
                        ->get();
                    
                    return [
                        'id' => $discussion->id,
                        'content' => $discussion->content,
                        'videoTimestamp' => $discussion->video_timestamp,
                        'isInstructor' => $discussion->is_instructor,
                        'likeCount' => $discussion->like_count,
                        'createdAt' => is_string($discussion->created_at) ? $discussion->created_at : $discussion->created_at->toISOString(),
                        'user' => $discussion->user ? [
                            'id' => $discussion->user->id,
                            'name' => $discussion->user->name,
                            'email' => $discussion->user->email,
                            'avatar' => $discussion->user->avatar,
                        ] : null,
                        'replies' => $replies->map(function ($reply) {
                            return [
                                'id' => $reply->id,
                                'content' => $reply->content,
                                'isInstructor' => $reply->is_instructor,
                                'likeCount' => $reply->like_count,
                                'createdAt' => is_string($reply->created_at) ? $reply->created_at : $reply->created_at->toISOString(),
                                'user' => $reply->user ? [
                                    'id' => $reply->user->id,
                                    'name' => $reply->user->name,
                                    'email' => $reply->user->email,
                                    'avatar' => $reply->user->avatar,
                                ] : null,
                            ];
                        }),
                    ];
                });

            return $this->paginated($discussions->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in admin getLessonDiscussions: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Get assignments for a lesson (Admin only)
     * GET /api/admin/lessons/{lessonId}/assignments
     */
    public function getLessonAssignments(int $lessonId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem danh sách bài tập');
            }

            // Verify lesson exists
            $lesson = \App\Models\Lesson::find($lessonId);
            if (!$lesson) {
                return $this->notFound('Lesson');
            }

            $assignments = \App\Models\Assignment::where('lesson_id', $lessonId)
                ->with(['lesson:id,title'])
                ->orderBy('created_at', 'desc')
                ->get();

            return $this->success($assignments, 'Lấy danh sách bài tập thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin getLessonAssignments: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Create assignment for a lesson (Admin only)
     * POST /api/admin/lessons/{lessonId}/assignments
     */
    public function createLessonAssignment(int $lessonId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền tạo bài tập');
            }

            // Verify lesson exists
            $lesson = \App\Models\Lesson::find($lessonId);
            if (!$lesson) {
                return $this->notFound('Lesson');
            }

            $validator = Validator::make($request->all(), [
                'title' => ['required', 'string', 'max:200'],
                'description' => ['required', 'string'],
                'assignmentType' => ['required', 'integer', 'in:1,2,3'], // 1=quiz, 2=assignment, 3=exam
                'maxScore' => ['required', 'integer', 'min:1'],
                'timeLimit' => ['nullable', 'integer', 'min:1'],
                'maxAttempts' => ['required', 'integer', 'min:1'],
                'showAnswersAfter' => ['required', 'integer', 'in:1,2,3'], // 1=immediately, 2=after due, 3=never
                'dueDate' => ['nullable', 'date'],
                'isPublished' => ['nullable', 'boolean'],
                'passingScore' => ['nullable', 'numeric', 'min:0'],
                'shuffleQuestions' => ['nullable', 'boolean'],
                'shuffleOptions' => ['nullable', 'boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

            $assignment = \App\Models\Assignment::create([
                'lesson_id' => $lessonId,
                'title' => $data['title'],
                'description' => $data['description'],
                'assignment_type' => $data['assignmentType'],
                'max_score' => $data['maxScore'],
                'time_limit' => $data['timeLimit'] ?? null,
                'max_attempts' => $data['maxAttempts'],
                'show_answers_after' => $data['showAnswersAfter'],
                'due_date' => isset($data['dueDate']) ? $data['dueDate'] : null,
                'is_published' => $data['isPublished'] ?? false,
                'passing_score' => $data['passingScore'] ?? null,
                'shuffle_questions' => $data['shuffleQuestions'] ?? false,
                'shuffle_options' => $data['shuffleOptions'] ?? false,
            ]);

            // Send notifications to enrolled students
            try {
                $lesson = \App\Models\Lesson::with('course')->find($lessonId);
                if ($lesson && $lesson->course) {
                    // Get all enrolled students for this course
                    $enrollments = CourseEnrollment::where('course_id', $lesson->course->id)
                        ->whereRaw('is_active = true')
                        ->with('user:id,name,email')
                        ->get();

                    // Create notifications for each enrolled student
                    $notifications = [];
                    $assignmentTypeNames = [
                        1 => 'Quiz',
                        2 => 'Homework',
                        3 => 'Exam',
                        4 => 'Practice',
                    ];
                    $assignmentTypeName = $assignmentTypeNames[$data['assignmentType']] ?? 'Bài tập';

                    foreach ($enrollments as $enrollment) {
                        if ($enrollment->user) {
                            $notifications[] = [
                                'user_id' => $enrollment->user->id,
                                'title' => 'Bài tập mới: ' . $assignment->title,
                                'message' => "Giảng viên đã tạo {$assignmentTypeName} mới cho bài học \"{$lesson->title}\" trong khóa học \"{$lesson->course->title}\"",
                                'type' => 3, // Assignment type
                                'action_url' => "/assignments/{$assignment->id}",
                                'priority' => 3, // High priority
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }

                    // Bulk insert notifications and send emails
                    if (!empty($notifications)) {
                        Notification::insert($notifications);
                        \Log::info("Sent {$assignmentTypeName} notification to " . count($notifications) . " students for assignment {$assignment->id}");
                        
                        // Send emails to enrolled students
                        foreach ($enrollments as $enrollment) {
                            if ($enrollment->user && $enrollment->user->email) {
                                try {
                                    Mail::to($enrollment->user->email)->send(
                                        new AssignmentCreated($assignment, $lesson, $lesson->course, $enrollment->user->name ?? $enrollment->user->email)
                                    );
                                } catch (\Exception $emailError) {
                                    // Log email error but don't fail the process
                                    \Log::error("Error sending assignment email to {$enrollment->user->email}: " . $emailError->getMessage());
                                }
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                // Log error but don't fail the assignment creation
                \Log::error('Error sending assignment notifications: ' . $e->getMessage());
            }

            return $this->success($assignment, 'Tạo bài tập thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin createLessonAssignment: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Create question for assignment (Admin only)
     * POST /api/admin/assignments/{assignmentId}/questions
     */
    public function createAssignmentQuestion(int $assignmentId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền tạo câu hỏi');
            }

            // Verify assignment exists
            $assignment = \App\Models\Assignment::find($assignmentId);
            if (!$assignment) {
                return $this->notFound('Assignment');
            }

            $validator = Validator::make($request->all(), [
                'questionContent' => ['required', 'string'],
                'questionType' => ['required', 'integer', 'in:1,2,3'], // 1=multiple choice, 2=true/false, 3=short answer/essay
                'difficultyLevel' => ['nullable', 'integer', 'in:1,2,3'], // 1=easy, 2=medium, 3=hard
                'defaultPoints' => ['nullable', 'numeric', 'min:0'],
                'explanationContent' => ['nullable', 'string'],
                'orderIndex' => ['nullable', 'integer', 'min:0'],
                'options' => ['required_if:questionType,1,2', 'array', 'min:2'], // Required for multiple choice and true/false
                'options.*.content' => ['required_with:options', 'string'],
                'options.*.isCorrect' => ['required_with:options', 'boolean'],
                'options.*.pointsValue' => ['nullable', 'numeric', 'min:0'],
                'options.*.orderIndex' => ['nullable', 'integer', 'min:0'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

            // Get next order_index if not provided
            $orderIndex = $data['orderIndex'] ?? null;
            if ($orderIndex === null) {
                $maxOrder = \App\Models\Question::where('context_type', 1)
                    ->where('context_id', $assignmentId)
                    ->max('order_index');
                $orderIndex = ($maxOrder ?? 0) + 1;
            }

            $question = \App\Models\Question::create([
                'context_type' => 1, // 1=assignment
                'context_id' => $assignmentId,
                'question_content' => $data['questionContent'],
                'question_type' => $data['questionType'],
                'difficulty_level' => $data['difficultyLevel'] ?? 2, // Default to medium
                'default_points' => $data['defaultPoints'] ?? 10.0,
                'explanation_content' => $data['explanationContent'] ?? '',
                'order_index' => $orderIndex,
                'is_active' => true,
            ]);

            // Create options for multiple choice and true/false questions
            if (in_array($data['questionType'], [1, 2]) && isset($data['options'])) {
                foreach ($data['options'] as $index => $optionData) {
                    \App\Models\QuestionOption::create([
                        'question_id' => $question->id,
                        'option_content' => $optionData['content'],
                        'is_correct' => $optionData['isCorrect'] ?? false,
                        'points_value' => $optionData['pointsValue'] ?? ($optionData['isCorrect'] ? $question->default_points : 0),
                        'order_index' => $optionData['orderIndex'] ?? ($index + 1),
                    ]);
                }
            }

            $question->load('options');

            return $this->success($question, 'Tạo câu hỏi thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin createAssignmentQuestion: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Get assignment attempts for grading (Admin/Instructor only)
     * GET /api/admin/assignments/{assignmentId}/attempts
     */
    public function getAssignmentAttempts(int $assignmentId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || !in_array($user->role, ['admin', 'teacher'])) {
                return $this->forbidden('Chỉ admin và giảng viên mới có quyền xem danh sách bài nộp');
            }

            // Verify assignment exists
            $assignment = \App\Models\Assignment::find($assignmentId);
            if (!$assignment) {
                return $this->notFound('Assignment');
            }

            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);

            $q = \App\Models\UserAssignmentAttempt::with(['user:id,name,email'])
                ->where('assignment_id', $assignmentId)
                ->where('is_completed', true);

            $total = $q->count();
            $attempts = $q->orderBy('submitted_at', 'desc')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get()
                ->map(function ($attempt) {
                    return [
                        'id' => $attempt->id,
                        'userId' => $attempt->user_id,
                        'user' => $attempt->user ? [
                            'id' => $attempt->user->id,
                            'name' => $attempt->user->name,
                            'email' => $attempt->user->email,
                        ] : null,
                        'attemptNumber' => $attempt->attempt_number,
                        'score' => $attempt->score,
                        'isPassed' => $attempt->is_passed,
                        'startedAt' => $attempt->started_at ? $attempt->started_at->toISOString() : null,
                        'submittedAt' => $attempt->submitted_at ? $attempt->submitted_at->toISOString() : null,
                        'timeSpent' => $attempt->time_spent,
                    ];
                });

            return $this->paginated($attempts->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in admin getAssignmentAttempts: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Get attempt details with answers for grading (Admin/Instructor only)
     * GET /api/admin/attempts/{attemptId}
     */
    public function getAttemptDetails(int $attemptId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || !in_array($user->role, ['admin', 'teacher'])) {
                return $this->forbidden('Chỉ admin và giảng viên mới có quyền xem chi tiết bài nộp');
            }

            $attempt = \App\Models\UserAssignmentAttempt::with(['user:id,name,email'])
                ->find($attemptId);

            if (!$attempt) {
                return $this->notFound('Attempt');
            }

            // Get assignment
            $assignment = \App\Models\Assignment::find($attempt->assignment_id);
            if (!$assignment) {
                return $this->notFound('Assignment');
            }

            // Get questions
            $questions = \App\Models\Question::where('context_type', 1)
                ->where('context_id', $assignment->id)
                ->with('options')
                ->orderBy('order_index')
                ->get();

            // Get answers
            $answers = \App\Models\UserAssignmentAnswer::where('attempt_id', $attemptId)
                ->get()
                ->keyBy('question_id');

            $questionsWithAnswers = $questions->map(function ($question) use ($answers) {
                $answer = $answers[$question->id] ?? null;
                return [
                    'id' => $question->id,
                    'questionContent' => $question->question_content,
                    'questionType' => $question->question_type,
                    'defaultPoints' => $question->default_points,
                    'explanationContent' => $question->explanation_content,
                    'options' => $question->options->map(function ($option) {
                        return [
                            'id' => $option->id,
                            'content' => $option->option_content,
                            'isCorrect' => $option->is_correct,
                            'pointsValue' => $option->points_value,
                        ];
                    }),
                    'answer' => $answer ? [
                        'id' => $answer->id,
                        'optionId' => $answer->option_id,
                        'answerText' => $answer->answer_text,
                        'isCorrect' => $answer->is_correct,
                        'pointsEarned' => $answer->points_earned,
                    ] : null,
                ];
            });

            $result = [
                'attempt' => [
                    'id' => $attempt->id,
                    'userId' => $attempt->user_id,
                    'user' => $attempt->user ? [
                        'id' => $attempt->user->id,
                        'name' => $attempt->user->name,
                        'email' => $attempt->user->email,
                    ] : null,
                    'attemptNumber' => $attempt->attempt_number,
                    'score' => $attempt->score,
                    'isPassed' => $attempt->is_passed,
                    'startedAt' => $attempt->started_at ? $attempt->started_at->toISOString() : null,
                    'submittedAt' => $attempt->submitted_at ? $attempt->submitted_at->toISOString() : null,
                    'timeSpent' => $attempt->time_spent,
                ],
                'assignment' => [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'maxScore' => $assignment->max_score,
                    'passingScore' => $assignment->passing_score,
                ],
                'questions' => $questionsWithAnswers,
            ];

            return $this->success($result, 'Lấy chi tiết bài nộp thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin getAttemptDetails: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Grade assignment attempt (Admin/Instructor only)
     * POST /api/admin/attempts/{attemptId}/grade
     */
    public function gradeAttempt(int $attemptId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || !in_array($user->role, ['admin', 'teacher'])) {
                return $this->forbidden('Chỉ admin và giảng viên mới có quyền chấm bài');
            }

            $attempt = \App\Models\UserAssignmentAttempt::find($attemptId);
            if (!$attempt) {
                return $this->notFound('Attempt');
            }

            if (!$attempt->is_completed) {
                return $this->error(\App\Constants\MessageCode::VALIDATION_ERROR, 'Bài tập chưa được nộp', null, 400);
            }

            $validator = Validator::make($request->all(), [
                'grades' => ['required', 'array'],
                'grades.*.questionId' => ['required', 'integer'],
                'grades.*.pointsEarned' => ['required', 'numeric', 'min:0'],
                'grades.*.isCorrect' => ['nullable', 'boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

            // Get assignment
            $assignment = \App\Models\Assignment::find($attempt->assignment_id);
            if (!$assignment) {
                return $this->notFound('Assignment');
            }

            $totalScore = 0;

            // Update grades for each question
            foreach ($data['grades'] as $grade) {
                $answer = \App\Models\UserAssignmentAnswer::where('attempt_id', $attemptId)
                    ->where('question_id', $grade['questionId'])
                    ->first();

                if ($answer) {
                    $pointsEarned = (float) $grade['pointsEarned'];
                    $answer->points_earned = $pointsEarned;
                    if (isset($grade['isCorrect'])) {
                        $answer->is_correct = (bool) $grade['isCorrect'];
                    }
                    $answer->save();
                    $totalScore += $pointsEarned;
                }
            }

            // Update attempt score
            $attempt->score = $totalScore;
            $attempt->is_passed = $assignment->passing_score ? ($totalScore >= $assignment->passing_score) : null;
            $attempt->save();

            return $this->success([
                'attempt' => $attempt,
                'totalScore' => $totalScore,
                'maxScore' => $assignment->max_score,
                'isPassed' => $attempt->is_passed,
            ], 'Chấm bài thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin gradeAttempt: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Get course revenue statistics (Admin only)
     * GET /api/admin/courses/{courseId}/revenue
     */
    public function getCourseRevenue(int $courseId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem thống kê doanh thu');
            }

            $course = \App\Models\Course::find($courseId);
            if (!$course) {
                return $this->notFound('Course');
            }

            // Get date range from query params
            $startDate = $request->query('startDate') ? \Carbon\Carbon::parse($request->query('startDate'))->startOfDay() : now()->subDays(30)->startOfDay();
            $endDate = $request->query('endDate') ? \Carbon\Carbon::parse($request->query('endDate'))->endOfDay() : now()->endOfDay();

            // Total revenue from paid orders
            $totalRevenue = (float) \DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.status', 2) // Paid
                ->where('order_items.item_type', 1) // Course
                ->where('order_items.item_id', $courseId)
                ->whereBetween('orders.updated_at', [$startDate, $endDate])
                ->sum('order_items.price');

            // Total orders
            $totalOrders = (int) \DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.status', 2)
                ->where('order_items.item_type', 1)
                ->where('order_items.item_id', $courseId)
                ->whereBetween('orders.updated_at', [$startDate, $endDate])
                ->distinct('orders.id')
                ->count('orders.id');

            // Revenue by day
            $revenueByDay = [];
            $currentDate = $startDate->copy();
            while ($currentDate <= $endDate) {
                $nextDate = $currentDate->copy()->addDay();
                $revenue = (float) \DB::table('orders')
                    ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                    ->where('orders.status', 2)
                    ->where('order_items.item_type', 1)
                    ->where('order_items.item_id', $courseId)
                    ->where('orders.updated_at', '>=', $currentDate)
                    ->where('orders.updated_at', '<', $nextDate)
                    ->sum('order_items.price');
                $revenueByDay[] = [
                    'date' => $currentDate->format('Y-m-d'),
                    'label' => $currentDate->format('d/m/Y'),
                    'revenue' => $revenue,
                ];
                $currentDate->addDay();
            }

            // Revenue by month
            $revenueByMonth = [];
            $currentMonth = $startDate->copy()->startOfMonth();
            while ($currentMonth <= $endDate) {
                $nextMonth = $currentMonth->copy()->endOfMonth()->addDay();
                $revenue = (float) \DB::table('orders')
                    ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                    ->where('orders.status', 2)
                    ->where('order_items.item_type', 1)
                    ->where('order_items.item_id', $courseId)
                    ->where('orders.updated_at', '>=', $currentMonth)
                    ->where('orders.updated_at', '<', $nextMonth)
                    ->sum('order_items.price');
                $revenueByMonth[] = [
                    'month' => $currentMonth->format('Y-m'),
                    'label' => $currentMonth->format('m/Y'),
                    'revenue' => $revenue,
                ];
                $currentMonth->addMonth();
            }

            return $this->success([
                'courseId' => $courseId,
                'courseTitle' => $course->title,
                'totalRevenue' => $totalRevenue,
                'totalOrders' => $totalOrders,
                'averageOrderValue' => $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0,
                'revenueByDay' => $revenueByDay,
                'revenueByMonth' => $revenueByMonth,
                'startDate' => $startDate->format('Y-m-d'),
                'endDate' => $endDate->format('Y-m-d'),
            ], 'Lấy thống kê doanh thu thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin getCourseRevenue: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Get all courses revenue statistics (Admin only)
     * GET /api/admin/courses/revenue
     */
    public function getAllCoursesRevenue(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem thống kê doanh thu');
            }

            // Get date range from query params
            $startDate = $request->query('startDate') ? \Carbon\Carbon::parse($request->query('startDate'))->startOfDay() : now()->subDays(30)->startOfDay();
            $endDate = $request->query('endDate') ? \Carbon\Carbon::parse($request->query('endDate'))->endOfDay() : now()->endOfDay();

            // Get revenue for each course
            $coursesRevenue = \DB::table('courses')
                ->leftJoin('order_items', function($join) use ($startDate, $endDate) {
                    $join->on('courses.id', '=', 'order_items.item_id')
                        ->where('order_items.item_type', 1) // Course
                        ->join('orders', 'order_items.order_id', '=', 'orders.id')
                        ->where('orders.status', 2) // Paid
                        ->whereBetween('orders.updated_at', [$startDate, $endDate]);
                })
                ->select(
                    'courses.id',
                    'courses.title',
                    \DB::raw('COALESCE(SUM(order_items.price), 0) as revenue'),
                    \DB::raw('COUNT(DISTINCT orders.id) as order_count')
                )
                ->groupBy('courses.id', 'courses.title')
                ->orderByDesc('revenue')
                ->get()
                ->map(function($item) {
                    return [
                        'courseId' => $item->id,
                        'title' => $item->title,
                        'revenue' => (float) $item->revenue,
                        'orderCount' => (int) $item->order_count,
                    ];
                });

            $totalRevenue = $coursesRevenue->sum('revenue');
            $totalOrders = $coursesRevenue->sum('orderCount');

            return $this->success([
                'courses' => $coursesRevenue,
                'totalRevenue' => $totalRevenue,
                'totalOrders' => $totalOrders,
                'startDate' => $startDate->format('Y-m-d'),
                'endDate' => $endDate->format('Y-m-d'),
            ], 'Lấy thống kê doanh thu tất cả khóa học thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin getAllCoursesRevenue: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Get book revenue statistics (Admin only)
     * GET /api/admin/books/{bookId}/revenue
     */
    public function getBookRevenue(int $bookId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem thống kê doanh thu');
            }

            $book = \App\Models\Book::find($bookId);
            if (!$book) {
                return $this->notFound('Book');
            }

            // Get date range from query params
            $startDate = $request->query('startDate') ? \Carbon\Carbon::parse($request->query('startDate'))->startOfDay() : now()->subDays(30)->startOfDay();
            $endDate = $request->query('endDate') ? \Carbon\Carbon::parse($request->query('endDate'))->endOfDay() : now()->endOfDay();

            // Total revenue from paid orders
            $totalRevenue = (float) \DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.status', 2) // Paid
                ->where('order_items.item_type', 2) // Book
                ->where('order_items.item_id', $bookId)
                ->whereBetween('orders.updated_at', [$startDate, $endDate])
                ->sum('order_items.price');

            // Total orders
            $totalOrders = (int) \DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.status', 2)
                ->where('order_items.item_type', 2)
                ->where('order_items.item_id', $bookId)
                ->whereBetween('orders.updated_at', [$startDate, $endDate])
                ->distinct('orders.id')
                ->count('orders.id');

            // Revenue by day
            $revenueByDay = [];
            $currentDate = $startDate->copy();
            while ($currentDate <= $endDate) {
                $nextDate = $currentDate->copy()->addDay();
                $revenue = (float) \DB::table('orders')
                    ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                    ->where('orders.status', 2)
                    ->where('order_items.item_type', 2)
                    ->where('order_items.item_id', $bookId)
                    ->where('orders.updated_at', '>=', $currentDate)
                    ->where('orders.updated_at', '<', $nextDate)
                    ->sum('order_items.price');
                $revenueByDay[] = [
                    'date' => $currentDate->format('Y-m-d'),
                    'label' => $currentDate->format('d/m/Y'),
                    'revenue' => $revenue,
                ];
                $currentDate->addDay();
            }

            // Total purchases (activation codes used)
            $totalPurchases = (int) \DB::table('book_activation_codes')
                ->where('book_id', $bookId)
                ->whereRaw('is_used = true')
                ->whereBetween('used_at', [$startDate, $endDate])
                ->count();

            return $this->success([
                'bookId' => $bookId,
                'bookTitle' => $book->title,
                'totalRevenue' => $totalRevenue,
                'totalOrders' => $totalOrders,
                'totalPurchases' => $totalPurchases,
                'averageOrderValue' => $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0,
                'revenueByDay' => $revenueByDay,
                'startDate' => $startDate->format('Y-m-d'),
                'endDate' => $endDate->format('Y-m-d'),
            ], 'Lấy thống kê doanh thu thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin getBookRevenue: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Get all books revenue statistics (Admin only)
     * GET /api/admin/books/revenue
     */
    public function getAllBooksRevenue(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem thống kê doanh thu');
            }

            // Get date range from query params
            $startDate = $request->query('startDate') ? \Carbon\Carbon::parse($request->query('startDate'))->startOfDay() : now()->subDays(30)->startOfDay();
            $endDate = $request->query('endDate') ? \Carbon\Carbon::parse($request->query('endDate'))->endOfDay() : now()->endOfDay();

            // Get revenue for each book
            $booksRevenue = \DB::table('books')
                ->leftJoin('order_items', function($join) use ($startDate, $endDate) {
                    $join->on('books.id', '=', 'order_items.item_id')
                        ->where('order_items.item_type', 2) // Book
                        ->join('orders', 'order_items.order_id', '=', 'orders.id')
                        ->where('orders.status', 2) // Paid
                        ->whereBetween('orders.updated_at', [$startDate, $endDate]);
                })
                ->select(
                    'books.id',
                    'books.title',
                    \DB::raw('COALESCE(SUM(order_items.price), 0) as revenue'),
                    \DB::raw('COUNT(DISTINCT orders.id) as order_count')
                )
                ->groupBy('books.id', 'books.title')
                ->orderByDesc('revenue')
                ->get()
                ->map(function($item) {
                    return [
                        'bookId' => $item->id,
                        'title' => $item->title,
                        'revenue' => (float) $item->revenue,
                        'orderCount' => (int) $item->order_count,
                    ];
                });

            $totalRevenue = $booksRevenue->sum('revenue');
            $totalOrders = $booksRevenue->sum('orderCount');

            return $this->success([
                'books' => $booksRevenue,
                'totalRevenue' => $totalRevenue,
                'totalOrders' => $totalOrders,
                'startDate' => $startDate->format('Y-m-d'),
                'endDate' => $endDate->format('Y-m-d'),
            ], 'Lấy thống kê doanh thu tất cả sách thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin getAllBooksRevenue: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Get total revenue statistics (all courses + books) (Admin only)
     * GET /api/admin/revenue/total
     */
    public function getTotalRevenue(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem thống kê doanh thu');
            }

            // Get date range from query params
            $startDate = $request->query('startDate') ? \Carbon\Carbon::parse($request->query('startDate'))->startOfDay() : now()->subDays(30)->startOfDay();
            $endDate = $request->query('endDate') ? \Carbon\Carbon::parse($request->query('endDate'))->endOfDay() : now()->endOfDay();

            // Total revenue from courses
            $coursesRevenue = (float) \DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.status', 2) // Paid
                ->where('order_items.item_type', 1) // Course
                ->whereBetween('orders.updated_at', [$startDate, $endDate])
                ->sum('order_items.price');

            // Total revenue from books
            $booksRevenue = (float) \DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.status', 2) // Paid
                ->where('order_items.item_type', 2) // Book
                ->whereBetween('orders.updated_at', [$startDate, $endDate])
                ->sum('order_items.price');

            $totalRevenue = $coursesRevenue + $booksRevenue;

            // Total orders
            $totalOrders = (int) \DB::table('orders')
                ->where('status', 2)
                ->whereBetween('updated_at', [$startDate, $endDate])
                ->count();

            // Revenue by day
            $revenueByDay = [];
            $currentDate = $startDate->copy();
            while ($currentDate <= $endDate) {
                $nextDate = $currentDate->copy()->addDay();
                $dayRevenue = (float) \DB::table('orders')
                    ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                    ->where('orders.status', 2)
                    ->where('orders.updated_at', '>=', $currentDate)
                    ->where('orders.updated_at', '<', $nextDate)
                    ->sum('order_items.price');
                $revenueByDay[] = [
                    'date' => $currentDate->format('Y-m-d'),
                    'label' => $currentDate->format('d/m/Y'),
                    'revenue' => $dayRevenue,
                ];
                $currentDate->addDay();
            }

            // Revenue by month
            $revenueByMonth = [];
            $currentMonth = $startDate->copy()->startOfMonth();
            while ($currentMonth <= $endDate) {
                $nextMonth = $currentMonth->copy()->endOfMonth()->addDay();
                $monthRevenue = (float) \DB::table('orders')
                    ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                    ->where('orders.status', 2)
                    ->where('orders.updated_at', '>=', $currentMonth)
                    ->where('orders.updated_at', '<', $nextMonth)
                    ->sum('order_items.price');
                $revenueByMonth[] = [
                    'month' => $currentMonth->format('Y-m'),
                    'label' => $currentMonth->format('m/Y'),
                    'revenue' => $monthRevenue,
                ];
                $currentMonth->addMonth();
            }

            // Revenue breakdown by type
            $revenueBreakdown = [
                'courses' => $coursesRevenue,
                'books' => $booksRevenue,
                'total' => $totalRevenue,
            ];

            return $this->success([
                'totalRevenue' => $totalRevenue,
                'coursesRevenue' => $coursesRevenue,
                'booksRevenue' => $booksRevenue,
                'totalOrders' => $totalOrders,
                'averageOrderValue' => $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0,
                'revenueByDay' => $revenueByDay,
                'revenueByMonth' => $revenueByMonth,
                'revenueBreakdown' => $revenueBreakdown,
                'startDate' => $startDate->format('Y-m-d'),
                'endDate' => $endDate->format('Y-m-d'),
            ], 'Lấy thống kê doanh thu tổng thành công', $request);

        } catch (\Exception $e) {
            \Log::error('Error in admin getTotalRevenue: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * List all orders (Admin only)
     * GET /api/admin/orders
     */
    public function listOrders(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem danh sách đơn hàng');
            }

            $query = Order::with(['items', 'user:id,name,email']);

            // Search by order code
            if ($request->filled('search')) {
                $search = $request->string('search');
                $query->where('order_code', 'ilike', "%{$search}%");
            }

            // Filter by status
            if ($request->filled('status')) {
                $query->where('status', $request->integer('status'));
            }

            // Filter by user
            if ($request->filled('userId')) {
                $query->where('user_id', $request->integer('userId'));
            }

            // Filter by date range
            if ($request->filled('fromDate')) {
                $query->where('created_at', '>=', $request->string('fromDate') . ' 00:00:00');
            }
            if ($request->filled('toDate')) {
                $query->where('created_at', '<=', $request->string('toDate') . ' 23:59:59');
            }

            // Sorting
            $sortBy = $request->string('sortBy', 'created_at')->toString();
            $sortOrder = $request->string('sortOrder', 'desc')->toString();
            $allowedSorts = ['created_at', 'updated_at', 'final_amount', 'status'];
            if (in_array($sortBy, $allowedSorts)) {
                $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
            } else {
                $query->orderBy('created_at', 'desc');
            }

            // Pagination
            $perPage = min(max(1, (int) $request->query('perPage', 20)), 100);
            $page = max(1, (int) $request->query('page', 1));
            $result = $query->paginate($perPage, ['*'], 'page', $page);

            $orders = $result->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_code' => $order->order_code,
                    'user_id' => $order->user_id,
                    'user_name' => $order->user->name ?? 'N/A',
                    'user_email' => $order->user->email ?? 'N/A',
                    'total_amount' => (float) $order->total_amount,
                    'discount_amount' => (float) $order->discount_amount,
                    'final_amount' => (float) $order->final_amount,
                    'status' => $order->status,
                    'payment_method' => $order->payment_method ?? 'N/A',
                    'created_at' => $order->created_at->toISOString(),
                    'paid_at' => $order->paid_at ? $order->paid_at->toISOString() : null,
                    'items_count' => $order->items->count(),
                ];
            });

            return $this->paginated($orders->toArray(), $page, $perPage, $result->total());

        } catch (\Exception $e) {
            Log::error('Error in admin listOrders: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get order detail (Admin only)
     * GET /api/admin/orders/{id}
     */
    public function getOrder(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem chi tiết đơn hàng');
            }

            $order = Order::with(['items', 'user:id,name,email'])->find($id);

            if (!$order) {
                return $this->notFound('Order');
            }

            // Load course/book details for items
            $items = $order->items->map(function ($item) {
                $itemData = [
                    'id' => $item->id,
                    'item_id' => $item->item_id,
                    'item_type' => $item->item_type,
                    'item_name' => null,
                    'price' => (float) $item->price,
                    'quantity' => $item->quantity,
                    'subtotal' => (float) ($item->price * $item->quantity),
                ];

                if ($item->item_type == 1) { // Course
                    $course = Course::find($item->item_id);
                    if ($course) {
                        $itemData['item_name'] = $course->title;
                        $itemData['thumbnail'] = $course->thumbnail;
                    }
                } else if ($item->item_type == 2) { // Book
                    $book = Book::find($item->item_id);
                    if ($book) {
                        $itemData['item_name'] = $book->title;
                        $itemData['thumbnail'] = $book->cover_image;
                    }
                }

                return $itemData;
            });

            $orderData = [
                'id' => $order->id,
                'order_code' => $order->order_code,
                'user_id' => $order->user_id,
                'user_name' => $order->user->name ?? 'N/A',
                'user_email' => $order->user->email ?? 'N/A',
                'user_phone' => null, // Phone field not available in users table
                'total_amount' => (float) $order->total_amount,
                'discount_amount' => (float) $order->discount_amount,
                'tax_amount' => (float) ($order->tax_amount ?? 0),
                'final_amount' => (float) $order->final_amount,
                'status' => $order->status,
                'payment_method' => $order->payment_method ?? 'N/A',
                'payment_gateway' => $order->payment_gateway ?? null,
                'transaction_id' => $order->transaction_id ?? null,
                'billing_address' => $order->billing_address ?? null,
                'order_notes' => $order->order_notes ?? null,
                'created_at' => $order->created_at->toISOString(),
                'paid_at' => $order->paid_at ? $order->paid_at->toISOString() : null,
                'items' => $items,
            ];

            return $this->success($orderData, 'Lấy thông tin đơn hàng thành công', $request);

        } catch (\Exception $e) {
            Log::error('Error in admin getOrder: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
