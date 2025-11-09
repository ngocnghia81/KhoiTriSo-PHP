<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id','title','description','lesson_order','video_url','video_duration','content_text','static_page_path','is_published','is_free'
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_free' => 'boolean',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function materials()
    {
        return $this->hasMany(LessonMaterial::class, 'lesson_id');
    }
}
















