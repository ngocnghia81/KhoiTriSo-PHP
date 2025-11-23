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

            $validator = Validator::make($request->all(), [
                'questions' => ['required', 'array', 'min:1'],
                'questions.*.content' => ['required', 'string'],
                'questions.*.type' => ['required', 'string', 'in:multiple_choice,essay'],
                'questions.*.options' => ['required_if:questions.*.type,multiple_choice', 'array', 'min:2'],
                'questions.*.options.*.text' => ['required_with:questions.*.options', 'string'],
                'questions.*.options.*.isCorrect' => ['required_with:questions.*.options', 'boolean'],
                'questions.*.explanation' => ['nullable', 'string'],
                'questions.*.correctAnswer' => ['nullable', 'string'],
                'questions.*.solutionVideo' => ['nullable', 'string', 'url'],
                'questions.*.solutionType' => ['nullable', 'string', 'in:text,video,latex'],
                'questions.*.defaultPoints' => ['nullable', 'numeric', 'min:0'], // For BatchInsert
                'isBatchInsert' => ['nullable', 'boolean'], // true for Word import, false for single add
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            $isBatchInsert = $data['isBatchInsert'] ?? false;

            \DB::beginTransaction();

            try {
                // Get existing questions for this assignment
                $existingQuestions = Question::where('context_type', 1)
                    ->where('context_id', $assignmentId)
                    ->get();

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
                                if ($correctOptionsCount > 0 && $correctOptionsCount <= 4) {
                                    $pointsValue = $defaultPoints * $azotaPoints[$correctOptionsCount - 1];
                                } else {
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
