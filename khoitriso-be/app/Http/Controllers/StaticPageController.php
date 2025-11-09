<?php

namespace App\Http\Controllers;

use App\Models\StaticPage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class StaticPageController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = StaticPage::query();
            
            if ($request->filled('search')) {
                $search = $request->query('search');
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%$search%")
                      ->orWhere('slug', 'like', "%$search%");
                });
            }
            
            if ($request->filled('isPublished')) {
                $isPublished = filter_var($request->query('isPublished'), FILTER_VALIDATE_BOOLEAN);
                $query->whereRaw('is_published = ' . ($isPublished ? 'true' : 'false'));
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $query->count();
            $pages = $query->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->orderBy('created_at', 'desc')
                ->get();
            
            return $this->paginated($pages->toArray(), $page, $pageSize, $total);
        } catch (\Exception $e) {
            \Log::error('Error in StaticPageController::index: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'slug' => ['required', 'string', 'max:200', 'unique:static_pages,slug'],
                'title' => ['required', 'string', 'max:200'],
                'metaDescription' => ['nullable', 'string', 'max:500'],
                'metaKeywords' => ['nullable', 'string', 'max:500'],
                'content' => ['required', 'string'],
                'template' => ['nullable', 'string', 'max:50'],
                'isPublished' => ['nullable', 'boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $page = StaticPage::create([
                'slug' => $data['slug'],
                'title' => $data['title'],
                'meta_description' => $data['metaDescription'] ?? null,
                'meta_keywords' => $data['metaKeywords'] ?? null,
                'content' => $data['content'],
                'template' => $data['template'] ?? 'default',
                'is_published' => $data['isPublished'] ?? false,
                'is_active' => true,
            ]);

            return $this->success($page, 201);
        } catch (\Exception $e) {
            \Log::error('Error in StaticPageController::store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $page = StaticPage::find($id);
            
            if (!$page) {
                return $this->notFound('StaticPage');
            }
            
            return $this->success($page);
        } catch (\Exception $e) {
            \Log::error('Error in StaticPageController::show: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function showBySlug(string $slug): JsonResponse
    {
        try {
            $page = StaticPage::where('slug', $slug)
                ->whereRaw('is_published = true')
                ->whereRaw('is_active = true')
                ->first();
            
            if (!$page) {
                return $this->notFound('StaticPage');
            }
            
            // Increment view count
            DB::table('static_pages')
                ->where('id', $page->id)
                ->increment('view_count');
            
            return $this->success($page);
        } catch (\Exception $e) {
            \Log::error('Error in StaticPageController::showBySlug: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $page = StaticPage::find($id);
            
            if (!$page) {
                return $this->notFound('StaticPage');
            }

            $validator = Validator::make($request->all(), [
                'slug' => ['sometimes', 'string', 'max:200', 'unique:static_pages,slug,' . $id],
                'title' => ['sometimes', 'string', 'max:200'],
                'metaDescription' => ['nullable', 'string', 'max:500'],
                'metaKeywords' => ['nullable', 'string', 'max:500'],
                'content' => ['sometimes', 'string'],
                'template' => ['nullable', 'string', 'max:50'],
                'isPublished' => ['nullable', 'boolean'],
                'isActive' => ['nullable', 'boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $page->update([
                'slug' => $data['slug'] ?? $page->slug,
                'title' => $data['title'] ?? $page->title,
                'meta_description' => $data['metaDescription'] ?? $page->meta_description,
                'meta_keywords' => $data['metaKeywords'] ?? $page->meta_keywords,
                'content' => $data['content'] ?? $page->content,
                'template' => $data['template'] ?? $page->template,
                'is_published' => isset($data['isPublished']) ? (bool)$data['isPublished'] : $page->is_published,
                'is_active' => isset($data['isActive']) ? (bool)$data['isActive'] : $page->is_active,
            ]);

            return $this->success($page);
        } catch (\Exception $e) {
            \Log::error('Error in StaticPageController::update: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $page = StaticPage::find($id);
            
            if (!$page) {
                return $this->notFound('StaticPage');
            }
            
            $page->delete();
            
            return $this->success(null);
        } catch (\Exception $e) {
            \Log::error('Error in StaticPageController::destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}

