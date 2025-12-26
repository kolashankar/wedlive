import logging
import uuid
from datetime import datetime
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class FolderService:
    """
    Folder/Album Service for organizing wedding media
    Allows creators to organize photos and videos into folders
    Uses UUIDs instead of MongoDB ObjectIds for consistency
    """
    
    def __init__(self, db):
        self.db = db
        self.folders_collection = db.media_folders
        self.media_collection = db.media
        self.weddings_collection = db.weddings
    
    async def create_folder(
        self,
        wedding_id: str,
        name: str,
        parent_folder_id: Optional[str] = None,
        description: Optional[str] = None,
        user_id: str = None
    ) -> Dict:
        """Create a new media folder (supports nested folders)"""
        try:
            # Check if folder name already exists at this level
            query = {
                "wedding_id": wedding_id,
                "name": name,
                "parent_folder_id": parent_folder_id
            }
            
            existing = await self.folders_collection.find_one(query)
            
            if existing:
                raise Exception(f"Folder '{name}' already exists at this level")
            
            # Verify parent folder exists if provided
            if parent_folder_id:
                parent = await self.folders_collection.find_one({
                    "_id": parent_folder_id
                })
                if not parent:
                    raise Exception(f"Parent folder {parent_folder_id} not found")
            
            folder_id = str(uuid.uuid4())
            
            folder_doc = {
                "_id": folder_id,
                "wedding_id": wedding_id,
                "name": name,
                "parent_folder_id": parent_folder_id,
                "description": description,
                "media_count": 0,
                "folder_size": 0,
                "subfolder_count": 0,
                "created_by": user_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await self.folders_collection.insert_one(folder_doc)
            
            # Update parent folder's subfolder count
            if parent_folder_id:
                await self._update_subfolder_count(parent_folder_id)
            
            logger.info(f"📁 Folder '{name}' created for wedding {wedding_id} (parent: {parent_folder_id or 'root'})")
            
            return {
                "id": folder_id,
                "wedding_id": wedding_id,
                "name": name,
                "parent_folder_id": parent_folder_id,
                "description": description,
                "media_count": 0,
                "folder_size": 0,
                "subfolder_count": 0,
                "created_at": folder_doc["created_at"].isoformat(),
                "updated_at": folder_doc["updated_at"].isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to create folder: {str(e)}")
            raise
    
    async def get_folder(self, folder_id: str) -> Optional[Dict]:
        """Get folder by ID with updated counts"""
        try:
            folder = await self.folders_collection.find_one({
                "_id": folder_id
            })
            
            if not folder:
                return None
            
            # Calculate current media count
            media_count = await self.media_collection.count_documents({
                "folder_id": folder_id
            })
            
            # Calculate subfolder count
            subfolder_count = await self.folders_collection.count_documents({
                "parent_folder_id": folder_id
            })
            
            # Calculate folder size
            folder_size = await self._calculate_folder_size(folder_id)
            
            return {
                "id": str(folder["_id"]),
                "wedding_id": folder["wedding_id"],
                "name": folder["name"],
                "parent_folder_id": folder.get("parent_folder_id"),
                "description": folder.get("description"),
                "media_count": media_count,
                "folder_size": folder_size,
                "subfolder_count": subfolder_count,
                "created_at": folder["created_at"].isoformat(),
                "updated_at": folder["updated_at"].isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get folder {folder_id}: {str(e)}")
            raise
    
    async def get_wedding_folders(
        self,
        wedding_id: str
    ) -> List[Dict]:
        """Get all folders for a wedding (flat list with parent references)"""
        try:
            cursor = self.folders_collection.find({
                "wedding_id": wedding_id
            }).sort("created_at", 1)
            
            folders = []
            async for folder in cursor:
                folder_id = str(folder["_id"])
                
                # Count media in folder
                media_count = await self.media_collection.count_documents({
                    "wedding_id": wedding_id,
                    "folder_id": folder_id
                })
                
                # Count subfolders
                subfolder_count = await self.folders_collection.count_documents({
                    "parent_folder_id": folder_id
                })
                
                # Calculate folder size
                folder_size = await self._calculate_folder_size(folder_id)
                
                folders.append({
                    "id": folder_id,
                    "wedding_id": folder["wedding_id"],
                    "name": folder["name"],
                    "parent_folder_id": folder.get("parent_folder_id"),
                    "description": folder.get("description"),
                    "media_count": media_count,
                    "folder_size": folder_size,
                    "subfolder_count": subfolder_count,
                    "created_at": folder["created_at"].isoformat(),
                    "updated_at": folder["updated_at"].isoformat()
                })
            
            return folders
            
        except Exception as e:
            logger.error(f"Failed to get wedding folders: {str(e)}")
            raise
    
    async def update_folder(
        self,
        folder_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None
    ) -> Dict:
        """Update folder name or description"""
        try:
            update_data = {"updated_at": datetime.utcnow()}
            
            if name is not None:
                update_data["name"] = name
            if description is not None:
                update_data["description"] = description
            
            await self.folders_collection.update_one(
                {"_id": folder_id},
                {"$set": update_data}
            )
            
            return await self.get_folder(folder_id)
            
        except Exception as e:
            logger.error(f"Failed to update folder {folder_id}: {str(e)}")
            raise
    
    async def delete_folder(
        self,
        folder_id: str,
        user_id: str
    ) -> bool:
        """Delete a folder (moves content to parent)"""
        try:
            folder = await self.folders_collection.find_one({"_id": folder_id})
            
            if not folder:
                return False
            
            parent_folder_id = folder.get("parent_folder_id")
            
            # Move all media to parent folder (or root if no parent)
            await self.media_collection.update_many(
                {"folder_id": folder_id},
                {"$set": {"folder_id": parent_folder_id}}
            )
            
            # Move all subfolders to parent
            await self.folders_collection.update_many(
                {"parent_folder_id": folder_id},
                {"$set": {"parent_folder_id": parent_folder_id}}
            )
            
            # Delete the folder
            await self.folders_collection.delete_one({"_id": folder_id})
            
            # Update parent subfolder count
            if parent_folder_id:
                await self._update_subfolder_count(parent_folder_id)
            
            logger.info(f"🗑️ Folder {folder_id} deleted, content moved to parent")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete folder {folder_id}: {str(e)}")
            raise
    
    async def move_folder(
        self,
        folder_id: str,
        new_parent_id: Optional[str],
        user_id: str
    ) -> bool:
        """Move folder to a different parent (or root)"""
        try:
            # Prevent circular references
            if new_parent_id and await self._is_descendant(new_parent_id, folder_id):
                raise Exception("Cannot move folder into its own descendant")
            
            folder = await self.folders_collection.find_one({"_id": folder_id})
            if not folder:
                return False
            
            old_parent_id = folder.get("parent_folder_id")
            
            # Update folder's parent
            await self.folders_collection.update_one(
                {"_id": folder_id},
                {"$set": {
                    "parent_folder_id": new_parent_id,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            # Update old parent's subfolder count
            if old_parent_id:
                await self._update_subfolder_count(old_parent_id)
            
            # Update new parent's subfolder count
            if new_parent_id:
                await self._update_subfolder_count(new_parent_id)
            
            logger.info(f"📂 Folder {folder_id} moved to {new_parent_id or 'root'}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to move folder {folder_id}: {str(e)}")
            raise
    
    async def move_media_to_folder(
        self,
        media_id: str,
        folder_id: Optional[str],
        user_id: str
    ) -> bool:
        """Move media to a folder or remove from folder"""
        try:
            media = await self.media_collection.find_one({"_id": media_id})
            if not media:
                return False
            
            old_folder_id = media.get("folder_id")
            
            # Update media's folder
            await self.media_collection.update_one(
                {"_id": media_id},
                {"$set": {"folder_id": folder_id}}
            )
            
            # Update old folder's counts
            if old_folder_id:
                await self._update_folder_counts(old_folder_id)
            
            # Update new folder's counts
            if folder_id:
                await self._update_folder_counts(folder_id)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to move media {media_id}: {str(e)}")
            raise
    
    async def get_folder_media(
        self,
        folder_id: str,
        limit: int = 50,
        skip: int = 0
    ) -> List[Dict]:
        """Get media in a specific folder"""
        try:
            cursor = self.media_collection.find({
                "folder_id": folder_id
            }).sort("created_at", -1).skip(skip).limit(limit)
            
            media_list = []
            async for media in cursor:
                media["id"] = str(media["_id"])
                del media["_id"]
                media_list.append(media)
            
            return media_list
            
        except Exception as e:
            logger.error(f"Failed to get folder media: {str(e)}")
            raise
    
    # Helper methods
    
    async def _calculate_folder_size(self, folder_id: str) -> int:
        """Calculate total size of media in folder (recursive)"""
        try:
            # Get media in this folder
            cursor = self.media_collection.find({"folder_id": folder_id})
            total_size = 0
            
            async for media in cursor:
                total_size += media.get("file_size", 0)
            
            # Add size from subfolders
            subfolder_cursor = self.folders_collection.find({"parent_folder_id": folder_id})
            async for subfolder in subfolder_cursor:
                subfolder_id = str(subfolder["_id"])
                total_size += await self._calculate_folder_size(subfolder_id)
            
            return total_size
            
        except Exception as e:
            logger.error(f"Failed to calculate folder size: {str(e)}")
            return 0
    
    async def _update_subfolder_count(self, folder_id: str):
        """Update subfolder count for a folder"""
        try:
            count = await self.folders_collection.count_documents({
                "parent_folder_id": folder_id
            })
            
            await self.folders_collection.update_one(
                {"_id": folder_id},
                {"$set": {"subfolder_count": count, "updated_at": datetime.utcnow()}}
            )
        except Exception as e:
            logger.error(f"Failed to update subfolder count: {str(e)}")
    
    async def _update_folder_counts(self, folder_id: str):
        """Update media count and size for a folder"""
        try:
            media_count = await self.media_collection.count_documents({
                "folder_id": folder_id
            })
            
            folder_size = await self._calculate_folder_size(folder_id)
            
            await self.folders_collection.update_one(
                {"_id": folder_id},
                {"$set": {
                    "media_count": media_count,
                    "folder_size": folder_size,
                    "updated_at": datetime.utcnow()
                }}
            )
        except Exception as e:
            logger.error(f"Failed to update folder counts: {str(e)}")
    
    async def _is_descendant(self, potential_descendant_id: str, ancestor_id: str) -> bool:
        """Check if potential_descendant is a descendant of ancestor"""
        try:
            current = await self.folders_collection.find_one({"_id": potential_descendant_id})
            
            while current:
                if str(current["_id"]) == ancestor_id:
                    return True
                
                parent_id = current.get("parent_folder_id")
                if not parent_id:
                    break
                
                current = await self.folders_collection.find_one({"_id": parent_id})
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to check descendant: {str(e)}")
            return False
