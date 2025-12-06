from fastapi import APIRouter, HTTPException, status, Depends, Request
from app.models import SubscriptionCreate, SubscriptionResponse, SubscriptionPlan
from app.auth import get_current_user
from app.database import get_db
import stripe
import os
from datetime import datetime
import uuid

router = APIRouter()

# Stripe configuration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_MONTHLY_PRODUCT = os.getenv("STRIPE_MONTHLY_PRODUCT_ID", "prod_TYIPx5PAGAEXF9")
STRIPE_YEARLY_PRODUCT = os.getenv("STRIPE_YEARLY_PRODUCT_ID", "prod_TYIQmXS3INzbx4")

@router.post("/create-checkout-session")
async def create_checkout_session(
    plan: SubscriptionPlan,
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe checkout session"""
    if plan == SubscriptionPlan.FREE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Free plan does not require checkout"
        )
    
    # Determine price based on plan
    price_data = {
        "currency": "usd",
        "product": STRIPE_MONTHLY_PRODUCT if plan == SubscriptionPlan.MONTHLY else STRIPE_YEARLY_PRODUCT,
        "recurring": {
            "interval": "month" if plan == SubscriptionPlan.MONTHLY else "year"
        },
        "unit_amount": 1800 if plan == SubscriptionPlan.MONTHLY else 18000  # in cents
    }
    
    try:
        checkout_session = stripe.checkout.Session.create(
            customer_email=current_user["email"],
            payment_method_types=["card"],
            line_items=[{
                "price_data": price_data,
                "quantity": 1
            }],
            mode="subscription",
            success_url=os.getenv("NEXT_PUBLIC_BASE_URL") + "/dashboard?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=os.getenv("NEXT_PUBLIC_BASE_URL") + "/pricing",
            metadata={
                "user_id": current_user["user_id"],
                "plan": plan.value
            }
        )
        
        return {"checkout_url": checkout_session.url, "session_id": checkout_session.id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}"
        )

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    db = get_db()
    
    # Handle checkout.session.completed
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"]["user_id"]
        plan = session["metadata"]["plan"]
        
        # Update user subscription
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"subscription_plan": plan}}
        )
        
        # Create subscription record
        subscription_id = str(uuid.uuid4())
        subscription = {
            "id": subscription_id,
            "user_id": user_id,
            "plan": plan,
            "stripe_subscription_id": session.get("subscription"),
            "stripe_customer_id": session.get("customer"),
            "status": "active",
            "current_period_end": None,
            "created_at": datetime.utcnow()
        }
        await db.subscriptions.insert_one(subscription)
    
    # Handle subscription updated/cancelled
    elif event["type"] in ["customer.subscription.updated", "customer.subscription.deleted"]:
        subscription = event["data"]["object"]
        stripe_subscription_id = subscription["id"]
        
        # Find and update subscription
        db_subscription = await db.subscriptions.find_one({"stripe_subscription_id": stripe_subscription_id})
        if db_subscription:
            new_status = "active" if subscription["status"] == "active" else "cancelled"
            await db.subscriptions.update_one(
                {"id": db_subscription["id"]},
                {"$set": {"status": new_status}}
            )
            
            # Update user plan if cancelled
            if new_status == "cancelled":
                await db.users.update_one(
                    {"id": db_subscription["user_id"]},
                    {"$set": {"subscription_plan": SubscriptionPlan.FREE.value}}
                )
    
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
        stripe_subscription_id=subscription.get("stripe_subscription_id"),
        status=subscription["status"],
        current_period_end=subscription.get("current_period_end"),
        created_at=subscription["created_at"]
    )
