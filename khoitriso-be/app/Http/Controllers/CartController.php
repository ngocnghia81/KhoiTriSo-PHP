<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Cart Controller
 */
class CartController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $items = CartItem::where('user_id', $request->user()->id)->get();
            
            return $this->success([
                'cartItems' => $items,
                'totalItems' => $items->count()
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in cart index: ' . $e->getMessage());
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
                'itemId' => ['required','integer','min:1'],
                'itemType' => ['required','integer','in:1,2,3'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $existing = CartItem::where('user_id', $request->user()->id)
                ->where('item_id', $data['itemId'])
                ->where('item_type', $data['itemType'])
                ->first();
            
            if ($existing) {
                return $this->error(
                    MessageCode::CART_ITEM_EXISTS,
                    null,
                    null,
                    400
                );
            }
            
            $item = CartItem::create([
                'user_id' => $request->user()->id,
                'item_id' => $data['itemId'],
                'item_type' => $data['itemType'],
            ]);
            
            return $this->success($item);

        } catch (\Exception $e) {
            \Log::error('Error in cart store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $item = CartItem::where('user_id', $request->user()->id)
                ->where('id', $id)
                ->first();
            
            if (!$item) {
                return $this->notFound('CartItem');
            }
            
            $item->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in cart destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function clear(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            CartItem::where('user_id', $request->user()->id)->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in cart clear: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
