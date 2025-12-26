import logging
from datetime import datetime
from typing import List, Dict, Optional
from bson import ObjectId

logger = logging.getLogger(__name__)


class ChatService:
    """
    Chat Service for managing wedding live chat messages
    Stores messages permanently in database
    """
    
    def __init__(self, db):
        self.db = db
        self.messages_collection = db.chat_messages
        self.weddings_collection = db.weddings
    
    async def save_message(
        self,
        wedding_id: str,
        message: str,
        guest_name: str = "Anonymous",
        user_id: Optional[str] = None
    ) -> Dict:
        """Save a chat message to database"""
        try:
            message_doc = {
                "wedding_id": wedding_id,
                "message": message,
                "guest_name": guest_name,
                "user_id": user_id,
                "created_at": datetime.utcnow(),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            result = await self.messages_collection.insert_one(message_doc)
            message_id = str(result.inserted_id)
            
            logger.info(f"💬 Message saved for wedding {wedding_id} by {guest_name}")
            
            return {
                "message_id": message_id,
                "wedding_id": wedding_id,
                "message": message,
                "guest_name": guest_name,
                "user_id": user_id,
                "timestamp": message_doc["timestamp"]
            }
            
        except Exception as e:
            logger.error(f"Failed to save message: {str(e)}")
            raise
    
    async def get_messages(
        self,
        wedding_id: str,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict]:
        """Get chat messages for a wedding"""
        try:
            cursor = self.messages_collection.find({
                "wedding_id": wedding_id
            }).sort("created_at", 1).skip(skip).limit(limit)
            
            messages = []
            async for msg in cursor:
                messages.append({
                    "message_id": str(msg["_id"]),
                    "wedding_id": msg["wedding_id"],
                    "message": msg["message"],
                    "guest_name": msg.get("guest_name", "Anonymous"),
                    "user_id": msg.get("user_id"),
                    "timestamp": msg.get("timestamp") or msg["created_at"].isoformat()
                })
            
            return messages
            
        except Exception as e:
            logger.error(f"Failed to get messages for wedding {wedding_id}: {str(e)}")
            raise
    
    async def get_recent_messages(
        self,
        wedding_id: str,
        limit: int = 50
    ) -> List[Dict]:
        """Get most recent messages for a wedding"""
        try:
            cursor = self.messages_collection.find({
                "wedding_id": wedding_id
            }).sort("created_at", -1).limit(limit)
            
            messages = []
            async for msg in cursor:
                messages.append({
                    "message_id": str(msg["_id"]),
                    "wedding_id": msg["wedding_id"],
                    "message": msg["message"],
                    "guest_name": msg.get("guest_name", "Anonymous"),
                    "user_id": msg.get("user_id"),
                    "timestamp": msg.get("timestamp") or msg["created_at"].isoformat()
                })
            
            # Reverse to get chronological order
            messages.reverse()
            return messages
            
        except Exception as e:
            logger.error(f"Failed to get recent messages for wedding {wedding_id}: {str(e)}")
            raise
    
    async def delete_message(
        self,
        message_id: str,
        user_id: str
    ) -> bool:
        """Delete a message (admin/creator only)"""
        try:
            result = await self.messages_collection.delete_one({
                "_id": ObjectId(message_id)
            })
            
            if result.deleted_count > 0:
                logger.info(f"Message {message_id} deleted by user {user_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to delete message {message_id}: {str(e)}")
            raise
    
    async def get_message_count(self, wedding_id: str) -> int:
        """Get total message count for a wedding"""
        try:
            count = await self.messages_collection.count_documents({
                "wedding_id": wedding_id
            })
            return count
        except Exception as e:
            logger.error(f"Failed to get message count for wedding {wedding_id}: {str(e)}")
            return 0
    
    async def clear_wedding_messages(
        self,
        wedding_id: str,
        user_id: str
    ) -> int:
        """Clear all messages for a wedding (creator only)"""
        try:
            result = await self.messages_collection.delete_many({
                "wedding_id": wedding_id
            })
            
            logger.info(f"Cleared {result.deleted_count} messages for wedding {wedding_id} by user {user_id}")
            return result.deleted_count
            
        except Exception as e:
            logger.error(f"Failed to clear messages for wedding {wedding_id}: {str(e)}")
            raise
