<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\Assignment;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\UserAssignmentAttempt;
use App\Models\UserAssignmentAnswer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Assignment Controller
 */
class AssignmentController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $q = Assignment::query();
            
            if ($request->filled('courseId')) {
                $q->whereHas('lesson', function ($x) use ($request) {
                    $x->where('course_id', $request->integer('courseId'));
                });
            }
            if ($request->filled('lessonId')) {
                $q->where('lesson_id', $request->integer('lessonId'));
            }
            if ($request->filled('assignmentType')) {
                $q->where('assignment_type', $request->integer('assignmentType'));
            }
            if ($request->filled('isPublished')) {
                $q->where('is_published', filter_var($request->query('isPublished'), FILTER_VALIDATE_BOOLEAN));
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $assignments = $q->orderByDesc('created_at')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();
            
            return $this->paginated($assignments->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in assignments index: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function show(int $id, Request $request): JsonResponse
    {
        try {
            $a = Assignment::find($id);
            
            if (!$a) {
                return $this->notFound('Assignment');
            }
            
            $questions = Question::where('context_type', 1)
                ->where('context_id', $id)
                ->with('options')
                ->orderBy('order_index')
                ->get();
            
            $result = $a->toArray();
            $result['questions'] = $questions;
            
            return $this->success($result);

        } catch (\Exception $e) {
            \Log::error('Error in assignment show: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => ['required','string','max:200'],
                'description' => ['required','string'],
                'lessonId' => ['required','integer','exists:lessons,id'],
                'assignmentType' => ['required','integer','in:1,2,3,4'],
                'maxScore' => ['required','integer','min:1'],
                'timeLimit' => ['nullable','integer','min:1'],
                'maxAttempts' => ['required','integer','min:1'],
                'showAnswersAfter' => ['required','integer','in:1,2,3,4'],
                'dueDate' => ['nullable','date'],
                'isPublished' => ['required','boolean'],
                'passingScore' => ['nullable','numeric','min:0'],
                'shuffleQuestions' => ['required','boolean'],
                'shuffleOptions' => ['required','boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $a = Assignment::create([
                'title' => $data['title'],
                'description' => $data['description'],
                'lesson_id' => $data['lessonId'],
                'assignment_type' => $data['assignmentType'],
                'max_score' => $data['maxScore'],
                'time_limit' => $data['timeLimit'] ?? null,
                'max_attempts' => $data['maxAttempts'],
                'show_answers_after' => $data['showAnswersAfter'],
                'due_date' => $data['dueDate'] ?? null,
                'is_published' => $data['isPublished'],
                'passing_score' => $data['passingScore'] ?? null,
                'shuffle_questions' => $data['shuffleQuestions'],
                'shuffle_options' => $data['shuffleOptions'],
            ]);
            
            return $this->success($a);

        } catch (\Exception $e) {
            \Log::error('Error in assignment store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $a = Assignment::find($id);
            
            if (!$a) {
                return $this->notFound('Assignment');
            }

            $validator = Validator::make($request->all(), [
                'title' => ['sometimes','string','max:200'],
                'description' => ['sometimes','string'],
                'assignmentType' => ['sometimes','integer','in:1,2,3,4'],
                'maxScore' => ['sometimes','integer','min:1'],
                'timeLimit' => ['sometimes','integer','min:1'],
                'maxAttempts' => ['sometimes','integer','min:1'],
                'showAnswersAfter' => ['sometimes','integer','in:1,2,3,4'],
                'dueDate' => ['sometimes','date'],
                'isPublished' => ['sometimes','boolean'],
                'passingScore' => ['sometimes','numeric','min:0'],
                'shuffleQuestions' => ['sometimes','boolean'],
                'shuffleOptions' => ['sometimes','boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $a->fill([
                'title' => $data['title'] ?? $a->title,
                'description' => $data['description'] ?? $a->description,
                'assignment_type' => $data['assignmentType'] ?? $a->assignment_type,
                'max_score' => $data['maxScore'] ?? $a->max_score,
                'time_limit' => $data['timeLimit'] ?? $a->time_limit,
                'max_attempts' => $data['maxAttempts'] ?? $a->max_attempts,
                'show_answers_after' => $data['showAnswersAfter'] ?? $a->show_answers_after,
                'due_date' => $data['dueDate'] ?? $a->due_date,
                'is_published' => array_key_exists('isPublished', $data) ? (bool)$data['isPublished'] : $a->is_published,
                'passing_score' => $data['passingScore'] ?? $a->passing_score,
                'shuffle_questions' => array_key_exists('shuffleQuestions', $data) ? (bool)$data['shuffleQuestions'] : $a->shuffle_questions,
                'shuffle_options' => array_key_exists('shuffleOptions', $data) ? (bool)$data['shuffleOptions'] : $a->shuffle_options,
            ])->save();
            
            return $this->success($a);

        } catch (\Exception $e) {
            \Log::error('Error in assignment update: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        try {
            $a = Assignment::find($id);
            
            if (!$a) {
                return $this->notFound('Assignment');
            }
            
            $a->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in assignment destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function start(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $a = Assignment::find($id);
            
            if (!$a) {
                return $this->notFound('Assignment');
            }
            
            $max = UserAssignmentAttempt::where('assignment_id', $id)
                ->where('user_id', $request->user()->id)
                ->max('attempt_number');
            
            $num = ($max ?? 0) + 1;
            
            if ($a->max_attempts && $num > $a->max_attempts) {
                return $this->error(MessageCode::VALIDATION_ERROR, 'Max attempts reached', null, 400);
            }
            
            $attempt = UserAssignmentAttempt::create([
                'assignment_id' => $id,
                'user_id' => $request->user()->id,
                'attempt_number' => $num,
                'is_completed' => false,
            ]);
            
            return $this->success($attempt);

        } catch (\Exception $e) {
            \Log::error('Error in assignment start: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function submit(int $id, Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'attemptId' => ['required','integer','exists:user_assignment_attempts,id'],
                'answers' => ['required','array','min:1'],
                'answers.*.questionId' => ['required','integer','min:1'],
                'answers.*.optionId' => ['nullable','integer','min:1'],
                'answers.*.answerText' => ['nullable','string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            $attempt = UserAssignmentAttempt::find($data['attemptId']);
            
            if (!$attempt) {
                return $this->notFound('Attempt');
            }
            
            if ($attempt->is_completed) {
                return $this->error(MessageCode::VALIDATION_ERROR, 'Already submitted', null, 400);
            }

            $questions = Question::where('context_type', 1)
                ->where('context_id', $id)
                ->get()
                ->keyBy('id');
            
            $score = 0;
            
            foreach ($data['answers'] as $ans) {
                $qid = $ans['questionId'];
                $q = $questions[$qid] ?? null;
                
                if (!$q) continue;
                
                $isCorrect = null;
                $earned = 0;
                
                if ($q->question_type === 1 || $q->question_type === 2) {
                    $opt = $ans['optionId'] 
                        ? QuestionOption::where('id', $ans['optionId'])->where('question_id', $qid)->first() 
                        : null;
                    $isCorrect = $opt ? (bool) $opt->is_correct : false;
                    $earned = $isCorrect ? (float) ($opt->points_value ?? $q->default_points) : 0;
                } else {
                    // short answer/essay stub: zero or default
                    $earned = (float) $q->default_points;
                    $isCorrect = null;
                }
                
                $score += $earned;
                
                UserAssignmentAnswer::updateOrCreate([
                    'attempt_id' => $attempt->id,
                    'question_id' => $qid,
                ], [
                    'option_id' => $ans['optionId'] ?? null,
                    'answer_text' => $ans['answerText'] ?? null,
                    'is_correct' => $isCorrect,
                    'points_earned' => $earned,
                ]);
            }
            
            $attempt->score = $score;
            $attempt->is_completed = true;
            $attempt->submitted_at = now();
            $attempt->save();

            return $this->success($attempt);

        } catch (\Exception $e) {
            \Log::error('Error in assignment submit: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function attempts(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $res = UserAssignmentAttempt::where('assignment_id', $id)
                ->where('user_id', $request->user()->id)
                ->orderByDesc('started_at')
                ->get();
            
            return $this->success(['attempts' => $res]);

        } catch (\Exception $e) {
            \Log::error('Error in assignment attempts: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
