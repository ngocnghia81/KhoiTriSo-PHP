<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id','order_code','total_amount','discount_amount','tax_amount','final_amount','status','payment_method','payment_gateway','transaction_id','currency','exchange_rate','paid_at','billing_address','order_notes'
    ];

    protected $casts = [
        'billing_address' => 'array',
        'paid_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }
}









