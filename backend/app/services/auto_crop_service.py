"""
Auto-Crop Service with Mask Support
Handles intelligent photo cropping into non-uniform border masks
"""
import os
import tempfile
import logging
from typing import Optional, Tuple, Dict
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import aiohttp
import aiofiles
from io import BytesIO
import cairosvg
from xml.etree import ElementTree as ET

logger = logging.getLogger(__name__)

class AutoCropService:
    """
    Service for automatically cropping photos into border masks
    - Always works from original image
    - Applies mask (SVG or polygon)
    - Center-weighted smart cropping
    - Mirror support for bride/groom
    """
    
    def __init__(self):
        self.temp_dir = "/tmp/wedlive_crops"
        os.makedirs(self.temp_dir, exist_ok=True)
    
    async def download_image(self, url: str) -> str:
        """Download image from URL to temp file"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                    if response.status != 200:
                        raise Exception(f"Failed to download image: HTTP {response.status}")
                    
                    content = await response.read()
                    
                    # Save to temp file
                    temp_file = tempfile.NamedTemporaryFile(
                        delete=False, 
                        suffix='.jpg', 
                        dir=self.temp_dir
                    )
                    
                    async with aiofiles.open(temp_file.name, 'wb') as f:
                        await f.write(content)
                    
                    logger.info(f"[AUTO_CROP] Downloaded image to {temp_file.name}")
                    return temp_file.name
                    
        except Exception as e:
            logger.error(f"[AUTO_CROP] Error downloading image from {url}: {str(e)}")
            raise
    
    def create_mask_from_svg(self, svg_path: str, width: int, height: int) -> Image.Image:
        """Convert SVG path to PIL mask image"""
        try:
            # Create SVG document with the path
            svg_template = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
    <path d="{svg_path}" fill="white"/>
</svg>'''
            
            # Convert SVG to PNG using cairosvg
            png_data = cairosvg.svg2png(bytestring=svg_template.encode('utf-8'))
            
            # Load as PIL Image
            mask = Image.open(BytesIO(png_data)).convert('L')
            
            logger.info(f"[AUTO_CROP] Created mask from SVG path")
            return mask
            
        except Exception as e:
            logger.error(f"[AUTO_CROP] Error creating mask from SVG: {str(e)}")
            # Fallback: create rectangular mask
            return Image.new('L', (width, height), 255)
    
    def create_mask_from_polygon(self, points: list, width: int, height: int) -> Image.Image:
        """Create mask from polygon points"""
        try:
            mask = Image.new('L', (width, height), 0)
            draw = ImageDraw.Draw(mask)
            
            # Convert points to tuple format
            polygon_coords = [(p['x'], p['y']) for p in points]
            
            # Draw filled polygon
            draw.polygon(polygon_coords, fill=255)
            
            logger.info(f"[AUTO_CROP] Created mask from {len(points)} polygon points")
            return mask
            
        except Exception as e:
            logger.error(f"[AUTO_CROP] Error creating mask from polygon: {str(e)}")
            # Fallback: create rectangular mask
            return Image.new('L', (width, height), 255)
    
    def apply_feather(self, mask: Image.Image, radius: int) -> Image.Image:
        """Apply feather/blur effect to mask edges"""
        if radius > 0:
            mask = mask.filter(ImageFilter.GaussianBlur(radius=radius))
        return mask
    
    def smart_crop_and_fit(self, photo: Image.Image, mask: Image.Image, 
                          mask_bbox: Dict) -> Image.Image:
        """
        Intelligently crop photo to fit mask area
        Uses center-weighted cropping with no distortion
        """
        try:
            # Get mask dimensions from bbox
            mask_width = int(mask_bbox['width'])
            mask_height = int(mask_bbox['height'])
            
            if mask_width == 0 or mask_height == 0:
                # Fallback to image dimensions
                mask_width, mask_height = mask.size
            
            # Calculate aspect ratios
            photo_ratio = photo.width / photo.height
            mask_ratio = mask_width / mask_height
            
            # Determine crop strategy
            if photo_ratio > mask_ratio:
                # Photo is wider - crop width, fit height
                new_height = mask_height
                new_width = int(new_height * photo_ratio)
            else:
                # Photo is taller - crop height, fit width
                new_width = mask_width
                new_height = int(new_width / photo_ratio)
            
            # Resize photo maintaining aspect ratio
            photo_resized = photo.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Create canvas for final result
            result = Image.new('RGB', (mask_width, mask_height), (255, 255, 255))
            
            # Center the resized photo
            paste_x = (mask_width - new_width) // 2
            paste_y = (mask_height - new_height) // 2
            
            # Paste photo onto canvas
            result.paste(photo_resized, (paste_x, paste_y))
            
            logger.info(f"[AUTO_CROP] Smart cropped photo from {photo.size} to {result.size}")
            return result
            
        except Exception as e:
            logger.error(f"[AUTO_CROP] Error in smart crop: {str(e)}")
            # Fallback: simple resize
            return photo.resize((mask_width, mask_height), Image.Resampling.LANCZOS)
    
    def mirror_image(self, img: Image.Image) -> Image.Image:
        """Mirror image horizontally for groom photo"""
        return ImageOps.mirror(img)
    
    def mirror_border(self, border: Image.Image) -> Image.Image:
        """Mirror border image horizontally"""
        return ImageOps.mirror(border)
    
    async def apply_crop_with_border(
        self,
        photo_url: str,
        border_url: str,
        mask_data: Dict,
        mirror: bool = False
    ) -> Tuple[str, str]:
        """
        Main auto-crop function
        
        Args:
            photo_url: URL of original photo
            border_url: URL of border image
            mask_data: Dict with mask configuration
            mirror: Whether to mirror the result (for groom photo)
        
        Returns:
            Tuple of (temp_file_path, message)
        """
        photo_path = None
        border_path = None
        
        try:
            logger.info(f"[AUTO_CROP] Starting auto-crop process")
            logger.info(f"[AUTO_CROP] Photo: {photo_url}")
            logger.info(f"[AUTO_CROP] Border: {border_url}")
            logger.info(f"[AUTO_CROP] Mirror: {mirror}")
            
            # Download images
            photo_path = await self.download_image(photo_url)
            border_path = await self.download_image(border_url)
            
            # Load images
            photo = Image.open(photo_path).convert('RGB')
            border = Image.open(border_path).convert('RGBA')
            
            # Mirror border if needed
            if mirror:
                border = self.mirror_border(border)
                logger.info(f"[AUTO_CROP] Border mirrored")
            
            # Get border dimensions
            border_width, border_height = border.size
            
            # Create mask
            mask = None
            if mask_data.get('svg_path'):
                mask = self.create_mask_from_svg(
                    mask_data['svg_path'],
                    border_width,
                    border_height
                )
            elif mask_data.get('polygon_points'):
                mask = self.create_mask_from_polygon(
                    mask_data['polygon_points'],
                    border_width,
                    border_height
                )
            else:
                # No mask - create rectangular mask for entire image
                logger.warning("[AUTO_CROP] No mask data provided, using full image")
                mask = Image.new('L', (border_width, border_height), 255)
            
            # Apply feather
            feather_radius = mask_data.get('feather_radius', 8)
            mask = self.apply_feather(mask, feather_radius)
            
            # Smart crop photo to fit mask area
            mask_bbox = {
                'width': mask_data.get('width', border_width),
                'height': mask_data.get('height', border_height),
                'x': mask_data.get('x', 0),
                'y': mask_data.get('y', 0)
            }
            
            fitted_photo = self.smart_crop_and_fit(photo, mask, mask_bbox)
            
            # Mirror photo if needed
            if mirror:
                fitted_photo = self.mirror_image(fitted_photo)
                logger.info(f"[AUTO_CROP] Photo mirrored")
            
            # Create final composite
            # Start with border as base
            final = Image.new('RGBA', border.size, (255, 255, 255, 0))
            
            # Convert fitted photo to RGBA
            fitted_photo_rgba = fitted_photo.convert('RGBA')
            
            # Apply mask to photo
            fitted_photo_rgba.putalpha(mask)
            
            # Paste masked photo onto final
            paste_x = int(mask_bbox['x'])
            paste_y = int(mask_bbox['y'])
            final.paste(fitted_photo_rgba, (paste_x, paste_y), fitted_photo_rgba)
            
            # Paste border on top
            final.paste(border, (0, 0), border)
            
            # Save result
            output_path = tempfile.NamedTemporaryFile(
                delete=False,
                suffix='.png',
                dir=self.temp_dir
            ).name
            
            final.save(output_path, 'PNG', quality=95, optimize=True)
            
            logger.info(f"[AUTO_CROP] Successfully created cropped image: {output_path}")
            
            # Cleanup temp files
            if photo_path and os.path.exists(photo_path):
                os.unlink(photo_path)
            if border_path and os.path.exists(border_path):
                os.unlink(border_path)
            
            return output_path, "Photo cropped successfully with border and mask"
            
        except Exception as e:
            logger.error(f"[AUTO_CROP] Error in apply_crop_with_border: {str(e)}")
            
            # Cleanup on error
            if photo_path and os.path.exists(photo_path):
                os.unlink(photo_path)
            if border_path and os.path.exists(border_path):
                os.unlink(border_path)
            
            raise Exception(f"Auto-crop failed: {str(e)}")
    
    async def recrop_photo(
        self,
        original_photo_url: str,
        new_border_url: str,
        new_mask_data: Dict,
        mirror: bool = False
    ) -> Tuple[str, str]:
        """
        Re-crop photo with new border
        Always uses original image as source
        """
        logger.info(f"[AUTO_CROP] Re-cropping with new border")
        return await self.apply_crop_with_border(
            original_photo_url,
            new_border_url,
            new_mask_data,
            mirror
        )
    
    def cleanup_temp_files(self):
        """Clean up old temporary files"""
        try:
            import time
            current_time = time.time()
            
            for filename in os.listdir(self.temp_dir):
                filepath = os.path.join(self.temp_dir, filename)
                
                # Delete files older than 1 hour
                if os.path.isfile(filepath):
                    file_age = current_time - os.path.getmtime(filepath)
                    if file_age > 3600:  # 1 hour
                        os.unlink(filepath)
                        logger.info(f"[AUTO_CROP] Cleaned up old temp file: {filename}")
                        
        except Exception as e:
            logger.error(f"[AUTO_CROP] Error cleaning temp files: {str(e)}")

# Singleton instance
auto_crop_service = AutoCropService()
