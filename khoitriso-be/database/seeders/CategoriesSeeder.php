<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $roots = [
            ['name' => 'Toán học','description' => 'Các khóa học và sách về toán học','icon' => 'math-icon','order_index' => 1],
            ['name' => 'Vật lý','description' => 'Các khóa học và sách về vật lý','icon' => 'physics-icon','order_index' => 2],
            ['name' => 'Hóa học','description' => 'Các khóa học và sách về hóa học','icon' => 'chemistry-icon','order_index' => 3],
            ['name' => 'Sinh học','description' => 'Các khóa học và sách về sinh học','icon' => 'biology-icon','order_index' => 4],
            ['name' => 'Ngữ văn','description' => 'Các khóa học và sách về ngữ văn','icon' => 'literature-icon','order_index' => 5],
            ['name' => 'Tiếng Anh','description' => 'Các khóa học và sách về tiếng Anh','icon' => 'english-icon','order_index' => 6],
            ['name' => 'Lịch sử','description' => 'Các khóa học và sách về lịch sử','icon' => 'history-icon','order_index' => 7],
            ['name' => 'Địa lý','description' => 'Các khóa học và sách về địa lý','icon' => 'geography-icon','order_index' => 8],
            ['name' => 'Tin học','description' => 'Các khóa học và sách về tin học','icon' => 'computer-icon','order_index' => 9],
            ['name' => 'Kỹ năng sống','description' => 'Các khóa học về kỹ năng sống','icon' => 'life-skills-icon','order_index' => 10],
        ];
        $parentIds = [];
        foreach ($roots as $r) {
            $existing = DB::table('categories')->where('name', $r['name'])->first();
            if ($existing) {
                $parentIds[$r['name']] = $existing->id;
            } else {
                $id = DB::table('categories')->insertGetId($r + ['is_active' => true, 'created_at' => $now, 'updated_at' => $now]);
                $parentIds[$r['name']] = $id;
            }
        }
        // Subcategories for Toán học
        $mathChildren = [
            ['name' => 'Đại số','description' => 'Đại số cơ bản và nâng cao','icon' => 'algebra-icon','order_index' => 1],
            ['name' => 'Hình học','description' => 'Hình học phẳng và không gian','icon' => 'geometry-icon','order_index' => 2],
            ['name' => 'Giải tích','description' => 'Giải tích và tích phân','icon' => 'calculus-icon','order_index' => 3],
            ['name' => 'Xác suất thống kê','description' => 'Xác suất và thống kê','icon' => 'statistics-icon','order_index' => 4],
        ];
        foreach ($mathChildren as $c) {
            $exists = DB::table('categories')->where('name', $c['name'])->where('parent_id', $parentIds['Toán học'])->exists();
            if (!$exists) {
                DB::table('categories')->insert($c + ['parent_id' => $parentIds['Toán học'], 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]);
            }
        }
        // Subcategories for Tin học
        $itChildren = [
            ['name' => 'Lập trình','description' => 'Các ngôn ngữ lập trình','icon' => 'programming-icon','order_index' => 1],
            ['name' => 'Cơ sở dữ liệu','description' => 'Thiết kế và quản trị CSDL','icon' => 'database-icon','order_index' => 2],
            ['name' => 'Mạng máy tính','description' => 'Mạng và bảo mật','icon' => 'network-icon','order_index' => 3],
            ['name' => 'Trí tuệ nhân tạo','description' => 'AI và Machine Learning','icon' => 'ai-icon','order_index' => 4],
        ];
        foreach ($itChildren as $c) {
            $exists = DB::table('categories')->where('name', $c['name'])->where('parent_id', $parentIds['Tin học'])->exists();
            if (!$exists) {
                DB::table('categories')->insert($c + ['parent_id' => $parentIds['Tin học'], 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]);
            }
        }
    }
}









