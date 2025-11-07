<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserController extends BaseController
{
    public function profile(Request $request)
    {
        $u = $request->user();
        if (!$u) {
            return $this->error('UNAUTHORIZED', null, 'User not authenticated', 401);
        }
        
        $profileData = [
            'id' => $u->id,
            'username' => $u->name,
            'email' => $u->email,
            'fullName' => $u->name,
            'avatar' => $u->avatar, // Get avatar from database
            'role' => $u->role ?? 'student',
            'isActive' => $u->is_active ?? true,
            'emailVerified' => (bool) $u->email_verified_at,
        ];
        
        return $this->success($profileData);
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'fullName' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);
        $u = $request->user();
        if (!$u) {
            return $this->error('UNAUTHORIZED', null, 'User not authenticated', 401);
        }
        
        if (isset($data['fullName'])) {
            $u->name = $data['fullName'];
        }
        $u->save();
        
        // Return updated profile
        $profileData = [
            'id' => $u->id,
            'username' => $u->name,
            'email' => $u->email,
            'fullName' => $u->name,
            'avatar' => $u->avatar,
            'role' => $u->role ?? 'student',
            'isActive' => $u->is_active ?? true,
            'emailVerified' => (bool) $u->email_verified_at,
        ];
        
        return $this->success($profileData);
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'currentPassword' => ['required', 'string'],
            'newPassword' => ['required', 'string', 'min:8'],
        ]);
        if (! password_verify($data['currentPassword'], $request->user()->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid current password'], 400);
        }
        $request->user()->password = bcrypt($data['newPassword']);
        $request->user()->save();
        return response()->json(['success' => true, 'message' => 'Password changed successfully']);
    }

    public function uploadAvatar(Request $request)
    {
        $file = $request->file('file');
        if (! $file || ! $file->isValid()) return response()->json(['success' => false, 'message' => 'Invalid file'], 400);
        $path = $file->store('avatars', 'public');
        // Assume avatar path in a profile table; here return URL
        return response()->json(['success' => true, 'avatarUrl' => Storage::url($path)]);
    }

    public function getById(int $id)
    {
        $u = User::select('id','name as username','email')->findOrFail($id);
        return response()->json($u);
    }

    public function search(Request $request)
    {
        $q = $request->query('q', '');
        $res = User::select('id','name as username','email')
            ->where(function ($w) use ($q) { $w->where('name','like',"%$q%")->orWhere('email','like',"%$q%"); })
            ->paginate((int) $request->query('pageSize', 20));
        return response()->json(['users' => $res->items(), 'total' => $res->total(), 'hasMore' => $res->hasMorePages()]);
    }
}


