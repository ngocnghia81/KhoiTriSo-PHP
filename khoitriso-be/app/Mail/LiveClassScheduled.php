<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LiveClassScheduled extends Mailable
{
    use Queueable, SerializesModels;

    public $liveClass;
    public $course;
    public $userName;

    /**
     * Create a new message instance.
     */
    public function __construct($liveClass, $course, $userName)
    {
        $this->liveClass = $liveClass;
        $this->course = $course;
        $this->userName = $userName;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $scheduledAt = \Carbon\Carbon::parse($this->liveClass->scheduled_at);
        $formattedDate = $scheduledAt->format('d/m/Y');
        $formattedTime = $scheduledAt->format('H:i');
        
        return $this->subject("📅 Lớp học trực tuyến: {$this->liveClass->title} - {$formattedDate} lúc {$formattedTime}")
                    ->view('emails.live-class-scheduled')
                    ->with([
                        'liveClass' => $this->liveClass,
                        'course' => $this->course,
                        'userName' => $this->userName,
                        'scheduledDate' => $formattedDate,
                        'scheduledTime' => $formattedTime,
                    ]);
    }
}

