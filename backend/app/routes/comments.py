from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
import uuid

from app.models import CommentCreate, CommentResponse, CommentLikeRequest, CommentUpdateRequest
from app.database import get_db
from app.auth import get_current_user, get_current_user_optional
from app.services.socket_service import sio

router = APIRouter()

# ==================== COMMENTS API (Full-Featured: Basic + Likes + Threading) ====================

async def build_comment_tree(comments: List[dict], current_user_id: Optional[str] = None):
    """Build hierarchical comment tree with replies"""
    # Create a map of comments by ID
    comment_map = {}
    root_comments = []
    
    for comment in comments:
        comment_id = comment["id"]
        # Add is_liked_by_user field
        liked_by = comment.get("liked_by", [])
        comment["is_liked_by_user"] = current_user_id in liked_by if current_user_id else False
        comment["replies"] = []
        comment_map[comment_id] = comment
    
    # Build tree structure
    for comment in comments:
        parent_id = comment.get("parent_comment_id")
        if parent_id and parent_id in comment_map:
            # This is a reply, add to parent's replies
            comment_map[parent_id]["replies"].append(comment)
        else:
            # This is a root comment
            root_comments.append(comment)
    
    # Sort replies by creation time (oldest first for better reading flow)
    for comment in comment_map.values():
        comment["replies"].sort(key=lambda x: x["created_at"])
    
    return root_comments


@router.post("", response_model=CommentResponse)
async def create_comment(
    comment: CommentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new comment or reply (Authentication required)"""
    db = get_db()
    
    # Verify wedding exists
    wedding = await db.weddings.find_one({"id": comment.wedding_id})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    # Check if comments are allowed
    settings = wedding.get("settings", {})
    if not settings.get("allow_comments", True):
        raise HTTPException(status_code=403, detail="Comments are disabled for this wedding")
    
    # If replying to a comment, verify parent exists
    if comment.parent_comment_id:
        parent_comment = await db.comments.find_one({"id": comment.parent_comment_id})
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")
    
    # Create comment document
    comment_doc = {
        "id": str(uuid.uuid4()),
        "wedding_id": comment.wedding_id,
        "parent_comment_id": comment.parent_comment_id,
        "user_id": current_user.get("id", "anonymous"),
        "user_name": current_user.get("full_name", "User"),
        "user_avatar": current_user.get("avatar_url"),
        "comment": comment.comment,
        "likes_count": 0,
        "replies_count": 0,
        "liked_by": [],
        "created_at": datetime.utcnow(),
        "updated_at": None
    }
    
    await db.comments.insert_one(comment_doc)
    
    # If this is a reply, increment parent's replies_count
    if comment.parent_comment_id:
        await db.comments.update_one(
            {"id": comment.parent_comment_id},
            {"$inc": {"replies_count": 1}}
        )
    
    # Emit real-time event via Socket.IO
    try:
        await sio.emit('new_comment', {
            'wedding_id': comment.wedding_id,
            'comment': {
                **comment_doc,
                'created_at': comment_doc['created_at'].isoformat(),
                'is_liked_by_user': False,
                'replies': []
            }
        }, room=f"wedding_{comment.wedding_id}")
    except Exception as e:
        print(f"Socket.IO emit error: {e}")
    
    return CommentResponse(**{**comment_doc, "is_liked_by_user": False, "replies": []})


@router.get("", response_model=List[CommentResponse])
async def get_comments(
    weddingId: str,
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_user_optional)
):
    """Get all comments for a wedding with threading"""
    db = get_db()
    
    # Verify wedding exists
    wedding = await db.weddings.find_one({"id": weddingId})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    # Get all comments (not just root - we need all for threading)
    all_comments = await db.comments.find(
        {"wedding_id": weddingId}
    ).sort("created_at", -1).to_list(length=None)
    
    # Build comment tree
    current_user_id = current_user.get("id") if current_user else None
    root_comments = await build_comment_tree(all_comments, current_user_id)
    
    # Apply pagination to root comments only
    paginated_comments = root_comments[offset:offset + limit]
    
    return [CommentResponse(**comment) for comment in paginated_comments]


@router.post("/{comment_id}/like")
async def like_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Like or unlike a comment (Authentication required)"""
    db = get_db()
    
    # Find the comment
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    user_id = current_user["user_id"]
    liked_by = comment.get("liked_by", [])
    
    if user_id in liked_by:
        # Unlike
        await db.comments.update_one(
            {"id": comment_id},
            {
                "$pull": {"liked_by": user_id},
                "$inc": {"likes_count": -1}
            }
        )
        liked = False
        likes_count = comment["likes_count"] - 1
    else:
        # Like
        await db.comments.update_one(
            {"id": comment_id},
            {
                "$addToSet": {"liked_by": user_id},
                "$inc": {"likes_count": 1}
            }
        )
        liked = True
        likes_count = comment["likes_count"] + 1
    
    # Emit real-time event via Socket.IO
    try:
        await sio.emit('comment_liked', {
            'wedding_id': comment["wedding_id"],
            'comment_id': comment_id,
            'likes_count': likes_count,
            'user_id': user_id
        }, room=f"wedding_{comment['wedding_id']}")
    except Exception as e:
        print(f"Socket.IO emit error: {e}")
    
    return {"message": "Comment liked" if liked else "Comment unliked", "liked": liked, "likes_count": likes_count}


@router.put("/{comment_id}")
async def update_comment(
    comment_id: str,
    update_data: CommentUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update a comment (owner only)"""
    db = get_db()
    
    # Find the comment
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user is the comment owner
    if comment.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this comment")
    
    # Update comment
    await db.comments.update_one(
        {"id": comment_id},
        {
            "$set": {
                "comment": update_data.comment,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Emit real-time event
    try:
        await sio.emit('comment_updated', {
            'wedding_id': comment["wedding_id"],
            'comment_id': comment_id,
            'comment': update_data.comment
        }, room=f"wedding_{comment['wedding_id']}")
    except Exception as e:
        print(f"Socket.IO emit error: {e}")
    
    return {"message": "Comment updated successfully"}


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a comment and all its replies (creator or comment owner only)"""
    db = get_db()
    
    # Find the comment
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check permissions
    wedding = await db.weddings.find_one({"id": comment["wedding_id"]})
    is_creator = wedding and wedding.get("creator_id") == current_user["user_id"]
    is_owner = comment.get("user_id") == current_user["user_id"]
    
    if not (is_creator or is_owner):
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    # Delete the comment and all its replies (cascade)
    await db.comments.delete_many({
        "$or": [
            {"id": comment_id},
            {"parent_comment_id": comment_id}
        ]
    })
    
    # If this was a reply, decrement parent's replies_count
    if comment.get("parent_comment_id"):
        await db.comments.update_one(
            {"id": comment["parent_comment_id"]},
            {"$inc": {"replies_count": -1}}
        )
    
    # Emit real-time event
    try:
        await sio.emit('comment_deleted', {
            'wedding_id': comment["wedding_id"],
            'comment_id': comment_id
        }, room=f"wedding_{comment['wedding_id']}")
    except Exception as e:
        print(f"Socket.IO emit error: {e}")
    
    return {"message": "Comment deleted successfully"}
