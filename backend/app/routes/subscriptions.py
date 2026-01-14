from fastapi import APIRouter, HTTPException, status, Depends, Request
from app.models import SubscriptionCreate, SubscriptionResponse, SubscriptionPlan
from app.auth import get_current_user
from app.database import get_db
from app.plan_restrictions import get_storage_limit
from typing import List, Optional, Dict, Any
import razorpay
import os
import hmac
import hashlib
from datetime import datetime, timedelta
import uuid

router = APIRouter()

# Razorpay configuration from environment variables
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")
RAZORPAY_MONTHLY_PLAN = os.getenv("RAZORPAY_MONTHLY_PLAN_ID", "plan_Roi9vOrXj5yllC")
RAZORPAY_YEARLY_PLAN = os.getenv("RAZORPAY_YEARLY_PLAN_ID", "plan_RoiIoNFJdZcxdp")

# Auto-detect TEST/LIVE mode based on key prefix
def is_test_mode() -> bool:
    """Automatically detect if we're in TEST or LIVE mode based on key prefix"""
    if not RAZORPAY_KEY_ID:
        return True
    return RAZORPAY_KEY_ID.startswith("rzp_test_")

def get_mode_label() -> str:
    """Get current mode label for logging"""
    return "TEST" if is_test_mode() else "LIVE"

# Initialize Razorpay client
try:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    print(f"✅ Razorpay client initialized in {get_mode_label()} mode")
except Exception as e:
    print(f"⚠️  Warning: Failed to initialize Razorpay client: {e}")
    razorpay_client = None

@router.post("/create-checkout-session")
async def create_checkout_session(
    request_body: SubscriptionCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create Razorpay subscription order
    Supports both TEST and LIVE mode - automatically detected from API keys
    """
    if not razorpay_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment gateway not configured"
        )
    
    plan = request_body.plan
    
    if plan == SubscriptionPlan.FREE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Free plan does not require checkout"
        )
    
    # Determine plan_id based on plan
    if plan == SubscriptionPlan.MONTHLY:
        plan_id = RAZORPAY_MONTHLY_PLAN
        amount = 179900  # ₹1,799 in paise
    else:  # YEARLY
        plan_id = RAZORPAY_YEARLY_PLAN
        amount = 1727000  # ₹17,270 in paise (20% discount)
    
    try:
        # Create Razorpay subscription
        subscription_data = {
            "plan_id": plan_id,
            "customer_notify": 1,
            "total_count": 12,  # 12 billing cycles
            "notes": {
                "user_id": current_user["user_id"],
                "email": current_user["email"],
                "plan": plan.value,
                "mode": get_mode_label()
            }
        }
        
        print(f"Creating subscription in {get_mode_label()} mode for user {current_user['email']}")
        razorpay_subscription = razorpay_client.subscription.create(subscription_data)
        
        return {
            "subscription_id": razorpay_subscription["id"],
            "plan_id": plan_id,
            "status": razorpay_subscription["status"],
            "razorpay_key": RAZORPAY_KEY_ID,
            "user_email": current_user["email"],
            "user_name": current_user.get("full_name", ""),
            "amount": amount,
            "mode": get_mode_label()
        }
    except razorpay.errors.BadRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request: {str(e)}"
        )
    except Exception as e:
        print(f"❌ Error creating subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create subscription: {str(e)}"
        )

async def lock_weddings_for_free_plan(db, user_id: str):
    """Lock all weddings except the most recent one for free plan users"""
    # Get all user's weddings sorted by created_at descending
    cursor = db.weddings.find({"creator_id": user_id}).sort("created_at", -1)
    weddings = await cursor.to_list(length=None)
    
    if len(weddings) > 1:
        # Keep first (most recent) wedding unlocked, lock the rest
        for i, wedding in enumerate(weddings):
            if i == 0:
                # Unlock the most recent wedding
                await db.weddings.update_one(
                    {"id": wedding["id"]},
                    {"$set": {"is_locked": False}}
                )
            else:
                # Lock older weddings
                await db.weddings.update_one(
                    {"id": wedding["id"]},
                    {"$set": {"is_locked": True}}
                )

async def unlock_all_weddings(db, user_id: str):
    """Unlock all weddings for premium users"""
    await db.weddings.update_many(
        {"creator_id": user_id},
        {"$set": {"is_locked": False}}
    )

@router.post("/verify-payment")
async def verify_payment(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Verify Razorpay payment signature and activate subscription"""
    db = get_db()
    
    try:
        body = await request.json()
        razorpay_payment_id = body.get("razorpay_payment_id")
        razorpay_subscription_id = body.get("razorpay_subscription_id")
        razorpay_signature = body.get("razorpay_signature")
        plan = body.get("plan", "monthly")
        
        if not all([razorpay_payment_id, razorpay_subscription_id, razorpay_signature]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required payment parameters"
            )
        
        # Verify signature
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            f"{razorpay_payment_id}|{razorpay_subscription_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != razorpay_signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment signature"
            )
        
        # Signature is valid - activate subscription
        await db.users.update_one(
            {"id": current_user["user_id"]},
            {"$set": {"subscription_plan": plan}}
        )
        
        # Create subscription record
        subscription_id = str(uuid.uuid4())
        subscription = {
            "id": subscription_id,
            "user_id": current_user["user_id"],
            "plan": plan,
            "razorpay_subscription_id": razorpay_subscription_id,
            "razorpay_payment_id": razorpay_payment_id,
            "status": "active",
            "current_period_end": None,
            "created_at": datetime.utcnow()
        }
        
        # Check if subscription already exists
        existing = await db.subscriptions.find_one({"razorpay_subscription_id": razorpay_subscription_id})
        if not existing:
            await db.subscriptions.insert_one(subscription)
        
        # Unlock all weddings for premium users
        if plan in ["monthly", "yearly"]:
            await unlock_all_weddings(db, current_user["user_id"])
        
        return {
            "success": True,
            "message": "Payment verified and subscription activated",
            "plan": plan
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify payment: {str(e)}"
        )

