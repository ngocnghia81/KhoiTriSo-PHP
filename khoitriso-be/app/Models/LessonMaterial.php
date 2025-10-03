<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LessonMaterial extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_id','title','file_name','file_path','file_type','file_size','download_count'
    ];

    public function lesson()
    {
        return $this->belongsTo(Lesson::class, 'lesson_id');
    }
}


