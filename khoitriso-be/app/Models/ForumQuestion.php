<?php

namespace App\Models;

use Jenssegers\Mongodb\Eloquent\Model as Eloquent;

class ForumQuestion extends Eloquent
{
    protected $connection = 'mongodb';
    protected $collection = 'forum_questions';

    protected $fillable = [
        'title', 'content', 'author', 'category', 'tags', 'views', 'votes', 'answers', 'isSolved'
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


