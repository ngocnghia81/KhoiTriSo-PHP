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

    /**
     * Get static page content by path (for courses/books)
     * GET /api/static-pages/by-path?path=...
     */
    public function showByPath(Request $request): JsonResponse
    {
        try {
            $path = $request->query('path');
            
            if (!$path) {
                return $this->validationError([['field' => 'path', 'messages' => ['Path parameter is required']]]);
            }
            
            // Try to find static page by slug matching the path
            $page = StaticPage::where('slug', $path)
                ->orWhere('slug', 'like', "%{$path}%")
                ->whereRaw('is_published = true')
                ->whereRaw('is_active = true')
                ->first();
            
            if (!$page) {
                // If no static page found, try to generate content from course/book
                return $this->generateContentByPath($path);
            }
            
            // Increment view count
            DB::table('static_pages')
                ->where('id', $page->id)
                ->increment('view_count');
            
            return $this->success($page);
        } catch (\Exception $e) {
            \Log::error('Error in StaticPageController::showByPath: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Generate static page content from course/book data
     */
    private function generateContentByPath(string $path): JsonResponse
    {
        try {
            // Check if path matches course pattern
            $course = \App\Models\Course::where('static_page_path', $path)
                ->whereRaw('is_active = true')
                ->with(['instructor', 'category'])
                ->first();
            
            if ($course) {
                return $this->generateCourseStaticPage($course);
            }
            
            // Check if path matches book pattern
            $book = \App\Models\Book::where('static_page_path', $path)
                ->whereRaw('is_active = true')
                ->with(['author', 'category'])
                ->first();
            
            if ($book) {
                return $this->generateBookStaticPage($book);
            }
            
            return $this->notFound('StaticPage');
        } catch (\Exception $e) {
            \Log::error('Error in StaticPageController::generateContentByPath: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Generate static page HTML for course
     */
    private function generateCourseStaticPage($course): JsonResponse
    {
        $siteUrl = config('app.url', 'http://localhost:3000');
        $thumbnail = $course->thumbnail ?: '/images/default-course.jpg';
        $instructorName = isset($course->instructor) && isset($course->instructor->name) ? $course->instructor->name : 'Giảng viên';
        $categoryName = isset($course->category) && isset($course->category->name) ? $course->category->name : 'Khóa học';
        
        $priceText = $course->is_free ? 'Miễn phí' : number_format($course->price, 0, ',', '.') . ' đ';
        $level = isset($course->level) ? $course->level : 1;
        $levelText = $this->getLevelText($level);
        
        $html = <<<HTML
<div class="course-static-page">
    <div class="course-header">
        <h1>{$course->title}</h1>
        <div class="course-meta">
            <span class="category">{$categoryName}</span>
            <span class="level">{$levelText}</span>
            <span class="price">{$priceText}</span>
        </div>
    </div>
    
    <div class="course-content">
        <div class="course-description">
            {$course->description}
        </div>
        
        <div class="course-instructor">
            <h2>Giảng viên</h2>
            <p>{$instructorName}</p>
        </div>
        
        <div class="course-stats">
            <div class="stat-item">
                <strong>Số học viên:</strong> {$course->total_students}
            </div>
            <div class="stat-item">
                <strong>Số bài học:</strong> " . (isset($course->total_lessons) ? $course->total_lessons : 0) . "
            </div>
            <div class="stat-item">
                <strong>Đánh giá:</strong> " . (isset($course->rating) ? $course->rating : 0) . "/5
            </div>
        </div>
    </div>
</div>
HTML;

        $staticPage = [
            'id' => null,
            'slug' => $course->static_page_path,
            'title' => $course->title,
            'meta_description' => strip_tags($course->description),
            'meta_keywords' => "{$course->title}, {$categoryName}, {$levelText}, khóa học online",
            'content' => $html,
            'template' => 'course',
            'is_published' => true,
            'is_active' => true,
            'view_count' => 0,
            'created_at' => $course->created_at,
            'updated_at' => $course->updated_at,
        ];
        
        return $this->success($staticPage);
    }

    /**
     * Generate static page HTML for book
     */
    private function generateBookStaticPage($book): JsonResponse
    {
        $siteUrl = config('app.url', 'http://localhost:3000');
        $coverImage = $book->cover_image ?: '/images/default-book.jpg';
        $authorName = isset($book->author) && isset($book->author->name) ? $book->author->name : 'Tác giả';
        $categoryName = isset($book->category) && isset($book->category->name) ? $book->category->name : 'Sách';
        
        $priceText = number_format($book->price, 0, ',', '.') . ' đ';
        
        $html = <<<HTML
<div class="book-static-page">
    <div class="book-header">
        <h1>{$book->title}</h1>
        <div class="book-meta">
            <span class="category">{$categoryName}</span>
            <span class="author">Tác giả: {$authorName}</span>
            <span class="price">{$priceText}</span>
        </div>
    </div>
    
    <div class="book-content">
        <div class="book-description">
            {$book->description}
        </div>
        
        <div class="book-details">
            <h2>Thông tin sách</h2>
            <ul>
                <li><strong>ISBN:</strong> " . (isset($book->isbn) ? $book->isbn : 'N/A') . "</li>
                <li><strong>Ngôn ngữ:</strong> " . (isset($book->language) ? $book->language : 'Tiếng Việt') . "</li>
                <li><strong>Năm xuất bản:</strong> " . (isset($book->publication_year) ? $book->publication_year : 'N/A') . "</li>
                <li><strong>Phiên bản:</strong> " . (isset($book->edition) ? $book->edition : '1.0') . "</li>
            </ul>
        </div>
        
        <div class="book-stats">
            <div class="stat-item">
                <strong>Số chương:</strong> " . (isset($book->chapters) ? $book->chapters->count() : 0) . "
            </div>
            <div class="stat-item">
                <strong>Số câu hỏi:</strong> " . (isset($book->total_questions) ? $book->total_questions : 0) . "
            </div>
        </div>
    </div>
</div>
HTML;

        $staticPage = [
            'id' => null,
            'slug' => $book->static_page_path,
            'title' => $book->title,
            'meta_description' => strip_tags($book->description),
            'meta_keywords' => "{$book->title}, {$categoryName}, {$authorName}, sách giáo khoa",
            'content' => $html,
            'template' => 'book',
            'is_published' => true,
            'is_active' => true,
            'view_count' => 0,
            'created_at' => $book->created_at,
            'updated_at' => $book->updated_at,
        ];
        
        return $this->success($staticPage);
    }

    /**
     * Get level text from level number
     */
    private function getLevelText(int $level): string
    {
        $levels = [
            1 => 'Lớp 10',
            2 => 'Lớp 11',
            3 => 'Lớp 12',
            4 => 'Đại học',
        ];
        
        return $levels[$level] ?? 'Tất cả';
    }
}

