<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code','name','description','discount_type','discount_value','max_discount_amount','min_order_amount','valid_from','valid_to','usage_limit','used_count','is_active','applicable_item_types','applicable_item_ids'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'valid_from' => 'datetime',
        'valid_to' => 'datetime',
        'applicable_item_types' => 'array',
        'applicable_item_ids' => 'array',
    ];
}