@router.post("/webhook")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhooks for payment events"""
    payload = await request.body()
    signature = request.headers.get("x-razorpay-signature")
    
    # Verify webhook signature
    try:
        generated_signature = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != signature:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature verification")
    
    db = get_db()
    
    try:
        import json
        event = json.loads(payload.decode())
        event_type = event.get("event")
        
        # Handle payment.captured event
        if event_type == "payment.captured":
            payment = event["payload"]["payment"]["entity"]
            subscription_id = payment.get("subscription_id")
            
            if subscription_id:
                # Update subscription status
                await db.subscriptions.update_one(
                    {"razorpay_subscription_id": subscription_id},
                    {"$set": {"status": "active"}}
                )
                
                # Get user and unlock weddings
                subscription = await db.subscriptions.find_one({"razorpay_subscription_id": subscription_id})
                if subscription:
                    # Update plan and storage limit
                    new_storage_limit = get_storage_limit(subscription["plan"])
                    await db.users.update_one(
                        {"id": subscription["user_id"]},
                        {"$set": {
                            "subscription_plan": subscription["plan"],
                            "storage_limit": new_storage_limit
                        }}
                    )
                    await unlock_all_weddings(db, subscription["user_id"])
        
        # Handle payment.failed event
        elif event_type == "payment.failed":
            payment = event["payload"]["payment"]["entity"]
            subscription_id = payment.get("subscription_id")
            
            if subscription_id:
                await db.subscriptions.update_one(
                    {"razorpay_subscription_id": subscription_id},
                    {"$set": {"status": "payment_failed"}}
                )
        
        # Handle invoice.paid event
        elif event_type == "invoice.paid":
            invoice = event["payload"]["invoice"]["entity"]
            subscription_id = invoice.get("subscription_id")
            
            if subscription_id:
                await db.subscriptions.update_one(
                    {"razorpay_subscription_id": subscription_id},
                    {"$set": {"status": "active"}}
                )
        
        # Handle payment_link.paid event  
        elif event_type == "payment_link.paid":
            payment_link = event["payload"]["payment_link"]["entity"]
            # Handle payment link completion if needed
            pass
        
        # Handle subscription cancellation/expiration
        elif event_type in ["subscription.cancelled", "subscription.completed", "subscription.halted"]:
            subscription = event["payload"]["subscription"]["entity"]
            subscription_id = subscription["id"]
            
            # Update subscription status
            db_subscription = await db.subscriptions.find_one({"razorpay_subscription_id": subscription_id})
            if db_subscription:
                await db.subscriptions.update_one(
                    {"id": db_subscription["id"]},
                    {"$set": {"status": "cancelled"}}
                )
                
                # Downgrade user to free plan with storage limit
                free_storage_limit = get_storage_limit("free")
                await db.users.update_one(
                    {"id": db_subscription["user_id"]},
                    {"$set": {
                        "subscription_plan": SubscriptionPlan.FREE.value,
                        "storage_limit": free_storage_limit
                    }}
                )
                
                # Lock weddings for free plan
                await lock_weddings_for_free_plan(db, db_subscription["user_id"])
    
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"status": "success"}

@router.get("/my-subscription", response_model=SubscriptionResponse)
async def get_my_subscription(current_user: dict = Depends(get_current_user)):
    """Get current user's subscription"""
    db = get_db()
    
    subscription = await db.subscriptions.find_one(
        {"user_id": current_user["user_id"]},
        sort=[("created_at", -1)]
    )
    
    if not subscription:
        # Return free plan if no subscription
        return SubscriptionResponse(
            id="free",
            user_id=current_user["user_id"],
            plan=SubscriptionPlan.FREE,
            status="active",
            created_at=datetime.utcnow()
        )
    
    return SubscriptionResponse(
        id=subscription["id"],
        user_id=subscription["user_id"],
        plan=SubscriptionPlan(subscription["plan"]),
        razorpay_subscription_id=subscription.get("razorpay_subscription_id"),
        status=subscription["status"],
        current_period_end=subscription.get("current_period_end"),
        created_at=subscription["created_at"]
    )

