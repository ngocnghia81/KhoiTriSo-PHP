<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Question Controller
 */
class QuestionController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $q = Question::query();
            
            if ($request->filled('contextType')) {
                $q->where('context_type', $request->integer('contextType'));
            }
            if ($request->filled('contextId')) {
                $q->where('context_id', $request->integer('contextId'));
            }
            if ($request->filled('questionType')) {
                $q->where('question_type', $request->integer('questionType'));
            }
            if ($request->filled('difficultyLevel')) {
                $q->where('difficulty_level', $request->integer('difficultyLevel'));
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $questions = $q->orderBy('order_index')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();
            
            return $this->paginated($questions->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in questions index: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
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

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
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
            
            if (!empty($data['options'])) {
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
            
            return $this->success($q);

        } catch (\Exception $e) {
            \Log::error('Error in question store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function show(int $id, Request $request): JsonResponse
    {
        try {
            $q = Question::with('options')->find($id);
            
            if (!$q) {
                return $this->notFound('Question');
            }
            
            return $this->success($q);

        } catch (\Exception $e) {
            \Log::error('Error in question show: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $q = Question::find($id);
            
            if (!$q) {
                return $this->notFound('Question');
            }

            $validator = Validator::make($request->all(), [
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

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
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
            
            return $this->success($q);

        } catch (\Exception $e) {
            \Log::error('Error in question update: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        try {
            $q = Question::find($id);
            
            if (!$q) {
                return $this->notFound('Question');
            }
            
            $q->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in question destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function options(int $id, Request $request): JsonResponse
    {
        try {
            $opts = QuestionOption::where('question_id', $id)
                ->orderBy('order_index')
                ->get();
            
            return $this->success(['options' => $opts]);

        } catch (\Exception $e) {
            \Log::error('Error in question options: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function addOption(int $id, Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'optionContent' => ['required','string'],
                'optionImage' => ['nullable','string'],
                'isCorrect' => ['required','boolean'],
                'orderIndex' => ['nullable','integer','min:0'],
                'pointsValue' => ['nullable','numeric'],
                'explanationText' => ['nullable','string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $opt = QuestionOption::create([
                'question_id' => $id,
                'option_content' => $data['optionContent'],
                'option_image' => $data['optionImage'] ?? null,
                'is_correct' => $data['isCorrect'],
                'order_index' => $data['orderIndex'] ?? 0,
                'points_value' => $data['pointsValue'] ?? null,
                'explanation_text' => $data['explanationText'] ?? null,
            ]);
            
            return $this->success($opt);

        } catch (\Exception $e) {
            \Log::error('Error in addOption: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function updateOption(int $questionId, int $optionId, Request $request): JsonResponse
    {
        try {
            $opt = QuestionOption::where('question_id', $questionId)->find($optionId);
            
            if (!$opt) {
                return $this->notFound('Option');
            }

            $validator = Validator::make($request->all(), [
                'optionContent' => ['sometimes','string'],
                'optionImage' => ['sometimes','string'],
                'isCorrect' => ['sometimes','boolean'],
                'orderIndex' => ['sometimes','integer','min:0'],
                'pointsValue' => ['sometimes','numeric'],
                'explanationText' => ['sometimes','string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $opt->fill([
                'option_content' => $data['optionContent'] ?? $opt->option_content,
                'option_image' => $data['optionImage'] ?? $opt->option_image,
                'is_correct' => array_key_exists('isCorrect', $data) ? (bool)$data['isCorrect'] : $opt->is_correct,
                'order_index' => $data['orderIndex'] ?? $opt->order_index,
                'points_value' => $data['pointsValue'] ?? $opt->points_value,
                'explanation_text' => $data['explanationText'] ?? $opt->explanation_text,
            ])->save();
            
            return $this->success($opt);

        } catch (\Exception $e) {
            \Log::error('Error in updateOption: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function deleteOption(int $questionId, int $optionId, Request $request): JsonResponse
    {
        try {
            $opt = QuestionOption::where('question_id', $questionId)->find($optionId);
            
            if (!$opt) {
                return $this->notFound('Option');
            }
            
            $opt->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in deleteOption: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
