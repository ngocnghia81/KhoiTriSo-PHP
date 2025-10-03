<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request)
    {
        return response()->json([
            'totalUsers' => (int) DB::table('users')->count(),
            'activeUsers' => (int) DB::table('users')->whereNotNull('last_login')->count(),
            'newRegistrations' => 0,
            'totalCourses' => (int) DB::table('courses')->count(),
            'totalBooks' => (int) DB::table('books')->count(),
            'totalRevenue' => (float) DB::table('orders')->where('status', 2)->sum('final_amount'),
            'revenueGrowth' => 0,
            'topCourses' => [],
            'topBooks' => [],
            'userGrowth' => [],
            'revenueChart' => [],
        ]);
    }

    public function course(int $id)
    {
        return response()->json([
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
        ]);
    }

    public function instructor(int $id)
    {
        return response()->json([
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
        ]);
    }
}


