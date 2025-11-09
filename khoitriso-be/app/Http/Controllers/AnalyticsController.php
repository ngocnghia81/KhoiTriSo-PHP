<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;

/**
 * Analytics Controller
 */
class AnalyticsController extends BaseController
{
    public function dashboard(Request $request): JsonResponse
    {
        try {
            // Get today's date range
            $today = now()->startOfDay();
            $yesterday = $today->copy()->subDay();
            
            // Total users
            $totalUsers = (int) DB::table('users')->count();
            
            // Active users (logged in within last 30 days)
            $activeUsers = (int) DB::table('users')
                ->where('last_login', '>=', now()->subDays(30))
                ->whereRaw('is_active = true')
                ->count();
            
            // New registrations today
            $newRegistrations = (int) DB::table('users')
                ->where('created_at', '>=', $today)
                ->count();
            
            // Total courses (active)
            $totalCourses = (int) DB::table('courses')
                ->whereRaw('is_active = true')
                ->count();
            
            // Total books (active)
            $totalBooks = (int) DB::table('books')
                ->whereRaw('is_active = true')
                ->count();
            
            // Total revenue (paid orders)
            $totalRevenue = (float) DB::table('orders')
                ->where('status', 2) // Paid
                ->sum('final_amount');
            
            // Revenue today
            $revenueToday = (float) DB::table('orders')
                ->where('status', 2)
                ->where('updated_at', '>=', $today)
                ->sum('final_amount');
            
            // Revenue yesterday
            $revenueYesterday = (float) DB::table('orders')
                ->where('status', 2)
                ->where('updated_at', '>=', $yesterday)
                ->where('updated_at', '<', $today)
                ->sum('final_amount');
            
            // Revenue growth percentage
            $revenueGrowth = $revenueYesterday > 0 
                ? round((($revenueToday - $revenueYesterday) / $revenueYesterday) * 100, 2)
                : ($revenueToday > 0 ? 100 : 0);
            
            // Orders today
            $ordersToday = (int) DB::table('orders')
                ->where('created_at', '>=', $today)
                ->count();
            
            // Compute revenue per course (courses only), then pick top 5 by revenue
            $lines = DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->where('o.status', 2) // paid
                ->where('oi.item_type', 1) // courses
                ->selectRaw('oi.item_id as course_id')
                ->selectRaw('oi.price as price')
                ->selectRaw('oi.quantity as quantity')
                ->selectRaw('COALESCE(o.total_amount, 0) as order_total')
                ->selectRaw('COALESCE(o.discount_amount, 0) as order_discount')
                ->get();

            $revenueByCourse = [];
            foreach ($lines as $line) {
                $cid = (int)$line->course_id;
                $gross = (float)$line->price * (float)$line->quantity;
                $orderTotal = (float)$line->order_total;
                $orderDiscount = (float)$line->order_discount;

                if ($orderTotal > 0) {
                    $discountShare = ($gross / $orderTotal) * $orderDiscount;
                } else {
                    $discountShare = 0.0;
                }

                $net = $gross - $discountShare;

                if (!isset($revenueByCourse[$cid])) $revenueByCourse[$cid] = 0.0;
                $revenueByCourse[$cid] += $net;
            }

            // Sort course ids by revenue desc and take top 5
            arsort($revenueByCourse);
            $topIds = array_slice(array_keys($revenueByCourse), 0, 5);

            // Fetch course data for these ids preserving order
            $courses = [];
            if (!empty($topIds)) {
                // Fetch course metadata for these ids.
                // Some DB schemas may not have `rating` or `is_free` columns; try the full select first
                // and fall back to a minimal select if a QueryException occurs.
                try {
                    $raw = DB::table('courses')
                        ->whereIn('id', $topIds)
                        ->whereRaw('is_active = true')
                        ->get(['id', 'title', 'total_students', 'rating', 'price', 'is_free']);
                } catch (QueryException $qe) {
                    // log and fallback to minimal columns
                    \Log::warning('Courses metadata select failed, falling back to minimal columns: ' . $qe->getMessage());
                    $raw = DB::table('courses')
                        ->whereIn('id', $topIds)
                        ->whereRaw('is_active = true')
                        ->get(['id', 'title', 'total_students', 'price']);
                }

                // Index raw by id for quick lookup
                $byId = [];
                foreach ($raw as $r) {
                    $byId[$r->id] = $r;
                }

                foreach ($topIds as $tid) {
                    if (!isset($byId[$tid])) continue; // skip inactive or missing
                    $r = $byId[$tid];
                    $courses[] = [
                        'id' => $r->id,
                        'title' => $r->title,
                        'students' => isset($r->total_students) ? (int)$r->total_students : 0,
                        // rating may be absent in some schemas
                        'rating' => isset($r->rating) ? (float)$r->rating : null,
                        'price' => isset($r->price) ? (float)$r->price : 0.0,
                        // isFree explicitly comes from DB flag when available; fallback to null when unknown
                        'isFree' => isset($r->is_free) ? (bool)$r->is_free : null,
                        'revenue' => round($revenueByCourse[$tid] ?? 0.0, 2),
                    ];
                }
            }

            // Ensure we always return an array (empty if none)
            $topCourses = collect($courses);
            
            // Compute revenue and purchases for all active books, then return books ordered by revenue desc
            // Aggregate from order_items (item_type = 2)
            $linesBooks = DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->where('o.status', 2) // paid
                ->where('oi.item_type', 2) // books
                ->selectRaw('oi.item_id as book_id')
                ->selectRaw('oi.price as price')
                ->selectRaw('oi.quantity as quantity')
                ->selectRaw('COALESCE(o.total_amount, 0) as order_total')
                ->selectRaw('COALESCE(o.discount_amount, 0) as order_discount')
                ->get();

            $revenueByBook = [];
            $purchasesByBook = [];
            foreach ($linesBooks as $line) {
                $bid = (int)$line->book_id;
                $gross = (float)$line->price * (float)$line->quantity;
                $orderTotal = (float)$line->order_total;
                $orderDiscount = (float)$line->order_discount;

                if ($orderTotal > 0) {
                    $discountShare = ($gross / $orderTotal) * $orderDiscount;
                } else {
                    $discountShare = 0.0;
                }

                $net = $gross - $discountShare;

                if (!isset($revenueByBook[$bid])) $revenueByBook[$bid] = 0.0;
                if (!isset($purchasesByBook[$bid])) $purchasesByBook[$bid] = 0;
                $revenueByBook[$bid] += $net;
                $purchasesByBook[$bid] += (int)$line->quantity;
            }

            // Fetch all active books metadata. Some DB schemas may not have `is_free` or `rating`.
            try {
                $rawBooks = DB::table('books')
                    ->whereRaw('is_active = true')
                    ->get(['id', 'title', 'total_questions', 'price', 'is_free']);
            } catch (QueryException $qe) {
                \Log::warning('Books metadata select failed, falling back to minimal columns: ' . $qe->getMessage());
                $rawBooks = DB::table('books')
                    ->whereRaw('is_active = true')
                    ->get(['id', 'title', 'total_questions', 'price']);
            }

            $booksList = [];
            foreach ($rawBooks as $b) {
                $id = $b->id;
                $booksList[] = [
                    'id' => $id,
                    'title' => $b->title,
                    'questions' => isset($b->total_questions) ? (int)$b->total_questions : 0,
                    'price' => isset($b->price) ? (float)$b->price : 0.0,
                    // rating column may not exist in this schema
                    'rating' => null,
                    // isFree explicitly comes from DB flag when available; fallback to null when unknown
                    'isFree' => isset($b->is_free) ? (bool)$b->is_free : null,
                    'revenue' => round($revenueByBook[$id] ?? 0.0, 2),
                    'purchases' => (int)($purchasesByBook[$id] ?? 0),
                ];
            }

            // Sort by revenue desc by default
            usort($booksList, function($a, $b) {
                return ($b['revenue'] ?? 0) <=> ($a['revenue'] ?? 0);
            });

            $topBooks = collect($booksList);
            
            // User growth - last 7 days
            $userGrowth = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i)->startOfDay();
                $nextDate = $date->copy()->addDay();
                $count = (int) DB::table('users')
                    ->where('created_at', '>=', $date)
                    ->where('created_at', '<', $nextDate)
                    ->count();
                $userGrowth[] = [
                    'date' => $date->format('Y-m-d'),
                    'label' => $date->format('d/m'),
                    'users' => $count,
                ];
            }
            
