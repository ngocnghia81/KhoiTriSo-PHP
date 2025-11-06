<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id','item_type','item_id','certificate_number','completion_percentage','final_score','issued_at','certificate_url','is_valid'
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'is_valid' => 'boolean',
    ];
}









