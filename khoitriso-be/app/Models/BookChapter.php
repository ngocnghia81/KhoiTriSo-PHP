<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookChapter extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id','title','description','order_index'
    ];

    public function book()
    {
        return $this->belongsTo(Book::class, 'book_id');
    }

    public function questions()
    {
        // context_type = 2 for book_chapter (assuming 1 = assignment, 2 = book_chapter)
        return $this->hasMany(Question::class, 'context_id')
            ->where('context_type', 2)
            ->whereRaw('is_active = true')
            ->orderBy('order_index');
    }
}