            // Revenue chart - last 7 days
            $revenueChart = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i)->startOfDay();
                $nextDate = $date->copy()->addDay();
                $revenue = (float) DB::table('orders')
                    ->where('status', 2)
                    ->where('updated_at', '>=', $date)
                    ->where('updated_at', '<', $nextDate)
                    ->sum('final_amount');
                $revenueChart[] = [
                    'date' => $date->format('Y-m-d'),
                    'label' => $date->format('d/m'),
                    'revenue' => $revenue,
                ];
            }
            
            $data = [
                'totalUsers' => $totalUsers,
                'activeUsers' => $activeUsers,
                'newRegistrations' => $newRegistrations,
                'totalCourses' => $totalCourses,
                'totalBooks' => $totalBooks,
                'totalRevenue' => $totalRevenue,
                'revenueToday' => $revenueToday,
                'ordersToday' => $ordersToday,
                'revenueGrowth' => $revenueGrowth,
                'topCourses' => $topCourses,
                'topBooks' => $topBooks,
                'userGrowth' => $userGrowth,
                'revenueChart' => $revenueChart,
            ];
            
            return $this->success($data);

        } catch (\Exception $e) {
            \Log::error('Error in analytics dashboard: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    public function course(int $id, Request $request): JsonResponse
    {
        try {
            $course = \App\Models\Course::find($id);
            if (!$course) {
                return $this->notFound('Course');
            }

            // Total enrollments
            $totalEnrollments = (int) DB::table('course_enrollments')
                ->where('course_id', $id)
                ->count();

            // Active students (currently enrolled)
            $activeStudents = (int) DB::table('course_enrollments')
                ->where('course_id', $id)
                ->whereRaw('is_active = true')
                ->count();

            // Completion rate
            $completed = (int) DB::table('course_enrollments')
                ->where('course_id', $id)
                ->whereNotNull('completed_at')
                ->count();
            $completionRate = $totalEnrollments > 0 ? round(($completed / $totalEnrollments) * 100, 2) : 0;

            // Average progress
            $avgProgress = (float) DB::table('course_enrollments')
                ->where('course_id', $id)
                ->whereRaw('is_active = true')
                ->avg('progress_percentage') ?? 0;
            $averageProgress = round($avgProgress, 2);

            // Rating
            $rating = is_numeric($course->rating) ? (float) $course->rating : 0.0;

            // Total revenue from orders (paid orders with this course)
            $totalRevenue = (float) DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.status', 2) // Paid
                ->where('order_items.item_type', 1) // Course
                ->where('order_items.item_id', $id)
                ->sum('order_items.price');

            // Enrollment trend - last 30 days
            $enrollmentTrend = [];
            for ($i = 29; $i >= 0; $i--) {
                $date = now()->subDays($i)->startOfDay();
                $nextDate = $date->copy()->addDay();
                $count = (int) DB::table('course_enrollments')
                    ->where('course_id', $id)
                    ->where('enrolled_at', '>=', $date)
                    ->where('enrolled_at', '<', $nextDate)
                    ->count();
                $enrollmentTrend[] = [
                    'date' => $date->format('Y-m-d'),
                    'label' => $date->format('d/m'),
                    'enrollments' => $count,
                ];
            }

            // Progress distribution
            $progressDistribution = [
                ['range' => '0-20%', 'count' => (int) DB::table('course_enrollments')->where('course_id', $id)->whereRaw('is_active = true')->whereRaw('progress_percentage >= 0 AND progress_percentage < 20')->count()],
                ['range' => '20-40%', 'count' => (int) DB::table('course_enrollments')->where('course_id', $id)->whereRaw('is_active = true')->whereRaw('progress_percentage >= 20 AND progress_percentage < 40')->count()],
                ['range' => '40-60%', 'count' => (int) DB::table('course_enrollments')->where('course_id', $id)->whereRaw('is_active = true')->whereRaw('progress_percentage >= 40 AND progress_percentage < 60')->count()],
                ['range' => '60-80%', 'count' => (int) DB::table('course_enrollments')->where('course_id', $id)->whereRaw('is_active = true')->whereRaw('progress_percentage >= 60 AND progress_percentage < 80')->count()],
                ['range' => '80-100%', 'count' => (int) DB::table('course_enrollments')->where('course_id', $id)->whereRaw('is_active = true')->whereRaw('progress_percentage >= 80')->count()],
            ];

            // Lesson engagement (views/completions per lesson)
            $lessons = DB::table('lessons')
                ->where('course_id', $id)
                ->whereRaw('is_published = true')
                ->orderBy('lesson_order')
                ->get(['id', 'title', 'lesson_order']);
            
            $lessonEngagement = $lessons->map(function($lesson) {
                $views = (int) DB::table('lesson_progress')
                    ->where('lesson_id', $lesson->id)
                    ->count();
                $completions = (int) DB::table('lesson_progress')
                    ->where('lesson_id', $lesson->id)
                    ->whereRaw('is_completed = true')
                    ->count();
                return [
                    'lessonId' => $lesson->id,
                    'title' => $lesson->title,
                    'order' => $lesson->lesson_order,
                    'views' => $views,
                    'completions' => $completions,
                    'completionRate' => $views > 0 ? round(($completions / $views) * 100, 2) : 0,
                ];
            });

            // Revenue trend - last 30 days
            $revenueTrend = [];
            for ($i = 29; $i >= 0; $i--) {
                $date = now()->subDays($i)->startOfDay();
                $nextDate = $date->copy()->addDay();
                $revenue = (float) DB::table('orders')
                    ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                    ->where('orders.status', 2)
                    ->where('order_items.item_type', 1)
                    ->where('order_items.item_id', $id)
                    ->where('orders.updated_at', '>=', $date)
                    ->where('orders.updated_at', '<', $nextDate)
                    ->sum('order_items.price');
                $revenueTrend[] = [
                    'date' => $date->format('Y-m-d'),
                    'label' => $date->format('d/m'),
                    'revenue' => $revenue,
                ];
            }

            $data = [
                'courseId' => $id,
                'courseTitle' => $course->title,
                'totalEnrollments' => $totalEnrollments,
                'activeStudents' => $activeStudents,
                'completionRate' => $completionRate,
                'averageProgress' => $averageProgress,
                'rating' => $rating,
                'totalReviews' => is_numeric($course->total_reviews) ? (int) $course->total_reviews : 0,
                'totalRevenue' => $totalRevenue,
                'enrollmentTrend' => $enrollmentTrend,
                'revenueTrend' => $revenueTrend,
                'progressDistribution' => $progressDistribution,
                'lessonEngagement' => $lessonEngagement,
            ];
            
            return $this->success($data);

        } catch (\Exception $e) {
            \Log::error('Error in analytics course: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    public function instructor(int $id, Request $request): JsonResponse
    {
        try {
            $data = [
                'instructorId' => $id,
                'totalCourses' => 0,
                'totalBooks' => 0,
                'totalStudents' => 0,
                'totalRevenue' => 0,
                'totalEarnings' => 0,
                'averageRating' => 0,
                'coursePerformance' => [],
                'monthlyEarnings' => [],
                'studentFeedback' => ['positive' => 0, 'neutral' => 0, 'negative' => 0],
            ];
            
            return $this->success($data);

        } catch (\Exception $e) {
            \Log::error('Error in analytics instructor: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
