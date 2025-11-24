<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * Admin Coupon Controller
 */
class AdminCouponController extends BaseController
{
    /**
     * List all coupons (Admin only)
     * GET /api/admin/coupons
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem danh sách mã giảm giá');
            }

            $query = Coupon::query();

            // Search
            if ($request->filled('search')) {
                $search = $request->string('search');
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'ilike', "%{$search}%")
                      ->orWhere('name', 'ilike', "%{$search}%");
                });
            }

            // Filter by status
            if ($request->filled('isActive')) {
                $isActive = filter_var($request->query('isActive'), FILTER_VALIDATE_BOOLEAN);
                $query->whereRaw('is_active = ' . ($isActive ? 'true' : 'false'));
            }

            // Filter by discount type
            if ($request->filled('discountType')) {
                $query->where('discount_type', $request->integer('discountType'));
            }

            // Sorting
            $sortBy = $request->string('sortBy', 'created_at')->toString();
            $sortOrder = $request->string('sortOrder', 'desc')->toString();
            $allowedSorts = ['created_at', 'updated_at', 'code', 'valid_from', 'valid_to'];
            if (in_array($sortBy, $allowedSorts)) {
                $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
            } else {
                $query->orderBy('created_at', 'desc');
            }

            // Pagination
            $perPage = min(max(1, (int) $request->query('perPage', 20)), 100);
            $page = max(1, (int) $request->query('page', 1));
            $result = $query->paginate($perPage, ['*'], 'page', $page);

            $coupons = $result->map(function ($coupon) {
                return [
                    'id' => $coupon->id,
                    'code' => $coupon->code,
                    'name' => $coupon->name,
                    'description' => $coupon->description,
                    'discount_type' => $coupon->discount_type, // 1: Percentage, 2: Fixed
                    'discount_value' => (float) $coupon->discount_value,
                    'max_discount_amount' => $coupon->max_discount_amount ? (float) $coupon->max_discount_amount : null,
                    'min_order_amount' => (float) $coupon->min_order_amount,
                    'valid_from' => $coupon->valid_from ? $coupon->valid_from->toISOString() : null,
                    'valid_to' => $coupon->valid_to ? $coupon->valid_to->toISOString() : null,
                    'usage_limit' => $coupon->usage_limit,
                    'used_count' => $coupon->used_count,
                    'is_active' => (bool) $coupon->is_active,
                    'applicable_item_types' => $coupon->applicable_item_types,
                    'applicable_item_ids' => $coupon->applicable_item_ids,
                    'created_at' => $coupon->created_at->toISOString(),
                    'updated_at' => $coupon->updated_at->toISOString(),
                ];
            });

            return $this->paginated($coupons->toArray(), $page, $perPage, $result->total());

        } catch (\Exception $e) {
            Log::error('Error in admin coupons index: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get coupon detail (Admin only)
     * GET /api/admin/coupons/{id}
     */
    public function show(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xem chi tiết mã giảm giá');
            }

            $coupon = Coupon::find($id);

            if (!$coupon) {
                return $this->notFound('Coupon');
            }

            $couponData = [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'name' => $coupon->name,
                'description' => $coupon->description,
                'discount_type' => $coupon->discount_type,
                'discount_value' => (float) $coupon->discount_value,
                'max_discount_amount' => $coupon->max_discount_amount ? (float) $coupon->max_discount_amount : null,
                'min_order_amount' => (float) $coupon->min_order_amount,
                'valid_from' => $coupon->valid_from ? $coupon->valid_from->format('Y-m-d\TH:i:s') : null,
                'valid_to' => $coupon->valid_to ? $coupon->valid_to->format('Y-m-d\TH:i:s') : null,
                'usage_limit' => $coupon->usage_limit,
                'used_count' => $coupon->used_count,
                'is_active' => (bool) $coupon->is_active,
                'applicable_item_types' => $coupon->applicable_item_types,
                'applicable_item_ids' => $coupon->applicable_item_ids,
                'created_at' => $coupon->created_at->toISOString(),
                'updated_at' => $coupon->updated_at->toISOString(),
            ];

