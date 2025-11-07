<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\LessonDiscussion;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

/**
 * Discussion Controller
 */
class DiscussionController extends BaseController
{
    public function list(int $lessonId, Request $request): JsonResponse
    {
        try {
            $q = LessonDiscussion::with(['user:id,name,email,avatar'])
                ->where('lesson_id', $lessonId)
                ->whereNull('parent_id');
            
            $sortBy = $request->query('sortBy', 'created_at');
            $sortOrder = $request->query('sortOrder', 'desc');
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $discussions = $q->orderBy($sortBy, $sortOrder)
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();
            
            return $this->paginated($discussions->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in discussions list: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function store(int $lessonId, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
                'content' => ['required','string'],
                'videoTimestamp' => ['nullable','integer','min:0'],
                'parentId' => ['nullable','integer','min:1'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            // Use raw SQL insert for PostgreSQL boolean compatibility
            $discussionId = DB::table('lesson_discussions')->insertGetId([
                'lesson_id' => $lessonId,
                'user_id' => $request->user()->id,
                'content' => $data['content'],
                'video_timestamp' => $data['videoTimestamp'] ?? null,
                'parent_id' => $data['parentId'] ?? null,
                'is_instructor' => DB::raw('false'), // Default to false for student questions
                'is_hidden' => DB::raw('false'),
                'like_count' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            // Load the created discussion with user relationship
            $d = LessonDiscussion::with('user:id,name,email,avatar')->find($discussionId);
            
            return $this->success($d);

        } catch (\Exception $e) {
            \Log::error('Error in discussion store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'content' => ['required','string']
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $d = LessonDiscussion::find($id);
            
            if (!$d) {
                return $this->notFound('Discussion');
            }
            
            $d->content = $data['content'];
            $d->save();
            
            return $this->success($d);

        } catch (\Exception $e) {
            \Log::error('Error in discussion update: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        try {
            $d = LessonDiscussion::find($id);
            
            if (!$d) {
                return $this->notFound('Discussion');
            }
            
            $d->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in discussion destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function like(int $id, Request $request): JsonResponse
    {
        try {
            $d = LessonDiscussion::find($id);
            
            if (!$d) {
                return $this->notFound('Discussion');
            }
            
            $d->like_count = ($d->like_count ?? 0) + 1;
            $d->save();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in discussion like: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function replies(int $id, Request $request): JsonResponse
    {
        try {
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 10);
            
            $q = LessonDiscussion::where('parent_id', $id);
            $total = $q->count();
            $replies = $q->orderBy('created_at', 'desc')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();
            
            return $this->paginated($replies->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in discussion replies: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function reply(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
                'content' => ['required','string']
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $parent = LessonDiscussion::find($id);
            
            if (!$parent) {
                return $this->notFound('Discussion');
            }
            
            $r = LessonDiscussion::create([
                'lesson_id' => $parent->lesson_id,
                'user_id' => $request->user()->id,
                'parent_id' => $id,
                'content' => $data['content'],
            ]);
            
            return $this->success($r);

        } catch (\Exception $e) {
            \Log::error('Error in discussion reply: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
