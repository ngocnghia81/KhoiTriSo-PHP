<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemController extends Controller
{
    public function settings()
    {
        $rows = DB::table('system_settings')->select('setting_key as key','setting_value as value','setting_type as type','is_public as isPublic')->get();
        return response()->json(['settings' => $rows]);
    }

    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'settings' => ['required','array','min:1'],
            'settings.*.key' => ['required','string'],
            'settings.*.value' => ['required'],
        ]);
        foreach ($data['settings'] as $s) {
            DB::table('system_settings')->where('setting_key', $s['key'])->update(['setting_value' => (string) $s['value'], 'updated_at' => now()]);
        }
        return response()->json(['success' => true]);
    }

    public function health()
    {
        return response()->json(['status' => 'healthy', 'timestamp' => now(), 'services' => ['database' => 'healthy', 'redis' => 'unknown', 'storage' => 'healthy'], 'version' => '1.0.0']);
    }

    public function stats()
    {
        return response()->json([
            'totalUsers' => (int) DB::table('users')->count(),
            'totalCourses' => (int) DB::table('courses')->count(),
            'totalBooks' => (int) DB::table('books')->count(),
            'totalOrders' => (int) DB::table('orders')->count(),
            'systemUptime' => 0,
            'storageUsed' => 'N/A',
            'lastBackup' => null,
        ]);
    }
}


