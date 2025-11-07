<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Book;
use App\Models\BookChapter;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\BookQuestionSolution;

class BookContentSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        
        // Get all active books
        $books = Book::whereRaw('is_active = true')->get();
        
        if ($books->isEmpty()) {
            $this->command->warn('No active books found. Please run BooksSeeder first.');
            return;
        }
        
        $this->command->info("Creating content for {$books->count()} books...");
        
        foreach ($books as $book) {
            $this->command->info("Processing book: {$book->title}");
            
            // Create 3-5 chapters per book
            $numChapters = rand(3, 5);
            $chapters = [];
            
            for ($i = 1; $i <= $numChapters; $i++) {
                $chapterId = DB::table('book_chapters')->insertGetId([
                    'book_id' => $book->id,
                    'title' => "Chương {$i}: " . $this->getChapterTitle($book->title, $i),
                    'description' => "Nội dung chương {$i} của sách {$book->title}",
                    'order_index' => $i,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                
                $chapters[] = $chapterId;
                
                // Create 5-10 questions per chapter
                $numQuestions = rand(5, 10);
                
                for ($j = 1; $j <= $numQuestions; $j++) {
                    // Random question type: 1 = multiple choice, 2 = essay
                    $questionType = rand(1, 2);
                    
                    $questionId = DB::table('questions')->insertGetId([
                        'context_type' => 2, // 2 = book_chapter
                        'context_id' => $chapterId,
                        'question_content' => "Câu hỏi {$j}: " . $this->getQuestionContent($questionType),
                        'question_type' => $questionType,
                        'difficulty_level' => rand(1, 3), // 1 = easy, 2 = medium, 3 = hard
                        'points' => json_encode([]),
                        'default_points' => $questionType === 1 ? 1.0 : 2.0,
                        'explanation_content' => "Giải thích cho câu hỏi {$j}",
                        'question_image' => null,
                        'video_url' => null,
                        'time_limit' => null,
                        'subject_type' => null,
                        'order_index' => $j,
                        'is_active' => DB::raw('true'),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                    
                    // If multiple choice, create 4 options
                    if ($questionType === 1) {
                        $correctOption = rand(1, 4);
                        
                        for ($k = 1; $k <= 4; $k++) {
                            DB::table('question_options')->insert([
                                'question_id' => $questionId,
                                'option_content' => "Đáp án {$k}: " . $this->getOptionContent($k === $correctOption),
                                'option_image' => null,
                                'is_correct' => DB::raw($k === $correctOption ? 'true' : 'false'),
                                'order_index' => $k,
                                'points_value' => $k === $correctOption ? 1.0 : 0.0,
                                'explanation_text' => $k === $correctOption ? 'Đây là đáp án đúng' : null,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ]);
                        }
                    }
                    
                    // Create solution (random type: video, text, or latex)
                    $solutionType = rand(1, 3); // 1 = video, 2 = text, 3 = latex
                    
                    $solutionData = [
                        'question_id' => $questionId,
                        'solution_type' => $solutionType,
                        'order_index' => 0,
                        'is_active' => DB::raw('true'),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                    
                    if ($solutionType === 1) {
                        // Video solution
                        $solutionData['content'] = 'Video giải bài tập';
                        $solutionData['video_url'] = 'https://www.youtube.com/watch?v=' . $this->getRandomYouTubeId();
                        $solutionData['latex_content'] = null;
                        $solutionData['image_url'] = null;
                    } elseif ($solutionType === 2) {
                        // Text solution
                        $solutionData['content'] = $this->getTextSolution();
                        $solutionData['video_url'] = null;
                        $solutionData['latex_content'] = null;
                        $solutionData['image_url'] = null;
                    } else {
                        // LaTeX solution
                        $solutionData['content'] = 'Giải bằng LaTeX';
                        $solutionData['video_url'] = null;
                        $solutionData['latex_content'] = $this->getLatexSolution();
                        $solutionData['image_url'] = null;
                    }
                    
                    DB::table('book_question_solutions')->insert($solutionData);
                }
            }
            
            // Update total_questions count
            $totalQuestions = Question::where('context_type', 2)
                ->whereIn('context_id', $chapters)
                ->count();
            
            DB::table('books')
                ->where('id', $book->id)
                ->update(['total_questions' => $totalQuestions]);
            
            $this->command->info("Created {$numChapters} chapters with questions for: {$book->title}");
        }
        
        $this->command->info('Book content created successfully!');
    }
    
    private function getChapterTitle(string $bookTitle, int $chapterNum): string
    {
        $titles = [
            'Khái niệm cơ bản',
            'Lý thuyết nâng cao',
            'Bài tập ứng dụng',
            'Thực hành',
            'Tổng hợp và ôn tập',
        ];
        
        return $titles[($chapterNum - 1) % count($titles)];
    }
    
    private function getQuestionContent(int $type): string
    {
        if ($type === 1) {
            $questions = [
                'Tính đạo hàm của hàm số f(x) = x² + 3x - 5?',
                'Giải phương trình: 2x + 5 = 15?',
                'Tìm giá trị lớn nhất của hàm số y = -x² + 4x?',
                'Tính tích phân ∫(2x + 3)dx?',
                'Xác định nghiệm của phương trình bậc hai?',
            ];
        } else {
            $questions = [
                'Hãy giải thích chi tiết cách tính đạo hàm của hàm số phức tạp.',
                'Viết bài luận về ứng dụng của tích phân trong thực tế.',
                'Trình bày phương pháp giải bài toán tối ưu hóa.',
            ];
        }
        
        return $questions[array_rand($questions)];
    }
    
    private function getOptionContent(bool $isCorrect): string
    {
        if ($isCorrect) {
            return 'Đáp án đúng';
        }
        
        $wrongOptions = [
            'Đáp án sai',
            'Không đúng',
            'Sai',
        ];
        
        return $wrongOptions[array_rand($wrongOptions)];
    }
    
    private function getTextSolution(): string
    {
        return "Giải:\n\nBước 1: Phân tích đề bài\nBước 2: Áp dụng công thức\nBước 3: Tính toán\nBước 4: Kết luận\n\nĐáp án cuối cùng là kết quả của các bước trên.";
    }
    
    private function getLatexSolution(): string
    {
        $latexExamples = [
            '\\int_{0}^{1} x^2 dx = \\left[\\frac{x^3}{3}\\right]_0^1 = \\frac{1}{3}',
            'f\'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}',
            '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
        ];
        
        return $latexExamples[array_rand($latexExamples)];
    }
    
    private function getRandomYouTubeId(): string
    {
        // Random YouTube video IDs for demo
        $ids = [
            'dQw4w9WgXcQ',
            'jNQXAC9IVRw',
            '9bZkp7q19f0',
            'kJQP7kiw5Fk',
            'L_jWHffIx5E',
        ];
        
        return $ids[array_rand($ids)];
    }
}
