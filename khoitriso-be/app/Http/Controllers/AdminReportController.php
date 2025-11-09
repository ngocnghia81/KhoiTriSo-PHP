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
}
