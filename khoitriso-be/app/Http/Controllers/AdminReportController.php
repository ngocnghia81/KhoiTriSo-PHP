<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Admin report endpoints
 */
class AdminReportController extends BaseController
{
    /**
     * Revenue report aggregated by instructor/author.
     * Query params:
     * - from (YYYY-MM-DD)
     * - to (YYYY-MM-DD)
     * - item_type (1=course,2=book)
     */
    public function revenueReport(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'admin') {
                return $this->forbidden();
            }

            $from = $request->query('from');
            $to = $request->query('to');
            $itemType = $request->query('item_type');

            // Commission: try read from system_settings, fallback to 30%
            $commissionSetting = DB::table('system_settings')->where('setting_key', 'commission_rate_default')->value('setting_value');
            $commission = is_numeric($commissionSetting) ? (float) $commissionSetting : 30.0;

            // Base query: order items joined with orders and courses/books
            $q = DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->leftJoin('courses as c', function ($join) {
                    $join->on('oi.item_id', '=', 'c.id')->where('oi.item_type', '=', 1);
                })
                ->leftJoin('books as b', function ($join) {
                    $join->on('oi.item_id', '=', 'b.id')->where('oi.item_type', '=', 2);
                })
                ->where('o.status', '=', 2); // only paid orders

            if ($from) {
                $q->where('o.created_at', '>=', $from . ' 00:00:00');
            }
            if ($to) {
                $q->where('o.created_at', '<=', $to . ' 23:59:59');
            }
            if ($itemType && in_array((int)$itemType, [1,2], true)) {
                $q->where('oi.item_type', '=', (int)$itemType);
            }

            // We'll fetch per-item lines and compute net/platform in PHP to avoid DB rounding surprises
            $lines = DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->leftJoin('courses as c', function ($join) {
                    $join->on('oi.item_id', '=', 'c.id')->where('oi.item_type', '=', 1);
                })
                ->leftJoin('books as b', function ($join) {
                    $join->on('oi.item_id', '=', 'b.id')->where('oi.item_type', '=', 2);
                })
                ->where('o.status', '=', 2)
                ->when($from, function ($q) use ($from) {
                    $q->where('o.created_at', '>=', $from . ' 00:00:00');
                })
                ->when($to, function ($q) use ($to) {
                    $q->where('o.created_at', '<=', $to . ' 23:59:59');
                })
                ->when($itemType, function ($q) use ($itemType) {
                    if (in_array((int)$itemType, [1,2], true)) $q->where('oi.item_type', '=', (int)$itemType);
                })
                ->selectRaw('COALESCE(c.instructor_id, b.author_id) as instructor_id')
                ->selectRaw('oi.price as price')
                ->selectRaw('oi.quantity as quantity')
                ->selectRaw('COALESCE(o.total_amount, 0) as order_total')
                ->selectRaw('COALESCE(o.discount_amount, 0) as order_discount')
                ->get();

            // Aggregate in PHP
            $agg = [];
            $totals = ['gross' => 0.0, 'net' => 0.0, 'platform_fee' => 0.0, 'instructor_earning' => 0.0];

            foreach ($lines as $line) {
                $instructorId = $line->instructor_id !== null ? (int)$line->instructor_id : null;
                $gross = (float)$line->price * (float)$line->quantity;
                $orderTotal = (float)$line->order_total;
                $orderDiscount = (float)$line->order_discount;

                if ($orderTotal > 0) {
                    $discountShare = ($gross / $orderTotal) * $orderDiscount;
                } else {
                    $discountShare = 0.0;
                }

                $net = $gross - $discountShare;
                $platformFee = round($net * (floatval($commission) / 100.0), 2);
                $instructorEarning = $net - $platformFee;

                if (!isset($agg[$instructorId])) {
                    $agg[$instructorId] = ['gross' => 0.0, 'net' => 0.0, 'platform_fee' => 0.0, 'instructor_earning' => 0.0];
                }

                $agg[$instructorId]['gross'] += $gross;
                $agg[$instructorId]['net'] += $net;
                $agg[$instructorId]['platform_fee'] += $platformFee;
                $agg[$instructorId]['instructor_earning'] += $instructorEarning;

                $totals['gross'] += $gross;
                $totals['net'] += $net;
                $totals['platform_fee'] += $platformFee;
                $totals['instructor_earning'] += $instructorEarning;
            }

