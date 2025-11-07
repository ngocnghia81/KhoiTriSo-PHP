<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\CartItem;
use App\Models\Course;
use App\Models\Book;
use App\Models\BookActivationCode;
use App\Models\UserBook;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $q = Order::where('user_id', $request->user()->id);
        if ($request->filled('status')) $q->where('status', $request->integer('status'));
        $res = $q->orderByDesc('created_at')->paginate((int) $request->query('pageSize', 20));
        return response()->json(['orders' => $res->items(), 'total' => $res->total(), 'hasMore' => $res->hasMorePages()]);
    }

    public function show(int $id, Request $request)
    {
        $order = Order::with('items')->where('user_id', $request->user()->id)->findOrFail($id);
        
        // If order is paid, include activation codes for books
        if ($order->status == 2) {
            $activationCodes = [];
            foreach ($order->items as $item) {
                if ($item->item_type == 2) { // Book
                    $code = BookActivationCode::where('book_id', $item->item_id)
                        ->where('is_used', false)
                        ->whereNull('used_by_id')
                        ->orderBy('created_at', 'desc')
                        ->first();
                    
                    if ($code) {
                        $item->activation_code = $code->activation_code;
                    }
                }
            }
        }
        
        return response()->json($order);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'items' => ['nullable','array','min:1'],
            'items.*.itemId' => ['required_with:items','integer','min:1'],
            'items.*.itemType' => ['required_with:items','integer','in:1,2,3'],
            'items.*.quantity' => ['nullable','integer','min:1'],
            'couponCode' => ['nullable','string','max:50'],
            'paymentMethod' => ['required','string','max:50'],
            'billingAddress' => ['nullable','array'],
            'orderNotes' => ['nullable','string'],
        ]);

        // If no items provided, get from cart
        if (empty($data['items'])) {
            $cartItems = CartItem::where('user_id', $request->user()->id)->get();
            if ($cartItems->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng.'
                ], 400);
            }
            
            $data['items'] = $cartItems->map(function($item) {
                return [
                    'itemId' => $item->item_id,
                    'itemType' => $item->item_type,
                    'quantity' => $item->quantity ?? 1,
                ];
            })->toArray();
        }

        $total = 0;
        $itemsWithDetails = [];
        
        foreach ($data['items'] as $i) {
            $qty = $i['quantity'] ?? 1;
            $itemType = $i['itemType'];
            $itemId = $i['itemId'];
            
            // Get real item data
            if ($itemType == 1) { // Course
                $item = Course::find($itemId);
                $itemName = $item ? $item->title : 'Unknown Course';
                $price = $item ? $item->price : 0;
            } else { // Book
                $item = Book::find($itemId);
                $itemName = $item ? $item->title : 'Unknown Book';
                $price = $item ? $item->price : 0;
            }
            
            $itemsWithDetails[] = [
                'itemId' => $itemId,
                'itemType' => $itemType,
                'itemName' => $itemName,
                'price' => $price,
                'quantity' => $qty,
            ];
            
            $total += $price * $qty;
        }
        $discount = 0;
        $coupon = null;
        if (! empty($data['couponCode'])) {
            $coupon = Coupon::where('code', $data['couponCode'])->where('is_active', true)->first();
            if ($coupon && now()->between($coupon->valid_from, $coupon->valid_to)) {
                if ((int) $coupon->discount_type === 1) {
                    $discount = round($total * ((float) $coupon->discount_value) / 100, 2);
                    if ($coupon->max_discount_amount) $discount = min($discount, (float) $coupon->max_discount_amount);
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

        foreach ($itemsWithDetails as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'item_id' => $item['itemId'],
                'item_type' => $item['itemType'],
                'item_name' => $item['itemName'],
                'price' => $item['price'],
                'quantity' => $item['quantity'],
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

        // Clear cart after order creation
        CartItem::where('user_id', $request->user()->id)->delete();

        return response()->json(['success' => true, 'order' => $order, 'paymentUrl' => null], 201);
    }

    public function cancel(int $id, Request $request)
    {
        $order = Order::where('user_id', $request->user()->id)->findOrFail($id);
        if ($order->status !== 1) {
            return response()->json(['success' => false, 'message' => 'Cannot cancel'], 400);
        }
        $order->status = 4;
        $order->save();
        return response()->json(['success' => true, 'message' => 'Order cancelled successfully']);
    }

    public function pay(int $id, Request $request)
    {
        $order = Order::where('user_id', $request->user()->id)->findOrFail($id);
        if ($order->status !== 1) {
            return response()->json(['success' => false, 'message' => 'Đơn hàng không thể thanh toán'], 400);
        }
        
        $order->status = 2; // Paid
        $order->paid_at = now();
        $order->transaction_id = 'TXN-' . time() . '-' . $order->id;
        $order->save();
        
        // Process order items
        $orderItems = OrderItem::where('order_id', $order->id)->get();
        $activationCodes = [];
        $enrolledCourses = [];
        
        foreach ($orderItems as $item) {
            if ($item->item_type == 1) { // Course
                // Enroll user in course
                $enrollment = \App\Models\CourseEnrollment::firstOrCreate([
                    'user_id' => $order->user_id,
                    'course_id' => $item->item_id,
                ], [
                    'enrolled_at' => now(),
                    'progress_percentage' => 0,
                    'is_active' => true,
                ]);
                
                $enrolledCourses[] = [
                    'course_id' => $item->item_id,
                    'course_name' => $item->item_name,
                ];
                
            } elseif ($item->item_type == 2) { // Book
                // Generate unique activation code
                $code = 'BOOK-' . strtoupper(substr(md5(uniqid()), 0, 8));
                
                // Create activation code
                $activationCode = BookActivationCode::create([
                    'book_id' => $item->item_id,
                    'activation_code' => $code,
                    'is_used' => false,
                    'expires_at' => now()->addYears(5),
                ]);
                
                $activationCodes[] = [
                    'book_id' => $item->item_id,
                    'book_name' => $item->item_name,
                    'code' => $code,
                ];
            }
        }
        
        return response()->json([
            'success' => true, 
            'message' => 'Thanh toán thành công', 
            'order' => $order,
            'enrolled_courses' => $enrolledCourses,
            'activation_codes' => $activationCodes
        ]);
    }

    public function paymentCallback(int $id, Request $request)
    {
        $order = Order::findOrFail($id);
        // Simplified callback: accept success status
        $status = $request->input('status');
        if ($status === 'success') {
            $order->status = 2;
            $order->paid_at = now();
            $order->transaction_id = $request->input('transactionId');
            $order->save();
            
            // Enroll user in courses after successful payment
            $orderItems = OrderItem::where('order_id', $order->id)->get();
            
            foreach ($orderItems as $item) {
                if ($item->item_type == 1) { // Course
                    \App\Models\CourseEnrollment::firstOrCreate([
                        'user_id' => $order->user_id,
                        'course_id' => $item->item_id,
                    ], [
                        'enrolled_at' => now(),
                        'progress_percentage' => 0,
                        'is_active' => true,
                    ]);
                } elseif ($item->item_type == 2) { // Book
                    // Generate activation code for books
                    $code = 'BOOK-' . strtoupper(substr(md5(uniqid()), 0, 8));
                    BookActivationCode::create([
                        'book_id' => $item->item_id,
                        'activation_code' => $code,
                        'is_used' => false,
                        'expires_at' => now()->addYears(5),
                    ]);
                }
            }
            
            return response()->json(['success' => true, 'order' => $order]);
        }
        return response()->json(['success' => false, 'message' => 'Invalid status'], 400);
    }
}