@router.post("/create-order")
async def create_one_time_order(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Create one-time payment order (not subscription)
    Use this for single purchases like extra storage, single event, etc.
    Works with both TEST and LIVE mode automatically
    """
    if not razorpay_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment gateway not configured"
        )
    
    try:
        body = await request.json()
        amount = body.get("amount")  # Amount in paise
        currency = body.get("currency", "INR")
        receipt = body.get("receipt", f"order_{uuid.uuid4().hex[:10]}")
        notes = body.get("notes", {})
        
        if not amount or amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid amount"
            )
        
        # Add user info to notes
        notes.update({
            "user_id": current_user["user_id"],
            "email": current_user["email"],
            "mode": get_mode_label()
        })
        
        # Create Razorpay order
        order_data = {
            "amount": int(amount),
            "currency": currency,
            "receipt": receipt,
            "notes": notes
        }
        
        print(f"Creating order in {get_mode_label()} mode: ₹{amount/100}")
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        # Store order in database
        order_record = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "razorpay_order_id": razorpay_order["id"],
            "amount": amount,
            "currency": currency,
            "status": "created",
            "notes": notes,
            "created_at": datetime.utcnow()
        }
        
        db = get_db()
        await db.orders.insert_one(order_record)
        
        return {
            "order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "razorpay_key": RAZORPAY_KEY_ID,
            "mode": get_mode_label()
        }
    except razorpay.errors.BadRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request: {str(e)}"
        )
    except Exception as e:
        print(f"❌ Error creating order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {str(e)}"
        )

@router.post("/verify-order")
async def verify_one_time_order(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Verify one-time payment order"""
    db = get_db()
    
    try:
        body = await request.json()
        razorpay_order_id = body.get("razorpay_order_id")
        razorpay_payment_id = body.get("razorpay_payment_id")
        razorpay_signature = body.get("razorpay_signature")
        
        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required payment parameters"
            )
        
        # Verify signature
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != razorpay_signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment signature"
            )
        
        # Update order status
        await db.orders.update_one(
            {"razorpay_order_id": razorpay_order_id},
            {"$set": {
                "status": "paid",
                "razorpay_payment_id": razorpay_payment_id,
                "paid_at": datetime.utcnow()
            }}
        )
        
        # Store payment record
        payment_record = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "type": "one_time",
            "status": "success",
            "created_at": datetime.utcnow()
        }
        await db.payments.insert_one(payment_record)
        
        return {
            "success": True,
            "message": "Payment verified successfully",
            "payment_id": razorpay_payment_id
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error verifying order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify payment: {str(e)}"
        )

