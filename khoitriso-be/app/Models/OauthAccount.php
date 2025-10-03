<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OauthAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id','provider','provider_id'
    ];
}


