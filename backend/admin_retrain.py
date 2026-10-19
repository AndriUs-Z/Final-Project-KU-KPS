"""
FastAPI router สำหรับระบบ Admin Retrain
ใช้งานโดย: app.include_router(admin_retrain.router) ใน main.py
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client

router = APIRouter(prefix="/api/admin", tags=["admin"])
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

ALL_DIRECTIONS = ["th-en", "en-th"]
TABLE_PAIRS = os.getenv("TABLE_PAIRS", "pending_words")
MIN_PAIRS = int(os.getenv("MIN_PAIRS", "100"))

REPO_ENV = {"th-en": "GITHUB_REPO_TH_EN", "en-th": "GITHUB_REPO_EN_TH"}

QUEUED_TIMEOUT_MIN = int(os.getenv("QUEUED_TIMEOUT_MIN", "30"))
RUNNING_TIMEOUT_MIN = int(os.getenv("RUNNING_TIMEOUT_MIN", "370"))


def approved_count(direction: str) -> int:
    """นับจำนวนคำที่ approved แล้วแยกตามทิศทาง"""
    res = (
        sb.table(TABLE_PAIRS)
        .select("id", count="exact")
        .eq("status", "approved")
        .eq("direction", direction)
        .limit(1)
        .execute()
    )
    return res.count or 0


def expire_stale_jobs():
    """เปลี่ยนงาน queued/running ที่ค้างนานเกินกำหนดให้เป็น failed"""
    now = datetime.now(timezone.utc)
    q_cut = (now - timedelta(minutes=QUEUED_TIMEOUT_MIN)).isoformat()
    r_cut = (now - timedelta(minutes=RUNNING_TIMEOUT_MIN)).isoformat()

    sb.table("retrain_jobs").update({
        "status": "failed",
        "finished_at": now.isoformat(),
        "message": f"หมดเวลา: workflow ไม่เริ่มภายใน {QUEUED_TIMEOUT_MIN} นาที",
    }).eq("status", "queued").lt("created_at", q_cut).execute()

    sb.table("retrain_jobs").update({
        "status": "failed",
        "finished_at": now.isoformat(),
        "message": f"หมดเวลา: รันนานเกิน {RUNNING_TIMEOUT_MIN} นาที",
    }).eq("status", "running").lt("started_at", r_cut).execute()


class RetrainRequest(BaseModel):
    direction: Literal["th-en", "en-th", "both"] = "both"


@router.post("/retrain")
async def trigger_retrain(body: RetrainRequest):
    directions = ALL_DIRECTIONS if body.direction == "both" else [body.direction]

    expire_stale_jobs()

    # ตรวจว่ามีงานกำลังทำงานอยู่ไหม
    active = (
        sb.table("retrain_jobs")
        .select("id")
        .in_("status", ["queued", "running"])
        .execute()
        .data
    )
    if active:
        raise HTTPException(409, "มีงานเทรนที่กำลังทำงานอยู่แล้ว")

    # ตรวจจำนวนคำที่ approved แล้ว
    counts = {d: approved_count(d) for d in directions}
    skipped = [
        {"direction": d, "approved": n, "required": MIN_PAIRS}
        for d, n in counts.items() if n < MIN_PAIRS
    ]
    directions = [d for d in directions if counts[d] >= MIN_PAIRS]

    if not directions:
        detail = "; ".join(
            f"{x['direction']}: approve แล้ว {x['approved']}/{x['required']} คำ"
            for x in skipped
        )
        raise HTTPException(400, f"ข้อมูลยังไม่พอสำหรับเทรน ({detail})")

    # สร้าง job records ใน Supabase
    jobs = {}
    for d in directions:
        row = sb.table("retrain_jobs").insert(
            {"direction": d, "status": "queued", "triggered_by": "admin"}
        ).execute().data[0]
        jobs[d] = row["id"]

    # ยิง GitHub Actions dispatch
    failed = []
    async with httpx.AsyncClient(timeout=15) as client:
        for d in directions:
            repo = os.environ.get(REPO_ENV[d], "")
            if not repo:
                failed.append(d)
                continue

            r = await client.post(
                f"https://api.github.com/repos/{repo}/dispatches",
                headers={
                    "Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                json={"event_type": "retrain", "client_payload": {"jobs": {d: jobs[d]}}},
            )
            if r.status_code != 204:
                failed.append(d)
                sb.table("retrain_jobs").update(
                    {"status": "failed", "message": f"GitHub dispatch error {r.status_code}"}
                ).eq("id", jobs[d]).execute()

    if len(failed) == len(directions):
        raise HTTPException(502, "ส่งคำสั่งไป GitHub ไม่สำเร็จ")

    return {
        "jobs": {d: j for d, j in jobs.items() if d not in failed},
        "failed": failed,
        "skipped": skipped,
    }


@router.get("/retrain/status")
def retrain_status():
    expire_stale_jobs()

    rows = (
        sb.table("retrain_jobs")
        .select("*")
        .order("created_at", desc=True)
        .limit(20)
        .execute()
        .data
    )

    latest = {d: next((r for r in rows if r["direction"] == d), None) for d in ALL_DIRECTIONS}

    return {
        "latest": latest,
        "history": rows,
        "approved_counts": {d: approved_count(d) for d in ALL_DIRECTIONS},
        "min_pairs": MIN_PAIRS,
    }
