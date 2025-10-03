<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_paths', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->text('description');
            $table->string('thumbnail', 255)->nullable();
            $table->unsignedBigInteger('instructor_id');
            $table->unsignedBigInteger('category_id')->nullable();
            $table->integer('estimated_duration')->nullable();
            $table->unsignedTinyInteger('difficulty_level');
            $table->decimal('price', 10, 2)->default(0);
            $table->boolean('is_published')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedTinyInteger('approval_status')->default(1);
            $table->unsignedTinyInteger('quality_score')->nullable();
            $table->text('review_notes')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('instructor_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
        });

        Schema::create('learning_path_courses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('learning_path_id');
            $table->unsignedBigInteger('course_id');
            $table->integer('order_index');
            $table->boolean('is_required')->default(true);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->unique(['learning_path_id', 'course_id']);
            $table->unique(['learning_path_id', 'order_index']);
            $table->foreign('learning_path_id')->references('id')->on('learning_paths')->cascadeOnDelete();
            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
        });

        Schema::create('user_learning_paths', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('learning_path_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('progress_percentage', 5, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->unique(['learning_path_id', 'user_id']);
            $table->foreign('learning_path_id')->references('id')->on('learning_paths')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedTinyInteger('item_type');
            $table->unsignedBigInteger('item_id');
            $table->string('certificate_number', 50)->unique();
            $table->decimal('completion_percentage', 5, 2);
            $table->decimal('final_score', 5, 2)->nullable();
            $table->timestamp('issued_at')->useCurrent();
            $table->string('certificate_url', 255)->nullable();
            $table->boolean('is_valid')->default(true);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->unique(['user_id', 'item_type', 'item_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['item_type', 'item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('user_learning_paths');
        Schema::dropIfExists('learning_path_courses');
        Schema::dropIfExists('learning_paths');
    }
};


