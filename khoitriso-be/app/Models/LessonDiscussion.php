<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LessonDiscussion extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_id','user_id','parent_id','content','video_timestamp','is_instructor','like_count','is_hidden'
    ];

    protected $casts = [
        'is_instructor' => 'boolean',
        'is_hidden' => 'boolean',
    ];
}









