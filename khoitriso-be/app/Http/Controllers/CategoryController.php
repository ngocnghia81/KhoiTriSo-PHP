<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

/**
 * Category Controller
 */
class CategoryController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Category::query();
            
            if ($request->filled('parentId')) {
                $query->where('parent_id', $request->integer('parentId'));
            }
            
            if (!filter_var($request->query('includeInactive', 'false'), FILTER_VALIDATE_BOOLEAN)) {
                $query->whereRaw('is_active = true');
            }
            
            $categories = $query->orderBy('order_index')->with('children')->get();
            
            return $this->success(['categories' => $categories]);

        } catch (\Exception $e) {
            \Log::error('Error in categories index: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => ['required','string','max:100'],
                'description' => ['required','string'],
                'parentId' => ['nullable','integer','exists:categories,id'],
                'icon' => ['required','string','max:50'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $category = Category::create([
                'name' => $data['name'],
                'description' => $data['description'],
                'parent_id' => $data['parentId'] ?? null,
                'icon' => $data['icon'],
                'is_active' => DB::raw('true'),
            ]);
            
            return $this->success($category);

        } catch (\Exception $e) {
            \Log::error('Error in category store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $cat = Category::with(['children','courses','books'])->find($id);
            
            if (!$cat) {
                return $this->notFound('Category');
            }
            
            return $this->success($cat);

        } catch (\Exception $e) {
            \Log::error('Error in category show: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $cat = Category::find($id);
            
            if (!$cat) {
                return $this->notFound('Category');
            }

            $validator = Validator::make($request->all(), [
                'name' => ['sometimes','string','max:100'],
                'description' => ['sometimes','string'],
                'parentId' => ['nullable','integer','exists:categories,id'],
                'icon' => ['sometimes','string','max:50'],
                'isActive' => ['sometimes','boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $cat->fill([
                'name' => $data['name'] ?? $cat->name,
                'description' => $data['description'] ?? $cat->description,
                'parent_id' => array_key_exists('parentId',$data) ? $data['parentId'] : $cat->parent_id,
                'icon' => $data['icon'] ?? $cat->icon,
                'is_active' => array_key_exists('isActive',$data) ? (bool)$data['isActive'] : $cat->is_active,
            ])->save();
            
            return $this->success($cat);

        } catch (\Exception $e) {
            \Log::error('Error in category update: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $cat = Category::withCount(['children','courses','books'])->find($id);
            
            if (!$cat) {
                return $this->notFound('Category');
            }
            
            if ($cat->children_count > 0 || $cat->courses_count > 0 || $cat->books_count > 0) {
                return $this->error(
                    MessageCode::CATEGORY_NOT_FOUND,
                    'Category has children or content, cannot delete',
                    null,
                    400
                );
            }
            
            $cat->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in category destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