@router.get("/payment-history")
async def get_payment_history(
    current_user: dict = Depends(get_current_user),
    limit: int = 50
):
    """Get user's payment history including subscriptions and one-time payments"""
    db = get_db()
    
    try:
        # Get subscription payments
        subscriptions = await db.subscriptions.find(
            {"user_id": current_user["user_id"]}
        ).sort("created_at", -1).limit(limit).to_list(length=None)
        
        # Get one-time payments
        orders = await db.orders.find(
            {"user_id": current_user["user_id"], "status": "paid"}
        ).sort("created_at", -1).limit(limit).to_list(length=None)
        
        # Get all payment records
        payments = await db.payments.find(
            {"user_id": current_user["user_id"]}
        ).sort("created_at", -1).limit(limit).to_list(length=None)
        
        # Format response
        history = []
        
        # Add subscription payments
        for sub in subscriptions:
            history.append({
                "id": sub.get("id"),
                "type": "subscription",
                "plan": sub.get("plan"),
                "amount": 179900 if sub.get("plan") == "monthly" else 1727000,
                "status": sub.get("status"),
                "razorpay_subscription_id": sub.get("razorpay_subscription_id"),
                "razorpay_payment_id": sub.get("razorpay_payment_id"),
                "created_at": sub.get("created_at")
            })
        
        # Add one-time payments
        for order in orders:
            history.append({
                "id": order.get("id"),
                "type": "one_time",
                "amount": order.get("amount"),
                "currency": order.get("currency", "INR"),
                "status": order.get("status"),
                "razorpay_order_id": order.get("razorpay_order_id"),
                "razorpay_payment_id": order.get("razorpay_payment_id"),
                "notes": order.get("notes"),
                "created_at": order.get("created_at"),
                "paid_at": order.get("paid_at")
            })
        
        # Sort by created_at
        history.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
        
        return {
            "success": True,
            "payments": history[:limit],
            "total": len(history),
            "mode": get_mode_label()
        }
    except Exception as e:
        print(f"❌ Error fetching payment history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch payment history: {str(e)}"
        )

@router.get("/invoice/{payment_id}")
async def get_invoice(
    payment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get invoice details for a specific payment"""
    db = get_db()
    
    try:
        # Try to find in subscriptions first
        subscription = await db.subscriptions.find_one({
            "user_id": current_user["user_id"],
            "$or": [
                {"id": payment_id},
                {"razorpay_subscription_id": payment_id},
                {"razorpay_payment_id": payment_id}
            ]
        })
        
        if subscription:
            return {
                "id": subscription.get("id"),
                "type": "subscription",
                "plan": subscription.get("plan"),
                "amount": 179900 if subscription.get("plan") == "monthly" else 1727000,
                "currency": "INR",
                "status": subscription.get("status"),
                "razorpay_subscription_id": subscription.get("razorpay_subscription_id"),
                "razorpay_payment_id": subscription.get("razorpay_payment_id"),
                "created_at": subscription.get("created_at"),
                "user_email": current_user["email"],
                "user_name": current_user.get("full_name", "")
            }
        
        # Try to find in orders
        order = await db.orders.find_one({
            "user_id": current_user["user_id"],
            "$or": [
                {"id": payment_id},
                {"razorpay_order_id": payment_id},
                {"razorpay_payment_id": payment_id}
            ]
        })
        
        if order:
            return {
                "id": order.get("id"),
                "type": "one_time",
                "amount": order.get("amount"),
                "currency": order.get("currency", "INR"),
                "status": order.get("status"),
                "razorpay_order_id": order.get("razorpay_order_id"),
                "razorpay_payment_id": order.get("razorpay_payment_id"),
                "notes": order.get("notes"),
                "created_at": order.get("created_at"),
                "paid_at": order.get("paid_at"),
                "user_email": current_user["email"],
                "user_name": current_user.get("full_name", "")
            }
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching invoice: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch invoice: {str(e)}"
        )