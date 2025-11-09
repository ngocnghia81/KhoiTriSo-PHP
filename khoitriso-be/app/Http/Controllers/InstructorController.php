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
            $q = CourseEnrollment::whereHas('course', function($query) use ($user) {
                $query->where('instructor_id', $user->id)->whereRaw('is_active = true');
            })
            ->whereRaw('is_active = true')
            ->with(['user:id,name,email,avatar', 'course:id,title'])
            ->distinct('user_id', 'course_id');

            // Search by user name or email
            if ($s = $request->query('search')) {
                $q->whereHas('user', function($query) use ($s) {
                    $query->where('name', 'like', "%$s%")
                          ->orWhere('email', 'like', "%$s%");
                });
            }

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
}

