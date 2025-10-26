<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\UserLessonProgress;
use App\Models\UserVideoProgress;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Progress Controller
 */
class ProgressController extends BaseController
{
    public function updateLesson(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
                'watchTime' => ['nullable','integer','min:0'],
                'isCompleted' => ['nullable','boolean'],
                'videoPosition' => ['nullable','integer','min:0'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $ulp = UserLessonProgress::firstOrCreate([
                'user_id' => $request->user()->id,
                'lesson_id' => $id,
            ]);
            
            if (isset($data['watchTime'])) {
                $ulp->watch_time = (int) $data['watchTime'];
            }
            
            if (array_key_exists('isCompleted', $data)) {
                $ulp->is_completed = (bool) $data['isCompleted'];
                $ulp->completed_at = $ulp->is_completed ? now() : null;
            }
            
            $ulp->last_accessed = now();
            $ulp->save();

            if (isset($data['videoPosition'])) {
                $uvp = UserVideoProgress::firstOrCreate([
                    'user_id' => $request->user()->id,
                    'lesson_id' => $id,
                ]);
                $uvp->video_position = (int) $data['videoPosition'];
                $uvp->last_watched_at = now();
                $uvp->save();
            }
            
            return $this->success($ulp);

        } catch (\Exception $e) {
            \Log::error('Error in updateLesson: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function getVideo(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $uvp = UserVideoProgress::where('user_id', $request->user()->id)
                ->where('lesson_id', $id)
                ->first();
            
            return $this->success($uvp);

        } catch (\Exception $e) {
            \Log::error('Error in getVideo: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function updateVideo(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
                'videoPosition' => ['required','integer','min:0'],
                'videoDuration' => ['required','integer','min:1'],
                'watchPercentage' => ['required','numeric','min:0','max:100'],
                'isCompleted' => ['required','boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $uvp = UserVideoProgress::firstOrCreate([
                'user_id' => $request->user()->id,
                'lesson_id' => $id,
            ]);
            
            $uvp->video_position = $data['videoPosition'];
            $uvp->video_duration = $data['videoDuration'];
            $uvp->watch_percentage = $data['watchPercentage'];
            $uvp->is_completed = $data['isCompleted'];
            $uvp->last_watched_at = now();
            $uvp->save();
            
            return $this->success($uvp);

        } catch (\Exception $e) {
            \Log::error('Error in updateVideo: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
