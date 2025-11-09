<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaticPage extends Model
{
    protected $table = 'static_pages';
    
    protected $fillable = [
        'slug',
        'title',
        'meta_description',
        'meta_keywords',
        'content',
        'template',
        'is_published',
        'is_active',
        'view_count',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_active' => 'boolean',
        'view_count' => 'integer',
    ];
}

