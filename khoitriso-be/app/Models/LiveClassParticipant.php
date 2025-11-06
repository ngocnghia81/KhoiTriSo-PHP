<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LiveClassParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'live_class_id','user_id','joined_at','attendance_duration'
    ];

    protected $casts = [
        'joined_at' => 'datetime',
    ];
}









