<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('course_id');
            $table->string('title', 200);
            $table->text('description');
            $table->integer('lesson_order');
            $table->string('video_url', 255);
            $table->integer('video_duration')->nullable();
            $table->longText('content_text');
            $table->text('static_page_path');
            $table->boolean('is_published')->default(false);
            $table->boolean('is_free')->default(false);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
            $table->index(['course_id', 'lesson_order']);
        });

        Schema::create('lesson_materials', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lesson_id');
            $table->string('title', 200);
            $table->string('file_name', 255);
            $table->string('file_path', 255);
            $table->string('file_type', 20);
            $table->integer('file_size')->nullable();
            $table->integer('download_count')->default(0);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            $table->index('lesson_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_materials');
        Schema::dropIfExists('lessons');
    }
};


