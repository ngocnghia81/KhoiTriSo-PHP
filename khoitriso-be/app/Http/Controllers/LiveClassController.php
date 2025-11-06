<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\LiveClass;
use App\Models\LiveClassParticipant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Live Class Controller
 */
class LiveClassController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $q = LiveClass::query();
            
            if ($request->filled('courseId')) {
                $q->where('course_id', $request->integer('courseId'));
            }
            if ($request->filled('status')) {
                $q->where('status', $request->integer('status'));
            }
            if (filter_var($request->query('upcoming', 'false'), FILTER_VALIDATE_BOOLEAN)) {
                $q->where('scheduled_at', '>=', now());
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $liveClasses = $q->orderBy('scheduled_at')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();
            
            return $this->paginated($liveClasses->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in liveClasses index: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function show(int $id, Request $request): JsonResponse
    {
        try {
            $lc = LiveClass::find($id);
            
            if (!$lc) {
                return $this->notFound('Live class');
            }
            
            return $this->success($lc);

        } catch (\Exception $e) {
            \Log::error('Error in liveClass show: ' . $e->getMessage());
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
                'courseId' => ['required','integer','exists:courses,id'],
                'title' => ['required','string','max:200'],
                'description' => ['required','string'],
                'scheduledAt' => ['required','date'],
                'durationMinutes' => ['required','integer','min:1'],
                'maxParticipants' => ['nullable','integer','min:1'],
                'meetingUrl' => ['required','string','max:500'],
                'meetingId' => ['required','string','max:100'],
                'meetingPassword' => ['nullable','string','max:50'],
                'chatEnabled' => ['nullable','boolean'],
                'recordingEnabled' => ['nullable','boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $lc = LiveClass::create([
                'course_id' => $data['courseId'],
                'instructor_id' => $request->user()->id,
                'title' => $data['title'],
                'description' => $data['description'],
                'scheduled_at' => $data['scheduledAt'],
                'duration_minutes' => $data['durationMinutes'],
                'max_participants' => $data['maxParticipants'] ?? null,
                'meeting_url' => $data['meetingUrl'],
                'meeting_id' => $data['meetingId'],
                'meeting_password' => $data['meetingPassword'] ?? null,
                'status' => 1,
                'chat_enabled' => (bool) ($data['chatEnabled'] ?? true),
                'recording_enabled' => (bool) ($data['recordingEnabled'] ?? true),
            ]);
            
            return $this->success($lc);

        } catch (\Exception $e) {
            \Log::error('Error in liveClass store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $lc = LiveClass::find($id);
            
            if (!$lc) {
                return $this->notFound('Live class');
            }

            $validator = Validator::make($request->all(), [
                'title' => ['sometimes','string','max:200'],
                'description' => ['sometimes','string'],
                'scheduledAt' => ['sometimes','date'],
                'durationMinutes' => ['sometimes','integer','min:1'],
                'maxParticipants' => ['sometimes','integer','min:1'],
                'status' => ['sometimes','integer','in:1,2,3,4'],
                'chatEnabled' => ['sometimes','boolean'],
                'recordingEnabled' => ['sometimes','boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $lc->fill([
                'title' => $data['title'] ?? $lc->title,
                'description' => $data['description'] ?? $lc->description,
                'scheduled_at' => $data['scheduledAt'] ?? $lc->scheduled_at,
                'duration_minutes' => $data['durationMinutes'] ?? $lc->duration_minutes,
                'max_participants' => $data['maxParticipants'] ?? $lc->max_participants,
                'status' => $data['status'] ?? $lc->status,
                'chat_enabled' => array_key_exists('chatEnabled', $data) ? (bool)$data['chatEnabled'] : $lc->chat_enabled,
                'recording_enabled' => array_key_exists('recordingEnabled', $data) ? (bool)$data['recordingEnabled'] : $lc->recording_enabled,
            ])->save();
            
            return $this->success($lc);

        } catch (\Exception $e) {
            \Log::error('Error in liveClass update: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        try {
            $lc = LiveClass::find($id);
            
            if (!$lc) {
                return $this->notFound('Live class');
            }
            
            $lc->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in liveClass destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function join(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $exists = LiveClassParticipant::where('live_class_id', $id)
                ->where('user_id', $request->user()->id)
                ->first();
            
            if ($exists) {
                return $this->success(['participant' => $exists]);
            }
            
            $p = LiveClassParticipant::create([
                'live_class_id' => $id,
                'user_id' => $request->user()->id,
            ]);
            
            return $this->success(['participant' => $p]);

        } catch (\Exception $e) {
            \Log::error('Error in liveClass join: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function leave(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
                'attendanceDuration' => ['nullable','integer','min:0']
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $p = LiveClassParticipant::where('live_class_id', $id)
                ->where('user_id', $request->user()->id)
                ->first();
            
            if (!$p) {
                return $this->notFound('Participant');
            }
            
            $p->attendance_duration = $data['attendanceDuration'] ?? $p->attendance_duration;
            $p->save();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in liveClass leave: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
