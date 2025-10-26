<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * System Controller
 */
class SystemController extends BaseController
{
    public function settings(Request $request): JsonResponse
    {
        try {
            $rows = DB::table('system_settings')
                ->select('setting_key as key','setting_value as value','setting_type as type','is_public as isPublic')
                ->get();
            
            return $this->success(['settings' => $rows]);

        } catch (\Exception $e) {
            \Log::error('Error in settings: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function updateSettings(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'settings' => ['required','array','min:1'],
                'settings.*.key' => ['required','string'],
                'settings.*.value' => ['required'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            foreach ($data['settings'] as $s) {
                DB::table('system_settings')
                    ->where('setting_key', $s['key'])
                    ->update([
                        'setting_value' => (string) $s['value'],
                        'updated_at' => now()
                    ]);
            }
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in updateSettings: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function health(Request $request): JsonResponse
    {
        try {
            $data = [
                'status' => 'healthy',
                'timestamp' => now(),
                'services' => [
                    'database' => 'healthy',
                    'redis' => 'unknown',
                    'storage' => 'healthy'
                ],
                'version' => '1.0.0'
            ];
            
            return $this->success($data);

        } catch (\Exception $e) {
            \Log::error('Error in health: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function stats(Request $request): JsonResponse
    {
        try {
            $data = [
                'totalUsers' => (int) DB::table('users')->count(),
                'totalCourses' => (int) DB::table('courses')->count(),
                'totalBooks' => (int) DB::table('books')->count(),
                'totalOrders' => (int) DB::table('orders')->count(),
                'systemUptime' => 0,
                'storageUsed' => 'N/A',
                'lastBackup' => null,
            ];
            
            return $this->success($data);

        } catch (\Exception $e) {
            \Log::error('Error in stats: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