            // Build rows array similar to previous shape
            $rows = [];
            foreach ($agg as $instId => $vals) {
                $rows[] = (object)array_merge(['instructor_id' => $instId], $vals);
                if ($instId !== null) $instructorIds[] = $instId;
            }

            // Compute totals
            $totals = ['gross' => 0.0, 'net' => 0.0, 'platform_fee' => 0.0, 'instructor_earning' => 0.0];
            $instructorIds = [];
            foreach ($rows as $r) {
                $g = (float) $r->gross;
                $n = (float) $r->net;
                $pf = (float) $r->platform_fee;
                $ie = $n - $pf;
                $totals['gross'] += $g;
                $totals['net'] += $n;
                $totals['platform_fee'] += $pf;
                $totals['instructor_earning'] += $ie;
                if ($r->instructor_id !== null) $instructorIds[] = $r->instructor_id;
            }

            // Fetch instructor names
            $names = [];
            if (!empty($instructorIds)) {
                $users = DB::table('users')->whereIn('id', array_values(array_unique($instructorIds)))->select('id','name')->get();
                foreach ($users as $u) {
                    $names[$u->id] = $u->name;
                }
            }

            $perInstructor = [];
            foreach ($rows as $r) {
                $id = $r->instructor_id !== null ? (int)$r->instructor_id : null;
                $g = (float) $r->gross;
                $n = (float) $r->net;
                $pf = (float) $r->platform_fee;
                $ie = $n - $pf;

                $perInstructor[] = [
                    'id' => $id,
                    'name' => $id ? ($names[$id] ?? 'N/A') : 'N/A',
                    'gross' => round($g, 2),
                    'net' => round($n, 2),
                    'platform_fee' => round($pf, 2),
                    'instructor_earning' => round($ie, 2),
                ];
            }

