<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'context_type','context_id','question_content','question_type','difficulty_level','points','default_points','explanation_content','question_image','video_url','time_limit','subject_type','order_index','is_active'
    ];

    protected $casts = [
        'points' => 'array',
        'is_active' => 'boolean',
    ];

    public function options()
    {
        return $this->hasMany(QuestionOption::class, 'question_id');
    }
}










