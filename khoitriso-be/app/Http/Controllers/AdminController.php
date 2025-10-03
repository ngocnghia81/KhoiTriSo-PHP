<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function listUsers(Request $request)
    {
        $q = User::query();
        if ($request->filled('role')) $q->where('role', $request->integer('role'));
        if ($request->filled('isActive')) $q->where('is_active', filter_var($request->query('isActive'), FILTER_VALIDATE_BOOLEAN));
        if ($s = $request->query('search')) $q->where(function ($w) use ($s) { $w->where('name','like',"%$s%")->orWhere('email','like',"%$s%"); });
        $res = $q->paginate((int) $request->query('pageSize', 20));
        return response()->json(['users' => $res->items(), 'total' => $res->total(), 'hasMore' => $res->hasMorePages()]);
    }

    public function updateUser(int $id, Request $request)
    {
        $data = $request->validate([
            'role' => ['nullable','integer'],
            'isActive' => ['nullable','boolean'],
            'emailVerified' => ['nullable','boolean'],
        ]);
        $u = User::findOrFail($id);
        $u->is_active = array_key_exists('isActive',$data) ? (bool)$data['isActive'] : $u->is_active;
        if (array_key_exists('emailVerified',$data) && $data['emailVerified']) $u->email_verified_at = now();
        $u->save();
        return response()->json(['success' => true, 'user' => $u]);
    }

    public function createInstructor(Request $request)
    {
        $data = $request->validate([
            'username' => ['required','string','max:50'],
            'email' => ['required','string','email','max:100','unique:users,email'],
            'password' => ['required','string','min:8'],
            'fullName' => ['required','string','max:100'],
            'phone' => ['nullable','string','max:20'],
        ]);
        $u = new User();
        $u->name = $data['fullName'] ?: $data['username'];
        $u->email = $data['email'];
        $u->password = \Illuminate\Support\Facades\Hash::make($data['password']);
        $u->is_active = true;
        $u->email_verified_at = now();
        $u->save();
        return response()->json(['success' => true, 'user' => $u], 201);
    }

    public function resetInstructorPassword(Request $request)
    {
        $data = $request->validate([
            'instructorId' => ['required','integer','exists:users,id'],
            'newPassword' => ['required','string','min:8'],
        ]);
        $u = User::findOrFail($data['instructorId']);
        $u->password = \Illuminate\Support\Facades\Hash::make($data['newPassword']);
        $u->save();
        return response()->json(['success' => true]);
    }
}


