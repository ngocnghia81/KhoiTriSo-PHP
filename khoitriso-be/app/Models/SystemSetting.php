<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $table = 'system_settings';
    
    protected $fillable = [
        'setting_key',
        'setting_value',
        'setting_type',
        'description',
        'is_public',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    // Setting types: 1=text, 2=number, 3=boolean, 4=json
    const TYPE_TEXT = 1;
    const TYPE_NUMBER = 2;
    const TYPE_BOOLEAN = 3;
    const TYPE_JSON = 4;
}