            return $this->success($couponData, 'Lấy thông tin mã giảm giá thành công', $request);

        } catch (\Exception $e) {
            Log::error('Error in admin coupons show: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Create coupon (Admin only)
     * POST /api/admin/coupons
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền tạo mã giảm giá');
            }

            $validator = Validator::make($request->all(), [
                'code' => ['required', 'string', 'max:50', 'unique:coupons,code'],
                'name' => ['required', 'string', 'max:200'],
                'description' => ['nullable', 'string'],
                'discount_type' => ['required', 'integer', 'in:1,2'], // 1: Percentage, 2: Fixed
                'discount_value' => ['required', 'numeric', 'min:0.01'],
                'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
                'min_order_amount' => ['nullable', 'numeric', 'min:0'],
                'valid_from' => ['required', 'date'],
                'valid_to' => ['required', 'date', 'after:valid_from'],
                'usage_limit' => ['nullable', 'integer', 'min:1'],
                'is_active' => ['nullable', 'boolean'],
                'applicable_item_types' => ['nullable', 'array'],
                'applicable_item_types.*' => ['integer', 'in:1,2'], // 1: Course, 2: Book
                'applicable_item_ids' => ['nullable', 'array'],
                'applicable_item_ids.*' => ['integer'],
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors()->toArray());
            }

            $data = $validator->validated();

            // Validate discount value based on type
            if ($data['discount_type'] == 1 && $data['discount_value'] > 100) {
                return $this->validationError(['discount_value' => ['Giá trị giảm giá phần trăm không được vượt quá 100%']]);
            }

            // Use raw SQL for PostgreSQL boolean compatibility
            $isActive = (isset($data['is_active']) ? $data['is_active'] : true) ? DB::raw('true') : DB::raw('false');
            
            // Handle JSON fields
            $applicableItemTypes = isset($data['applicable_item_types']) && $data['applicable_item_types'] 
                ? json_encode($data['applicable_item_types']) 
                : null;
            $applicableItemIds = isset($data['applicable_item_ids']) && $data['applicable_item_ids']
                ? json_encode($data['applicable_item_ids'])
                : null;
            
            $couponId = DB::table('coupons')->insertGetId([
                'code' => strtoupper($data['code']),
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'discount_type' => $data['discount_type'],
                'discount_value' => $data['discount_value'],
                'max_discount_amount' => $data['max_discount_amount'] ?? null,
                'min_order_amount' => $data['min_order_amount'] ?? 0,
                'valid_from' => $data['valid_from'],
                'valid_to' => $data['valid_to'],
                'usage_limit' => $data['usage_limit'] ?? null,
                'used_count' => 0,
                'is_active' => $isActive,
                'applicable_item_types' => $applicableItemTypes,
                'applicable_item_ids' => $applicableItemIds,
                'created_by' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            $coupon = Coupon::find($couponId);

            return $this->success([
                'id' => $coupon->id,
                'code' => $coupon->code,
                'name' => $coupon->name,
            ], 'Tạo mã giảm giá thành công', $request);

        } catch (\Exception $e) {
            Log::error('Error in admin coupons store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Update coupon (Admin only)
     * PUT /api/admin/coupons/{id}
     */
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền cập nhật mã giảm giá');
            }

            $coupon = Coupon::find($id);
            if (!$coupon) {
                return $this->notFound('Coupon');
            }

            $validator = Validator::make($request->all(), [
                'code' => ['sometimes', 'string', 'max:50', 'unique:coupons,code,' . $id],
                'name' => ['sometimes', 'string', 'max:200'],
                'description' => ['nullable', 'string'],
                'discount_type' => ['sometimes', 'integer', 'in:1,2'],
                'discount_value' => ['sometimes', 'numeric', 'min:0.01'],
                'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
                'min_order_amount' => ['nullable', 'numeric', 'min:0'],
                'valid_from' => ['sometimes', 'date'],
                'valid_to' => ['sometimes', 'date', 'after:valid_from'],
                'usage_limit' => ['nullable', 'integer', 'min:1'],
                'is_active' => ['nullable', 'boolean'],
                'applicable_item_types' => ['nullable', 'array'],
                'applicable_item_types.*' => ['integer', 'in:1,2'],
                'applicable_item_ids' => ['nullable', 'array'],
                'applicable_item_ids.*' => ['integer'],
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors()->toArray());
            }

            $data = $validator->validated();

            // Validate discount value based on type
            if (isset($data['discount_type']) && $data['discount_type'] == 1) {
                $discountValue = $data['discount_value'] ?? $coupon->discount_value;
                if ($discountValue > 100) {
                    return $this->validationError(['discount_value' => ['Giá trị giảm giá phần trăm không được vượt quá 100%']]);
                }
            }

            if (isset($data['code'])) {
                $data['code'] = strtoupper($data['code']);
            }

            // Handle boolean fields for PostgreSQL
            $updateData = $data;
            if (isset($data['is_active'])) {
                $updateData['is_active'] = $data['is_active'] ? DB::raw('true') : DB::raw('false');
            }
            
            // Handle JSON fields
            if (isset($data['applicable_item_types'])) {
                $updateData['applicable_item_types'] = $data['applicable_item_types'] ? json_encode($data['applicable_item_types']) : null;
            }
            if (isset($data['applicable_item_ids'])) {
                $updateData['applicable_item_ids'] = $data['applicable_item_ids'] ? json_encode($data['applicable_item_ids']) : null;
            }
            
            $updateData['updated_by'] = $user->id;
            $updateData['updated_at'] = now();
            
            DB::table('coupons')->where('id', $coupon->id)->update($updateData);
            $coupon->refresh();

            return $this->success([
                'id' => $coupon->id,
                'code' => $coupon->code,
                'name' => $coupon->name,
            ], 'Cập nhật mã giảm giá thành công', $request);

        } catch (\Exception $e) {
            Log::error('Error in admin coupons update: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Delete coupon (Admin only)
     * DELETE /api/admin/coupons/{id}
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return $this->forbidden('Chỉ admin mới có quyền xóa mã giảm giá');
            }

            $coupon = Coupon::find($id);
            if (!$coupon) {
                return $this->notFound('Coupon');
            }

            $coupon->delete();

            return $this->success(null, 'Xóa mã giảm giá thành công', $request);

        } catch (\Exception $e) {
            Log::error('Error in admin coupons destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}

