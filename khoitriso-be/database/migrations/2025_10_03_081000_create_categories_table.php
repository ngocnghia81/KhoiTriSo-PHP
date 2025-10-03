<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->text('description');
            $table->unsignedBigInteger('parent_id')->nullable()->index();
            $table->string('icon', 50);
            $table->boolean('is_active')->default(true)->index();
            $table->integer('order_index')->default(0)->index();
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('parent_id')->references('id')->on('categories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};


