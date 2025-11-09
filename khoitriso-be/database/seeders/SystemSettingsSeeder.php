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
            ['setting_key' => 'site_name', 'setting_value' => 'Khởi Trí Số', 'setting_type' => 1, 'description' => 'Tên website', 'is_public' => DB::raw('true')],
            ['setting_key' => 'site_description', 'setting_value' => 'Nền tảng học trực tuyến hàng đầu Việt Nam', 'setting_type' => 1, 'description' => 'Mô tả website', 'is_public' => DB::raw('true')],
            ['setting_key' => 'default_currency', 'setting_value' => 'VND', 'setting_type' => 1, 'description' => 'Đơn vị tiền tệ mặc định', 'is_public' => DB::raw('true')],
            ['setting_key' => 'registration_enabled', 'setting_value' => 'true', 'setting_type' => 3, 'description' => 'Cho phép đăng ký', 'is_public' => DB::raw('true')],
            ['setting_key' => 'site_logo', 'setting_value' => '/images/logo.png', 'setting_type' => 1, 'description' => 'Logo website', 'is_public' => DB::raw('true')],
            ['setting_key' => 'site_banner', 'setting_value' => '/images/banner.jpg', 'setting_type' => 1, 'description' => 'Banner website', 'is_public' => DB::raw('true')],
            ['setting_key' => 'hotline', 'setting_value' => '1900-xxxx', 'setting_type' => 1, 'description' => 'Số điện thoại hotline', 'is_public' => DB::raw('true')],
            ['setting_key' => 'email_contact', 'setting_value' => 'contact@khoitriso.com', 'setting_type' => 1, 'description' => 'Email liên hệ', 'is_public' => DB::raw('true')],
            ['setting_key' => 'address', 'setting_value' => '123 Đường ABC, Quận XYZ, TP.HCM', 'setting_type' => 1, 'description' => 'Địa chỉ', 'is_public' => DB::raw('true')],
            ['setting_key' => 'commission_rate_default', 'setting_value' => '30', 'setting_type' => 2, 'description' => 'Tỷ lệ chiết khấu mặc định (%)', 'is_public' => DB::raw('false')],
        ];
        foreach ($rows as $r) {
            DB::table('system_settings')->updateOrInsert(
                ['setting_key' => $r['setting_key']],
                $r + ['created_at' => $now, 'updated_at' => $now]
            );
        }
    }
}









