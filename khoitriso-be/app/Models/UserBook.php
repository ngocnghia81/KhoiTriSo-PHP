<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserBook extends Model
{
    use HasFactory;

    protected $fillable = [
        'activation_code_id','user_id','expires_at','is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'expires_at' => 'datetime',
    ];

    public function activationCode()
    {
        return $this->belongsTo(BookActivationCode::class, 'activation_code_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}














