<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule live class starting notifications to run every minute
Schedule::command('live-class:send-starting-notifications')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();
