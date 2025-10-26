<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserAssignmentAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'assignment_id','user_id','attempt_number','started_at','submitted_at','score','is_completed','is_passed','time_spent'
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
        'is_completed' => 'boolean',
        'is_passed' => 'boolean',
    ];
}










