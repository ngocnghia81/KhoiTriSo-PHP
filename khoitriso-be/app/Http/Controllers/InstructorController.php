<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Course;
use App\Models\Book;
use App\Models\CourseEnrollment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Instructor Controller
 * Handles instructor-specific endpoints
 */
class InstructorController extends BaseController
{
    /**
     * Get instructor dashboard statistics
     */
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $instructorId = $user->id;

            // Get courses count
            $coursesCount = Course::where('instructor_id', $instructorId)
                ->whereRaw('is_active = true')
                ->count();

            // Get books count
            $booksCount = Book::where('author_id', $instructorId)
                ->whereRaw('is_active = true')
                ->count();

            // Get total students (distinct users enrolled in instructor's courses)
            $totalStudents = CourseEnrollment::whereHas('course', function($q) use ($instructorId) {
                $q->where('instructor_id', $instructorId)->whereRaw('is_active = true');
            })
            ->whereRaw('is_active = true')
            ->distinct('user_id')
            ->count('user_id');

            // Get total revenue (from order_items where instructor_id matches)
            $totalRevenue = (float) DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->where('o.status', 2) // Paid
                ->where('oi.instructor_id', $instructorId)
                ->selectRaw('SUM(oi.instructor_revenue) as total')
                ->value('total') ?: 0.0;

            // Get revenue today
            $revenueToday = (float) DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->where('o.status', 2)
                ->where('oi.instructor_id', $instructorId)
                ->whereDate('o.created_at', today())
                ->selectRaw('SUM(oi.instructor_revenue) as total')
                ->value('total') ?: 0.0;

            // Get orders today
            $ordersToday = (int) DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->where('o.status', 2)
                ->where('oi.instructor_id', $instructorId)
                ->whereDate('o.created_at', today())
                ->distinct('oi.order_id')
                ->count('oi.order_id');

            // Get revenue last 7 days
            $revenueChart = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $revenue = (float) DB::table('order_items as oi')
                    ->join('orders as o', 'oi.order_id', '=', 'o.id')
                    ->where('o.status', 2)
                    ->where('oi.instructor_id', $instructorId)
                    ->whereDate('o.created_at', $date->format('Y-m-d'))
                    ->selectRaw('SUM(oi.instructor_revenue) as total')
                    ->value('total') ?: 0.0;
                
