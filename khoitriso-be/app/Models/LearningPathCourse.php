<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LearningPathCourse extends Model
{
    use HasFactory;

    protected $fillable = [
        'learning_path_id','course_id','order_index','is_required'
    ];
}


