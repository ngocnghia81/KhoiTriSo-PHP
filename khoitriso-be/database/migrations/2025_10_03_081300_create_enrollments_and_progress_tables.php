<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('course_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('progress_percentage', 5, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->unique(['course_id', 'user_id']);
            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('user_lesson_progresses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('lesson_id');
            $table->boolean('is_completed')->default(false);
            $table->integer('watch_time')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('last_accessed')->useCurrent();
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->unique(['user_id', 'lesson_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
        });

        Schema::create('user_video_progresses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('lesson_id');
            $table->integer('video_position')->default(0);
            $table->integer('video_duration');
            $table->decimal('watch_percentage', 5, 2)->default(0);
            $table->boolean('is_completed')->default(false);
            $table->timestamp('last_watched_at')->useCurrent();
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->unique(['user_id', 'lesson_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_video_progresses');
        Schema::dropIfExists('user_lesson_progresses');
        Schema::dropIfExists('course_enrollments');
    }
};


