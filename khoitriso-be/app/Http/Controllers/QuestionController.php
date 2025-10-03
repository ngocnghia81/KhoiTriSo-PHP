<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function index(Request $request)
    {
        $q = Question::query();
        if ($request->filled('contextType')) $q->where('context_type', $request->integer('contextType'));
        if ($request->filled('contextId')) $q->where('context_id', $request->integer('contextId'));
        if ($request->filled('questionType')) $q->where('question_type', $request->integer('questionType'));
        if ($request->filled('difficultyLevel')) $q->where('difficulty_level', $request->integer('difficultyLevel'));
        $res = $q->orderBy('order_index')->paginate((int) $request->query('pageSize', 20));
        return response()->json(['questions' => $res->items(), 'total' => $res->total(), 'hasMore' => $res->hasMorePages()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'contextType' => ['required','integer','in:1,2,3,4'],
            'contextId' => ['required','integer','min:1'],
            'questionContent' => ['required','string'],
            'questionType' => ['required','integer','in:1,2,3,4'],
            'difficultyLevel' => ['required','integer','in:1,2,3'],
            'points' => ['required','array','min:1'],
            'defaultPoints' => ['required','numeric','min:0'],
            'explanationContent' => ['nullable','string'],
            'questionImage' => ['nullable','string'],
            'videoUrl' => ['nullable','string'],
            'timeLimit' => ['nullable','integer','min:1'],
            'subjectType' => ['nullable','string','max:50'],
            'orderIndex' => ['nullable','integer','min:0'],
            'options' => ['nullable','array'],
        ]);
        $q = Question::create([
            'context_type' => $data['contextType'],
            'context_id' => $data['contextId'],
            'question_content' => $data['questionContent'],
            'question_type' => $data['questionType'],
            'difficulty_level' => $data['difficultyLevel'],
            'points' => $data['points'],
            'default_points' => $data['defaultPoints'],
            'explanation_content' => $data['explanationContent'] ?? null,
            'question_image' => $data['questionImage'] ?? null,
            'video_url' => $data['videoUrl'] ?? null,
            'time_limit' => $data['timeLimit'] ?? null,
            'subject_type' => $data['subjectType'] ?? null,
            'order_index' => $data['orderIndex'] ?? 0,
        ]);
        if (! empty($data['options'])) {
            foreach ($data['options'] as $opt) {
                QuestionOption::create([
                    'question_id' => $q->id,
                    'option_content' => $opt['optionContent'] ?? '',
                    'option_image' => $opt['optionImage'] ?? null,
                    'is_correct' => (bool) ($opt['isCorrect'] ?? false),
                    'order_index' => (int) ($opt['orderIndex'] ?? 0),
                    'points_value' => $opt['pointsValue'] ?? null,
                    'explanation_text' => $opt['explanationText'] ?? null,
                ]);
            }
        }
        return response()->json(['success' => true, 'question' => $q], 201);
    }

    public function show(int $id)
    {
        $q = Question::with('options')->findOrFail($id);
        return response()->json($q);
    }

    public function update(Request $request, int $id)
    {
        $q = Question::findOrFail($id);
        $data = $request->validate([
            'questionContent' => ['sometimes','string'],
            'questionType' => ['sometimes','integer','in:1,2,3,4'],
            'difficultyLevel' => ['sometimes','integer','in:1,2,3'],
            'points' => ['sometimes','array','min:1'],
            'defaultPoints' => ['sometimes','numeric','min:0'],
            'explanationContent' => ['sometimes','string'],
            'questionImage' => ['sometimes','string'],
            'videoUrl' => ['sometimes','string'],
            'timeLimit' => ['sometimes','integer','min:1'],
            'subjectType' => ['sometimes','string','max:50'],
            'orderIndex' => ['sometimes','integer','min:0'],
        ]);
        $q->fill([
            'question_content' => $data['questionContent'] ?? $q->question_content,
            'question_type' => $data['questionType'] ?? $q->question_type,
            'difficulty_level' => $data['difficultyLevel'] ?? $q->difficulty_level,
            'points' => $data['points'] ?? $q->points,
            'default_points' => $data['defaultPoints'] ?? $q->default_points,
            'explanation_content' => $data['explanationContent'] ?? $q->explanation_content,
            'question_image' => $data['questionImage'] ?? $q->question_image,
            'video_url' => $data['videoUrl'] ?? $q->video_url,
            'time_limit' => $data['timeLimit'] ?? $q->time_limit,
            'subject_type' => $data['subjectType'] ?? $q->subject_type,
            'order_index' => $data['orderIndex'] ?? $q->order_index,
        ])->save();
        return response()->json(['success' => true, 'question' => $q]);
    }

    public function destroy(int $id)
    {
        $q = Question::findOrFail($id);
        $q->delete();
        return response()->json(['success' => true, 'message' => 'Question deleted successfully']);
    }

    public function options(int $id)
    {
        $opts = QuestionOption::where('question_id', $id)->orderBy('order_index')->get();
        return response()->json(['options' => $opts]);
    }

    public function addOption(int $id, Request $request)
    {
        $data = $request->validate([
            'optionContent' => ['required','string'],
            'optionImage' => ['nullable','string'],
            'isCorrect' => ['required','boolean'],
            'orderIndex' => ['nullable','integer','min:0'],
            'pointsValue' => ['nullable','numeric'],
            'explanationText' => ['nullable','string'],
        ]);
        $opt = QuestionOption::create([
            'question_id' => $id,
            'option_content' => $data['optionContent'],
            'option_image' => $data['optionImage'] ?? null,
            'is_correct' => $data['isCorrect'],
            'order_index' => $data['orderIndex'] ?? 0,
            'points_value' => $data['pointsValue'] ?? null,
            'explanation_text' => $data['explanationText'] ?? null,
        ]);
        return response()->json(['success' => true, 'option' => $opt], 201);
    }

    public function updateOption(int $questionId, int $optionId, Request $request)
    {
        $opt = QuestionOption::where('question_id', $questionId)->findOrFail($optionId);
        $data = $request->validate([
            'optionContent' => ['sometimes','string'],
            'optionImage' => ['sometimes','string'],
            'isCorrect' => ['sometimes','boolean'],
            'orderIndex' => ['sometimes','integer','min:0'],
            'pointsValue' => ['sometimes','numeric'],
            'explanationText' => ['sometimes','string'],
        ]);
        $opt->fill([
            'option_content' => $data['optionContent'] ?? $opt->option_content,
            'option_image' => $data['optionImage'] ?? $opt->option_image,
            'is_correct' => array_key_exists('isCorrect',$data) ? (bool)$data['isCorrect'] : $opt->is_correct,
            'order_index' => $data['orderIndex'] ?? $opt->order_index,
            'points_value' => $data['pointsValue'] ?? $opt->points_value,
            'explanation_text' => $data['explanationText'] ?? $opt->explanation_text,
        ])->save();
        return response()->json(['success' => true, 'option' => $opt]);
    }

    public function deleteOption(int $questionId, int $optionId)
    {
        $opt = QuestionOption::where('question_id', $questionId)->findOrFail($optionId);
        $opt->delete();
        return response()->json(['success' => true, 'message' => 'Option deleted successfully']);
    }
}


