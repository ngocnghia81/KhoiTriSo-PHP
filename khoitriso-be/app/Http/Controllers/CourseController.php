<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Course Controller
 * Manage courses
 */
class CourseController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Course::with(['instructor:id,name,email', 'category:id,name'])
                ->where('is_active', true);
            
            if ($request->filled('category')) {
                $query->where('category_id', $request->integer('category'));
            }
            if ($request->filled('level')) {
                $query->where('level', $request->integer('level'));
            }
            if ($request->filled('isFree')) {
                $query->where('is_free', filter_var($request->query('isFree'), FILTER_VALIDATE_BOOLEAN));
            }
            if ($search = $request->query('search')) {
                $query->where('title', 'LIKE', "%$search%");
            }
            
            $sortBy = $request->query('sortBy', 'rating');
            $sortOrder = $request->query('sortOrder', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            $page = (int) $request->query('page', 1);
            $limit = max(1, min(100, (int) $request->query('limit', 20)));
            
            $total = $query->count();
            $courses = $query->skip(($page - 1) * $limit)->take($limit)->get();
            
            return $this->paginated($courses->toArray(), $page, $limit, $total);

        } catch (\Exception $e) {
            \Log::error('Error in courses index: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $course = Course::with(['instructor', 'category', 'lessons' => function ($q) {
                $q->orderBy('lesson_order');
            }])->find($id);
            
            if (!$course) {
                return $this->notFound('Course');
            }
            
            return $this->success($course);

        } catch (\Exception $e) {
            \Log::error('Error in course show: ' . $e->getMessage());
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
                'title' => ['required','string','max:200'],
                'description' => ['required','string'],
                'thumbnail' => ['required','string','max:255'],
                'categoryId' => ['required','integer','exists:categories,id'],
                'level' => ['required','integer','in:1,2,3'],
                'isFree' => ['required','boolean'],
                'price' => ['required','numeric','min:0'],
                'staticPagePath' => ['required','string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $course = Course::create([
                'title' => $data['title'],
                'description' => $data['description'],
                'thumbnail' => $data['thumbnail'],
                'category_id' => $data['categoryId'],
                'level' => $data['level'],
                'is_free' => $data['isFree'],
                'price' => $data['price'],
                'static_page_path' => $data['staticPagePath'],
                'instructor_id' => $request->user()->id,
                'approval_status' => 1,
            ]);
            
            return $this->success($course);

        } catch (\Exception $e) {
            \Log::error('Error in course store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $course = Course::find($id);
            
            if (!$course) {
                return $this->notFound('Course');
            }

            $validator = Validator::make($request->all(), [
                'title' => ['sometimes','string','max:200'],
                'description' => ['sometimes','string'],
                'thumbnail' => ['sometimes','string','max:255'],
                'categoryId' => ['sometimes','integer','exists:categories,id'],
                'level' => ['sometimes','integer','in:1,2,3'],
                'isFree' => ['sometimes','boolean'],
                'price' => ['sometimes','numeric','min:0'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $course->fill([
                'title' => $data['title'] ?? $course->title,
                'description' => $data['description'] ?? $course->description,
                'thumbnail' => $data['thumbnail'] ?? $course->thumbnail,
                'category_id' => $data['categoryId'] ?? $course->category_id,
                'level' => $data['level'] ?? $course->level,
                'is_free' => array_key_exists('isFree',$data) ? (bool)$data['isFree'] : $course->is_free,
                'price' => $data['price'] ?? $course->price,
            ])->save();
            
            return $this->success($course);

        } catch (\Exception $e) {
            \Log::error('Error in course update: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $course = Course::find($id);
            
            if (!$course) {
                return $this->notFound('Course');
            }
            
            $course->is_active = false;
            $course->save();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in course destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