                $revenueChart[] = [
                    'label' => $date->format('d/m'),
                    'revenue' => $revenue,
                ];
            }

            // Get top courses by enrollment
            $topCourses = Course::where('instructor_id', $instructorId)
                ->whereRaw('is_active = true')
                ->get()
                ->map(function($course) {
                    $studentsCount = CourseEnrollment::where('course_id', $course->id)
                        ->whereRaw('is_active = true')
                        ->count();
                    
                    return [
                        'id' => $course->id,
                        'title' => $course->title,
                        'students' => $studentsCount,
                    ];
                })
                ->sortByDesc('students')
                ->take(5)
                ->values();

            // Get top books by purchases
            $topBooks = Book::where('author_id', $instructorId)
                ->whereRaw('is_active = true')
                ->get()
                ->map(function($book) {
                    $purchasesCount = \App\Models\UserBook::whereHas('activationCode', function($q) use ($book) {
                        $q->where('book_id', $book->id);
                    })
                    ->whereRaw('is_active = true')
                    ->count();
                    
                    return [
                        'id' => $book->id,
                        'title' => $book->title,
                        'purchases' => $purchasesCount,
                    ];
                })
                ->sortByDesc('purchases')
                ->take(5)
                ->values();

            return $this->success([
                'coursesCount' => $coursesCount,
                'booksCount' => $booksCount,
                'totalStudents' => $totalStudents,
                'totalRevenue' => round($totalRevenue, 2),
                'revenueToday' => round($revenueToday, 2),
                'ordersToday' => $ordersToday,
                'revenueChart' => $revenueChart,
                'topCourses' => $topCourses,
                'topBooks' => $topBooks,
            ]);

        } catch (\Exception $e) {
            Log::error('Error in instructor dashboard: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get instructor's courses
     */
    public function courses(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);

            $q = Course::with(['category:id,name'])
                ->where('instructor_id', $user->id);

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

            $total = $q->count();
            $courses = $q->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($course) {
                    // Get enrollment count
                    $enrollmentsCount = CourseEnrollment::where('course_id', $course->id)
                        ->whereRaw('is_active = true')
                        ->count();

                    return [
                        'id' => $course->id,
                        'title' => $course->title,
                        'description' => $course->description,
                        'thumbnail' => $course->thumbnail,
                        'price' => (float) $course->price,
                        'isFree' => (bool) $course->is_free,
                        'isActive' => (bool) $course->is_active,
                        'isPublished' => (bool) $course->is_published,
                        'approvalStatus' => (int) $course->approval_status,
                        'rating' => (float) ($course->rating ?? 0),
                        'totalStudents' => $enrollmentsCount,
                        'totalLessons' => $course->total_lessons ?? 0,
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
            Log::error('Error in instructor courses: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get instructor's books
     */
    public function books(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);

            $q = Book::with(['category:id,name'])
                ->where('author_id', $user->id);
            
            // Instructor can see all their books (active and inactive) by default
            // Only filter by status if explicitly requested

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

            $total = $q->count();
            $books = $q->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($book) {
                    // Get purchase count
                    $purchasesCount = \App\Models\UserBook::whereHas('activationCode', function($q) use ($book) {
                        $q->where('book_id', $book->id);
                    })
                    ->whereRaw('is_active = true')
                    ->count();

                    return [
                        'id' => $book->id,
                        'title' => $book->title,
                        'description' => $book->description,
                        'isbn' => $book->isbn,
                        'coverImage' => $book->cover_image,
                        'price' => (float) $book->price,
                        'approvalStatus' => (int) $book->approval_status,
                        'isPublished' => (bool) $book->is_published,
                        'purchaseCount' => $purchasesCount,
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
            Log::error('Error in instructor books: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get instructor's students (enrolled in their courses)
     */
    public function students(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);

            // Get all enrollments for instructor's courses
            // PostgreSQL doesn't support count(distinct col1, col2), so we use a subquery
            $baseQuery = CourseEnrollment::whereHas('course', function($query) use ($user) {
                $query->where('instructor_id', $user->id)->whereRaw('is_active = true');
            })
            ->whereRaw('is_active = true');

            // Search by user name or email
            if ($s = $request->query('search')) {
                $baseQuery->whereHas('user', function($query) use ($s) {
                    $query->where('name', 'like', "%$s%")
                          ->orWhere('email', 'like', "%$s%");
                });
            }

            // Get all enrollments first, then group by (user_id, course_id) and get the latest one for each pair
            $allEnrollments = $baseQuery->with(['user:id,name,email,avatar', 'course:id,title'])
                ->orderBy('enrolled_at', 'desc')
                ->get();

            // Group by (user_id, course_id) and keep only the latest enrollment for each pair
            $grouped = [];
            foreach ($allEnrollments as $enrollment) {
                $key = $enrollment->user_id . '_' . $enrollment->course_id;
                if (!isset($grouped[$key])) {
                    $grouped[$key] = $enrollment;
                }
            }

            $total = count($grouped);
            
            // Convert to array and sort by enrolled_at desc
            $enrollmentsArray = array_values($grouped);
            usort($enrollmentsArray, function($a, $b) {
                $aTime = is_string($a->enrolled_at) ? strtotime($a->enrolled_at) : $a->enrolled_at->timestamp;
                $bTime = is_string($b->enrolled_at) ? strtotime($b->enrolled_at) : $b->enrolled_at->timestamp;
                return $bTime - $aTime;
            });

            // Apply pagination
            $enrollments = array_slice($enrollmentsArray, ($page - 1) * $pageSize, $pageSize);
            
            $enrollments = collect($enrollments)->map(function ($enrollment) {
                return [
                    'id' => $enrollment->id,
                    'user' => $enrollment->user ? [
                        'id' => $enrollment->user->id,
                        'name' => $enrollment->user->name,
                        'email' => $enrollment->user->email,
                        'avatar' => $enrollment->user->avatar,
                    ] : null,
                    'course' => $enrollment->course ? [
                        'id' => $enrollment->course->id,
                        'title' => $enrollment->course->title,
                    ] : null,
                    'progressPercentage' => (float) ($enrollment->progress_percentage ?? 0),
                    'enrolledAt' => is_string($enrollment->enrolled_at) ? $enrollment->enrolled_at : $enrollment->enrolled_at->toISOString(),
                    'completedAt' => $enrollment->completed_at ? (is_string($enrollment->completed_at) ? $enrollment->completed_at : $enrollment->completed_at->toISOString()) : null,
                ];
            })
                ->map(function ($enrollment) {
                    return [
                        'id' => $enrollment->id,
                        'user' => $enrollment->user ? [
                            'id' => $enrollment->user->id,
                            'name' => $enrollment->user->name,
                            'email' => $enrollment->user->email,
                            'avatar' => $enrollment->user->avatar,
                        ] : null,
                        'course' => $enrollment->course ? [
                            'id' => $enrollment->course->id,
                            'title' => $enrollment->course->title,
                        ] : null,
                        'progressPercentage' => (float) ($enrollment->progress_percentage ?? 0),
                        'enrolledAt' => is_string($enrollment->enrolled_at) ? $enrollment->enrolled_at : $enrollment->enrolled_at->toISOString(),
                        'completedAt' => $enrollment->completed_at ? (is_string($enrollment->completed_at) ? $enrollment->completed_at : $enrollment->completed_at->toISOString()) : null,
                    ];
                });

            return $this->paginated($enrollments->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            Log::error('Error in instructor students: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get instructor's orders (orders containing their courses/books)
     */
    public function orders(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);

            // Get order IDs that contain items from this instructor
            $orderIds = DB::table('order_items')
                ->where('instructor_id', $user->id)
                ->distinct('order_id')
                ->pluck('order_id');

            $q = \App\Models\Order::with(['items' => function($query) use ($user) {
                $query->where('instructor_id', $user->id);
            }, 'user:id,name,email'])
                ->whereIn('id', $orderIds);

            // Filter by status
            if ($request->filled('status')) {
                $q->where('status', $request->integer('status'));
            }

            // Search
            if ($s = $request->query('search')) {
                $q->where(function ($w) use ($s) {
                    $w->where('order_code', 'like', "%$s%")
                      ->orWhereHas('user', function($q) use ($s) {
                          $q->where('name', 'like', "%$s%")
                            ->orWhere('email', 'like', "%$s%");
                      });
                });
            }

            $total = $q->count();
            $orders = $q->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'orderCode' => $order->order_code,
                        'userId' => $order->user_id,
                        'userName' => $order->user ? $order->user->name : null,
                        'userEmail' => $order->user ? $order->user->email : null,
                        'totalAmount' => (float) $order->total_amount,
                        'discountAmount' => (float) $order->discount_amount,
                        'finalAmount' => (float) $order->final_amount,
                        'status' => (int) $order->status,
                        'paymentMethod' => $order->payment_method,
                        'items' => $order->items->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'itemId' => $item->item_id,
                                'itemType' => $item->item_type,
                                'itemName' => $item->item_name,
                                'price' => (float) $item->price,
                                'quantity' => (int) $item->quantity,
                                'instructorRevenue' => (float) ($item->instructor_revenue ?? 0),
                            ];
                        }),
                        'createdAt' => is_string($order->created_at) ? $order->created_at : $order->created_at->toISOString(),
                    ];
                });

            return $this->paginated($orders->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            Log::error('Error in instructor orders: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Create a new course (Instructor only)
     * POST /api/instructor/courses
     */
    public function createCourse(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'title' => ['required', 'string', 'max:200'],
                'description' => ['required', 'string'],
                'thumbnail' => ['required', 'string', 'max:255'],
                'categoryId' => ['required', 'integer', 'exists:categories,id'],
                'level' => ['required', 'integer', 'in:1,2,3'],
                'isFree' => ['required', 'boolean'],
                'price' => ['required', 'numeric', 'min:0'],
                'staticPagePath' => ['required', 'string'],
                'language' => ['nullable', 'string', 'max:10'],
                'requirements' => ['nullable', 'array'],
                'whatYouWillLearn' => ['nullable', 'array'],
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors()->toArray());
            }

            $data = $validator->validated();
            $staticPagePath = $data['staticPagePath'] ?? \Illuminate\Support\Str::slug($data['title']);

            // Instructor courses are pending approval by default
            // Use raw SQL for PostgreSQL boolean compatibility
            $isFree = filter_var($data['isFree'], FILTER_VALIDATE_BOOLEAN);
            
            $courseId = DB::selectOne("
                INSERT INTO courses (
                    title, description, thumbnail, category_id, level,
                    is_free, price, static_page_path, instructor_id,
                    approval_status, is_active, is_published,
                    language, requirements, what_you_will_learn,
                    created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?,
                    ?::boolean, ?, ?, ?,
                    ?, true::boolean, false::boolean,
                    ?, ?::json, ?::json,
                    ?, ?
                ) RETURNING id
            ", [
                $data['title'],
                $data['description'],
                $data['thumbnail'],
                $data['categoryId'],
                $data['level'],
                $isFree,
                $data['price'],
                $staticPagePath,
                $user->id,
                0, // Pending
                $data['language'] ?? 'vi',
                json_encode($data['requirements'] ?? [], JSON_UNESCAPED_UNICODE),
                json_encode($data['whatYouWillLearn'] ?? [], JSON_UNESCAPED_UNICODE),
                now(),
                now(),
            ])->id;
            
            $course = Course::find($courseId);

            return $this->success($course, 'Tạo khóa học thành công. Đang chờ phê duyệt.', $request);

        } catch (\Exception $e) {
            Log::error('Error in instructor createCourse: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Update course (Instructor only, must own the course)
     * PUT /api/instructor/courses/{id}
     */
    public function updateCourse(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $course = Course::find($id);
            if (!$course) {
                return $this->notFound('Course');
            }

            // Check ownership
            if ($course->instructor_id !== $user->id) {
                return $this->forbidden('Bạn không có quyền chỉnh sửa khóa học này');
            }

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'title' => ['sometimes', 'string', 'max:200'],
                'description' => ['sometimes', 'string'],
                'thumbnail' => ['sometimes', 'string', 'max:255'],
                'categoryId' => ['sometimes', 'integer', 'exists:categories,id'],
                'level' => ['sometimes', 'integer', 'in:1,2,3'],
                'isFree' => ['sometimes', 'boolean'],
                'price' => ['sometimes', 'numeric', 'min:0'],
                'language' => ['sometimes', 'string', 'max:10'],
                'requirements' => ['sometimes', 'array'],
                'whatYouWillLearn' => ['sometimes', 'array'],
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors()->toArray());
            }

            $data = $validator->validated();

            // Use raw SQL for PostgreSQL boolean compatibility
            $updates = [];
            $values = [];
            
            if (isset($data['title'])) {
                $updates[] = 'title = ?';
                $values[] = $data['title'];
            }
            if (isset($data['description'])) {
                $updates[] = 'description = ?';
                $values[] = $data['description'];
            }
            if (isset($data['thumbnail'])) {
                $updates[] = 'thumbnail = ?';
                $values[] = $data['thumbnail'];
            }
            if (isset($data['categoryId'])) {
                $updates[] = 'category_id = ?';
                $values[] = $data['categoryId'];
            }
            if (isset($data['level'])) {
                $updates[] = 'level = ?';
                $values[] = $data['level'];
            }
            if (isset($data['isFree'])) {
                $isFree = filter_var($data['isFree'], FILTER_VALIDATE_BOOLEAN);
                $updates[] = 'is_free = ?::boolean';
                $values[] = $isFree;
            }
            if (isset($data['price'])) {
                $updates[] = 'price = ?';
                $values[] = $data['price'];
            }
            if (isset($data['language'])) {
                $updates[] = 'language = ?';
                $values[] = $data['language'];
            }
            if (isset($data['requirements'])) {
                $updates[] = 'requirements = ?::json';
                $values[] = json_encode($data['requirements'], JSON_UNESCAPED_UNICODE);
            }
            if (isset($data['whatYouWillLearn'])) {
                $updates[] = 'what_you_will_learn = ?::json';
                $values[] = json_encode($data['whatYouWillLearn'], JSON_UNESCAPED_UNICODE);
            }
            
            // If course was approved, set back to pending after update
            if ($course->approval_status === 1) {
                $updates[] = 'approval_status = ?';
                $values[] = 0;
                $updates[] = 'is_published = false::boolean';
            }
            
            $updates[] = 'updated_at = ?';
            $values[] = now();
            $values[] = $id;
            
            if (!empty($updates)) {
                DB::statement('UPDATE courses SET ' . implode(', ', $updates) . ' WHERE id = ?', $values);
                $course->refresh();
            }

            return $this->success($course, 'Cập nhật khóa học thành công. Đang chờ phê duyệt lại.', $request);

        } catch (\Exception $e) {
            Log::error('Error in instructor updateCourse: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Delete course (Instructor only, must own the course)
     * DELETE /api/instructor/courses/{id}
     */
    public function deleteCourse(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $course = Course::find($id);
            if (!$course) {
                return $this->notFound('Course');
            }

            // Check ownership
            if ($course->instructor_id !== $user->id) {
                return $this->forbidden('Bạn không có quyền xóa khóa học này');
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
            Log::error('Error in instructor deleteCourse: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get course detail (Instructor only, must own the course)
     * GET /api/instructor/courses/{id}
     */
    public function getCourse(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $course = Course::with(['category:id,name', 'instructor:id,name,email'])
                ->find($id);

            if (!$course) {
                return $this->notFound('Course');
            }

            // Check ownership
            if ($course->instructor_id !== $user->id) {
                return $this->forbidden('Bạn không có quyền xem khóa học này');
            }

            return $this->success($course, 'Lấy thông tin khóa học thành công', $request);

        } catch (\Exception $e) {
            Log::error('Error in instructor getCourse: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Create a new book (Instructor only)
     * POST /api/instructor/books
     */
    public function createBook(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'title' => ['required', 'string', 'max:200'],
                'description' => ['required', 'string'],
                'isbn' => ['required', 'string', 'max:20', 'unique:books,isbn'],
                'coverImage' => ['required', 'string', 'max:255'],
                'price' => ['required', 'numeric', 'min:0'],
                'categoryId' => ['nullable', 'integer', 'exists:categories,id'],
                'ebookFile' => ['nullable', 'string', 'max:255'],
                'staticPagePath' => ['required', 'string'],
                'language' => ['nullable', 'string', 'max:10'],
                'publicationYear' => ['nullable', 'integer'],
                'edition' => ['nullable', 'string', 'max:50'],
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors()->toArray());
            }

            $data = $validator->validated();

            // Instructor books are pending approval by default
            $book = Book::create([
                'title' => $data['title'],
                'description' => $data['description'],
                'isbn' => $data['isbn'],
                'cover_image' => $data['coverImage'],
                'price' => $data['price'],
                'category_id' => $data['categoryId'] ?? null,
                'ebook_file' => $data['ebookFile'] ?? '',
                'static_page_path' => $data['staticPagePath'],
                'author_id' => $user->id,
                'approval_status' => 0, // Pending
                'is_published' => false,
                'language' => $data['language'] ?? 'vi',
                'publication_year' => $data['publicationYear'] ?? null,
                'edition' => $data['edition'] ?? null,
            ]);

            return $this->success($book, 'Tạo sách thành công. Đang chờ phê duyệt.', $request);

        } catch (\Exception $e) {
            Log::error('Error in instructor createBook: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Update book (Instructor only, must own the book)
     * PUT /api/instructor/books/{id}
     */
    public function updateBook(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $book = Book::find($id);
            if (!$book) {
                return $this->notFound('Book');
            }

            // Check ownership
            if ($book->author_id !== $user->id) {
                return $this->forbidden('Bạn không có quyền chỉnh sửa sách này');
            }

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'title' => ['sometimes', 'string', 'max:200'],
                'description' => ['sometimes', 'string'],
                'coverImage' => ['sometimes', 'string', 'max:255'],
                'price' => ['sometimes', 'numeric', 'min:0'],
                'categoryId' => ['sometimes', 'integer', 'exists:categories,id'],
                'ebookFile' => ['sometimes', 'string', 'max:255'],
                'language' => ['sometimes', 'string', 'max:10'],
                'publicationYear' => ['sometimes', 'integer'],
                'edition' => ['sometimes', 'string', 'max:50'],
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors()->toArray());
            }

            $data = $validator->validated();

            // If book was approved, set back to pending after update
            if ($book->approval_status === 1) {
                $book->approval_status = 0;
                $book->is_published = false;
            }

            $book->fill([
                'title' => $data['title'] ?? $book->title,
                'description' => $data['description'] ?? $book->description,
                'cover_image' => $data['coverImage'] ?? $book->cover_image,
                'price' => $data['price'] ?? $book->price,
                'category_id' => $data['categoryId'] ?? $book->category_id,
                'ebook_file' => $data['ebookFile'] ?? $book->ebook_file,
                'language' => $data['language'] ?? $book->language,
                'publication_year' => $data['publicationYear'] ?? $book->publication_year,
                'edition' => $data['edition'] ?? $book->edition,
            ])->save();

            return $this->success($book, 'Cập nhật sách thành công. Đang chờ phê duyệt lại.', $request);

        } catch (\Exception $e) {
            Log::error('Error in instructor updateBook: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Delete book (Instructor only, must own the book)
     * DELETE /api/instructor/books/{id}
     */
    public function deleteBook(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $book = Book::find($id);
            if (!$book) {
                return $this->notFound('Book');
            }

            // Check ownership
            if ($book->author_id !== $user->id) {
                return $this->forbidden('Bạn không có quyền xóa sách này');
            }

            // Soft delete: set is_active = false (use direct update with raw SQL for PostgreSQL boolean)
            \DB::table('books')
                ->where('id', $id)
                ->update([
                    'is_active' => \DB::raw('false'),
                    'updated_at' => now(),
                ]);

            return $this->success(null, 'Xóa sách thành công', $request);

        } catch (\Exception $e) {
            Log::error('Error in instructor deleteBook: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get book detail (Instructor only, must own the book)
     * GET /api/instructor/books/{id}
     */
    public function getBook(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $book = Book::with(['category:id,name', 'author:id,name,email', 'chapters' => function ($q) {
                $q->orderBy('order_index');
            }])->find($id);

            if (!$book) {
                return $this->notFound('Book');
            }

            // Check ownership
            if ($book->author_id !== $user->id) {
                return $this->forbidden('Bạn không có quyền xem sách này');
            }

            return $this->success($book, 'Lấy thông tin sách thành công', $request);

        } catch (\Exception $e) {
            Log::error('Error in instructor getBook: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get course analytics (Instructor only, must own the course)
     * GET /api/instructor/courses/{id}/analytics
     */
    public function getCourseAnalytics(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $course = Course::find($id);
            if (!$course) {
                return $this->notFound('Course');
            }

            // Check ownership
            if ($course->instructor_id !== $user->id) {
                return $this->forbidden('Bạn không có quyền xem thống kê khóa học này');
            }

            // Get enrollments count
            $enrollmentsCount = CourseEnrollment::where('course_id', $id)
                ->whereRaw('is_active = true')
                ->count();

            // Get total revenue from order_items
            $totalRevenue = (float) DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->where('o.status', 2) // Paid
                ->where('oi.item_type', 1) // Course
                ->where('oi.item_id', $id)
                ->where('oi.instructor_id', $user->id)
                ->selectRaw('SUM(oi.instructor_revenue) as total')
                ->value('total') ?: 0.0;

            // Get completion rate
            $completedCount = CourseEnrollment::where('course_id', $id)
                ->whereRaw('is_active = true')
                ->whereNotNull('completed_at')
                ->count();
            $completionRate = $enrollmentsCount > 0 ? round(($completedCount / $enrollmentsCount) * 100, 2) : 0;

            // Get average progress
            $avgProgress = (float) CourseEnrollment::where('course_id', $id)
                ->whereRaw('is_active = true')
                ->selectRaw('AVG(progress_percentage) as avg')
                ->value('avg') ?: 0.0;

            return $this->success([
                'courseId' => $id,
                'courseTitle' => $course->title,
                'enrollmentsCount' => $enrollmentsCount,
                'totalRevenue' => round($totalRevenue, 2),
                'completionRate' => $completionRate,
                'averageProgress' => round($avgProgress, 2),
                'completedCount' => $completedCount,
            ], 'Lấy thống kê khóa học thành công', $request);

        } catch (\Exception $e) {
            Log::error('Error in instructor getCourseAnalytics: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get course revenue (Instructor only, must own the course)
     * GET /api/instructor/courses/{id}/revenue
     */
    public function getCourseRevenue(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $course = Course::find($id);
            if (!$course) {
                return $this->notFound('Course');
            }

            // Check ownership
            if ($course->instructor_id !== $user->id) {
                return $this->forbidden('Bạn không có quyền xem doanh thu khóa học này');
            }

            // Get date range from query params
            $startDate = $request->query('startDate') ? \Carbon\Carbon::parse($request->query('startDate'))->startOfDay() : now()->subDays(30)->startOfDay();
            $endDate = $request->query('endDate') ? \Carbon\Carbon::parse($request->query('endDate'))->endOfDay() : now()->endOfDay();

            // Total revenue from instructor_revenue (not total price)
            $totalRevenue = (float) DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->where('o.status', 2) // Paid
                ->where('oi.item_type', 1) // Course
                ->where('oi.item_id', $id)
                ->where('oi.instructor_id', $user->id)
                ->whereBetween('o.updated_at', [$startDate, $endDate])
                ->selectRaw('SUM(oi.instructor_revenue) as total')
                ->value('total') ?: 0.0;

            // Total orders
            $totalOrders = (int) DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->where('o.status', 2)
                ->where('oi.item_type', 1)
                ->where('oi.item_id', $id)
                ->where('oi.instructor_id', $user->id)
                ->whereBetween('o.updated_at', [$startDate, $endDate])
                ->distinct('o.id')
                ->count('o.id');

            // Revenue by day
            $revenueByDay = [];
            $currentDate = $startDate->copy();
            while ($currentDate <= $endDate) {
                $nextDate = $currentDate->copy()->addDay();
                $revenue = (float) DB::table('order_items as oi')
                    ->join('orders as o', 'oi.order_id', '=', 'o.id')
                    ->where('o.status', 2)
                    ->where('oi.item_type', 1)
                    ->where('oi.item_id', $id)
                    ->where('oi.instructor_id', $user->id)
                    ->where('o.updated_at', '>=', $currentDate)
                    ->where('o.updated_at', '<', $nextDate)
                    ->selectRaw('SUM(oi.instructor_revenue) as total')
                    ->value('total') ?: 0.0;
                $revenueByDay[] = [
                    'date' => $currentDate->format('Y-m-d'),
                    'label' => $currentDate->format('d/m/Y'),
                    'revenue' => $revenue,
                ];
                $currentDate->addDay();
            }

            return $this->success([
                'courseId' => $id,
                'courseTitle' => $course->title,
                'totalRevenue' => round($totalRevenue, 2),
                'totalOrders' => $totalOrders,
                'averageOrderValue' => $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0,
                'revenueByDay' => $revenueByDay,
                'startDate' => $startDate->format('Y-m-d'),
                'endDate' => $endDate->format('Y-m-d'),
            ], 'Lấy thống kê doanh thu thành công', $request);

        } catch (\Exception $e) {
            Log::error('Error in instructor getCourseRevenue: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get course enrollments (Instructor only, must own the course)
     * GET /api/instructor/courses/{id}/enrollments
     */
    public function getCourseEnrollments(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'instructor') {
                return $this->forbidden();
            }

            $course = Course::find($id);
            if (!$course) {
                return $this->notFound('Course');
            }

            // Check ownership
            if ($course->instructor_id !== $user->id) {
                return $this->forbidden('Bạn không có quyền xem danh sách học viên khóa học này');
            }

            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);

            $q = CourseEnrollment::where('course_id', $id)
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
                        'progressPercentage' => (float) ($enrollment->progress_percentage ?? 0),
                        'enrolledAt' => is_string($enrollment->enrolled_at) ? $enrollment->enrolled_at : $enrollment->enrolled_at->toISOString(),
                        'completedAt' => $enrollment->completed_at ? (is_string($enrollment->completed_at) ? $enrollment->completed_at : $enrollment->completed_at->toISOString()) : null,
                    ];
                });

            return $this->paginated($enrollments->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            Log::error('Error in instructor getCourseEnrollments: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}

