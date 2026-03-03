import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database import get_db, get_db_client
from app.services.email_service import send_daily_schedule_email, send_attendance_warning_email

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()

def job_send_morning_alerts():
    """
    Runs daily at 7:00 AM.
    Queries today's timetable for each student and sends a daily schedule email.
    """
    try:
        logger.info("Starting morning schedule alerts job...")
        
        # We need a fresh DB connection outside of request scope
        client = get_db_client()
        db = client["smart_attendance"]
        
        # Determine today's day of week string
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        today_name = days[datetime.utcnow().weekday()]

        if today_name == "Sunday":
            logger.info("Today is Sunday, skipping schedule alerts.")
            return

        # Fetch all students
        students = list(db.students.find({}))
        
        # Fetch today's timetable
        today_classes = list(db.timetable.find({"day": today_name}))

        emails_sent = 0

        for student in students:
            # Reconstruct student user profile for email
            user = db.users.find_one({"_id": student["user_id"]})
            if not user or not user.get("email"):
                continue

            # Filter timetable for this student's department, year(sem), and batch
            student_schedule = []
            for c in today_classes:
                dept_match = c.get("department") == student.get("department")
                sem_match = c.get("semester") == student.get("year")
                batch_match = not c.get("batch") or c.get("batch") == student.get("batch")
                
                if dept_match and sem_match and batch_match:
                    student_schedule.append(c)

            # Sort by time slot roughly
            student_schedule.sort(key=lambda x: x.get("time_slot", ""))

            if len(student_schedule) > 0:
                send_daily_schedule_email(
                    email=user["email"],
                    student_name=user.get("full_name", "Student"),
                    schedule=student_schedule
                )
                emails_sent += 1

        logger.info(f"Morning alerts complete. Sent {emails_sent} emails.")
    except Exception as e:
        logger.error(f"Error in morning alerts job: {e}")
    finally:
        client.close()


def job_mark_auto_absent():
    """
    Runs daily at 11:00 PM.
    Checks today's timetable. If a student was supposed to be in class but has no attendance record, marks absent.
    """
    try:
        logger.info("Starting auto-absent tracking job...")
        
        client = get_db_client()
        db = client["smart_attendance"]
        
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        today_name = days[datetime.utcnow().weekday()]
        today_str = datetime.utcnow().strftime("%Y-%m-%d")

        if today_name == "Sunday":
            logger.info("Today is Sunday, skipping auto-absent.")
            return

        # Fetch all students and today's classes
        students = list(db.students.find({}))
        today_classes = list(db.timetable.find({"day": today_name}))

        absent_records_created = 0

        for student in students:
            student_id = str(student["_id"])
            
            # Find classes this student should have attended today
            for c in today_classes:
                dept_match = c.get("department") == student.get("department")
                sem_match = c.get("semester") == student.get("year")
                batch_match = not c.get("batch") or c.get("batch") == student.get("batch")
                
                if dept_match and sem_match and batch_match:
                    subject = c.get("subject")
                    # Check if an attendance record exists for this student + subject + date
                    existing_record = db.attendance.find_one({
                        "student_id": student_id,
                        "subject": subject,
                        "date": today_str
                        # Not filtering by status: if it's 'present', 'absent', or 'excused', do nothing.
                    })
                    
                    if not existing_record:
                        # Missing entirely -> they were absent!
                        db.attendance.insert_one({
                            "student_id": student_id,
                            "subject": subject,
                            "status": "absent",
                            "date": today_str,
                            "timestamp": datetime.utcnow(),
                            "marked_via": "auto_cron",
                            "teacher_id": str(c.get("teacher")),
                            "class_id": str(c.get("_id"))
                        })
                        absent_records_created += 1

        logger.info(f"Auto-absent tracking complete. Created {absent_records_created} absent records.")

    except Exception as e:
        logger.error(f"Error in auto-absent tracking job: {e}")
    finally:
        client.close()

def init_scheduler():
    """
    Initializes the scheduler with the defined jobs.
    """
    # Run morning alerts at 07:00 AM daily
    scheduler.add_job(job_send_morning_alerts, CronTrigger(hour=7, minute=0), id="morning_alerts", replace_existing=True)
    
    # Run auto-absent marking at 23:00 (11 PM) daily
    scheduler.add_job(job_mark_auto_absent, CronTrigger(hour=23, minute=0), id="auto_absent", replace_existing=True)
    
    logger.info("Background jobs scheduled (Morning Alerts: 07:00, Auto-Absent: 23:00)")
    
    scheduler.start()
