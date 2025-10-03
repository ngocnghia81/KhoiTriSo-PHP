<?php

namespace App\Http\Controllers;

use App\Models\UserLessonProgress;
use App\Models\UserVideoProgress;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function updateLesson(int $id, Request $request)
    {
        $data = $request->validate([
            'watchTime' => ['nullable','integer','min:0'],
            'isCompleted' => ['nullable','boolean'],
            'videoPosition' => ['nullable','integer','min:0'],
        ]);
        $ulp = UserLessonProgress::firstOrCreate([
            'user_id' => $request->user()->id,
            'lesson_id' => $id,
        ]);
        if (isset($data['watchTime'])) $ulp->watch_time = (int) $data['watchTime'];
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
        return response()->json(['success' => true, 'progress' => $ulp]);
    }

    public function getVideo(int $id, Request $request)
    {
        $uvp = UserVideoProgress::where('user_id', $request->user()->id)->where('lesson_id', $id)->first();
        return response()->json($uvp);
    }

    public function updateVideo(int $id, Request $request)
    {
        $data = $request->validate([
            'videoPosition' => ['required','integer','min:0'],
            'videoDuration' => ['required','integer','min:1'],
            'watchPercentage' => ['required','numeric','min:0','max:100'],
            'isCompleted' => ['required','boolean'],
        ]);
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
        return response()->json(['success' => true, 'progress' => $uvp]);
    }
}


