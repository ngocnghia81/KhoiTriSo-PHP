<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookActivationCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id','activation_code','is_used','used_by_id'
    ];

    protected $casts = [
        'is_used' => 'boolean',
    ];
}


