<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Category;

class BooksSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        
        // Get categories
        $mathCategory = Category::where('name', 'Toán học')->first();
        $physicsCategory = Category::where('name', 'Vật lý')->first();
        $chemistryCategory = Category::where('name', 'Hóa học')->first();
        $literatureCategory = Category::where('name', 'Ngữ văn')->first();
        $englishCategory = Category::where('name', 'Tiếng Anh')->first();
        $itCategory = Category::where('name', 'Tin học')->first();
        
        $books = [
            // Toán học
            [
                'title' => 'Sách giải tích 12 - Tích phân và ứng dụng',
                'static_page_path' => 'sach-giai-tich-12-tích-phan',
                'description' => 'Sách chuyên sâu về tích phân, bao gồm lý thuyết và 500+ bài tập từ cơ bản đến nâng cao',
                'category_id' => $mathCategory?->id,
                'author_id' => 1,
                'isbn' => '978-604-0-12345-0',
                'language' => 'vi',
                'publication_year' => 2024,
                'edition' => 1,
                'price' => 299000,
                'cover_image' => 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=800&fit=crop',
                'ebook_file' => '/pdfs/books/giai-tich-12.pdf',
                'is_active' => true,
                'approval_status' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Toán học 11 - Hình học không gian',
                'static_page_path' => 'toan-hoc-11-hinh-hoc-khong-gian',
                'description' => 'Giáo trình hình học không gian với phương pháp giảng dạy hiện đại, dễ hiểu',
                'category_id' => $mathCategory?->id,
                'author_id' => 1,
                'isbn' => '978-604-0-12346-7',
                'language' => 'vi',
                'publication_year' => 2024,
                'edition' => 1,
                'price' => 249000,
                'cover_image' => 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=800&fit=crop',
                'ebook_file' => '/pdfs/books/hinh-hoc-11.pdf',
                'is_active' => true,
                'approval_status' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Đề thi thử THPT Quốc gia - Toán học',
                'static_page_path' => 'de-thi-thu-thpt-toan-hoc',
                'description' => '30 đề thi thử THPT Quốc gia môn Toán với đáp án chi tiết',
                'category_id' => $mathCategory?->id,
                'author_id' => 1,
                'isbn' => '978-604-0-12347-4',
                'language' => 'vi',
                'publication_year' => 2024,
                'edition' => 1,
                'price' => 0,
                'cover_image' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=800&fit=crop',
                'ebook_file' => '/pdfs/books/de-thi-thu-toan.pdf',
                'is_active' => true,
                'approval_status' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            
            // Vật lý
            [
                'title' => 'Vật lý 12 - Điện từ học và quang học',
                'static_page_path' => 'vat-ly-12-dien-tu-quang-hoc',
                'description' => 'Sách tổng hợp lý thuyết và bài tập về điện từ học, quang học',
                'category_id' => $physicsCategory?->id,
                'author_id' => 1,
                'isbn' => '978-604-0-12348-1',
                'language' => 'vi',
                'publication_year' => 2024,
                'edition' => 1,
                'price' => 279000,
                'cover_image' => 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&h=800&fit=crop',
                'ebook_file' => '/pdfs/books/vat-ly-12.pdf',
                'is_active' => true,
                'approval_status' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            
            // Hóa học
            [
                'title' => 'Hóa học 12 - Hóa hữu cơ nâng cao',
                'static_page_path' => 'hoa-hoc-12-huu-co-nang-cao',
                'description' => 'Sách chuyên đề hóa hữu cơ với các phản ứng đặc trưng và bài tập phân loại',
                'category_id' => $chemistryCategory?->id,
                'author_id' => 1,
                'isbn' => '978-604-0-12349-8',
                'language' => 'vi',
                'publication_year' => 2024,
                'edition' => 1,
                'price' => 269000,
                'cover_image' => 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=800&fit=crop',
                'ebook_file' => '/pdfs/books/hoa-hoc-12.pdf',
                'is_active' => true,
                'approval_status' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            
            // Ngữ văn
            [
                'title' => 'Ngữ văn 12 - Phân tích tác phẩm văn học',
                'static_page_path' => 'ngu-van-12-phan-tich-tac-pham',
                'description' => 'Phân tích chi tiết các tác phẩm văn học trong chương trình lớp 12',
                'category_id' => $literatureCategory?->id,
                'author_id' => 1,
                'isbn' => '978-604-0-12350-4',
                'language' => 'vi',
                'publication_year' => 2024,
                'edition' => 1,
                'price' => 0,
                'cover_image' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
                'ebook_file' => '/pdfs/books/ngu-van-12.pdf',
                'is_active' => true,
                'approval_status' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            
            // Tiếng Anh
            [
                'title' => 'IELTS Vocabulary - 3000+ từ vựng IELTS',
                'static_page_path' => 'ielts-vocabulary-3000-tu',
                'description' => 'Bộ từ vựng IELTS thiết yếu với ví dụ và bài tập thực hành',
                'category_id' => $englishCategory?->id,
                'author_id' => 1,
                'isbn' => '978-604-0-12351-1',
                'language' => 'vi',
                'publication_year' => 2024,
                'edition' => 1,
                'price' => 329000,
                'cover_image' => 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=800&fit=crop',
                'ebook_file' => '/pdfs/books/ielts-vocabulary.pdf',
                'is_active' => true,
                'approval_status' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'English Grammar in Use - Ngữ pháp tiếng Anh',
                'static_page_path' => 'english-grammar-in-use',
                'description' => 'Sách ngữ pháp tiếng Anh toàn diện với hơn 1000 bài tập',
                'category_id' => $englishCategory?->id,
                'author_id' => 1,
                'isbn' => '978-604-0-12352-8',
                'language' => 'vi',
                'publication_year' => 2024,
                'edition' => 1,
                'price' => 299000,
                'cover_image' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=800&fit=crop',
                'ebook_file' => '/pdfs/books/grammar-in-use.pdf',
                'is_active' => true,
                'approval_status' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            
            // Tin học
            [
                'title' => 'Python Programming - Lập trình Python thực chiến',
                'static_page_path' => 'python-programming-thuc-chien',
                'description' => 'Sách Python từ cơ bản đến nâng cao với các dự án thực tế',
                'category_id' => $itCategory?->id,
                'author_id' => 1,
                'isbn' => '978-604-0-12353-5',
                'language' => 'vi',
                'publication_year' => 2024,
                'edition' => 1,
                'price' => 399000,
                'cover_image' => 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=800&fit=crop',
                'ebook_file' => '/pdfs/books/python-programming.pdf',
                'is_active' => true,
                'approval_status' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Cấu trúc dữ liệu và giải thuật',
                'static_page_path' => 'cau-truc-du-lieu-giai-thuat',
                'description' => 'Giáo trình cấu trúc dữ liệu và giải thuật với Python',
                'category_id' => $itCategory?->id,
                'author_id' => 1,
                'isbn' => '978-604-0-12354-2',
                'language' => 'vi',
                'publication_year' => 2024,
                'edition' => 1,
                'price' => 0,
                'cover_image' => 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=800&fit=crop',
                'ebook_file' => '/pdfs/books/data-structures.pdf',
                'is_active' => true,
                'approval_status' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];
        
        foreach ($books as $bookData) {
            // Convert boolean values for PostgreSQL
            $bookData['is_active'] = $bookData['is_active'] ? DB::raw('true') : DB::raw('false');
            
            DB::table('books')->insert($bookData);
        }
    }
}
