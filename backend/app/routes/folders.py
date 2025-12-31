from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models import (
    MediaFolderCreate, MediaFolderUpdate, MediaFolderResponse, 
    MediaFolderListResponse, MediaFolderMove, MediaMoveRequest
)
from app.services.folder_service import FolderService
from app.database import get_db
from app.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/folders", tags=["Folders"])


@router.post("/create", response_model=MediaFolderResponse)
async def create_folder(
    folder_data: MediaFolderCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new media folder for organizing wedding photos/videos
    Supports nested folders via parent_folder_id
    Creator only
    """
    try:
        db = get_db()
        folder_service = FolderService(db)
        
        result = await folder_service.create_folder(
            wedding_id=folder_data.wedding_id,
            name=folder_data.name,
            parent_folder_id=folder_data.parent_folder_id,
            description=folder_data.description,
            user_id=current_user["user_id"]
        )
        
        return MediaFolderResponse(**result)
        
    except Exception as e:
        logger.error(f"Failed to create folder: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{folder_id}", response_model=MediaFolderResponse)
async def get_folder(
    folder_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get folder details by ID
    """
    try:
        db = get_db()
        folder_service = FolderService(db)
        folder = await folder_service.get_folder(folder_id)
        
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        return MediaFolderResponse(**folder)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get folder: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/wedding/{wedding_id}", response_model=List[MediaFolderResponse])
async def get_wedding_folders(
    wedding_id: str
):
    """
    Get all folders for a wedding
    Public access for viewing, but only creator can modify
    """
    try:
        db = get_db()
        folder_service = FolderService(db)
        folders = await folder_service.get_wedding_folders(wedding_id)
        
        return [MediaFolderResponse(**folder) for folder in folders]
        
    except Exception as e:
        logger.error(f"Failed to get wedding folders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{folder_id}", response_model=MediaFolderResponse)
async def update_folder(
    folder_id: str,
    folder_data: MediaFolderUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update folder name or description
    Creator only
    """
    try:
        db = get_db()
        folder_service = FolderService(db)
        
        result = await folder_service.update_folder(
            folder_id=folder_id,
            name=folder_data.name,
            description=folder_data.description
        )
        
        return MediaFolderResponse(**result)
        
    except Exception as e:
        logger.error(f"Failed to update folder: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a folder
    Media in folder will not be deleted, just moved to root
    Creator only
    """
    try:
        db = get_db()
        folder_service = FolderService(db)
        
        success = await folder_service.delete_folder(
            folder_id=folder_id,
            user_id=current_user["user_id"]
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        return {
            "success": True,
            "message": "Folder deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete folder: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/move-media")
async def move_media_to_folder(
    media_id: str,
    folder_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Move media to a folder or remove from folder (folder_id=null)
    Creator only
    """
    try:
        db = get_db()
        folder_service = FolderService(db)
        
        success = await folder_service.move_media_to_folder(
            media_id=media_id,
            folder_id=folder_id,
            user_id=current_user["user_id"]
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Media not found")
        
        return {
            "success": True,
            "message": f"Media moved to {'folder' if folder_id else 'root'} successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to move media: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{folder_id}/media", response_model=List[dict])
async def get_folder_media(
    folder_id: str,
    limit: int = 50,
    skip: int = 0
):
    """
    Get all media in a specific folder
    Public access
    """
    try:
        db = get_db()
        folder_service = FolderService(db)
        media = await folder_service.get_folder_media(
            folder_id=folder_id,
            limit=limit,
            skip=skip
        )
        
        return media
        
    except Exception as e:
        logger.error(f"Failed to get folder media: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/move")
async def move_folder(
    move_data: MediaFolderMove,
    current_user: dict = Depends(get_current_user)
):
    """
    Move a folder to a different parent folder (or root if new_parent_id is None)
    Creator only
    """
    try:
        db = get_db()
        folder_service = FolderService(db)
        
        success = await folder_service.move_folder(
            folder_id=move_data.folder_id,
            new_parent_id=move_data.new_parent_id,
            user_id=current_user["user_id"]
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        return {
            "success": True,
            "message": f"Folder moved to {'root' if not move_data.new_parent_id else 'new parent'} successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to move folder: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
