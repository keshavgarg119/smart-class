import logging

logger = logging.getLogger(__name__)

def send_daily_schedule_email(email: str, student_name: str, schedule: list):
    """
    Simulates sending an HTML email containing the student's daily schedule.
    In production, this would use smtplib and email.message.EmailMessage.
    """
    if not schedule:
        return

    # Build an HTML-like structure for the logs to simulate an email
    lines = [
        f"\n{'='*60}",
        f"✉️  EMAIL SENT TO: {email}",
        f"SUBJECT: Your Smart Attendance Daily Schedule",
        f"{'-'*60}",
        f"Hello {student_name},",
        f"Here is your class schedule for today:\n"
    ]

    for c in schedule:
        time_slot = c.get("time_slot", "Unknown Time")
        subject = c.get("subject", "Unknown Subject")
        venue = c.get("room", "TBA")
        teacher = c.get("teacher", "Instructor")
        lines.append(f"  • {time_slot} | {subject} (Room: {venue}) - Prof. {teacher}")

    lines.append("\nPlease make sure to attend and mark your attendance via QR code or location scan!")
    lines.append(f"{'='*60}\n")

    # Output to console
    print("\n".join(lines))
    logger.info(f"Daily schedule email simulated for {email}")


def send_attendance_warning_email(email: str, student_name: str, subject: str, percentage: float):
    """
    Simulates shipping a warning email when attendance drops below 75%.
    """
    lines = [
        f"\n{'='*60}",
        f"✉️  WARNING EMAIL SENT TO: {email}",
        f"SUBJECT: Low Attendance Warning: {subject}",
        f"{'-'*60}",
        f"Hello {student_name},",
        f"Your attendance in {subject} has dropped to {percentage:.1f}%.",
        f"Please ensure you maintain at least 75% attendance to avoid penalties.",
        f"{'='*60}\n"
    ]
    print("\n".join(lines))
    logger.info(f"Low attendance warning simulated for {email} ({subject})")
