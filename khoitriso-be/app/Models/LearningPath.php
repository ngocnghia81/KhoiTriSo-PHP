<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LearningPath extends Model
{
    use HasFactory;

    protected $fillable = [
        'title','description','thumbnail','instructor_id','category_id','estimated_duration','difficulty_level','price','is_published','is_active','approval_status','quality_score','review_notes'
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function courses()
    {
        return $this->hasMany(LearningPathCourse::class, 'learning_path_id');
    }
}


