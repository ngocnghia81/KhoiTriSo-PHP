<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InstructorAccountCreated extends Mailable
{
    use Queueable, SerializesModels;

    public $email;
    public $password;
    public $name;

    /**
     * Create a new message instance.
     */
    public function __construct(string $email, string $password, string $name)
    {
        $this->email = $email;
        $this->password = $password;
        $this->name = $name;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Tài khoản giảng viên đã được tạo - Khởi Trí Số')
                    ->view('emails.instructor-account-created')
                    ->with([
                        'email' => $this->email,
                        'password' => $this->password,
                        'name' => $this->name,
                    ]);
    }
}
