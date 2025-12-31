from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
import uuid

from app.models import (
    ChatMessageCreate, ChatMessageResponse,
    ReactionCreate, ReactionResponse,
    GuestBookCreate, GuestBookResponse
)
from app.database import get_db
from app.auth import get_current_user_optional

router = APIRouter()

# ==================== CHAT MESSAGES ====================

@router.post("/messages", response_model=ChatMessageResponse)
async def send_chat_message(
    message: ChatMessageCreate,
    current_user: dict = Depends(get_current_user_optional)
):
    """Send a chat message during a live wedding stream"""
    db = get_db()
    
    # Create message document
    message_doc = {
        "id": str(uuid.uuid4()),
        "wedding_id": message.wedding_id,
        "user_id": current_user["user_id"] if current_user else None,
        "guest_name": current_user.get("full_name") if current_user else message.guest_name,
        "message": message.message,
        "created_at": datetime.utcnow()
    }
    
    await db.chat_messages.insert_one(message_doc)
    
    # Update viewer session chat count if user is logged in
    if current_user:
        await db.viewer_sessions.update_many(
            {
                "wedding_id": message.wedding_id,
                "user_id": current_user["user_id"],
                "leave_time": None
            },
            {"$inc": {"chat_messages_count": 1}}
        )
    
    return ChatMessageResponse(**message_doc)


@router.get("/messages/{wedding_id}", response_model=List[ChatMessageResponse])
async def get_chat_messages(
    wedding_id: str,
    limit: int = 100,
    offset: int = 0
):
    """Get chat messages for a wedding (public access)"""
    db = get_db()
    
    messages = await db.chat_messages.find(
        {"wedding_id": wedding_id}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(length=limit)
    
    return [ChatMessageResponse(**msg) for msg in messages]


# ==================== REACTIONS ====================

@router.post("/reactions", response_model=ReactionResponse)
async def send_reaction(
    reaction: ReactionCreate,
    current_user: dict = Depends(get_current_user_optional)
):
    """Send an emoji reaction during a live wedding stream"""
    db = get_db()
    
    # Create reaction document - map reaction_type to emoji for compatibility
    reaction_doc = {
        "id": str(uuid.uuid4()),
        "wedding_id": reaction.wedding_id,
        "user_id": current_user["user_id"] if current_user else None,
        "guest_name": current_user.get("full_name") if current_user else getattr(reaction, 'guest_name', None),
        "reaction_type": reaction.reaction_type,
        "emoji": reaction.reaction_type,  # Add emoji field for compatibility
        "created_at": datetime.utcnow()
    }
    
    await db.reactions.insert_one(reaction_doc)
    
    # Update viewer session reactions count
    if current_user:
        await db.viewer_sessions.update_many(
            {
                "wedding_id": reaction.wedding_id,
                "user_id": current_user["user_id"],
                "leave_time": None
            },
            {"$inc": {"reactions_count": 1}}
        )
    
    return ReactionResponse(**reaction_doc)


@router.get("/reactions/{wedding_id}", response_model=List[ReactionResponse])
async def get_reactions(
    wedding_id: str,
    limit: int = 50
):
    """Get reactions for a wedding (public access)"""
    db = get_db()
    
    reactions = await db.reactions.find(
        {"wedding_id": wedding_id}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    return [ReactionResponse(**r) for r in reactions]


# ==================== GUEST BOOK ====================

@router.post("/guestbook", response_model=GuestBookResponse)
async def create_guest_book_entry(entry: GuestBookCreate):
    """Create a guest book entry (public access)"""
    db = get_db()
    
    # Verify wedding exists
    wedding = await db.weddings.find_one({"id": entry.wedding_id})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    # Create guest book entry
    entry_doc = {
        "id": str(uuid.uuid4()),
        "wedding_id": entry.wedding_id,
        "guest_name": entry.guest_name,
        "email": entry.email,
        "message": entry.message,
        "created_at": datetime.utcnow()
    }
    
    await db.guest_book.insert_one(entry_doc)
    
    return GuestBookResponse(**entry_doc)


@router.get("/guestbook/{wedding_id}", response_model=List[GuestBookResponse])
async def get_guest_book_entries(
    wedding_id: str,
    limit: int = 100,
    offset: int = 0
):
    """Get guestbook entries for a wedding (public access)"""
    db = get_db()
    
    entries = await db.guest_book.find(
        {"wedding_id": wedding_id}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(length=limit)
    
    return [GuestBookResponse(**e) for e in entries]


@router.delete("/guestbook/{entry_id}")
async def delete_guest_book_entry(
    entry_id: str,
    current_user: dict = Depends(get_current_user_optional)
):
    """Delete a guest book entry (admin or creator only)"""
    if not current_user or current_user["role"] not in ["admin", "creator"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = await get_database()
    result = await db.guest_book.delete_one({"id": entry_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    return {"message": "Guest book entry deleted successfully"}
