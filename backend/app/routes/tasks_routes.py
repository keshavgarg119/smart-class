from fastapi import APIRouter
from app.services.scheduler_service import job_send_morning_alerts, job_mark_auto_absent

router = APIRouter()

@router.post("/trigger-morning-alerts")
async def trigger_morning_alerts():
    """Manually trigger the morning schedule email job."""
    await job_send_morning_alerts()
    return {"message": "Morning schedule alerts job triggered successfully."}

@router.post("/trigger-auto-absent")
async def trigger_auto_absent():
    """Manually trigger the auto-absent tracking job."""
    await job_mark_auto_absent()
    return {"message": "Auto-absent tracking job triggered successfully."}
