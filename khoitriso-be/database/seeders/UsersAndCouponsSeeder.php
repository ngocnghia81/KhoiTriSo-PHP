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
        
        // Admin - Tài khoản quản trị viên
        DB::table('users')->updateOrInsert(
            ['email' => 'admin@khoitriso.com'],
            [
                'name' => 'Quản trị viên',
                'username' => 'admin',
                'password' => Hash::make('123456'),
                'email_verified_at' => $now,
                'is_active' => DB::raw('true'),
                'role' => 'admin',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        // Instructor - Tài khoản giảng viên
        DB::table('users')->updateOrInsert(
            ['email' => 'instructor@khoitriso.com'],
            [
                'name' => 'Giảng viên',
                'username' => 'instructor',
                'password' => Hash::make('123456'),
                'email_verified_at' => $now,
                'is_active' => DB::raw('true'),
                'role' => 'instructor',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        // Student - Tài khoản học viên
        DB::table('users')->updateOrInsert(
            ['email' => 'student@khoitriso.com'],
            [
                'name' => 'Học viên',
                'username' => 'student',
                'password' => Hash::make('123456'),
                'email_verified_at' => $now,
                'is_active' => DB::raw('true'),
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
                'is_active' => DB::raw('true'),
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
                'is_active' => DB::raw('true'),
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }
}









