<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedTinyInteger('item_type');
            $table->unsignedBigInteger('item_id');
            $table->unsignedTinyInteger('rating');
            $table->string('review_title', 200)->nullable();
            $table->longText('review_content')->nullable();
            $table->boolean('is_verified_purchase')->default(false);
            $table->integer('helpful_count')->default(0);
            $table->boolean('is_approved')->default(true);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->unique(['user_id', 'item_type', 'item_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['item_type', 'item_id']);
        });

        Schema::create('live_classes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('course_id');
            $table->unsignedBigInteger('instructor_id');
            $table->string('title', 200);
            $table->longText('description');
            $table->string('meeting_url', 500);
            $table->string('meeting_id', 100);
            $table->string('meeting_password', 50)->nullable();
            $table->timestamp('scheduled_at');
            $table->integer('duration_minutes');
            $table->integer('max_participants')->nullable();
            $table->unsignedTinyInteger('status');
            $table->string('recording_url', 500)->nullable();
            $table->unsignedTinyInteger('recording_status')->default(0);
            $table->boolean('chat_enabled')->default(true);
            $table->boolean('recording_enabled')->default(true);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
            $table->foreign('instructor_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['course_id', 'scheduled_at']);
        });

        Schema::create('live_class_participants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_class_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamp('joined_at')->useCurrent();
            $table->integer('attendance_duration')->default(0);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->unique(['live_class_id', 'user_id']);
            $table->foreign('live_class_id')->references('id')->on('live_classes')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('lesson_discussions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lesson_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->longText('content');
            $table->integer('video_timestamp')->nullable();
            $table->boolean('is_instructor')->default(false);
            $table->integer('like_count')->default(0);
            $table->boolean('is_hidden')->default(false);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('parent_id')->references('id')->on('lesson_discussions')->cascadeOnDelete();
            $table->index(['lesson_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_discussions');
        Schema::dropIfExists('live_class_participants');
        Schema::dropIfExists('live_classes');
        Schema::dropIfExists('reviews');
    }
};










