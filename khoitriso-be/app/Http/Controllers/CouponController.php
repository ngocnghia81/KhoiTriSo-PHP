<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Coupon Controller
 */
class CouponController extends BaseController
{
    public function validateCode(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'couponCode' => ['required','string','max:50'],
                'totalAmount' => ['required','numeric','min:0'],
                'items' => ['nullable','array'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $coupon = Coupon::where('code', $data['couponCode'])
                ->where('is_active', true)
                ->first();
            
            if (!$coupon || !now()->between($coupon->valid_from, $coupon->valid_to)) {
                return response()->json([
                    'success' => false,
                    'messageCode' => MessageCode::VALIDATION_ERROR,
                    'message' => $this->getMessage(MessageCode::VALIDATION_ERROR),
                    'valid' => false
                ], 400);
            }
            
            $discount = 0;
            if ((int) $coupon->discount_type === 1) {
                $discount = round($data['totalAmount'] * ((float) $coupon->discount_value) / 100, 2);
                if ($coupon->max_discount_amount) {
                    $discount = min($discount, (float) $coupon->max_discount_amount);
                }
            } else {
                $discount = (float) $coupon->discount_value;
            }
            
            return $this->success([
                'valid' => true,
                'discountAmount' => $discount
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in validateCode: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $q = Coupon::query()->where('is_active', true);
            
            if ($request->filled('itemType')) {
                // Optional filter: include if applicable_item_types contains itemType
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $coupons = $q->orderByDesc('created_at')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();
            
            return $this->paginated($coupons->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in coupons index: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