            return $this->success([
                'commission_percentage' => $commission,
                'totals' => [
                    'gross' => round($totals['gross'], 2),
                    'net' => round($totals['net'], 2),
                    'platform_fee' => round($totals['platform_fee'], 2),
                    'instructor_earning' => round($totals['instructor_earning'], 2),
                ],
                'per_instructor' => $perInstructor,
            ]);

        } catch (\Exception $e) {
            Log::error('Error in AdminReportController::revenueReport: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Total admin revenue report
     * Includes: revenue from admin-created items + commission from instructor-created items
     * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
     */
    public function adminTotalRevenue(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'admin') {
                return $this->forbidden();
            }

            $from = $request->query('from');
            $to = $request->query('to');

            $q = DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->where('o.status', '=', 2); // only paid orders

            if ($from) {
                $q->where('o.created_at', '>=', $from . ' 00:00:00');
            }
            if ($to) {
                $q->where('o.created_at', '<=', $to . ' 23:59:59');
            }

            // Revenue from admin-created items (instructor_id is null)
            $adminItemsRevenue = (float) $q->clone()
                ->whereNull('oi.instructor_id')
                ->selectRaw('SUM(oi.price * oi.quantity) as total')
                ->value('total') ?: 0.0;

            // Commission from instructor-created items
            $commissionFromInstructors = (float) $q->clone()
                ->whereNotNull('oi.instructor_id')
                ->selectRaw('SUM(oi.commission_amount) as total')
                ->value('total') ?: 0.0;

            $totalAdminRevenue = $adminItemsRevenue + $commissionFromInstructors;

            // Breakdown by type
            $coursesRevenue = (float) $q->clone()
                ->whereNull('oi.instructor_id')
                ->where('oi.item_type', 1)
                ->selectRaw('SUM(oi.price * oi.quantity) as total')
                ->value('total') ?: 0.0;

            $booksRevenue = (float) $q->clone()
                ->whereNull('oi.instructor_id')
                ->where('oi.item_type', 2)
                ->selectRaw('SUM(oi.price * oi.quantity) as total')
                ->value('total') ?: 0.0;

            return $this->success([
                'total_revenue' => round($totalAdminRevenue, 2),
                'admin_items_revenue' => round($adminItemsRevenue, 2),
                'commission_from_instructors' => round($commissionFromInstructors, 2),
                'breakdown' => [
                    'courses' => round($coursesRevenue, 2),
                    'books' => round($booksRevenue, 2),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error in AdminReportController::adminTotalRevenue: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Instructor revenue report
     * Shows revenue for each instructor (their earnings from their courses/books)
     * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD), instructor_id (optional)
     */
    public function instructorRevenue(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            // Allow both admin and instructor to access
            if (!$user) {
                return $this->forbidden();
            }

            $from = $request->query('from');
            $to = $request->query('to');
            $instructorId = $request->query('instructor_id');

            // If user is instructor, only show their own data
            if (($user->role ?? '') === 'instructor' && !$instructorId) {
                $instructorId = $user->id;
            }

            $q = DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->where('o.status', '=', 2) // only paid orders
                ->whereNotNull('oi.instructor_id'); // only instructor-created items

            if ($from) {
                $q->where('o.created_at', '>=', $from . ' 00:00:00');
            }
            if ($to) {
                $q->where('o.created_at', '<=', $to . ' 23:59:59');
            }
            if ($instructorId) {
                $q->where('oi.instructor_id', '=', $instructorId);
            }

            // Aggregate by instructor
            $results = $q->selectRaw('oi.instructor_id')
                ->selectRaw('SUM(oi.price * oi.quantity) as gross_revenue')
                ->selectRaw('SUM(oi.commission_amount) as total_commission')
                ->selectRaw('SUM(oi.instructor_revenue) as instructor_earning')
                ->selectRaw('COUNT(DISTINCT oi.order_id) as total_orders')
                ->groupBy('oi.instructor_id')
                ->get();

            $instructorIds = $results->pluck('instructor_id')->toArray();
            $instructors = [];
            if (!empty($instructorIds)) {
                $users = DB::table('users')
                    ->whereIn('id', $instructorIds)
                    ->select('id', 'name', 'email')
                    ->get();
                foreach ($users as $u) {
                    $instructors[$u->id] = $u;
                }
            }

            $data = [];
            foreach ($results as $r) {
                $instId = (int) $r->instructor_id;
                $instructor = $instructors[$instId] ?? null;
                
                $data[] = [
                    'instructor_id' => $instId,
                    'instructor_name' => $instructor ? $instructor->name : 'N/A',
                    'instructor_email' => $instructor ? $instructor->email : 'N/A',
                    'gross_revenue' => round((float) $r->gross_revenue, 2),
                    'total_commission' => round((float) $r->total_commission, 2),
                    'instructor_earning' => round((float) $r->instructor_earning, 2),
                    'total_orders' => (int) $r->total_orders,
                ];
            }

            return $this->success([
                'instructors' => $data,
            ]);

        } catch (\Exception $e) {
            Log::error('Error in AdminReportController::instructorRevenue: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Commission statistics for admin dashboard
     * Returns: total pending, total paid, total instructors, avg commission rate
     */
    public function commissionStats(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'admin') {
                return $this->forbidden();
            }

            $from = $request->query('from');
            $to = $request->query('to');

            // Base query for paid orders with instructor items
            $q = DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->where('o.status', '=', 2) // only paid orders
                ->whereNotNull('oi.instructor_id'); // only instructor-created items

            if ($from) {
                $q->where('o.created_at', '>=', $from . ' 00:00:00');
            }
            if ($to) {
                $q->where('o.created_at', '<=', $to . ' 23:59:59');
            }

            // Total pending (all instructor revenue - can be considered as pending until paid)
            $totalPending = (float) $q->clone()
                ->selectRaw('SUM(oi.instructor_revenue) as total')
                ->value('total') ?: 0.0;

            // Total paid (for now, we don't have payout_history, so this is 0 or can be calculated differently)
            // For now, we'll use a separate query if we have payout tracking
            $totalPaid = 0.0; // TODO: Implement payout tracking

            // Total active instructors
            $totalInstructors = (int) $q->clone()
                ->selectRaw('COUNT(DISTINCT oi.instructor_id) as total')
                ->value('total') ?: 0;

            // Average commission rate
            $avgCommissionRate = (float) $q->clone()
                ->selectRaw('AVG(oi.commission_rate) as avg')
                ->value('avg') ?: 0.0;

            // This month pending (current month)
            $thisMonthStart = date('Y-m-01');
            $thisMonthPending = (float) $q->clone()
                ->where('o.created_at', '>=', $thisMonthStart . ' 00:00:00')
                ->selectRaw('SUM(oi.instructor_revenue) as total')
                ->value('total') ?: 0.0;

            // Next payout date (15th of next month)
            $nextPayoutDate = date('Y-m-15', strtotime('+1 month'));

            return $this->success([
                'total_pending' => round($totalPending, 2),
                'total_paid' => round($totalPaid, 2),
                'total_instructors' => $totalInstructors,
                'avg_commission_rate' => round($avgCommissionRate, 2),
                'this_month_pending' => round($thisMonthPending, 2),
                'next_payout_date' => $nextPayoutDate,
            ]);

        } catch (\Exception $e) {
            Log::error('Error in AdminReportController::commissionStats: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Pending payouts - list of instructors with pending payments
     */
    public function pendingPayouts(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'admin') {
                return $this->forbidden();
            }

            $from = $request->query('from');
            $to = $request->query('to');

            $q = DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->where('o.status', '=', 2) // only paid orders
                ->whereNotNull('oi.instructor_id'); // only instructor-created items

            if ($from) {
                $q->where('o.created_at', '>=', $from . ' 00:00:00');
            }
            if ($to) {
                $q->where('o.created_at', '<=', $to . ' 23:59:59');
            }

            // Aggregate by instructor
            $results = $q->selectRaw('oi.instructor_id')
                ->selectRaw('SUM(oi.instructor_revenue) as total_earnings')
                ->selectRaw('AVG(oi.commission_rate) as commission_rate')
                ->selectRaw('SUM(CASE WHEN oi.item_type = 1 THEN oi.price * oi.quantity ELSE 0 END) as courses_revenue')
                ->selectRaw('SUM(CASE WHEN oi.item_type = 2 THEN oi.price * oi.quantity ELSE 0 END) as books_revenue')
                ->selectRaw('COUNT(DISTINCT oi.order_id) as transaction_count')
                ->selectRaw('MIN(o.created_at) as pending_since')
                ->groupBy('oi.instructor_id')
                ->get();

            $instructorIds = $results->pluck('instructor_id')->toArray();
            $instructors = [];
            if (!empty($instructorIds)) {
                $users = DB::table('users')
                    ->whereIn('id', $instructorIds)
                    ->select('id', 'name', 'email', 'avatar')
                    ->get();
                foreach ($users as $u) {
                    $instructors[$u->id] = $u;
                }
            }

            $data = [];
            foreach ($results as $r) {
                $instId = (int) $r->instructor_id;
                $instructor = $instructors[$instId] ?? null;
                
                if (!$instructor) continue;

                $data[] = [
                    'id' => $instId,
                    'instructor' => [
                        'name' => $instructor->name,
                        'email' => $instructor->email,
                        'avatar' => $instructor->avatar,
                    ],
                    'total_earnings' => round((float) $r->total_earnings, 2),
                    'commission_rate' => round((float) $r->commission_rate, 2),
                    'courses_revenue' => round((float) $r->courses_revenue, 2),
                    'books_revenue' => round((float) $r->books_revenue, 2),
                    'transaction_count' => (int) $r->transaction_count,
                    'pending_since' => $r->pending_since,
                    'bank_info' => [
                        'bank_name' => null, // TODO: Add bank info to users table
                        'account_number' => null,
                        'account_name' => null,
                    ],
                ];
            }

            // Sort by total_earnings descending
            usort($data, function($a, $b) {
                return $b['total_earnings'] <=> $a['total_earnings'];
            });

            return $this->success([
                'payouts' => $data,
            ]);

        } catch (\Exception $e) {
            Log::error('Error in AdminReportController::pendingPayouts: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Top instructors by revenue
     */
    public function topInstructors(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'admin') {
                return $this->forbidden();
            }

            $limit = (int) $request->query('limit', 10);
            $from = $request->query('from');
            $to = $request->query('to');

            $q = DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->where('o.status', '=', 2) // only paid orders
                ->whereNotNull('oi.instructor_id'); // only instructor-created items

            if ($from) {
                $q->where('o.created_at', '>=', $from . ' 00:00:00');
            }
            if ($to) {
                $q->where('o.created_at', '<=', $to . ' 23:59:59');
            }

            // Aggregate by instructor
            $results = $q->selectRaw('oi.instructor_id')
                ->selectRaw('SUM(oi.instructor_revenue) as total_earnings')
                ->selectRaw('AVG(oi.commission_rate) as commission_rate')
                ->selectRaw('COUNT(DISTINCT CASE WHEN oi.item_type = 1 THEN oi.item_id END) as courses_count')
                ->selectRaw('COUNT(DISTINCT CASE WHEN oi.item_type = 2 THEN oi.item_id END) as books_count')
                ->selectRaw('COUNT(DISTINCT o.user_id) as students_count')
                ->groupBy('oi.instructor_id')
                ->orderBy('total_earnings', 'desc')
                ->limit($limit)
                ->get();

            $instructorIds = $results->pluck('instructor_id')->toArray();
            $instructors = [];
            if (!empty($instructorIds)) {
                $users = DB::table('users')
                    ->whereIn('id', $instructorIds)
                    ->select('id', 'name', 'email', 'avatar')
                    ->get();
                foreach ($users as $u) {
                    $instructors[$u->id] = $u;
                }
            }

            $data = [];
            foreach ($results as $r) {
                $instId = (int) $r->instructor_id;
                $instructor = $instructors[$instId] ?? null;
                
                if (!$instructor) continue;

                $data[] = [
                    'name' => $instructor->name,
                    'total_earnings' => round((float) $r->total_earnings, 2),
                    'courses_count' => (int) $r->courses_count,
                    'books_count' => (int) $r->books_count,
                    'students_count' => (int) $r->students_count,
                    'commission_rate' => round((float) $r->commission_rate, 2),
                    'avatar' => $instructor->avatar,
                ];
            }

            return $this->success([
                'instructors' => $data,
            ]);

        } catch (\Exception $e) {
            Log::error('Error in AdminReportController::topInstructors: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Recent commission transactions
     */
    public function recentTransactions(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'admin') {
                return $this->forbidden();
            }

            $limit = (int) $request->query('limit', 20);
            $from = $request->query('from');
            $to = $request->query('to');

            $q = DB::table('order_items as oi')
                ->join('orders as o', 'oi.order_id', '=', 'o.id')
                ->where('o.status', '=', 2) // only paid orders
                ->whereNotNull('oi.instructor_id'); // only instructor-created items

            if ($from) {
                $q->where('o.created_at', '>=', $from . ' 00:00:00');
            }
            if ($to) {
                $q->where('o.created_at', '<=', $to . ' 23:59:59');
            }

            $results = $q->select(
                    'oi.id',
                    'oi.instructor_id',
                    'oi.item_type',
                    'oi.price',
                    'oi.quantity',
                    'oi.commission_rate',
                    'oi.commission_amount',
                    'oi.instructor_revenue',
                    'o.order_code',
                    'o.created_at as order_date'
                )
                ->orderBy('o.created_at', 'desc')
                ->limit($limit)
                ->get();

            $instructorIds = $results->pluck('instructor_id')->unique()->toArray();
            $instructors = [];
            if (!empty($instructorIds)) {
                $users = DB::table('users')
                    ->whereIn('id', $instructorIds)
                    ->select('id', 'name')
                    ->get();
                foreach ($users as $u) {
                    $instructors[$u->id] = $u->name;
                }
            }

            $data = [];
            foreach ($results as $r) {
                $originalAmount = (float) $r->price * (int) $r->quantity;
                
                $data[] = [
                    'id' => (int) $r->id,
                    'instructor' => $instructors[$r->instructor_id] ?? 'N/A',
                    'type' => $r->item_type == 1 ? 'course_enrollment' : 'book_purchase',
                    'original_amount' => round($originalAmount, 2),
                    'commission_rate' => round((float) $r->commission_rate, 2),
                    'commission_amount' => round((float) $r->commission_amount, 2),
                    'status' => 'pending', // TODO: Implement payout status tracking
                    'paid_at' => null, // TODO: Implement payout tracking
                    'reference' => $r->order_code,
                ];
            }

            return $this->success([
                'transactions' => $data,
            ]);

        } catch (\Exception $e) {
            Log::error('Error in AdminReportController::recentTransactions: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Payout history - list of completed payouts
     * Note: Currently returns empty array as payout tracking is not yet implemented
     */
    public function payoutHistory(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || ($user->role ?? '') !== 'admin') {
                return $this->forbidden();
            }

            $from = $request->query('from');
            $to = $request->query('to');
            $status = $request->query('status');

            // TODO: Implement payout_history table to track actual payouts
            // For now, return empty array with a message
            // In the future, this should query from a payout_history table
            
            return $this->success([
                'history' => [],
                'message' => 'Lịch sử thanh toán sẽ được cập nhật sau khi hệ thống tracking payout được triển khai.',
            ]);

        } catch (\Exception $e) {
            Log::error('Error in AdminReportController::payoutHistory: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
