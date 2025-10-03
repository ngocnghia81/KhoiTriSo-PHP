<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function validateCode(Request $request)
    {
        $data = $request->validate([
            'couponCode' => ['required','string','max:50'],
            'totalAmount' => ['required','numeric','min:0'],
            'items' => ['nullable','array'],
        ]);
        $coupon = Coupon::where('code', $data['couponCode'])->where('is_active', true)->first();
        if (! $coupon || ! now()->between($coupon->valid_from, $coupon->valid_to)) {
            return response()->json(['valid' => false, 'message' => 'Invalid coupon'], 400);
        }
        $discount = 0;
        if ((int) $coupon->discount_type === 1) {
            $discount = round($data['totalAmount'] * ((float) $coupon->discount_value) / 100, 2);
            if ($coupon->max_discount_amount) $discount = min($discount, (float) $coupon->max_discount_amount);
        } else {
            $discount = (float) $coupon->discount_value;
        }
        return response()->json(['valid' => true, 'discountAmount' => $discount]);
    }

    public function index(Request $request)
    {
        $q = Coupon::query()->where('is_active', true);
        if ($request->filled('itemType')) {
            // Optional filter: include if applicable_item_types contains itemType
        }
        $res = $q->orderByDesc('created_at')->paginate((int) $request->query('pageSize', 20));
        return response()->json(['coupons' => $res->items(), 'total' => $res->total(), 'hasMore' => $res->hasMorePages()]);
    }
}


