<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class SampleContentSeeder extends Seeder
{
    public function run(): void
    {
        // Categories (skip if exist)
        $categories = [
            'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Tiếng Anh'
        ];
        foreach ($categories as $name) {
            $exists = DB::table('categories')->where('name', $name)->exists();
            if (!$exists) {
                DB::table('categories')->insert([
                    'name' => $name,
                    'slug' => Str::slug($name),
                    'description' => 'Danh mục mẫu - ' . $name,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Courses
        $catIds = DB::table('categories')->pluck('id')->all();
        $instructorId = null;
        if (Schema::hasColumn('users', 'role')) {
            $instructorId = DB::table('users')->where('role', 'instructor')->value('id');
        }
        if (!$instructorId && Schema::hasColumn('users', 'is_instructor')) {
            $instructorId = DB::table('users')->where('is_instructor', 1)->value('id');
        }
        if (!$instructorId) $instructorId = DB::table('users')->value('id');
        for ($i = 1; $i <= 12; $i++) {
            $title = 'Khóa học mẫu #' . $i;
            $exists = DB::table('courses')->where('title', $title)->exists();
            if ($exists) continue;
            $payload = [
                'title' => $title,
                'price' => rand(0, 1) ? rand(100000, 500000) : 0,
                'is_free' => rand(0, 1) === 1,
                'category_id' => $catIds[array_rand($catIds)] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if (Schema::hasColumn('courses', 'slug')) $payload['slug'] = 'khoa-hoc-mau-' . $i;
            if (Schema::hasColumn('courses', 'description')) $payload['description'] = 'Mô tả khóa học mẫu ' . $i;
            if (Schema::hasColumn('courses', 'static_page_path')) $payload['static_page_path'] = 'courses/khoa-hoc-mau-' . $i;
            if (Schema::hasColumn('courses', 'thumbnail')) $payload['thumbnail'] = '/images/no_image.png';
            if (Schema::hasColumn('courses', 'instructor_id')) $payload['instructor_id'] = $instructorId;
            if (Schema::hasColumn('courses', 'level')) $payload['level'] = rand(1, 3); // 1=beginner,2=intermediate,3=advanced
            DB::table('courses')->insert($payload);
        }

        // Books
        for ($i = 1; $i <= 12; $i++) {
            $title = 'Sách mẫu #' . $i;
            $exists = DB::table('books')->where('title', $title)->exists();
            if ($exists) continue;
            $payload = [
                'title' => $title,
                'price' => rand(80000, 250000),
                'category_id' => $catIds[array_rand($catIds)] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if (Schema::hasColumn('books', 'slug')) $payload['slug'] = 'sach-mau-' . $i;
            if (Schema::hasColumn('books', 'author')) $payload['author'] = 'Tác giả ' . $i;
            if (Schema::hasColumn('books', 'cover_image')) $payload['cover_image'] = '/images/no_image.png';
            if (Schema::hasColumn('books', 'description')) $payload['description'] = 'Mô tả sách mẫu ' . $i;
            if (Schema::hasColumn('books', 'isbn')) $payload['isbn'] = 'ISBN-' . str_pad((string)($i), 6, '0', STR_PAD_LEFT);
            if (Schema::hasColumn('books', 'static_page_path')) $payload['static_page_path'] = 'books/sach-mau-' . $i;
            if (Schema::hasColumn('books', 'ebook_file')) $payload['ebook_file'] = 'samples/sample.pdf';
            if (Schema::hasColumn('books', 'author_id')) $payload['author_id'] = $instructorId;
            DB::table('books')->insert($payload);
        }
    }
}


