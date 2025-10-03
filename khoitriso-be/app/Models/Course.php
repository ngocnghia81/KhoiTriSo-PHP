<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'title','static_page_path','description','thumbnail','instructor_id','category_id','level','is_free','price','total_lessons','total_students','rating','total_reviews','is_published','is_active','approval_status','estimated_duration','language','requirements','what_you_will_learn','quality_score','review_notes'
    ];

    protected $casts = [
        'is_free' => 'boolean',
        'is_published' => 'boolean',
        'is_active' => 'boolean',
        'requirements' => 'array',
        'what_you_will_learn' => 'array',
    ];

    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class, 'course_id');
    }

    public function enrollments()
    {
        return $this->hasMany(CourseEnrollment::class, 'course_id');
    }
}


