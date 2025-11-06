<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->text('static_page_path');
            $table->text('description');
            $table->unsignedBigInteger('author_id')->nullable();
            $table->string('isbn', 20)->unique();
            $table->string('cover_image', 255);
            $table->decimal('price', 10, 2);
            $table->string('ebook_file', 255);
            $table->unsignedBigInteger('category_id')->nullable();
            $table->integer('total_questions')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedTinyInteger('approval_status')->default(1)->index();
            $table->string('language', 10)->default('vi');
            $table->integer('publication_year')->nullable();
            $table->string('edition', 50)->nullable();
            $table->unsignedTinyInteger('quality_score')->nullable();
            $table->text('review_notes')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('author_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
        });

        Schema::create('book_chapters', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('book_id');
            $table->string('title', 200);
            $table->text('description');
            $table->integer('order_index');
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('book_id')->references('id')->on('books')->cascadeOnDelete();
            $table->index(['book_id', 'order_index']);
        });

        Schema::create('book_activation_codes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('book_id');
            $table->string('activation_code', 50)->unique();
            $table->boolean('is_used')->default(false);
            $table->unsignedBigInteger('used_by_id')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('book_id')->references('id')->on('books')->cascadeOnDelete();
            $table->foreign('used_by_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['book_id', 'activation_code']);
        });

        Schema::create('user_books', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('activation_code_id')->unique();
            $table->unsignedBigInteger('user_id');
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('activation_code_id')->references('id')->on('book_activation_codes')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_books');
        Schema::dropIfExists('book_activation_codes');
        Schema::dropIfExists('book_chapters');
        Schema::dropIfExists('books');
    }
};



