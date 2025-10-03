<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('order_code', 50)->unique();
            $table->decimal('total_amount', 15, 2);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('final_amount', 10, 2);
            $table->unsignedTinyInteger('status');
            $table->string('payment_method', 50);
            $table->string('payment_gateway', 50);
            $table->string('transaction_id', 100)->nullable();
            $table->string('currency', 3)->default('VND');
            $table->decimal('exchange_rate', 10, 4)->default(1.0000);
            $table->timestamp('paid_at')->nullable();
            $table->json('billing_address')->nullable();
            $table->text('order_notes')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['user_id', 'status']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('item_id');
            $table->unsignedTinyInteger('item_type');
            $table->string('item_name', 200);
            $table->decimal('price', 15, 2);
            $table->integer('quantity')->default(1);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->index(['item_type', 'item_id']);
        });

        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('item_id');
            $table->unsignedTinyInteger('item_type');
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->unique(['user_id', 'item_id', 'item_type']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['item_type', 'item_id']);
        });

        Schema::create('wishlists', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('item_id');
            $table->unsignedTinyInteger('item_type');
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->unique(['user_id', 'item_id', 'item_type']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['item_type', 'item_id']);
        });

        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('discount_type');
            $table->decimal('discount_value', 10, 2);
            $table->decimal('max_discount_amount', 10, 2)->nullable();
            $table->decimal('min_order_amount', 10, 2)->default(0);
            $table->timestamp('valid_from');
            $table->timestamp('valid_to');
            $table->integer('usage_limit')->nullable();
            $table->integer('used_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('applicable_item_types')->nullable();
            $table->json('applicable_item_ids')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();
        });

        Schema::create('coupon_usages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('coupon_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('order_id');
            $table->decimal('discount_amount', 10, 2);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('coupon_id')->references('id')->on('coupons')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupon_usages');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('wishlists');
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};


