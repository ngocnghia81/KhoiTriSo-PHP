<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('title', 200);
            $table->longText('message');
            $table->unsignedTinyInteger('type');
            $table->string('action_url', 500)->nullable();
            $table->boolean('is_read')->default(false);
            $table->unsignedTinyInteger('priority')->default(2);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['user_id', 'type', 'is_read', 'priority']);
        });

        Schema::create('user_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('correlation_id', 36)->nullable();
            $table->string('module', 100)->nullable();
            $table->string('action', 100)->nullable();
            $table->string('table_name', 100)->nullable();
            $table->unsignedBigInteger('record_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('description', 1000)->nullable();
            $table->string('status', 50)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'module', 'table_name', 'created_at']);
        });

        Schema::create('daily_analytics', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->integer('total_users')->default(0);
            $table->integer('active_users')->default(0);
            $table->integer('new_registrations')->default(0);
            $table->integer('total_courses')->default(0);
            $table->integer('total_books')->default(0);
            $table->integer('total_learning_paths')->default(0);
            $table->decimal('total_revenue', 15, 2)->default(0);
            $table->integer('total_orders')->default(0);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();
        });

        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('setting_key', 100)->unique();
            $table->longText('setting_value');
            $table->unsignedTinyInteger('setting_type');
            $table->text('description');
            $table->boolean('is_public')->default(false);
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->string('updated_by')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('daily_analytics');
        Schema::dropIfExists('user_activity_logs');
        Schema::dropIfExists('notifications');
    }
};

















