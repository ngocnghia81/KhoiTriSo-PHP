<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\Wishlist;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Wishlist Controller
 */
class WishlistController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $q = Wishlist::where('user_id', $request->user()->id);
            
            if ($request->filled('itemType')) {
                $q->where('item_type', $request->integer('itemType'));
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $items = $q->orderByDesc('created_at')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();
            
            return $this->paginated($items->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in wishlist index: ' . $e->getMessage());
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
                'itemType' => ['required','integer','in:1,2,3'],
                'itemId' => ['required','integer','min:1'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $exists = Wishlist::where('user_id', $request->user()->id)
                ->where('item_type', $data['itemType'])
                ->where('item_id', $data['itemId'])
                ->first();
            
            if ($exists) {
                return $this->success($exists);
            }
            
            $w = Wishlist::create([
                'user_id' => $request->user()->id,
                'item_type' => $data['itemType'],
                'item_id' => $data['itemId'],
            ]);
            
            return $this->success($w);

        } catch (\Exception $e) {
            \Log::error('Error in wishlist store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $w = Wishlist::where('user_id', $request->user()->id)->find($id);
            
            if (!$w) {
                return $this->notFound('Wishlist');
            }
            
            $w->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in wishlist destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function clear(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            Wishlist::where('user_id', $request->user()->id)->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in wishlist clear: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
