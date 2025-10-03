<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserLearningPath extends Model
{
    use HasFactory;

    protected $fillable = [
        'learning_path_id','user_id','enrolled_at','completed_at','progress_percentage','is_active'
    ];

    protected $casts = [
        'enrolled_at' => 'datetime',
        'completed_at' => 'datetime',
        'is_active' => 'boolean',
    ];
}


