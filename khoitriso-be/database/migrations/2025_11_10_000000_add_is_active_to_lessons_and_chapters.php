<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add is_active to lessons table
        if (!Schema::hasColumn('lessons', 'is_active')) {
            Schema::table('lessons', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('is_free');
            });
        }

        // Add is_active to book_chapters table
        if (!Schema::hasColumn('book_chapters', 'is_active')) {
            Schema::table('book_chapters', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('order_index');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('lessons', 'is_active')) {
            Schema::table('lessons', function (Blueprint $table) {
                $table->dropColumn('is_active');
            });
        }

        if (Schema::hasColumn('book_chapters', 'is_active')) {
            Schema::table('book_chapters', function (Blueprint $table) {
                $table->dropColumn('is_active');
            });
        }
    }
};

