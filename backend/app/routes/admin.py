from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.models import AdminStats, UserResponse, UserRole, SubscriptionPlan, WeddingResponse, StreamStatus
from app.auth import get_current_admin
from app.database import get_db
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter()

# Extended Models
class UserWithDetails(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: UserRole
    subscription_plan: SubscriptionPlan
    created_at: datetime
    total_weddings: int
    total_media: int

class WeddingWithCreator(BaseModel):
    id: str
    title: str
    bride_name: str
    groom_name: str
    creator_email: str
    creator_name: Optional[str]
    status: str
    scheduled_date: datetime
    viewers_count: int
    created_at: datetime

class RevenueStats(BaseModel):
    total_revenue: float
    monthly_revenue: float
    yearly_revenue: float
    revenue_by_month: List[Dict]

class AnalyticsData(BaseModel):
    user_growth: List[Dict]
    wedding_stats: List[Dict]
    revenue_trends: List[Dict]

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(current_user: dict = Depends(get_current_admin)):
    """Get admin dashboard statistics"""
    db = get_db()
    
    # Count totals
    total_users = await db.users.count_documents({})
    total_weddings = await db.weddings.count_documents({})
    active_streams = await db.weddings.count_documents({"status": "live"})
    total_subscriptions = await db.subscriptions.count_documents({"status": "active"})
    
    # Calculate monthly revenue
    monthly_subscriptions = await db.subscriptions.count_documents({
        "plan": "monthly",
        "status": "active"
    })
    yearly_subscriptions = await db.subscriptions.count_documents({
        "plan": "yearly",
        "status": "active"
    })
    
    monthly_revenue = (monthly_subscriptions * 18) + (yearly_subscriptions * 15)
    
    return AdminStats(
        total_users=total_users,
        total_weddings=total_weddings,
        active_streams=active_streams,
        total_subscriptions=total_subscriptions,
        monthly_revenue=monthly_revenue
    )

@router.get("/users", response_model=List[UserWithDetails])
async def list_all_users(
    current_user: dict = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    role: Optional[str] = None
):
    """List all users with details (admin only)"""
    db = get_db()
    
    # Build query
    query = {}
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"full_name": {"$regex": search, "$options": "i"}}
        ]
    if role:
        query["role"] = role
    
    cursor = db.users.find(query).sort("created_at", -1).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    
    result = []
    for user in users:
        # Count user's weddings
        total_weddings = await db.weddings.count_documents({"creator_id": user["id"]})
        
        # Count user's media
        total_media = await db.media.count_documents({"uploaded_by": user["id"]})
        
        result.append(UserWithDetails(
            id=user["id"],
            email=user["email"],
            full_name=user.get("full_name"),
            role=UserRole(user["role"]),
            subscription_plan=SubscriptionPlan(user.get("subscription_plan", "free")),
            created_at=user["created_at"],
            total_weddings=total_weddings,
            total_media=total_media
        ))
    
    return result

@router.get("/weddings", response_model=List[WeddingWithCreator])
async def list_all_weddings(
    current_user: dict = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None
):
    """List all weddings with creator details (admin only)"""
    db = get_db()
    
    query = {}
    if status_filter:
        query["status"] = status_filter
    
    cursor = db.weddings.find(query).sort("created_at", -1).skip(skip).limit(limit)
    weddings = await cursor.to_list(length=limit)
    
    result = []
    for wedding in weddings:
        # Get creator info
        creator = await db.users.find_one({"id": wedding["creator_id"]})
        
        result.append(WeddingWithCreator(
            id=wedding["id"],
            title=wedding["title"],
            bride_name=wedding["bride_name"],
            groom_name=wedding["groom_name"],
            creator_email=creator["email"] if creator else "Unknown",
            creator_name=creator.get("full_name") if creator else None,
            status=wedding["status"],
            scheduled_date=wedding["scheduled_date"],
            viewers_count=wedding["viewers_count"],
            created_at=wedding["created_at"]
        ))
    
    return result

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Delete a user (admin only)"""
    db = get_db()
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Don't allow deleting admin
    if user["role"] == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete admin user"
        )
    
    # Delete user's weddings and media
    await db.weddings.delete_many({"creator_id": user_id})
    await db.media.delete_many({"uploaded_by": user_id})
    await db.subscriptions.delete_many({"user_id": user_id})
    
    await db.users.delete_one({"id": user_id})
    return {"message": "User and all associated data deleted successfully"}

@router.delete("/weddings/{wedding_id}")
async def delete_wedding_admin(
    wedding_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Delete a wedding (admin only)"""
    db = get_db()
    
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    # Delete associated media
    await db.media.delete_many({"wedding_id": wedding_id})
    await db.recordings.delete_many({"wedding_id": wedding_id})
    
    await db.weddings.delete_one({"id": wedding_id})
    return {"message": "Wedding and all associated data deleted successfully"}

