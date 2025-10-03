<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseEnrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id','user_id','enrolled_at','completed_at','progress_percentage','is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'enrolled_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}


