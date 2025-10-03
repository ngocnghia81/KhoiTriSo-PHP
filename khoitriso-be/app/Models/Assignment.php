<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_id','title','description','assignment_type','max_score','time_limit','max_attempts','show_answers_after','due_date','is_published','passing_score','shuffle_questions','shuffle_options'
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'due_date' => 'datetime',
        'shuffle_questions' => 'boolean',
        'shuffle_options' => 'boolean',
    ];

    public function lesson()
    {
        return $this->belongsTo(\App\Models\Lesson::class, 'lesson_id');
    }
}


