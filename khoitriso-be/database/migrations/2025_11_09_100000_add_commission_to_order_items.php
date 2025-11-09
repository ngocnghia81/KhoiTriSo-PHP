<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedBigInteger('instructor_id')->nullable()->after('item_id');
            $table->decimal('commission_rate', 5, 2)->default(0)->after('quantity');
            $table->decimal('commission_amount', 15, 2)->default(0)->after('commission_rate');
            $table->decimal('instructor_revenue', 15, 2)->default(0)->after('commission_amount');
            
            $table->index('instructor_id');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['instructor_id']);
            $table->dropColumn(['instructor_id', 'commission_rate', 'commission_amount', 'instructor_revenue']);
        });
    }
};

