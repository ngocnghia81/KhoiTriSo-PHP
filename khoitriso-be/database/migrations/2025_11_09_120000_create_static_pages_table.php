<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('static_pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 200)->unique();
            $table->string('title', 200);
            $table->text('meta_description')->nullable();
            $table->string('meta_keywords', 500)->nullable();
            $table->longText('content');
            $table->string('template', 50)->default('default');
            $table->boolean('is_published')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('view_count')->default(0);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();
            
            $table->index(['slug', 'is_published', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('static_pages');
    }
};

