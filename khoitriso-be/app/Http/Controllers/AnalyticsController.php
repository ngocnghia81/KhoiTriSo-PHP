<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

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
            
            // Top 5 courses by total_students
            $topCourses = DB::table('courses')
                ->whereRaw('is_active = true')
                ->orderByDesc('total_students')
                ->limit(5)
                ->get(['id', 'title', 'total_students', 'rating', 'price'])
                ->map(function($course) {
                    return [
                        'id' => $course->id,
                        'title' => $course->title,
                        'students' => (int) $course->total_students,
                        'rating' => (float) $course->rating,
                        'price' => (float) $course->price,
                    ];
                });
            
            // Top 5 books by total_questions
            $topBooks = DB::table('books')
                ->whereRaw('is_active = true')
                ->orderByDesc('total_questions')
                ->limit(5)
                ->get(['id', 'title', 'total_questions', 'price'])
                ->map(function($book) {
                    return [
                        'id' => $book->id,
                        'title' => $book->title,
                        'questions' => (int) $book->total_questions,
                        'price' => (float) $book->price,
                    ];
                });
            
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
            $data = [
                'courseId' => $id,
                'totalEnrollments' => 0,
                'activeStudents' => 0,
                'completionRate' => 0,
                'averageProgress' => 0,
                'rating' => 0,
                'totalRevenue' => 0,
                'enrollmentTrend' => [],
                'progressDistribution' => [],
                'lessonEngagement' => [],
            ];
            
            return $this->success($data);

        } catch (\Exception $e) {
            \Log::error('Error in analytics course: ' . $e->getMessage());
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
