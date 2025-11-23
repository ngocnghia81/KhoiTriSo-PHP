<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AssignmentCreated extends Mailable
{
    use Queueable, SerializesModels;

    public $assignment;
    public $lesson;
    public $course;
    public $userName;
    public $assignmentTypeName;
    public $dueDateFormatted;

    /**
     * Create a new message instance.
     */
    public function __construct($assignment, $lesson, $course, $userName)
    {
        $this->assignment = $assignment;
        $this->lesson = $lesson;
        $this->course = $course;
        $this->userName = $userName;
        
        $assignmentTypeNames = [
            1 => 'Quiz',
            2 => 'Homework',
            3 => 'Exam',
            4 => 'Practice',
        ];
        $this->assignmentTypeName = $assignmentTypeNames[$assignment->assignment_type] ?? 'Bài tập';
        
        if ($assignment->due_date) {
            $dueDate = \Carbon\Carbon::parse($assignment->due_date);
            $this->dueDateFormatted = $dueDate->format('d/m/Y H:i');
        } else {
            $this->dueDateFormatted = null;
        }
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $subject = "📝 Bài tập mới: {$this->assignment->title} - {$this->course->title}";
        
        return $this->subject($subject)
                    ->view('emails.assignment-created')
                    ->with([
                        'assignment' => $this->assignment,
                        'lesson' => $this->lesson,
                        'course' => $this->course,
                        'userName' => $this->userName,
                        'assignmentTypeName' => $this->assignmentTypeName,
                        'dueDateFormatted' => $this->dueDateFormatted,
                    ]);
    }
}

