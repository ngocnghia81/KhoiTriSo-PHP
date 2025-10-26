<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuestionOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id','option_content','option_image','is_correct','order_index','points_value','explanation_text'
    ];

    protected $casts = [
        'is_correct' => 'boolean',
    ];
}










