<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_id','title','description','assignment_type','max_score','time_limit','max_attempts','show_answers_after','due_date','is_published','passing_score','shuffle_questions','shuffle_options','is_active'
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'due_date' => 'datetime',
        'shuffle_questions' => 'boolean',
        'shuffle_options' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function lesson()
    {
        return $this->belongsTo(\App\Models\Lesson::class, 'lesson_id');
    }

    public function questions()
    {
        return $this->hasMany(\App\Models\Question::class, 'context_id')
            ->where('context_type', 1)
            ->orderBy('order_index');
    }

    public function attempts()
    {
        return $this->hasMany(\App\Models\UserAssignmentAttempt::class, 'assignment_id');
    }
}


