<?php

namespace App\Http\Controllers;

use App\Models\LiveClass;
use App\Models\LiveClassParticipant;
use Illuminate\Http\Request;

class LiveClassController extends Controller
{
    public function index(Request $request)
    {
        $q = LiveClass::query();
        if ($request->filled('courseId')) $q->where('course_id', $request->integer('courseId'));
        if ($request->filled('status')) $q->where('status', $request->integer('status'));
        if (filter_var($request->query('upcoming', 'false'), FILTER_VALIDATE_BOOLEAN)) $q->where('scheduled_at', '>=', now());
        $res = $q->orderBy('scheduled_at')->paginate((int) $request->query('pageSize', 20));
        return response()->json(['liveClasses' => $res->items(), 'total' => $res->total(), 'hasMore' => $res->hasMorePages()]);
    }

    public function show(int $id)
    {
        $lc = LiveClass::findOrFail($id);
        return response()->json($lc);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
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
        return response()->json(['success' => true, 'liveClass' => $lc], 201);
    }

    public function update(Request $request, int $id)
    {
        $lc = LiveClass::findOrFail($id);
        $data = $request->validate([
            'title' => ['sometimes','string','max:200'],
            'description' => ['sometimes','string'],
            'scheduledAt' => ['sometimes','date'],
            'durationMinutes' => ['sometimes','integer','min:1'],
            'maxParticipants' => ['sometimes','integer','min:1'],
            'status' => ['sometimes','integer','in:1,2,3,4'],
            'chatEnabled' => ['sometimes','boolean'],
            'recordingEnabled' => ['sometimes','boolean'],
        ]);
        $lc->fill([
            'title' => $data['title'] ?? $lc->title,
            'description' => $data['description'] ?? $lc->description,
            'scheduled_at' => $data['scheduledAt'] ?? $lc->scheduled_at,
            'duration_minutes' => $data['durationMinutes'] ?? $lc->duration_minutes,
            'max_participants' => $data['maxParticipants'] ?? $lc->max_participants,
            'status' => $data['status'] ?? $lc->status,
            'chat_enabled' => array_key_exists('chatEnabled',$data) ? (bool)$data['chatEnabled'] : $lc->chat_enabled,
            'recording_enabled' => array_key_exists('recordingEnabled',$data) ? (bool)$data['recordingEnabled'] : $lc->recording_enabled,
        ])->save();
        return response()->json(['success' => true, 'liveClass' => $lc]);
    }

    public function destroy(int $id)
    {
        $lc = LiveClass::findOrFail($id);
        $lc->delete();
        return response()->json(['success' => true, 'message' => 'Live class deleted successfully']);
    }

    public function join(int $id, Request $request)
    {
        $exists = LiveClassParticipant::where('live_class_id', $id)->where('user_id', $request->user()->id)->first();
        if ($exists) return response()->json(['success' => true, 'participant' => $exists]);
        $p = LiveClassParticipant::create([
            'live_class_id' => $id,
            'user_id' => $request->user()->id,
        ]);
        return response()->json(['success' => true, 'participant' => $p]);
    }

    public function leave(int $id, Request $request)
    {
        $data = $request->validate(['attendanceDuration' => ['nullable','integer','min:0']]);
        $p = LiveClassParticipant::where('live_class_id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        $p->attendance_duration = $data['attendanceDuration'] ?? $p->attendance_duration;
        $p->save();
        return response()->json(['success' => true, 'message' => 'Left live class successfully']);
    }
}


