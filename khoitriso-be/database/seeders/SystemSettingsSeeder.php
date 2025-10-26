<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $rows = [
            ['setting_key' => 'site_name', 'setting_value' => 'Khởi Trí Số', 'setting_type' => 1, 'description' => 'Tên website', 'is_public' => true],
            ['setting_key' => 'site_description', 'setting_value' => 'Nền tảng học trực tuyến hàng đầu Việt Nam', 'setting_type' => 1, 'description' => 'Mô tả website', 'is_public' => true],
            ['setting_key' => 'default_currency', 'setting_value' => 'VND', 'setting_type' => 1, 'description' => 'Đơn vị tiền tệ mặc định', 'is_public' => true],
            ['setting_key' => 'registration_enabled', 'setting_value' => 'true', 'setting_type' => 3, 'description' => 'Cho phép đăng ký', 'is_public' => true],
        ];
        foreach ($rows as $r) {
            DB::table('system_settings')->updateOrInsert(
                ['setting_key' => $r['setting_key']],
                $r + ['created_at' => $now, 'updated_at' => $now]
            );
        }
    }
}









