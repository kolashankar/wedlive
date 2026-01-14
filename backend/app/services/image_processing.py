"""
Image Processing Service
Handles mask generation, image compositing, and template processing
"""
import os
import tempfile
import logging
from typing import List, Dict, Optional, Tuple
import asyncio
from concurrent.futures import ThreadPoolExecutor
import aiofiles
import aiohttp
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

logger = logging.getLogger(__name__)

class ImageProcessingService:
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)
    
    async def generate_mask_from_shape(self, shape: Dict, template_url: str, template_path: str) -> str:
        """
        Generate alpha mask from freehand shape
        """
        try:
            logger.info(f"[MASK_GEN] Generating mask for shape: {shape['id']}")
            
            # Load template image
            template_img = Image.open(template_path)
            
            # Create mask canvas
            mask = Image.new('L', template_img.size, 0)  # Black background
            
            # Draw shape on mask
            draw = ImageDraw.Draw(mask)
            
            if len(shape['points']) >= 3:
                points = [(int(p[0]), int(p[1])) for p in shape['points']]
                
                # Draw filled polygon
                draw.polygon(points, fill=255)
                
                # Apply feather effect if specified
                if shape.get('feather', 0) > 0:
                    mask = self._apply_feather(mask, shape['feather'])
                
                # Save mask to temp file
                temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
                mask.save(temp_file.name, 'PNG')
                
                # Upload to Telegram CDN
                from app.services.telegram_service import TelegramCDNService
                telegram_service = TelegramCDNService()
                
                upload_result = await telegram_service.upload_photo(
                    file_path=temp_file.name,
                    caption=f"Mask for shape {shape['id']}",
                    wedding_id="template-masks"
                )
                
                # Cleanup temp file
                os.unlink(temp_file.name)
                
                if upload_result.get("success"):
                    logger.info(f"[MASK_GEN] Successfully generated mask: {shape['id']}")
                    return upload_result["cdn_url"]
                else:
                    raise Exception(f"Failed to upload mask: {upload_result.get('error')}")
                
        except Exception as e:
            logger.error(f"[MASK_GEN] Error generating mask: {str(e)}")
            raise
    
    def _apply_feather(self, mask: Image.Image, feather_radius: int) -> Image.Image:
        """Apply feather/blur effect to mask edges"""
        # Gaussian blur for feathering
        return mask.filter(ImageFilter.GaussianBlur(radius=feather_radius))
    
    async def generate_composite(self, template: Dict, photo_urls: List[str], template_url: str) -> str:
        """
        Generate final composite image with photos fitted into shapes
        """
        try:
            logger.info(f"[COMPOSITE] Generating composite for template: {template['id']}")
            
            # Download template image
            template_path = await self._download_image(template_url)
            template_img = Image.open(template_path)
            
            # Create composite canvas
            composite = Image.new('RGBA', template_img.size, (0, 0, 0, 0))
            
            # Draw template as base
            composite.paste(template_img, (0, 0), template_img)
            
            # Process each shape and corresponding photo
            shapes = template.get('shapes', [])
            for i, shape in enumerate(shapes):
                if i >= len(photo_urls):
                    break
                
                try:
                    processed_result = await self._process_shape_with_photo(template_img, shape, photo_urls[i])
                    if processed_result:
                        photo_with_mask, position = processed_result
                        # Paste processed photo onto composite
                        composite.paste(photo_with_mask, position, photo_with_mask)
                except Exception as e:
                    logger.error(f"[COMPOSITE] Error processing shape {i}: {str(e)}")
                    continue
            
            # Save composite to temp file
            temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            composite.save(temp_file.name, 'PNG')
            
            # Upload composite to Telegram CDN
            upload_result = await self._upload_to_telegram(
                temp_file.name, 
                f"Composite for template {template['id']}"
            )
            
            # Cleanup temp files
            os.unlink(temp_file.name)
            os.unlink(template_path)
            
            if upload_result.get("success"):
                logger.info(f"[COMPOSITE] Successfully generated composite: {template['id']}")
                return upload_result["cdn_url"]
            else:
                raise Exception(f"Failed to upload composite: {upload_result.get('error')}")
                
        except Exception as e:
            logger.error(f"[COMPOSITE] Error generating composite: {str(e)}")
            raise
    
    async def _process_shape_with_photo(self, template_img: Image.Image, shape: Dict, photo_url: str) -> Optional[Tuple[Image.Image, Tuple[int, int]]]:
        """Process individual shape with photo"""
        try:
            # Download photo
            photo_path = await self._download_image(photo_url)
            photo_img = Image.open(photo_path)
            
            # Get shape bounding box
            bbox = shape.get('bounding_box', {})
            if not bbox:
                return None
            
            # Calculate dimensions
            shape_width = int(bbox['width'])
            shape_height = int(bbox['height'])
            shape_x = int(bbox['minX'])
            shape_y = int(bbox['minY'])
            
            # Resize photo to fit shape bounding box
            resized_photo = self._resize_photo_to_fit(photo_img, shape_width, shape_height)
            
            # Create mask for this shape
            mask = Image.new('L', (shape_width, shape_height), 0)
            draw = ImageDraw.Draw(mask)
            
            # Transform shape points to local coordinates
            local_points = []
            for point in shape['points']:
                local_x = int(point[0] - bbox['minX'])
                local_y = int(point[1] - bbox['minY'])
                local_points.append((local_x, local_y))
            
            # Draw shape mask
            draw.polygon(local_points, fill=255)
            
            # Apply feather
            if shape.get('feather', 0) > 0:
                mask = self._apply_feather(mask, shape['feather'])
            
            # Apply mask to photo
            photo_with_mask = Image.new('RGBA', (shape_width, shape_height), (0, 0, 0, 0))
            photo_with_mask.paste(resized_photo, (0, 0), mask)
            
            # Add shadow if enabled
            if shape.get('shadow', False):
                photo_with_mask = self._add_shadow(photo_with_mask, shape.get('shadow_depth', 4))
            
            # Cleanup
            os.unlink(photo_path)
            
            return photo_with_mask, (shape_x, shape_y)
            
        except Exception as e:
            logger.error(f"[SHAPE_PROCESS] Error: {str(e)}")
            return None
    
    def _resize_photo_to_fit(self, photo: Image.Image, target_width: int, target_height: int) -> Image.Image:
        """Resize photo to fit within target dimensions while maintaining aspect ratio"""
        # Calculate aspect ratios
        photo_ratio = photo.width / photo.height
        target_ratio = target_width / target_height
        
        if photo_ratio > target_ratio:
            # Photo is wider - fit to width
            new_width = target_width
            new_height = int(target_width / photo_ratio)
        else:
            # Photo is taller - fit to height
            new_height = target_height
            new_width = int(target_height * photo_ratio)
        
        # Resize and crop to center
        resized = photo.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Create target-sized image and paste resized photo in center
        result = Image.new('RGBA', (target_width, target_height), (0, 0, 0, 0))
        paste_x = (target_width - new_width) // 2
        paste_y = (target_height - new_height) // 2
        result.paste(resized, (paste_x, paste_y))
        
        return result
    
    def _add_shadow(self, img: Image.Image, shadow_depth: int) -> Image.Image:
        """Add drop shadow to image"""
        # Create shadow layer
        shadow = Image.new('RGBA', img.size, (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)
        
        # Draw offset shadow
        shadow_draw.bitmap((shadow_depth, shadow_depth), img.convert('L'), fill=(0, 0, 0, 128))
        
        # Blur shadow
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=shadow_depth//2))
        
        # Composite shadow and image
        result = Image.new('RGBA', img.size, (0, 0, 0, 0))
        result.paste(shadow, (0, 0))
        result.paste(img, (0, 0), img)
        
        return result
    
    async def _download_image(self, url: str) -> str:
        """Download image from URL to temp file"""
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    content = await response.read()
                    
                    # Save to temp file
                    temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
                    async with aiofiles.open(temp_file.name, 'wb') as f:
                        await f.write(content)
                    
                    return temp_file.name
                else:
                    raise Exception(f"Failed to download image: {response.status}")
    
    async def _upload_to_telegram(self, file_path: str, caption: str) -> Dict:
        """Upload processed image to Telegram CDN"""
        from app.services.telegram_service import TelegramCDNService
        telegram_service = TelegramCDNService()
        
        result = await telegram_service.upload_photo(
            file_path=file_path,
            caption=caption,
            wedding_id="template-composites"
        )
        
        return result
