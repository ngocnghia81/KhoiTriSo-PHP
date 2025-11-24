<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\Assignment;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\UserAssignmentAttempt;
use App\Models\UserAssignmentAnswer;
use App\Models\Notification;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use App\Mail\AssignmentCreated;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;

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
            $assignments = $q->withCount('questions')
                ->orderByDesc('created_at')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get()
                ->map(function ($assignment) {
                    $data = $assignment->toArray();
                    // Add questions_count to response
                    $data['questions_count'] = $assignment->questions_count ?? 0;
                    return $data;
                });
            
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

            // Send notifications to enrolled students
            try {
                $lesson = Lesson::with('course')->find($data['lessonId']);
                if ($lesson && $lesson->course) {
                    // Get all enrolled students for this course
                    $enrollments = CourseEnrollment::where('course_id', $lesson->course->id)
                        ->whereRaw('is_active = true')
                        ->with('user:id,name,email')
                        ->get();

                    // Create notifications for each enrolled student
                    $notifications = [];
                    foreach ($enrollments as $enrollment) {
                        if ($enrollment->user) {
                            $assignmentTypeNames = [
                                1 => 'Quiz',
                                2 => 'Homework',
                                3 => 'Exam',
                                4 => 'Practice',
                            ];
                            $assignmentTypeName = $assignmentTypeNames[$data['assignmentType']] ?? 'Bài tập';

                            $notifications[] = [
                                'user_id' => $enrollment->user->id,
                                'title' => 'Bài tập mới: ' . $a->title,
                                'message' => "Giảng viên đã tạo {$assignmentTypeName} mới cho bài học \"{$lesson->title}\" trong khóa học \"{$lesson->course->title}\"",
                                'type' => 3, // Assignment type
                                'action_url' => "/assignments/{$a->id}",
                                'priority' => 3, // High priority
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }

                    // Bulk insert notifications and send emails
                    if (!empty($notifications)) {
                        Notification::insert($notifications);
                        \Log::info("Sent {$assignmentTypeName} notification to " . count($notifications) . " students for assignment {$a->id}");
                        
                        // Send emails to enrolled students
                        foreach ($enrollments as $enrollment) {
                            if ($enrollment->user && $enrollment->user->email) {
                                try {
                                    Mail::to($enrollment->user->email)->send(
                                        new AssignmentCreated($a, $lesson, $lesson->course, $enrollment->user->name ?? $enrollment->user->email)
                                    );
                                } catch (\Exception $emailError) {
                                    // Log email error but don't fail the process
                                    \Log::error("Error sending assignment email to {$enrollment->user->email}: " . $emailError->getMessage());
                                }
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                // Log error but don't fail the assignment creation
                \Log::error('Error sending assignment notifications: ' . $e->getMessage());
            }
            
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
            
            // Create attempt with proper boolean handling for PostgreSQL
            // Use raw SQL with explicit boolean casting
            $result = DB::selectOne("
                INSERT INTO user_assignment_attempts (
                    assignment_id, user_id, attempt_number, is_completed, created_at, updated_at
                ) VALUES (
                    :assignment_id, :user_id, :attempt_number, false::boolean, :created_at, :updated_at
                ) RETURNING id
            ", [
                'assignment_id' => $id,
                'user_id' => $request->user()->id,
                'attempt_number' => $num,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            $attempt = UserAssignmentAttempt::find($result->id);
            
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
            $azotaPoints = [0.1, 0.25, 0.5, 1.0];
            
            foreach ($data['answers'] as $ans) {
                $qid = $ans['questionId'];
                $q = $questions[$qid] ?? null;
                
                if (!$q) continue;
                
                $isCorrect = null;
                $earned = 0;
                
                if ($q->question_type === 1 || $q->question_type === 2) {
                    $optionId = $ans['optionId'] ?? null;
                    $opt = $optionId 
                        ? QuestionOption::where('id', $optionId)->where('question_id', $qid)->first() 
                        : null;
                    $isCorrect = $opt ? (bool) $opt->is_correct : false;
                    
                    if ($isCorrect) {
                        // Count correct options for this question
                        $correctOptionsCount = QuestionOption::where('question_id', $qid)
                            ->where('is_correct', \DB::raw('true'))
                            ->count();
                        
                        // Calculate points based on correct options count
                        if ($correctOptionsCount === 1) {
                            // Single correct answer: full points
                            $earned = (float) $q->default_points;
                        } elseif ($correctOptionsCount > 1 && $correctOptionsCount <= 4) {
                            // Multiple correct answers: use Azota rule
                            $earned = (float) ($q->default_points * $azotaPoints[$correctOptionsCount - 1]);
                        } else {
                            // More than 4 or edge case: use points_value or default_points
                            $earned = (float) ($opt->points_value ?? $q->default_points);
                        }
                    } else {
                        $earned = 0;
                    }
                } else {
                    // short answer/essay stub: zero or default
                    $earned = (float) $q->default_points;
                    $isCorrect = null;
                }
                
                $score += $earned;
                
                // Use raw SQL for proper PostgreSQL boolean handling
                $existing = DB::table('user_assignment_answers')
                    ->where('attempt_id', $attempt->id)
                    ->where('question_id', $qid)
                    ->first();
                
                $optionId = $ans['optionId'] ?? null;
                $answerText = $ans['answerText'] ?? null;
                
                if ($existing) {
                    // Update existing answer
                    if ($isCorrect !== null) {
                        $isCorrectValue = $isCorrect ? 'true' : 'false';
                        DB::statement("
                            UPDATE user_assignment_answers 
                            SET option_id = :option_id,
                                answer_text = :answer_text,
                                is_correct = {$isCorrectValue}::boolean,
                                points_earned = :points_earned,
                                updated_at = :updated_at
                            WHERE id = :id
                        ", [
                            'id' => $existing->id,
                            'option_id' => $optionId,
                            'answer_text' => $answerText,
                            'points_earned' => $earned,
                            'updated_at' => now(),
                        ]);
                    } else {
                        DB::statement("
                            UPDATE user_assignment_answers 
                            SET option_id = :option_id,
                                answer_text = :answer_text,
                                is_correct = NULL,
                                points_earned = :points_earned,
                                updated_at = :updated_at
                            WHERE id = :id
                        ", [
                            'id' => $existing->id,
                            'option_id' => $optionId,
                            'answer_text' => $answerText,
                            'points_earned' => $earned,
                            'updated_at' => now(),
                        ]);
                    }
                } else {
                    // Insert new answer
                    if ($isCorrect !== null) {
                        $isCorrectValue = $isCorrect ? 'true' : 'false';
                        DB::statement("
                            INSERT INTO user_assignment_answers (
                                attempt_id, question_id, option_id, answer_text, 
                                is_correct, points_earned, created_at, updated_at
                            ) VALUES (
                                :attempt_id, :question_id, :option_id, :answer_text,
                                {$isCorrectValue}::boolean, :points_earned, :created_at, :updated_at
                            )
                        ", [
                            'attempt_id' => $attempt->id,
                            'question_id' => $qid,
                            'option_id' => $optionId,
                            'answer_text' => $answerText,
                            'points_earned' => $earned,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        DB::statement("
                            INSERT INTO user_assignment_answers (
                                attempt_id, question_id, option_id, answer_text, 
                                is_correct, points_earned, created_at, updated_at
                            ) VALUES (
                                :attempt_id, :question_id, :option_id, :answer_text,
                                NULL, :points_earned, :created_at, :updated_at
                            )
                        ", [
                            'attempt_id' => $attempt->id,
                            'question_id' => $qid,
                            'option_id' => $optionId,
                            'answer_text' => $answerText,
                            'points_earned' => $earned,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
            
            // Update attempt with proper boolean handling for PostgreSQL
            DB::statement("
                UPDATE user_assignment_attempts 
                SET score = :score,
                    is_completed = true::boolean,
                    submitted_at = :submitted_at,
                    updated_at = :updated_at
                WHERE id = :id
            ", [
                'id' => $attempt->id,
                'score' => $score,
                'submitted_at' => now(),
                'updated_at' => now(),
            ]);
            
            // Reload attempt to return updated data
            $attempt = UserAssignmentAttempt::find($attempt->id);

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

    /**
     * Create assignment with questions (BatchInsert from Word or Create single question)
     * Implements Azota scoring rules
     * POST /api/assignments/{assignmentId}/questions
     */
    public function createAssignmentQuestions(int $assignmentId, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->unauthorized();
            }

            $assignment = Assignment::find($assignmentId);
            if (!$assignment) {
                return $this->notFound('Assignment');
            }

            // Pre-process request data to filter out empty options
            $requestData = $request->all();
            if (isset($requestData['questions']) && is_array($requestData['questions'])) {
                foreach ($requestData['questions'] as $qIndex => &$question) {
                    if (isset($question['options']) && is_array($question['options'])) {
                        // Filter out options with empty text
                        $question['options'] = array_values(array_filter($question['options'], function($option) {
                            return isset($option['text']) && trim($option['text']) !== '';
                        }));
                    }
                }
                unset($question);
            }
            
            // First validation: basic structure
            $validator = Validator::make($requestData, [
                'questions' => ['required', 'array', 'min:1'],
                'questions.*.content' => ['required', 'string'],
                'questions.*.type' => ['required', 'string', 'in:multiple_choice,essay'],
                'questions.*.options' => ['required_if:questions.*.type,multiple_choice', 'array'],
                'questions.*.options.*.text' => ['required_with:questions.*.options', 'string'],
                'questions.*.options.*.isCorrect' => ['required_with:questions.*.options', 'boolean'],
                'questions.*.explanation' => ['nullable', 'string'],
                'questions.*.correctAnswer' => ['nullable', 'string'],
                'questions.*.solutionVideo' => ['nullable', 'string', 'url'],
                'questions.*.solutionType' => ['nullable', 'string', 'in:text,video,latex'],
                'questions.*.defaultPoints' => ['nullable', 'numeric', 'min:0'], // For BatchInsert
                'isBatchInsert' => ['nullable', 'boolean'], // true for Word import, false for single add
                'replaceExisting' => ['nullable', 'boolean'],
            ]);
            
            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }
            
            // Second validation: check minimum options count after filtering
            foreach ($requestData['questions'] as $qIndex => $question) {
                if (isset($question['type']) && $question['type'] === 'multiple_choice') {
                    $optionsCount = isset($question['options']) && is_array($question['options']) 
                        ? count($question['options']) 
                        : 0;
                    if ($optionsCount < 2) {
                        return $this->validationError([[
                            'field' => "questions.{$qIndex}.options",
                            'messages' => ['Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn hợp lệ (không được để trống)']
                        ]]);
                    }
                }
            }
            
            // Use filtered data
            $data = $requestData;
            $isBatchInsert = isset($data['isBatchInsert']) && $data['isBatchInsert'];
            $replaceExisting = isset($data['replaceExisting']) && filter_var($data['replaceExisting'], FILTER_VALIDATE_BOOLEAN);
            unset($data['replaceExisting']);

            \DB::beginTransaction();

            try {
                // Get existing questions for this assignment
                $existingQuestions = Question::where('context_type', 1)
                    ->where('context_id', $assignmentId)
                    ->get();

                if ($replaceExisting && $existingQuestions->count() > 0) {
                    $questionIds = $existingQuestions->pluck('id');
                    if ($questionIds->count() > 0) {
                        QuestionOption::whereIn('question_id', $questionIds)->delete();
                        Question::whereIn('id', $questionIds)->delete();
                    }
                    $existingQuestions = collect();
                }

                // Azota Points array: [10%, 25%, 50%, 100%]
                $azotaPoints = [0.1, 0.25, 0.5, 1.0];

                // Prepare questions data
                $questionsToCreate = [];
                foreach ($data['questions'] as $index => $questionData) {
                    // Count correct options for True-False calculation
                    $correctOptionsCount = 0;
                    if ($questionData['type'] === 'multiple_choice' && isset($questionData['options'])) {
                        $correctOptionsCount = count(array_filter($questionData['options'], fn($opt) => $opt['isCorrect']));
                    }

                    $questionsToCreate[] = [
                        'data' => $questionData,
                        'correctOptionsCount' => $correctOptionsCount,
                        'defaultPoints' => $questionData['defaultPoints'] ?? null,
                    ];
                }

                // Azota Rule 3 & 4: Check if all questions have or don't have defaultPoints
                $hasDefaultPoints = array_filter($questionsToCreate, fn($q) => $q['defaultPoints'] !== null);
                $allHaveDefaultPoints = count($hasDefaultPoints) === count($questionsToCreate);
                $allDontHaveDefaultPoints = count($hasDefaultPoints) === 0;

                if ($isBatchInsert) {
                    // BatchInsert: All must have or all must not have defaultPoints
                    if (!$allHaveDefaultPoints && !$allDontHaveDefaultPoints) {
                        \DB::rollBack();
                        return $this->validationError([[
                            'field' => 'questions',
                            'messages' => ['Tất cả câu hỏi phải có HOẶC đều không có DefaultPoints']
                        ]]);
                    }

                    if ($allDontHaveDefaultPoints) {
                        // Auto-calculate defaultPoints so total = 10
                        $totalQuestions = count($questionsToCreate) + $existingQuestions->count();
                        if ($totalQuestions > 0) {
                            $defaultPointsPerQuestion = 10.0 / $totalQuestions;
                            foreach ($questionsToCreate as &$q) {
                                $q['defaultPoints'] = $defaultPointsPerQuestion;
                            }
                        }
                    } else {
                        // Check if total = 10
                        $totalPoints = array_sum(array_column($questionsToCreate, 'defaultPoints'));
                        $existingTotal = $existingQuestions->sum('default_points');
                        if (abs($totalPoints + $existingTotal - 10.0) > 0.01) {
                            \DB::rollBack();
                            return $this->validationError([[
                                'field' => 'questions',
                                'messages' => ['Tổng điểm phải bằng 10. Hiện tại: ' . ($totalPoints + $existingTotal)]
                            ]]);
                        }
                    }
                } else {
                    // Create (single question): Ignore defaultPoints input, recalculate all
                    // Remove defaultPoints from input
                    foreach ($questionsToCreate as &$q) {
                        $q['defaultPoints'] = null;
                    }

                    // Recalculate defaultPoints for all questions (existing + new) so total = 10
                    $totalQuestions = count($questionsToCreate) + $existingQuestions->count();
                    if ($totalQuestions > 0) {
                        $defaultPointsPerQuestion = 10.0 / $totalQuestions;
                        
                        // Update existing questions
                        foreach ($existingQuestions as $existingQ) {
                            $existingQ->default_points = $defaultPointsPerQuestion;
                            $existingQ->save();
                        }

                        // Set for new questions
                        foreach ($questionsToCreate as &$q) {
                            $q['defaultPoints'] = $defaultPointsPerQuestion;
                        }
                    }
                }

                // Create questions
                $createdQuestions = [];
                foreach ($questionsToCreate as $index => $qData) {
                    $questionData = $qData['data'];
                    $defaultPoints = $qData['defaultPoints'];
                    $correctOptionsCount = $qData['correctOptionsCount'];

                    // Get next order index
                    $maxOrder = Question::where('context_type', 1)
                        ->where('context_id', $assignmentId)
                        ->max('order_index');
                    $orderIndex = ($maxOrder ?? 0) + 1;

                    // Calculate points array based on correct options count
                    // Azota Points array: [10%, 25%, 50%, 100%] for 1, 2, 3, 4 correct options
                    // True-False: Điểm = DefaultPoints × Points[Số options đúng - 1]
                    $pointsArray = [];
                    for ($i = 0; $i < 4; $i++) {
                        // i = 0 -> 1 correct option -> 10% (azotaPoints[0])
                        // i = 1 -> 2 correct options -> 25% (azotaPoints[1])
                        // i = 2 -> 3 correct options -> 50% (azotaPoints[2])
                        // i = 3 -> 4 correct options -> 100% (azotaPoints[3])
                        if ($correctOptionsCount > 0 && $correctOptionsCount <= 4) {
                            $pointsArray[] = $defaultPoints * $azotaPoints[$correctOptionsCount - 1];
                        } else {
                            // Default to full points if no correct options or more than 4
                            $pointsArray[] = $defaultPoints;
                        }
                    }

                    // Create question
                    $question = Question::create([
                        'context_type' => 1, // assignment
                        'context_id' => $assignmentId,
                        'question_content' => (string) $questionData['content'],
                        'question_type' => $questionData['type'] === 'multiple_choice' ? 1 : 2,
                        'difficulty_level' => 2, // Default medium
                        'points' => json_encode($pointsArray),
                        'default_points' => $defaultPoints,
                        'explanation_content' => $questionData['explanation'] ?? null,
                        'order_index' => $orderIndex,
                        'is_active' => \DB::raw('true'),
                        'created_by' => $user->name ?? $user->email,
                    ]);

                    // Create options for multiple choice
                    if ($questionData['type'] === 'multiple_choice' && isset($questionData['options'])) {
                        foreach ($questionData['options'] as $optIndex => $optionData) {
                            // Calculate points_value based on Azota rule
                            // For correct option: use points from array based on total correct options count
                            $pointsValue = 0.0;
                            if ($optionData['isCorrect']) {
                                // True-False: Điểm = DefaultPoints × Points[Số options đúng - 1]
                                // But if only 1 correct option, give full points (not 10%)
                                if ($correctOptionsCount === 1) {
                                    // Single correct answer: full points
                                    $pointsValue = $defaultPoints;
                                } elseif ($correctOptionsCount > 1 && $correctOptionsCount <= 4) {
                                    // Multiple correct answers: divide points
                                    $pointsValue = $defaultPoints * $azotaPoints[$correctOptionsCount - 1];
                                } else {
                                    // More than 4 or edge case: full points
                                    $pointsValue = $defaultPoints;
                                }
                            }

                            QuestionOption::create([
                                'question_id' => $question->id,
                                'option_content' => (string) $optionData['text'],
                                'is_correct' => \DB::raw($optionData['isCorrect'] ? 'true' : 'false'),
                                'order_index' => $optIndex + 1,
                                'points_value' => $pointsValue,
                                'created_by' => $user->name ?? $user->email,
                            ]);
                        }
                    }

                    $createdQuestions[] = $question;
                }

                \DB::commit();

                return $this->success([
                    'assignment' => $assignment,
                    'questions' => $createdQuestions,
                    'totalQuestions' => $existingQuestions->count() + count($createdQuestions),
                ], 'Tạo câu hỏi thành công', $request);

            } catch (\Exception $e) {
                \DB::rollBack();
                \Log::error('Error in createAssignmentQuestions: ' . $e->getMessage());
                \Log::error('Stack trace: ' . $e->getTraceAsString());
                return $this->internalError();
            }

        } catch (\Exception $e) {
            \Log::error('Error in createAssignmentQuestions: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
