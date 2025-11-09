<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\LiveClass;
use App\Models\LiveClassParticipant;
use App\Models\CourseEnrollment;
use App\Models\Notification;
use App\Models\Course;
use App\Mail\LiveClassScheduled;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
            $liveClasses = $q->with(['course:id,title'])
                ->orderBy('scheduled_at')
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
            $lc = LiveClass::with(['course:id,title'])->find($id);
            
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
            
            DB::beginTransaction();
            try {
                // Use raw SQL for PostgreSQL boolean compatibility
                $chatEnabled = filter_var($data['chatEnabled'] ?? true, FILTER_VALIDATE_BOOLEAN);
                $recordingEnabled = filter_var($data['recordingEnabled'] ?? true, FILTER_VALIDATE_BOOLEAN);
                
                $lcId = DB::selectOne("
                    INSERT INTO live_classes (
                        course_id, instructor_id, title, description, scheduled_at,
                        duration_minutes, max_participants, meeting_url, meeting_id,
                        meeting_password, status, chat_enabled, recording_enabled,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::boolean, ?::boolean, ?, ?)
                    RETURNING id
                ", [
                    $data['courseId'],
                    $request->user()->id,
                    $data['title'],
                    $data['description'],
                    $data['scheduledAt'],
                    $data['durationMinutes'],
                    $data['maxParticipants'] ?? null,
                    $data['meetingUrl'],
                    $data['meetingId'],
                    $data['meetingPassword'] ?? null,
                    1,
                    $chatEnabled,
                    $recordingEnabled,
                    now(),
                    now(),
                ])->id;
                
                $lc = LiveClass::find($lcId);
                
                // Get course and enrolled students
                $course = Course::find($data['courseId']);
                $enrollments = CourseEnrollment::where('course_id', $data['courseId'])
                    ->whereRaw('is_active = true')
                    ->with('user')
                    ->get();
                
                $scheduledAt = \Carbon\Carbon::parse($data['scheduledAt']);
                $formattedDate = $scheduledAt->format('d/m/Y');
                $formattedTime = $scheduledAt->format('H:i');
                
                // Send notifications and emails to all enrolled students
                foreach ($enrollments as $enrollment) {
                    $user = $enrollment->user;
                    if (!$user) continue;
                    
                    // Create notification using raw SQL for PostgreSQL boolean compatibility
                    try {
                        DB::statement("
                            INSERT INTO notifications (user_id, title, message, type, action_url, priority, is_read, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, false::boolean, ?, ?)
                        ", [
                            $user->id,
                            "Lớp học trực tuyến: {$lc->title}",
                            "Lớp học trực tuyến '{$lc->title}' của khóa học '{$course->title}' sẽ diễn ra vào {$formattedDate} lúc {$formattedTime}. Vui lòng chuẩn bị sẵn sàng!",
                            3, // Live class type
                            "/live-classes/{$lc->id}",
                            2, // Medium priority
                            now(),
                            now(),
                        ]);
                    } catch (\Exception $e) {
                        Log::error("Failed to create notification for user {$user->id}: " . $e->getMessage());
                    }
                    
                    // Send email
                    try {
                        Mail::to($user->email)->send(new LiveClassScheduled(
                            $lc,
                            $course,
                            $user->name
                        ));
                    } catch (\Exception $e) {
                        Log::error("Failed to send email to {$user->email}: " . $e->getMessage());
                    }
                }
                
                DB::commit();
                
                Log::info('Live class created and notifications sent', [
                    'live_class_id' => $lc->id,
                    'course_id' => $data['courseId'],
                    'enrollments_count' => $enrollments->count(),
                ]);
                
                return $this->success($lc);
                
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Error creating live class: ' . $e->getMessage());
                throw $e;
            }

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
                'courseId' => ['sometimes','integer','exists:courses,id'],
                'title' => ['sometimes','string','max:200'],
                'description' => ['sometimes','string'],
                'scheduledAt' => ['sometimes','date'],
                'durationMinutes' => ['sometimes','integer','min:1'],
                'maxParticipants' => ['sometimes','integer','min:1'],
                'status' => ['sometimes','integer','in:1,2,3,4'],
                'meetingUrl' => ['sometimes','string','max:500'],
                'meetingId' => ['sometimes','string','max:100'],
                'meetingPassword' => ['sometimes','string','max:50'],
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
            
            // Build update data with PostgreSQL boolean compatibility
            $updateData = [
                'title' => $data['title'] ?? $lc->title,
                'description' => $data['description'] ?? $lc->description,
                'scheduled_at' => isset($data['scheduledAt']) ? $data['scheduledAt'] : $lc->scheduled_at,
                'duration_minutes' => $data['durationMinutes'] ?? $lc->duration_minutes,
                'max_participants' => $data['maxParticipants'] ?? $lc->max_participants,
                'status' => $data['status'] ?? $lc->status,
                'updated_at' => now(),
            ];
            
            // Handle boolean fields separately for PostgreSQL
            if (array_key_exists('chatEnabled', $data)) {
                $chatEnabled = filter_var($data['chatEnabled'], FILTER_VALIDATE_BOOLEAN);
                DB::statement('UPDATE live_classes SET chat_enabled = ?::boolean WHERE id = ?', [$chatEnabled, $lc->id]);
            }
            
            if (array_key_exists('recordingEnabled', $data)) {
                $recordingEnabled = filter_var($data['recordingEnabled'], FILTER_VALIDATE_BOOLEAN);
                DB::statement('UPDATE live_classes SET recording_enabled = ?::boolean WHERE id = ?', [$recordingEnabled, $lc->id]);
            }
            
            if (isset($data['courseId'])) {
                $updateData['course_id'] = $data['courseId'];
            }
            if (isset($data['meetingUrl'])) {
                $updateData['meeting_url'] = $data['meetingUrl'];
            }
            if (isset($data['meetingId'])) {
                $updateData['meeting_id'] = $data['meetingId'];
            }
            if (isset($data['meetingPassword'])) {
                $updateData['meeting_password'] = $data['meetingPassword'];
            }
            
            $lc->fill($updateData)->save();
            
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
