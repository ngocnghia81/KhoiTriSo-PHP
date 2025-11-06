<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lesson_id');
            $table->string('title', 200);
            $table->text('description');
            $table->unsignedTinyInteger('assignment_type');
            $table->integer('max_score');
            $table->integer('time_limit')->nullable();
            $table->integer('max_attempts')->default(1);
            $table->unsignedTinyInteger('show_answers_after');
            $table->timestamp('due_date')->nullable();
            $table->boolean('is_published')->default(false);
            $table->decimal('passing_score', 5, 2)->nullable();
            $table->boolean('shuffle_questions')->default(false);
            $table->boolean('shuffle_options')->default(true);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            $table->index(['lesson_id', 'assignment_type']);
        });

        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('context_type');
            $table->unsignedBigInteger('context_id');
            $table->longText('question_content');
            $table->unsignedTinyInteger('question_type');
            $table->unsignedTinyInteger('difficulty_level');
            $table->json('points');
            $table->decimal('default_points', 5, 2)->default(0.25);
            $table->longText('explanation_content')->nullable();
            $table->text('question_image')->nullable();
            $table->text('video_url')->nullable();
            $table->integer('time_limit')->nullable();
            $table->string('subject_type', 50)->nullable();
            $table->integer('order_index')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->index(['context_type', 'context_id']);
            $table->index(['question_type', 'difficulty_level']);
        });

        Schema::create('question_options', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('question_id');
            $table->longText('option_content');
            $table->text('option_image')->nullable();
            $table->boolean('is_correct');
            $table->integer('order_index')->default(0);
            $table->decimal('points_value', 5, 2)->nullable();
            $table->longText('explanation_text')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('question_id')->references('id')->on('questions')->cascadeOnDelete();
            $table->index(['question_id', 'order_index']);
        });

        Schema::create('user_assignment_attempts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assignment_id');
            $table->unsignedBigInteger('user_id');
            $table->integer('attempt_number');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('submitted_at')->nullable();
            $table->decimal('score', 10, 2)->nullable();
            $table->boolean('is_completed')->default(false);
            $table->boolean('is_passed')->nullable();
            $table->integer('time_spent')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('assignment_id')->references('id')->on('assignments')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['assignment_id', 'user_id']);
        });

        Schema::create('user_assignment_answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('attempt_id');
            $table->unsignedBigInteger('question_id');
            $table->unsignedBigInteger('option_id')->nullable();
            $table->longText('answer_text')->nullable();
            $table->boolean('is_correct')->nullable();
            $table->decimal('points_earned', 10, 2);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->unique(['attempt_id', 'question_id']);
            $table->foreign('attempt_id')->references('id')->on('user_assignment_attempts')->cascadeOnDelete();
            $table->foreign('question_id')->references('id')->on('questions')->cascadeOnDelete();
            $table->foreign('option_id')->references('id')->on('question_options')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_assignment_answers');
        Schema::dropIfExists('user_assignment_attempts');
        Schema::dropIfExists('question_options');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('assignments');
    }
};



