<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserAssignmentAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'attempt_id','question_id','option_id','answer_text','is_correct','points_earned'
    ];

    protected $casts = [
        'is_correct' => 'boolean',
    ];
}


