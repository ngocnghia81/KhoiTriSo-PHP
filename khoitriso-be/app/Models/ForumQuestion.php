<?php

namespace App\Models;

use Jenssegers\Mongodb\Eloquent\Model as Eloquent;

class ForumQuestion extends Eloquent
{
    protected $connection = 'mongodb';
    protected $collection = 'forum_questions';

    protected $fillable = [
        'title', 'content', 'author', 'user_id', 'category', 'tags', 'views', 'votes', 'answers', 'isSolved', 'created_at', 'updated_at'
    ];

    protected $casts = [
        'author' => 'array',
        'category' => 'array',
        'tags' => 'array',
        'answers' => 'array',
        'views' => 'integer',
        'votes' => 'integer',
        'isSolved' => 'boolean',
    ];
}