@router.get("/revenue", response_model=RevenueStats)
async def get_revenue_stats(current_user: dict = Depends(get_current_admin)):
    """Get revenue statistics"""
    db = get_db()
    
    # Get all active subscriptions
    subscriptions = await db.subscriptions.find({"status": "active"}).to_list(None)
    
    monthly_revenue = 0
    yearly_revenue = 0
    
    for sub in subscriptions:
        if sub["plan"] == "monthly":
            monthly_revenue += 18
        elif sub["plan"] == "yearly":
            yearly_revenue += 180
    
    total_revenue = monthly_revenue + yearly_revenue
    
    # Revenue by month (last 6 months)
    revenue_by_month = []
    for i in range(6):
        month_start = datetime.utcnow() - timedelta(days=30 * (i + 1))
        month_end = datetime.utcnow() - timedelta(days=30 * i)
        
        month_subs = await db.subscriptions.count_documents({
            "created_at": {"$gte": month_start, "$lt": month_end}
        })
        
        revenue_by_month.append({
            "month": month_start.strftime("%B %Y"),
            "revenue": month_subs * 18,  # Simplified calculation
            "subscriptions": month_subs
        })
    
    revenue_by_month.reverse()
    
    return RevenueStats(
        total_revenue=total_revenue,
        monthly_revenue=monthly_revenue,
        yearly_revenue=yearly_revenue,
        revenue_by_month=revenue_by_month
    )

@router.get("/analytics", response_model=AnalyticsData)
async def get_analytics(current_user: dict = Depends(get_current_admin)):
    """Get analytics data for charts"""
    db = get_db()
    
    # User growth (last 6 months)
    user_growth = []
    for i in range(6):
        month_start = datetime.utcnow() - timedelta(days=30 * (i + 1))
        month_end = datetime.utcnow() - timedelta(days=30 * i)
        
        users = await db.users.count_documents({
            "created_at": {"$gte": month_start, "$lt": month_end}
        })
        
        user_growth.append({
            "month": month_start.strftime("%b"),
            "users": users
        })
    
    user_growth.reverse()
    
    # Wedding stats by status
    wedding_stats = []
    for status in ["scheduled", "live", "ended", "recorded"]:
        count = await db.weddings.count_documents({"status": status})
        wedding_stats.append({
            "status": status.capitalize(),
            "count": count
        })
    
    # Revenue trends (last 6 months)
    revenue_trends = []
    for i in range(6):
        month_start = datetime.utcnow() - timedelta(days=30 * (i + 1))
        month_end = datetime.utcnow() - timedelta(days=30 * i)
        
        subs = await db.subscriptions.count_documents({
            "created_at": {"$gte": month_start, "$lt": month_end}
        })
        
        revenue_trends.append({
            "month": month_start.strftime("%b"),
            "revenue": subs * 18
        })
    
    revenue_trends.reverse()
    
    return AnalyticsData(
        user_growth=user_growth,
        wedding_stats=wedding_stats,
        revenue_trends=revenue_trends
    )
