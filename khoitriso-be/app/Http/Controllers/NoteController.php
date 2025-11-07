<?php

namespace App\Http\Controllers;

use App\Models\LessonNote;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

/**
 * Note Controller
 * Handles lesson notes (user notes for lessons)
 */
class NoteController extends BaseController
{
    /**
     * Get all notes for a lesson
     */
    public function list(int $lessonId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->unauthorized();
            }

            $notes = LessonNote::where('lesson_id', $lessonId)
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return $this->success($notes->toArray());

        } catch (\Exception $e) {
            \Log::error('Error in notes list: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Create a new note
     */
    public function store(int $lessonId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
                'content' => ['required', 'string'],
                'videoTimestamp' => ['nullable', 'integer', 'min:0'],
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
            $noteId = DB::table('lesson_notes')->insertGetId([
                'user_id' => $user->id,
                'lesson_id' => $lessonId,
                'content' => $data['content'],
                'video_timestamp' => $data['videoTimestamp'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $note = LessonNote::find($noteId);

            return $this->success($note);

        } catch (\Exception $e) {
            \Log::error('Error in note store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Update a note
     */
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
                'content' => ['required', 'string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

            $note = LessonNote::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$note) {
                return $this->notFound('Note');
            }

            $note->content = $data['content'];
            $note->save();

            return $this->success($note);

        } catch (\Exception $e) {
            \Log::error('Error in note update: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Delete a note
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->unauthorized();
            }

            $note = LessonNote::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$note) {
                return $this->notFound('Note');
            }

            $note->delete();

            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in note destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
