<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonMaterial;
use App\Models\Assignment;
use App\Models\Question;
use App\Models\QuestionOption;

class CompleteCourseContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding complete course content...');
        
        // Get all courses
        $courses = Course::all();
        
        foreach ($courses as $course) {
            $this->command->info("Creating content for: {$course->title}");
            $this->createCourseContent($course);
        }
        
        $this->command->info('Complete course content seeded successfully!');
    }
    
    private function createCourseContent(Course $course)
    {
        // Create 8-12 lessons per course
        $lessonCount = rand(8, 12);
        
        for ($i = 1; $i <= $lessonCount; $i++) {
            $lesson = $this->createLesson($course, $i);
            
            // Add materials to lesson (2-4 materials each)
            $materialCount = rand(2, 4);
            for ($j = 1; $j <= $materialCount; $j++) {
                $this->createLessonMaterial($lesson, $j);
            }
            
            // Add assignment every 3 lessons
            if ($i % 3 == 0) {
                $this->createAssignment($course, $lesson, $i / 3);
            }
        }
        
        // Update total lessons count
        $course->update(['total_lessons' => $lessonCount]);
    }
    
    private function createLesson(Course $course, int $index): Lesson
    {
        $titles = [
            1 => "Giới thiệu và kiến thức cơ bản",
            2 => "Các khái niệm quan trọng",
            3 => "Phương pháp giải bài tập",
            4 => "Bài tập thực hành cơ bản",
            5 => "Nâng cao kiến thức chuyên sâu",
            6 => "Các dạng bài tập nâng cao",
            7 => "Ứng dụng thực tế",
            8 => "Bài tập tổng hợp",
            9 => "Đề thi thử và lời giải",
            10 => "Tips & Tricks",
            11 => "Chuyên đề nâng cao",
            12 => "Tổng kết và ôn tập",
        ];
        
        $lesson = Lesson::create([
            'course_id' => $course->id,
            'title' => "Bài {$index}: " . ($titles[$index] ?? "Chuyên đề {$index}"),
            'description' => "Nội dung chi tiết của bài học {$index}, giúp học viên nắm vững kiến thức và kỹ năng cần thiết.",
            'lesson_order' => $index,
            'video_url' => "https://www.youtube.com/watch?v=S_YGYXtxJCs",
            'video_duration' => rand(15, 60), // 15-60 minutes
            'content_text' => $this->generateLessonContent($index),
            'static_page_path' => "/lessons/course-{$course->id}/lesson-{$index}.html",
            'is_free' => $index <= 2, // First 2 lessons are free
            'is_published' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        return $lesson;
    }
    
    private function createLessonMaterial(Lesson $lesson, int $index): LessonMaterial
    {
        $types = ['pdf', 'docx', 'pptx', 'xlsx', 'mp4'];
        $type = $types[array_rand($types)];
        
        $titles = [
            'pdf' => 'Tài liệu học tập PDF',
            'docx' => 'Bài giảng chi tiết',
            'pptx' => 'Slide bài giảng',
            'xlsx' => 'Bảng tính mẫu',
            'mp4' => 'Video bổ trợ',
        ];
        
        $fileName = "lesson-{$lesson->id}-material-{$index}.{$type}";
        
        return LessonMaterial::create([
            'lesson_id' => $lesson->id,
            'title' => $titles[$type] . " {$index}",
            'file_name' => $fileName,
            'file_path' => "/materials/{$fileName}",
            'file_type' => $type,
            'file_size' => rand(500000, 5000000),
            'download_count' => rand(0, 500),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
    
    private function createAssignment(Course $course, Lesson $lesson, int $assignmentNumber): Assignment
    {
        $assignment = Assignment::create([
            'lesson_id' => $lesson->id,
            'title' => "Bài kiểm tra {$assignmentNumber}: " . substr($lesson->title, 0, 50),
            'description' => "Kiểm tra kiến thức đã học qua các bài trước. Hoàn thành bài kiểm tra để đánh giá mức độ nắm vững của bạn.",
            'assignment_type' => 1, // 1=quiz, 2=assignment, 3=exam
            'max_score' => 100,
            'time_limit' => 30, // 30 minutes
            'max_attempts' => 3,
            'show_answers_after' => 1, // 1=immediately, 2=after due date, 3=never
            'passing_score' => 70.0,
            'is_published' => true,
            'shuffle_questions' => true,
            'shuffle_options' => true,
            'due_date' => now()->addDays(30),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Create 10 questions for this assignment
        for ($i = 1; $i <= 10; $i++) {
            $this->createQuestion($assignment, $i);
        }
        
        return $assignment;
    }
    
    private function createQuestion(Assignment $assignment, int $index): Question
    {
        $types = [1, 2, 1]; // 1=multiple choice, 2=true/false, 3=short answer
        $type = $types[array_rand($types)];
        
        $difficulties = [1, 2, 3]; // 1=easy, 2=medium, 3=hard
        $difficulty = $difficulties[array_rand($difficulties)];
        
        $questions = [
            "Theo định lý được học, kết quả nào sau đây là chính xác?",
            "Phương pháp nào được sử dụng để giải bài toán này?",
            "Đâu là công thức đúng cho trường hợp này?",
            "Khẳng định nào dưới đây là đúng?",
            "Kết quả của phép tính sau là bao nhiêu?",
            "Trong các đáp án sau, đâu là đáp án chính xác nhất?",
            "Theo như đã học, nhận định nào là sai?",
            "Ứng dụng nào sau đây là phù hợp nhất?",
            "Điều kiện cần và đủ trong trường hợp này là gì?",
            "Cách giải nào sau đây là hiệu quả nhất?",
        ];
        
        $question = Question::create([
            'context_type' => 1, // 1=assignment, 2=lesson, 3=practice
            'context_id' => $assignment->id,
            'question_content' => "Câu {$index}: " . $questions[array_rand($questions)],
            'question_type' => $type,
            'difficulty_level' => $difficulty,
            'points' => json_encode(['min' => 0, 'max' => 10]),
            'default_points' => 10.0,
            'explanation_content' => "Giải thích chi tiết: Dựa vào lý thuyết đã học và các công thức cơ bản, chúng ta có thể suy ra đáp án chính xác.",
            'order_index' => $index,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Create options for the question
        if ($type === 2) { // true/false
            $this->createQuestionOption($question, 1, "Đúng", true);
            $this->createQuestionOption($question, 2, "Sai", false);
        } else { // Multiple choice - 4 options
            $correctOption = rand(1, 4);
            $options = ["A", "B", "C", "D"];
            
            for ($i = 1; $i <= 4; $i++) {
                $this->createQuestionOption(
                    $question, 
                    $i, 
                    "Đáp án {$options[$i-1]}: " . $this->generateOptionText(),
                    $i === $correctOption
                );
            }
        }
        
        return $question;
    }
    
    private function createQuestionOption(Question $question, int $index, string $text, bool $isCorrect): QuestionOption
    {
        return QuestionOption::create([
            'question_id' => $question->id,
            'option_content' => $text,
            'is_correct' => $isCorrect,
            'order_index' => $index,
            'points_value' => $isCorrect ? 10.0 : 0.0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
    
    private function generateLessonContent(int $index): string
    {
        $topics = [
            'kiến thức nền tảng và khái niệm cơ bản',
            'phương pháp giải bài tập hiệu quả', 
            'kỹ thuật nâng cao và ứng dụng thực tế',
            'phân tích chuyên sâu và tư duy logic',
            'tổng hợp kiến thức và thực hành'
        ];
        
        $examples = [
            'định lý cơ bản, công thức quan trọng',
            'các dạng bài điển hình và phương pháp giải',
            'bài toán phức tạp, tư duy logic cao',
            'ứng dụng thực tế trong công việc',
            'dự án tổng hợp nhiều kỹ năng'
        ];
        
        $practices = [
            'bài tập nhận biết khái niệm',
            'bài tập áp dụng công thức',
            'bài tập tổng hợp nhiều kiến thức',
            'bài tập phân tích và đánh giá',
            'dự án thực hành tổng hợp'
        ];
        
        $topicIndex = min($index - 1, 4);
        $topic = $topics[$topicIndex];
        $example = $examples[$topicIndex];  
        $practice = $practices[$topicIndex];
        
        return <<<HTML
        <div class="lesson-overview">
            <h2>🎯 Tổng quan bài học $index</h2>
            <p class="lead">Chào mừng bạn đến với bài học về <strong>$topic</strong>. Đây là một bài học quan trọng giúp bạn nắm vững kiến thức và kỹ năng cần thiết.</p>
            
            <div class="objectives">
                <h3>📚 Mục tiêu học tập</h3>
                <ul>
                    <li>Nắm vững các khái niệm cốt lõi về $topic</li>
                    <li>Hiểu rõ phương pháp tiếp cận và giải quyết vấn đề</li>
                    <li>Phát triển kỹ năng tư duy phân tích và logic</li>
                    <li>Áp dụng kiến thức vào các tình huống thực tế</li>
                    <li>Chuẩn bị nền tảng vững chắc cho các bài học tiếp theo</li>
                </ul>
            </div>
            
            <div class="theory">
                <h3>🔬 Nội dung lý thuyết</h3>
                <p>Trong bài học này, chúng ta sẽ khám phá chi tiết về $topic. Bạn sẽ được học:</p>
                <ul>
                    <li><strong>Định nghĩa và khái niệm:</strong> Hiểu rõ bản chất của vấn đề</li>
                    <li><strong>Nguyên lý hoạt động:</strong> Cơ chế và quy luật cơ bản</li>
                    <li><strong>Ứng dụng thực tế:</strong> Cách áp dụng trong đời sống và công việc</li>
                    <li><strong>Phương pháp giải quyết:</strong> Các bước tiếp cận bài toán</li>
                </ul>
            </div>
            
            <div class="examples">
                <h3>💡 Ví dụ minh họa</h3>
                <div class="example-box">
                    <p><strong>🔍 Ví dụ $index.1:</strong> Phân tích $example</p>
                    <p><em>Phương pháp giải:</em> Áp dụng các bước phân tích hệ thống, sử dụng công cụ và kỹ thuật phù hợp để đạt được kết quả chính xác.</p>
                </div>
                
                <div class="example-box">
                    <p><strong>🔍 Ví dụ $index.2:</strong> Ứng dụng thực tế</p>
                    <p><em>Giải thích:</em> Minh họa cách áp dụng kiến thức vào các tình huống cụ thể, giúp bạn hiểu rõ tính ứng dụng của bài học.</p>
                </div>
            </div>
            
            <div class="practice">
                <h3>✏️ Bài tập và thực hành</h3>
                <p>Để nắm vững kiến thức, bạn cần hoàn thành các hoạt động sau:</p>
                <ol>
                    <li><strong>Bài tập cơ bản:</strong> $practice - Giúp củng cố hiểu biết</li>
                    <li><strong>Bài tập nâng cao:</strong> Phân tích và giải quyết các tình huống phức tạp</li>
                    <li><strong>Dự án mini:</strong> Áp dụng kiến thức vào một dự án nhỏ thực tế</li>
                    <li><strong>Thảo luận nhóm:</strong> Chia sẻ và trao đổi với các học viên khác</li>
                </ol>
            </div>
            
            <div class="resources">
                <h3>📖 Tài liệu tham khảo</h3>
                <ul>
                    <li>📄 Slide bài giảng chi tiết (PDF)</li>
                    <li>📝 Tài liệu đọc thêm (DOCX)</li>
                    <li>📊 Biểu đồ và sơ đồ minh họa (PPTX)</li>
                    <li>🎥 Video demo và hướng dẫn bổ sung</li>
                </ul>
            </div>
            
            <div class="summary">
                <h3>📝 Tóm tắt quan trọng</h3>
                <div class="highlight-box">
                    <p>🔑 <strong>Điểm nhấn chính:</strong> $topic là nền tảng quan trọng giúp bạn:</p>
                    <ul>
                        <li>Phát triển tư duy có hệ thống</li>
                        <li>Nâng cao khả năng giải quyết vấn đề</li>
                        <li>Chuẩn bị tốt cho các thử thách phức tạp hơn</li>
                    </ul>
                </div>
            </div>
            
            <div class="next-steps">
                <h3>🚀 Bước tiếp theo</h3>
                <p>Sau khi hoàn thành bài học này, bạn sẽ sẵn sàng cho:</p>
                <ul>
                    <li>Bài học tiếp theo với nội dung nâng cao hơn</li>
                    <li>Áp dụng kiến thức vào các dự án thực tế</li>
                    <li>Tham gia các bài kiểm tra và đánh giá</li>
                </ul>
            </div>
        </div>
        
        <style>
        .lesson-overview { font-family: 'Segoe UI', sans-serif; line-height: 1.6; }
        .lead { font-size: 1.1em; color: #2563eb; margin-bottom: 1.5em; }
        .example-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 1em; margin: 1em 0; }
        .highlight-box { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 1.5em; }
        h3 { color: #1f2937; margin-top: 2em; }
        </style>
        HTML;
    }
    
    private function generateOptionText(): string
    {
        $options = [
            "Áp dụng công thức cơ bản",
            "Sử dụng phương pháp đặc biệt",
            "Kết hợp nhiều phương pháp",
            "Giải theo định lý đã học",
            "Không thể áp dụng trong trường hợp này",
            "Tất cả các phương án trên",
            "Không có đáp án đúng",
            "Cần thêm điều kiện để kết luận",
        ];
        
        return $options[array_rand($options)];
    }
    
    private function getFileExtension(string $type): string
    {
        return match($type) {
            'pdf' => 'pdf',
            'docx' => 'docx',
            'pptx' => 'pptx',
            'xlsx' => 'xlsx',
            'mp4' => 'mp4',
            default => 'pdf',
        };
    }
}
