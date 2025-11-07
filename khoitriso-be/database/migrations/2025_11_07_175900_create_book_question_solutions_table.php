<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('book_question_solutions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('question_id');
            $table->unsignedTinyInteger('solution_type'); // 1 = video, 2 = text, 3 = latex, 4 = image
            $table->longText('content'); // Video URL, text content, or LaTeX content
            $table->text('video_url')->nullable(); // For video type
            $table->text('image_url')->nullable(); // For image type
            $table->text('latex_content')->nullable(); // For LaTeX type
            $table->integer('order_index')->default(0); // In case a question has multiple solutions
            $table->boolean('is_active')->default(true);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('question_id')->references('id')->on('questions')->cascadeOnDelete();
            $table->index(['question_id', 'order_index']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('book_question_solutions');
    }
};
