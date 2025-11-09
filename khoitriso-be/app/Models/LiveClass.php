<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LiveClass extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id','instructor_id','title','description','meeting_url','meeting_id','meeting_password','scheduled_at','duration_minutes','max_participants','status','recording_url','recording_status','chat_enabled','recording_enabled'
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'chat_enabled' => 'boolean',
        'recording_enabled' => 'boolean',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }
}









