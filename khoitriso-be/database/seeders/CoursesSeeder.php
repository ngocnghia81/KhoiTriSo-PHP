<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Category;
use App\Models\Course;

class CoursesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        
        // Get categories
        $mathCategory = Category::where('name', 'Toán học')->first();
        $physicsCategory = Category::where('name', 'Vật lý')->first();
        $chemistryCategory = Category::where('name', 'Hóa học')->first();
        $itCategory = Category::where('name', 'Tin học')->first();
        $englishCategory = Category::where('name', 'Tiếng Anh')->first();
        
        $courses = [
            // Toán học
            [
                'title' => 'Toán học lớp 12 - Đại số',
                'static_page_path' => 'toan-hoc-lop-12-dai-so',
                'description' => 'Khóa học toàn diện về đại số lớp 12, giúp học sinh nắm vững kiến thức cơ bản và nâng cao',
                'category_id' => $mathCategory?->id,
                'instructor_id' => 1,
                'level' => 3,
                'estimated_duration' => 120,
                'language' => 'vi',
                'is_free' => false,
                'price' => 599000,
                'thumbnail' => 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop',
                'is_published' => true,
                'is_active' => true,
                'approval_status' => 2,
                'total_students' => 1250,
                'rating' => 4.8,
                'total_reviews' => 320,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Toán học lớp 11 - Hình học không gian',
                'static_page_path' => 'toan-hoc-lop-11-hinh-hoc-khong-gian',
                'description' => 'Khóa học về hình học không gian, giúp học sinh hiểu rõ các khái niệm và bài toán phức tạp',
                'category_id' => $mathCategory?->id,
                'instructor_id' => 1,
                'level' => 2,
                'estimated_duration' => 100,
                'language' => 'vi',
                'is_free' => false,
                'price' => 499000,
                'thumbnail' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=600&fit=crop',
                'is_published' => true,
                'is_active' => true,
                'approval_status' => 2,
                'total_students' => 890,
                'rating' => 4.6,
                'total_reviews' => 210,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Giải tích lớp 12 - Tích phân và ứng dụng',
                'static_page_path' => 'giai-tich-lop-12-tich-phan',
                'description' => 'Khóa học chuyên sâu về tích phân, ứng dụng trong các bài toán thực tế',
                'category_id' => $mathCategory?->id,
                'instructor_id' => 1,
                'level' => 3,
                'estimated_duration' => 80,
                'language' => 'vi',
                'is_free' => true,
                'price' => 0,
                'thumbnail' => 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=800&h=600&fit=crop',
                'is_published' => true,
                'is_active' => true,
                'approval_status' => 2,
                'total_students' => 2100,
                'rating' => 4.9,
                'total_reviews' => 580,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            
            // Vật lý
            [
                'title' => 'Vật lý 12 - Điện từ học',
                'static_page_path' => 'vat-ly-12-dien-tu-hoc',
                'description' => 'Khóa học về điện từ học, từ cơ bản đến nâng cao với nhiều bài tập thực hành',
                'category_id' => $physicsCategory?->id,
                'instructor_id' => 1,
                'level' => 3,
                'estimated_duration' => 110,
                'language' => 'vi',
                'is_free' => false,
                'price' => 549000,
                'thumbnail' => 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop',
                'is_published' => true,
                'is_active' => true,
                'approval_status' => 2,
                'total_students' => 780,
                'rating' => 4.7,
                'total_reviews' => 190,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Vật lý 11 - Cơ học',
                'static_page_path' => 'vat-ly-11-co-hoc',
                'description' => 'Nắm vững các định luật cơ học, giải quyết các bài toán chuyển động',
                'category_id' => $physicsCategory?->id,
                'instructor_id' => 1,
                'level' => 2,
                'estimated_duration' => 90,
                'language' => 'vi',
                'is_free' => true,
                'price' => 0,
                'thumbnail' => 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop',
                'is_published' => true,
                'is_active' => true,
                'approval_status' => 2,
                'total_students' => 1560,
                'rating' => 4.5,
                'total_reviews' => 420,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            
            // Hóa học
            [
                'title' => 'Hóa học 12 - Hóa hữu cơ',
                'static_page_path' => 'hoa-hoc-12-hoa-huu-co',
                'description' => 'Khóa học toàn diện về hóa hữu cơ, các phản ứng đặc trưng và bài tập nâng cao',
                'category_id' => $chemistryCategory?->id,
                'instructor_id' => 1,
                'level' => 3,
                'estimated_duration' => 100,
                'language' => 'vi',
                'is_free' => false,
                'price' => 529000,
                'thumbnail' => 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop',
                'is_published' => true,
                'is_active' => true,
                'approval_status' => 2,
                'total_students' => 950,
                'rating' => 4.8,
                'total_reviews' => 280,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            
            // Tin học
            [
                'title' => 'Lập trình Python từ cơ bản đến nâng cao',
                'static_page_path' => 'lap-trinh-python-co-ban-nang-cao',
                'description' => 'Khóa học Python toàn diện, từ cú pháp cơ bản đến các ứng dụng thực tế',
                'category_id' => $itCategory?->id,
                'instructor_id' => 1,
                'level' => 2,
                'estimated_duration' => 150,
                'language' => 'vi',
                'is_free' => false,
                'price' => 799000,
                'thumbnail' => 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=600&fit=crop',
                'is_published' => true,
                'is_active' => true,
                'approval_status' => 2,
                'total_students' => 3200,
                'rating' => 4.9,
                'total_reviews' => 890,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Web Development với React & Node.js',
                'static_page_path' => 'web-development-react-nodejs',
                'description' => 'Xây dựng ứng dụng web hiện đại với React frontend và Node.js backend',
                'category_id' => $itCategory?->id,
                'instructor_id' => 1,
                'level' => 3,
                'estimated_duration' => 180,
                'language' => 'vi',
                'is_free' => false,
                'price' => 999000,
                'thumbnail' => 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop',
                'is_published' => true,
                'is_active' => true,
                'approval_status' => 2,
                'total_students' => 2800,
                'rating' => 4.8,
                'total_reviews' => 750,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            
            // Tiếng Anh
            [
                'title' => 'IELTS Speaking Band 7.0+',
                'static_page_path' => 'ielts-speaking-band-7',
                'description' => 'Khóa học luyện speaking IELTS, đạt band 7.0 trở lên với phương pháp hiệu quả',
                'category_id' => $englishCategory?->id,
                'instructor_id' => 1,
                'level' => 3,
                'estimated_duration' => 60,
                'language' => 'vi',
                'is_free' => false,
                'price' => 699000,
                'thumbnail' => 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop',
                'is_published' => true,
                'is_active' => true,
                'approval_status' => 2,
                'total_students' => 1450,
                'rating' => 4.7,
                'total_reviews' => 380,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'English Grammar - Ngữ pháp tiếng Anh cơ bản',
                'static_page_path' => 'english-grammar-co-ban',
                'description' => 'Nắm vững ngữ pháp tiếng Anh từ cơ bản, nền tảng cho việc học tiếng Anh',
                'category_id' => $englishCategory?->id,
                'instructor_id' => 1,
                'level' => 1,
                'estimated_duration' => 40,
                'language' => 'vi',
                'is_free' => true,
                'price' => 0,
                'thumbnail' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop',
                'is_published' => true,
                'is_active' => true,
                'approval_status' => 2,
                'total_students' => 4200,
                'rating' => 4.6,
                'total_reviews' => 1100,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];
        
        foreach ($courses as $courseData) {
            // Convert boolean values for PostgreSQL
            $courseData['is_free'] = $courseData['is_free'] ? DB::raw('true') : DB::raw('false');
            $courseData['is_published'] = $courseData['is_published'] ? DB::raw('true') : DB::raw('false');
            $courseData['is_active'] = $courseData['is_active'] ? DB::raw('true') : DB::raw('false');
            
            DB::table('courses')->insert($courseData);
        }
    }
}
