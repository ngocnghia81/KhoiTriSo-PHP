<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersAndCouponsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        // Student (main user for testing)
        $studentId = DB::table('users')->updateOrInsert(
            ['email' => 'student@khoitriso.edu.vn'],
            [
                'name' => 'Trần Thị Học Sinh',
                'username' => 'student',
                'password' => Hash::make('student123'),
                'email_verified_at' => $now,
                'is_active' => true,
                'role' => 'admin',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        // Instructor
        DB::table('users')->updateOrInsert(
            ['email' => 'instructor@khoitriso.edu.vn'],
            [
                'name' => 'Nguyễn Văn Giảng',
                'username' => 'instructor1',
                'password' => Hash::make('instructor123'),
                'email_verified_at' => $now,
                'is_active' => true,
                'role' => 'instructor',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        // Admin
        DB::table('users')->updateOrInsert(
            ['email' => 'admin@khoitriso.edu.vn'],
            [
                'name' => 'Admin',
                'username' => 'admin',
                'password' => Hash::make('admin123'),
                'email_verified_at' => $now,
                'is_active' => true,
                'role' => 'student',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        // Coupons
        DB::table('coupons')->updateOrInsert(
            ['code' => 'WELCOME10'],
            [
                'name' => 'Chào mừng thành viên mới',
                'description' => 'Giảm 10% cho đơn hàng đầu tiên',
                'discount_type' => 1,
                'discount_value' => 10.00,
                'max_discount_amount' => 100000,
                'min_order_amount' => 0,
                'valid_from' => $now,
                'valid_to' => $now->copy()->addYear(),
                'usage_limit' => 1000,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
        DB::table('coupons')->updateOrInsert(
            ['code' => 'STUDENT50'],
            [
                'name' => 'Ưu đãi học sinh',
                'description' => 'Giảm 50,000 VND cho học sinh',
                'discount_type' => 2,
                'discount_value' => 50000,
                'valid_from' => $now,
                'valid_to' => $now->copy()->addMonths(6),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }
}









