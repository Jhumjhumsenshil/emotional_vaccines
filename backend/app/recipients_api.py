from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/recipients", tags=["Recipients"])

# --- In-memory database (matches your mock data structure) ---
# In production, replace this with SQLAlchemy and PostgreSQL database models.
recipients_db = [
    {
        "id": "rec-1",
        "name": "Sarah Jenkins",
        "email": "sarah.j@apexmedia.io",
        "company": "Apex Community Wellness",
        "role": "Director of Outreach",
        "status": "Active",
        "channelFocus": "Families Thrive",
        "assignedVideos": ["vid-001", "vid-003", "vid-007"],
        "lastContacted": datetime.utcnow().isoformat(),
        "notes": "",
        "avatar": "https://i.pravatar.cc/120?img=47"
    },
    {
        "id": "rec-2",
        "name": "Marcus Vance",
        "email": "m.vance@lumina-agency.com",
        "company": "Lumina Health Partners",
        "role": "Community Programs Lead",
        "status": "Active",
        "channelFocus": "Self Care",
        "assignedVideos": ["vid-002", "vid-004"],
        "lastContacted": datetime.utcnow().isoformat(),
        "notes": "",
        "avatar": "https://i.pravatar.cc/120?img=12"
    },
]

# --- Pydantic Schemas ---
class RecipientCreate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = "Independent"
    role: Optional[str] = "Media Partner"
    status: Optional[str] = "Active"
    channelFocus: Optional[str] = "General Content"
    videoId: Optional[str] = None
    recipientIds: Optional[List[str]] = None
    notes: Optional[str] = ""

class RecipientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    channelFocus: Optional[str] = None
    assignedVideos: Optional[List[str]] = None
    notes: Optional[str] = None


# --- Endpoints ---

@router.get("")
def get_recipients(
    status: str = Query("All"),
    search: str = Query("")
):
    filtered = list(recipients_db)

    if search.strip():
        q = search.lower().strip()
        filtered = [
            r for r in filtered
            if q in r["name"].lower() or
               q in r["email"].lower() or
               q in r["company"].lower() or
               q in r["role"].lower()
        ]

    if status and status != "All":
        filtered = [
            r for r in filtered
            if r["status"].lower() == status.lower()
        ]

    return {
        "success": True,
        "total": len(filtered),
        "data": filtered
    }


@router.get("/{recipient_id}")
def get_recipient_by_id(recipient_id: str):
    recipient = next((r for r in recipients_db if r["id"] == recipient_id), None)
    if not recipient:
        raise HTTPException(status_code=404, detail=f"Recipient with id '{recipient_id}' not found")
    return {"success": True, "data": recipient}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_recipient(payload: RecipientCreate):
    # ── Queue mode: assign a video to a list of existing recipients ──────────
    if payload.videoId and payload.recipientIds and len(payload.recipientIds) > 0:
        updated = 0
        not_found = []

        for rid in payload.recipientIds:
            recipient = next((r for r in recipients_db if r["id"] == rid), None)
            if not recipient:
                not_found.append(rid)
                continue
            
            if payload.videoId not in recipient["assignedVideos"]:
                recipient["assignedVideos"].append(payload.videoId)
                recipient["lastContacted"] = datetime.utcnow().isoformat()
                updated += 1

        return {
            "success": True,
            "message": f"Video '{payload.videoId}' assigned to {updated} recipient(s).",
            "updated": updated,
            "notFound": not_found
        }

    # ── Create mode: create a brand new recipient ────────────────────────────
    if not payload.name or not payload.email:
        raise HTTPException(
            status_code=400,
            detail="Provide either { videoId, recipientIds[] } to queue a video, or { name, email } to create a new recipient."
        )

    new_recipient = {
        "id": f"rec-{int(datetime.utcnow().timestamp() * 1000)}",
        "name": payload.name,
        "email": payload.email,
        "company": payload.company or "Independent",
        "role": payload.role or "Media Partner",
        "status": payload.status or "Active",
        "channelFocus": payload.channelFocus or "General Content",
        "assignedVideos": [payload.videoId] if payload.videoId else [],
        "lastContacted": datetime.utcnow().isoformat(),
        "notes": payload.notes or "",
        "avatar": f"https://i.pravatar.cc/120?u={payload.email}"
    }

    recipients_db.insert(0, new_recipient)

    return {
        "success": True,
        "message": "Recipient created successfully",
        "data": new_recipient
    }


@router.put("/{recipient_id}")
def update_recipient(recipient_id: str, payload: RecipientUpdate):
    recipient = next((r for r in recipients_db if r["id"] == recipient_id), None)
    if not recipient:
        raise HTTPException(status_code=404, detail=f"Recipient '{recipient_id}' not found")

    update_data = payload.dict(exclude_unset=True)
    recipient.update(update_data)
    recipient["lastContacted"] = datetime.utcnow().isoformat()

    return {
        "success": True,
        "message": "Recipient updated successfully",
        "data": recipient
    }


@router.delete("/{recipient_id}")
def delete_recipient(recipient_id: str):
    global recipients_db
    initial_length = len(recipients_db)
    recipients_db = [r for r in recipients_db if r["id"] != recipient_id]

    if len(recipients_db) == initial_length:
        raise HTTPException(status_code=404, detail=f"Recipient '{recipient_id}' not found")

    return {
        "success": True,
        "message": f"Recipient '{recipient_id}' removed successfully"
    }