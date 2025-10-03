<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->text('static_page_path');
            $table->text('description');
            $table->string('thumbnail', 255);
            $table->unsignedBigInteger('instructor_id');
            $table->unsignedBigInteger('category_id');
            $table->unsignedTinyInteger('level');
            $table->boolean('is_free')->default(false);
            $table->decimal('price', 10, 2)->default(0);
            $table->integer('total_lessons')->default(0);
            $table->integer('total_students')->default(0);
            $table->decimal('rating', 3, 2)->default(0);
            $table->integer('total_reviews')->default(0);
            $table->boolean('is_published')->default(false)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedTinyInteger('approval_status')->default(1)->index();
            $table->integer('estimated_duration')->nullable();
            $table->string('language', 10)->default('vi');
            $table->json('requirements')->nullable();
            $table->json('what_you_will_learn')->nullable();
            $table->unsignedTinyInteger('quality_score')->nullable();
            $table->text('review_notes')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('instructor_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('category_id')->references('id')->on('categories');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};


