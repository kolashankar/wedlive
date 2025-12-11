import aiohttp
import hmac
import hashlib
import json
from datetime import datetime
from app.database import get_db
import asyncio

class WebhookService:
    @staticmethod
    def create_signature(payload: dict, secret: str) -> str:
        """Create HMAC signature for webhook payload"""
        payload_str = json.dumps(payload, sort_keys=True)
        signature = hmac.new(
            secret.encode(),
            payload_str.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"sha256={signature}"
    
    @staticmethod
    async def trigger_webhooks(
        user_id: str,
        event: str,
        data: dict
    ):
        """Trigger all webhooks for a user and event"""
        db = get_db()
        
        # Find all active webhooks for this user and event
        webhooks = await db.webhooks.find({
            "user_id": user_id,
            "status": "active",
            "events": event
        }).to_list(length=100)
        
        # Trigger each webhook
        tasks = []
        for webhook in webhooks:
            task = WebhookService.deliver_webhook(webhook, event, data)
            tasks.append(task)
        
        # Execute all webhook deliveries concurrently
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    @staticmethod
    async def deliver_webhook(webhook: dict, event: str, data: dict):
        """Deliver webhook to URL"""
        db = get_db()
        
        payload = {
            "event": event,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
        
        signature = WebhookService.create_signature(payload, webhook["secret"])
        
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event
        }
        
        log_entry = {
            "webhook_id": webhook["id"],
            "event": event,
            "url": webhook["url"],
            "created_at": datetime.utcnow()
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook["url"],
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    log_entry["status_code"] = response.status
                    log_entry["response"] = await response.text()
                    log_entry["success"] = 200 <= response.status < 300
                    
                    # Update webhook stats
                    if log_entry["success"]:
                        await db.webhooks.update_one(
                            {"id": webhook["id"]},
                            {
                                "$set": {"last_triggered": datetime.utcnow()},
                                "$inc": {"success_count": 1}
                            }
                        )
                    else:
                        await db.webhooks.update_one(
                            {"id": webhook["id"]},
                            {"$inc": {"failure_count": 1}}
                        )
        
        except Exception as e:
            log_entry["status_code"] = 0
            log_entry["response"] = str(e)
            log_entry["success"] = False
            
            # Update failure count
            await db.webhooks.update_one(
                {"id": webhook["id"]},
                {"$inc": {"failure_count": 1}}
            )
        
        # Save log
        await db.webhook_logs.insert_one(log_entry)
        
        return log_entry["success"]

# Convenience functions for common events
async def trigger_stream_started(user_id: str, wedding_id: str, wedding_data: dict):
    await WebhookService.trigger_webhooks(
        user_id,
        "stream.started",
        {"wedding_id": wedding_id, "wedding": wedding_data}
    )

async def trigger_stream_ended(user_id: str, wedding_id: str, wedding_data: dict):
    await WebhookService.trigger_webhooks(
        user_id,
        "stream.ended",
        {"wedding_id": wedding_id, "wedding": wedding_data}
    )

async def trigger_recording_ready(user_id: str, wedding_id: str, recording_url: str):
    await WebhookService.trigger_webhooks(
        user_id,
        "recording.ready",
        {"wedding_id": wedding_id, "recording_url": recording_url}
    )

async def trigger_viewer_joined(user_id: str, wedding_id: str, viewer_count: int):
    await WebhookService.trigger_webhooks(
        user_id,
        "viewer.joined",
        {"wedding_id": wedding_id, "viewer_count": viewer_count}
    )
