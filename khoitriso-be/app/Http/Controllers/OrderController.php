<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Coupon;
use App\Models\CouponUsage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Order Controller
 */
class OrderController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $q = Order::where('user_id', $request->user()->id);
            
            if ($request->filled('status')) {
                $q->where('status', $request->integer('status'));
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $orders = $q->orderByDesc('created_at')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();
            
            return $this->paginated($orders->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in orders index: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function show(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $order = Order::with('items')
                ->where('user_id', $request->user()->id)
                ->find($id);
            
            if (!$order) {
                return $this->notFound('Order');
            }
            
            return $this->success($order);

        } catch (\Exception $e) {
            \Log::error('Error in order show: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
                'items' => ['required','array','min:1'],
                'items.*.itemId' => ['required','integer','min:1'],
                'items.*.itemType' => ['required','integer','in:1,2,3'],
                'items.*.quantity' => ['nullable','integer','min:1'],
                'couponCode' => ['nullable','string','max:50'],
                'paymentMethod' => ['required','string','max:50'],
                'billingAddress' => ['nullable','array'],
                'orderNotes' => ['nullable','string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

            $total = 0;
            foreach ($data['items'] as $i) {
                $qty = $i['quantity'] ?? 1;
                // Simplified pricing stub (fetch real price by item & type)
                $price = 100000; // placeholder
                $total += $price * $qty;
            }
            
            $discount = 0;
            $coupon = null;
            
            if (!empty($data['couponCode'])) {
                $coupon = Coupon::where('code', $data['couponCode'])
                    ->where('is_active', true)
                    ->first();
                
                if ($coupon && now()->between($coupon->valid_from, $coupon->valid_to)) {
                    if ((int) $coupon->discount_type === 1) {
                        $discount = round($total * ((float) $coupon->discount_value) / 100, 2);
                        if ($coupon->max_discount_amount) {
                            $discount = min($discount, (float) $coupon->max_discount_amount);
                        }
                    } else {
                        $discount = (float) $coupon->discount_value;
                    }
                }
            }
            
            $final = max(0, $total - $discount);

            $order = Order::create([
                'user_id' => $request->user()->id,
                'order_code' => 'ORD-'.date('Y').'-'.str_pad((string) (Order::max('id') + 1), 6, '0', STR_PAD_LEFT),
                'total_amount' => $total,
                'discount_amount' => $discount,
                'tax_amount' => 0,
                'final_amount' => $final,
                'status' => 1,
                'payment_method' => $data['paymentMethod'],
                'payment_gateway' => $data['paymentMethod'],
                'billing_address' => $data['billingAddress'] ?? null,
                'order_notes' => $data['orderNotes'] ?? null,
            ]);

            foreach ($data['items'] as $i) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'item_id' => $i['itemId'],
                    'item_type' => $i['itemType'],
                    'item_name' => 'Item '.$i['itemId'],
                    'price' => 100000,
                    'quantity' => $i['quantity'] ?? 1,
                ]);
            }

            if ($coupon && $discount > 0) {
                CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'user_id' => $request->user()->id,
                    'order_id' => $order->id,
                    'discount_amount' => $discount,
                ]);
            }

            return $this->success([
                'order' => $order,
                'paymentUrl' => null
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in order store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function cancel(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $order = Order::where('user_id', $request->user()->id)->find($id);
            
            if (!$order) {
                return $this->notFound('Order');
            }
            
            if ($order->status !== 1) {
                return $this->error(
                    MessageCode::ORDER_CANNOT_CANCEL,
                    null,
                    null,
                    400
                );
            }
            
            $order->status = 4;
            $order->save();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in order cancel: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function paymentCallback(int $id, Request $request): JsonResponse
    {
        try {
            $order = Order::find($id);
            
            if (!$order) {
                return $this->notFound('Order');
            }

            // Simplified callback: accept success status
            $status = $request->input('status');
            
            if ($status === 'success') {
                $order->status = 2;
                $order->paid_at = now();
                $order->transaction_id = $request->input('transactionId');
                $order->save();
                
                return $this->success($order);
            }
            
            return $this->error(
                MessageCode::INVALID_PAYMENT_METHOD,
                'Invalid payment status',
                null,
                400
            );

        } catch (\Exception $e) {
            \Log::error('Error in payment callback: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
