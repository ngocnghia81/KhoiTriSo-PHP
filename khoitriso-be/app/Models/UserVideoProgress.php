<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserVideoProgress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id','lesson_id','video_position','video_duration','watch_percentage','is_completed','last_watched_at'
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'last_watched_at' => 'datetime',
    ];
}









