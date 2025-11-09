<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'title','static_page_path','description','author_id','isbn','cover_image','price','ebook_file','category_id','total_questions','is_active','approval_status','language','publication_year','edition','quality_score','review_notes'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function chapters()
    {
        return $this->hasMany(BookChapter::class, 'book_id');
    }
}
















