<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Review Controller
 */
class ReviewController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $q = Review::query();
            
            if ($request->filled('itemType')) {
                $q->where('item_type', $request->integer('itemType'));
            }
            if ($request->filled('itemId')) {
                $q->where('item_id', $request->integer('itemId'));
            }
            if ($request->filled('rating')) {
                $q->where('rating', $request->integer('rating'));
            }
            
            $sortBy = $request->query('sortBy', 'created_at');
            $sortOrder = $request->query('sortOrder', 'desc');
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $reviews = $q->orderBy($sortBy, $sortOrder)
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();
            
            return $this->paginated($reviews->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in reviews index: ' . $e->getMessage());
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
                'rating' => ['required','integer','min:1','max:5'],
                'reviewTitle' => ['nullable','string','max:200'],
                'reviewContent' => ['nullable','string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $exists = Review::where('user_id', $request->user()->id)
                ->where('item_type', $data['itemType'])
                ->where('item_id', $data['itemId'])
                ->first();
            
            if ($exists) {
                return $this->error(
                    MessageCode::VALIDATION_ERROR,
                    'Already reviewed this item',
                    null,
                    400
                );
            }
            
            $r = Review::create([
                'user_id' => $request->user()->id,
                'item_type' => $data['itemType'],
                'item_id' => $data['itemId'],
                'rating' => $data['rating'],
                'review_title' => $data['reviewTitle'] ?? null,
                'review_content' => $data['reviewContent'] ?? null,
                'is_verified_purchase' => false,
            ]);
            
            return $this->success($r);

        } catch (\Exception $e) {
            \Log::error('Error in review store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function update(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $r = Review::where('user_id', $request->user()->id)->find($id);
            
            if (!$r) {
                return $this->notFound('Review');
            }

            $validator = Validator::make($request->all(), [
                'rating' => ['sometimes','integer','min:1','max:5'],
                'reviewTitle' => ['sometimes','string','max:200'],
                'reviewContent' => ['sometimes','string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $r->fill([
                'rating' => $data['rating'] ?? $r->rating,
                'review_title' => $data['reviewTitle'] ?? $r->review_title,
                'review_content' => $data['reviewContent'] ?? $r->review_content,
            ])->save();
            
            return $this->success($r);

        } catch (\Exception $e) {
            \Log::error('Error in review update: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $r = Review::where('user_id', $request->user()->id)->find($id);
            
            if (!$r) {
                return $this->notFound('Review');
            }
            
            $r->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in review destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function helpful(int $id, Request $request): JsonResponse
    {
        try {
            $r = Review::find($id);
            
            if (!$r) {
                return $this->notFound('Review');
            }
            
            $r->helpful_count = ($r->helpful_count ?? 0) + 1;
            $r->save();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in review helpful: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
