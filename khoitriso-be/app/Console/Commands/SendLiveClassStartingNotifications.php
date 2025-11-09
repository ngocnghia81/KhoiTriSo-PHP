<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\LiveClass;
use App\Models\CourseEnrollment;
use App\Models\Notification;
use App\Models\Course;
use App\Mail\LiveClassStarting;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SendLiveClassStartingNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'live-class:send-starting-notifications';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send notifications and emails when live classes are starting';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for live classes starting now...');
        
        // Get live classes that are scheduled to start within the next 5 minutes
        // and haven't been sent starting notifications yet
        $now = Carbon::now();
        $fiveMinutesFromNow = $now->copy()->addMinutes(5);
        
        // Get all live classes starting soon
        $allLiveClasses = LiveClass::where('status', 1) // Scheduled
            ->whereBetween('scheduled_at', [$now, $fiveMinutesFromNow])
            ->with('course')
            ->get();
        
        // Filter out those that already have starting notifications sent
        $liveClasses = $allLiveClasses->filter(function($liveClass) {
            // Check if starting notification already sent for any user
            $existingNotification = Notification::where('type', 4)
                ->where('action_url', "/live-classes/{$liveClass->id}")
                ->exists();
            return !$existingNotification;
        });
        
        if ($liveClasses->isEmpty()) {
            $this->info('No live classes starting soon.');
            return 0;
        }
        
        $this->info("Found {$liveClasses->count()} live class(es) starting soon.");
        
        $totalSent = 0;
        
        foreach ($liveClasses as $liveClass) {
            $this->info("Processing live class: {$liveClass->title}");
            
            $course = $liveClass->course;
            if (!$course) {
                $this->warn("Course not found for live class {$liveClass->id}");
                continue;
            }
            
            // Get all enrolled students
            $enrollments = CourseEnrollment::where('course_id', $liveClass->course_id)
                ->where('is_active', true)
                ->with('user')
                ->get();
            
            if ($enrollments->isEmpty()) {
                $this->warn("No enrolled students for live class {$liveClass->id}");
                continue;
            }
            
            $sentCount = 0;
            
            foreach ($enrollments as $enrollment) {
                $user = $enrollment->user;
                if (!$user) continue;
                
                // Create notification
                try {
                    Notification::create([
                        'user_id' => $user->id,
                        'title' => "🔴 Lớp học đang bắt đầu: {$liveClass->title}",
                        'message' => "Lớp học trực tuyến '{$liveClass->title}' của khóa học '{$course->title}' đang bắt đầu ngay bây giờ! Hãy tham gia ngay.",
                        'type' => 4, // Live class starting type
                        'action_url' => "/live-classes/{$liveClass->id}",
                        'priority' => 1, // High priority
                        'is_read' => false,
                    ]);
                } catch (\Exception $e) {
                    Log::error("Failed to create starting notification for user {$user->id}: " . $e->getMessage());
                    continue;
                }
                
                // Send email
                try {
                    Mail::to($user->email)->send(new LiveClassStarting(
                        $liveClass,
                        $course,
                        $user->name
                    ));
                    $sentCount++;
                } catch (\Exception $e) {
                    Log::error("Failed to send starting email to {$user->email}: " . $e->getMessage());
                }
            }
            
            $totalSent += $sentCount;
            $this->info("Sent {$sentCount} notifications/emails for live class {$liveClass->id}");
        }
        
        $this->info("Total notifications/emails sent: {$totalSent}");
        
        return 0;
    }
}

