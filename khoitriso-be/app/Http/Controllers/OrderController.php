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
use App\Services\VNPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
        try {
            $order = Order::with('items')->where('user_id', $request->user()->id)->findOrFail($id);
            
            // If order is paid, include activation codes for books
            if ($order->status == 2) {
                foreach ($order->items as $item) {
                    if ($item->item_type == 2) { // Book
                        // Find the most recent unused activation code for this book
                        // Created after the order was created (to ensure it's for this order)
                        $query = BookActivationCode::where('book_id', $item->item_id)
                            ->whereRaw('is_used = false')
                            ->whereNull('used_by_id');
                        
                        // Only find codes created after order was created
                        if ($order->created_at) {
                            $query->where('created_at', '>=', $order->created_at);
                        }
                        
                        $code = $query->orderBy('created_at', 'desc')->first();
                        
                        // If not found, try to find any unused code for this book (fallback)
                        if (!$code) {
                            $code = BookActivationCode::where('book_id', $item->item_id)
                                ->whereRaw('is_used = false')
                                ->whereNull('used_by_id')
                                ->orderBy('created_at', 'desc')
                                ->first();
                        }
                        
                        if ($code) {
                            $item->activation_code = $code->activation_code;
                        } else {
                            \Log::warning("No activation code found for book_id: {$item->item_id} in order: {$order->id}");
                        }
                    }
                }
            }
            
            return response()->json($order);
        } catch (\Exception $e) {
            \Log::error('Error in OrderController::show: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['success' => false, 'message' => 'Lỗi khi tải đơn hàng'], 500);
        }
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
            $coupon = Coupon::where('code', $data['couponCode'])->whereRaw('is_active = true')->first();
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

        // Generate payment URL if payment method is VNPay
        $paymentUrl = null;
        if (strtolower($data['paymentMethod']) === 'vnpay') {
            try {
                $vnpayService = new VNPayService();
                $orderDescription = "Thanh toan don hang {$order->order_code}";
                $paymentUrl = $vnpayService->createPaymentUrl(
                    $order->id,
                    $order->final_amount,
                    $orderDescription,
                    $order->order_code,
                    $request->ip()
                );
            } catch (\Exception $e) {
                \Log::error('Error creating VNPay payment URL: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'order' => $order,
            'paymentUrl' => $paymentUrl
        ], 201);
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
                // Enroll user in course - use DB::table for PostgreSQL compatibility
                $existing = DB::table('course_enrollments')
                    ->where('user_id', $order->user_id)
                    ->where('course_id', $item->item_id)
                    ->first();
                
                if (!$existing) {
                    DB::table('course_enrollments')->insert([
                        'user_id' => $order->user_id,
                        'course_id' => $item->item_id,
                        'enrolled_at' => now(),
                        'progress_percentage' => 0,
                        'is_active' => DB::raw('true'),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    // Reactivate if inactive
                    DB::table('course_enrollments')
                        ->where('user_id', $order->user_id)
                        ->where('course_id', $item->item_id)
                        ->update([
                            'is_active' => DB::raw('true'),
                            'enrolled_at' => now(),
                            'updated_at' => now(),
                        ]);
                }
                
                $enrolledCourses[] = [
                    'course_id' => $item->item_id,
                    'course_name' => $item->item_name,
                ];
                
            } elseif ($item->item_type == 2) { // Book
                // Generate unique activation code
                $code = 'BOOK-' . strtoupper(substr(md5(uniqid()), 0, 8));
                
                try {
                    // Create activation code - use DB::table for PostgreSQL compatibility
                    $activationCodeId = DB::table('book_activation_codes')->insertGetId([
                        'book_id' => $item->item_id,
                        'activation_code' => $code,
                        'is_used' => DB::raw('false'),
                        'used_by_id' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    
                    \Log::info("Created activation code for book_id: {$item->item_id}, code: {$code}, id: {$activationCodeId}");
                    
                    $activationCodes[] = [
                        'book_id' => $item->item_id,
                        'book_name' => $item->item_name,
                        'code' => $code,
                    ];
                } catch (\Exception $e) {
                    \Log::error("Failed to create activation code for book_id: {$item->item_id}, error: " . $e->getMessage());
                }
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
                    // Use DB::table for PostgreSQL compatibility
                    $existing = DB::table('course_enrollments')
                        ->where('user_id', $order->user_id)
                        ->where('course_id', $item->item_id)
                        ->first();
                    
                    if (!$existing) {
                        DB::table('course_enrollments')->insert([
                            'user_id' => $order->user_id,
                            'course_id' => $item->item_id,
                            'enrolled_at' => now(),
                            'progress_percentage' => 0,
                            'is_active' => DB::raw('true'),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        DB::table('course_enrollments')
                            ->where('user_id', $order->user_id)
                            ->where('course_id', $item->item_id)
                            ->update([
                                'is_active' => DB::raw('true'),
                                'enrolled_at' => now(),
                                'updated_at' => now(),
                            ]);
                    }
                } elseif ($item->item_type == 2) { // Book
                    // Generate activation code for books
                    $code = 'BOOK-' . strtoupper(substr(md5(uniqid()), 0, 8));
                    DB::table('book_activation_codes')->insert([
                        'book_id' => $item->item_id,
                        'activation_code' => $code,
                        'is_used' => DB::raw('false'),
                        'expires_at' => now()->addYears(5),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            
            $this->processOrderItems($order);
            return response()->json(['success' => true, 'order' => $order]);
        }
        return response()->json(['success' => false, 'message' => 'Invalid status'], 400);
    }

    /**
     * VNPay payment callback
     */
    public function vnpayCallback(Request $request)
    {
        try {
            $vnpayService = new VNPayService();
            $inputData = $request->all();
            
            // Verify payment
            $verifyResult = $vnpayService->verifyPayment($inputData);
            
            if (!$verifyResult['success']) {
                \Log::error('VNPay payment verification failed', ['data' => $inputData]);
                return redirect('/orders?status=error&message=' . urlencode('Xác thực thanh toán thất bại'));
            }
            
            // Find order by order code
            $order = Order::where('order_code', $verifyResult['order_code'])->first();
            
            if (!$order) {
                \Log::error('Order not found for VNPay callback', ['order_code' => $verifyResult['order_code']]);
                return redirect('/orders?status=error&message=' . urlencode('Không tìm thấy đơn hàng'));
            }
            
            // Check if order is already paid
            if ($order->status == 2) {
                return redirect("/orders/{$order->id}?status=success");
            }
            
            // Check response code
            if ($verifyResult['response_code'] === '00') {
                // Payment successful
                $order->status = 2; // Paid
                $order->paid_at = now();
                $order->transaction_id = $verifyResult['transaction_id'];
                $order->payment_method = 'vnpay';
                $order->payment_gateway = 'vnpay';
                $order->save();
                
                // Process order items (enroll courses, generate book codes)
                $this->processOrderItems($order);
                
                \Log::info('VNPay payment successful', [
                    'order_id' => $order->id,
                    'order_code' => $order->order_code,
                    'transaction_id' => $verifyResult['transaction_id']
                ]);
                
                return redirect("/orders/{$order->id}?status=success");
            } else {
                // Payment failed
                $order->status = 3; // Failed
                $order->save();
                
                \Log::warning('VNPay payment failed', [
                    'order_id' => $order->id,
                    'response_code' => $verifyResult['response_code'],
                    'message' => $verifyResult['message']
                ]);
                
                return redirect("/orders/{$order->id}?status=error&message=" . urlencode($verifyResult['message']));
            }
            
        } catch (\Exception $e) {
            \Log::error('Error processing VNPay callback: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return redirect('/orders?status=error&message=' . urlencode('Có lỗi xảy ra khi xử lý thanh toán'));
        }
    }

    /**
     * Process order items after successful payment
     */
    private function processOrderItems(Order $order)
    {
        $orderItems = OrderItem::where('order_id', $order->id)->get();
        $activationCodes = [];
        $enrolledCourses = [];
        
        foreach ($orderItems as $item) {
            if ($item->item_type == 1) { // Course
                // Use DB::table for PostgreSQL compatibility
                $existing = DB::table('course_enrollments')
                    ->where('user_id', $order->user_id)
                    ->where('course_id', $item->item_id)
                    ->first();
                
                if (!$existing) {
                    DB::table('course_enrollments')->insert([
                        'user_id' => $order->user_id,
                        'course_id' => $item->item_id,
                        'enrolled_at' => now(),
                        'progress_percentage' => 0,
                        'is_active' => DB::raw('true'),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    DB::table('course_enrollments')
                        ->where('user_id', $order->user_id)
                        ->where('course_id', $item->item_id)
                        ->update([
                            'is_active' => DB::raw('true'),
                            'enrolled_at' => now(),
                            'updated_at' => now(),
                        ]);
                }
                
                $enrolledCourses[] = $item->item_id;
            } elseif ($item->item_type == 2) { // Book
                // Generate activation code for books
                $code = 'BOOK-' . strtoupper(substr(md5(uniqid()), 0, 8));
                
                try {
                    DB::table('book_activation_codes')->insert([
                        'book_id' => $item->item_id,
                        'activation_code' => $code,
                        'is_used' => DB::raw('false'),
                        'used_by_id' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    
                    // Link book to user
                    $existingUserBook = DB::table('user_books')
                        ->where('user_id', $order->user_id)
                        ->where('book_id', $item->item_id)
                        ->first();
                    
                    if (!$existingUserBook) {
                        DB::table('user_books')->insert([
                            'user_id' => $order->user_id,
                            'book_id' => $item->item_id,
                            'activation_code' => $code,
                            'activated_at' => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                    
                    $activationCodes[] = [
                        'book_id' => $item->item_id,
                        'book_name' => $item->item_name,
                        'code' => $code,
                    ];
                } catch (\Exception $e) {
                    \Log::error("Failed to create activation code for book_id: {$item->item_id}, error: " . $e->getMessage());
                }
            }
        }
        
        return [
            'enrolled_courses' => $enrolledCourses,
            'activation_codes' => $activationCodes,
        ];
    }
}


