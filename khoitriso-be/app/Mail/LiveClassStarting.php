<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LiveClassStarting extends Mailable
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
        return $this->subject("🔴 Lớp học trực tuyến đang bắt đầu: {$this->liveClass->title}")
                    ->view('emails.live-class-starting')
                    ->with([
                        'liveClass' => $this->liveClass,
                        'course' => $this->course,
                        'userName' => $this->userName,
                    ]);
    }
}

