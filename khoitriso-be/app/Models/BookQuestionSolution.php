<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookQuestionSolution extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id',
        'solution_type', // 1 = video, 2 = text, 3 = latex, 4 = image
        'content',
        'video_url',
        'image_url',
        'latex_content',
        'order_index',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'solution_type' => 'integer',
        'order_index' => 'integer',
    ];

    public function question()
    {
        return $this->belongsTo(Question::class, 'question_id');
    }

    // Helper methods
    public function isVideo(): bool
    {
        return $this->solution_type === 1;
    }

    public function isText(): bool
    {
        return $this->solution_type === 2;
    }

    public function isLatex(): bool
    {
        return $this->solution_type === 3;
    }

    public function isImage(): bool
    {
        return $this->solution_type === 4;
    }
}
