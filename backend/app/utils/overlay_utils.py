"""
Utility functions for overlay coordinate system management
Handles conversion between pixel-based and percentage-based positioning
"""
from typing import Dict, Tuple


class OverlayCoordinateSystem:
    """
    Manages coordinate conversion for video overlay positioning.
    Treats video template as a fixed coordinate system, not responsive layout.
    All overlays are stored as percentages relative to reference resolution.
    """
    
    DEFAULT_REFERENCE_WIDTH = 1920
    DEFAULT_REFERENCE_HEIGHT = 1080
    
    @staticmethod
    def pixels_to_percentage(
        x: float, 
        y: float, 
        reference_width: int = DEFAULT_REFERENCE_WIDTH,
        reference_height: int = DEFAULT_REFERENCE_HEIGHT
    ) -> Tuple[float, float]:
        """
        Convert pixel coordinates to percentage-based coordinates.
        
        Args:
            x: X coordinate in pixels
            y: Y coordinate in pixels
            reference_width: Reference video width (default 1920)
            reference_height: Reference video height (default 1080)
            
        Returns:
            Tuple of (x_percent, y_percent) where values are 0-100
        """
        x_percent = (x / reference_width) * 100.0
        y_percent = (y / reference_height) * 100.0
        
        # Clamp to valid range
        x_percent = max(0.0, min(100.0, x_percent))
        y_percent = max(0.0, min(100.0, y_percent))
        
        return (round(x_percent, 2), round(y_percent, 2))
    
    @staticmethod
    def percentage_to_pixels(
        x_percent: float,
        y_percent: float,
        target_width: int,
        target_height: int
    ) -> Tuple[int, int]:
        """
        Convert percentage coordinates to pixel coordinates for a target resolution.
        Used for rendering overlays at specific video dimensions.
        
        Args:
            x_percent: X coordinate as percentage (0-100)
            y_percent: Y coordinate as percentage (0-100)
            target_width: Target video width in pixels
            target_height: Target video height in pixels
            
        Returns:
            Tuple of (x_pixels, y_pixels)
        """
        x_pixels = int((x_percent / 100.0) * target_width)
        y_pixels = int((y_percent / 100.0) * target_height)
        
        return (x_pixels, y_pixels)
    
    @staticmethod
    def normalize_position_dict(
        position: Dict,
        reference_width: int = DEFAULT_REFERENCE_WIDTH,
        reference_height: int = DEFAULT_REFERENCE_HEIGHT
    ) -> Dict:
        """
        Normalize a position dictionary to percentage-based coordinates.
        Detects if coordinates are in pixels and converts them.
        
        Args:
            position: Position dict with 'x' and 'y' keys
            reference_width: Reference video width
            reference_height: Reference video height
            
        Returns:
            Position dict with percentage coordinates and unit='percent'
        """
        x = position.get('x', 50)
        y = position.get('y', 50)
        unit = position.get('unit', 'percent')
        
        # If already in percentages and both values are <=100, return as-is
        if unit == 'percent' and x <= 100 and y <= 100:
            return {
                **position,
                'unit': 'percent',
                'x': round(float(x), 2),
                'y': round(float(y), 2)
            }
        
        # If coordinates look like pixels (either > 100 or unit='pixel'), convert
        if unit == 'pixel' or x > 100 or y > 100:
            x_percent, y_percent = OverlayCoordinateSystem.pixels_to_percentage(
                x, y, reference_width, reference_height
            )
            return {
                **position,
                'unit': 'percent',
                'x': x_percent,
                'y': y_percent
            }
        
        # Default: assume percentages
        return {
            **position,
            'unit': 'percent',
            'x': round(float(x), 2),
            'y': round(float(y), 2)
        }
    
    @staticmethod
    def scale_font_size(
        base_font_size: int,
        reference_height: int,
        target_height: int
    ) -> int:
        """
        Scale font size proportionally based on video height.
        
        Args:
            base_font_size: Font size configured for reference resolution
            reference_height: Reference video height
            target_height: Actual rendering height
            
        Returns:
            Scaled font size in pixels
        """
        scale_factor = target_height / reference_height
        scaled_size = int(base_font_size * scale_factor)
        
        # Ensure readable minimum size
        return max(12, scaled_size)
    
    @staticmethod
    def validate_overlay_position(overlay_data: Dict) -> Dict:
        """
        Validate and normalize overlay position data.
        Ensures all positions are in percentage-based format.
        
        Args:
            overlay_data: Overlay dictionary with position data
            
        Returns:
            Validated overlay data with normalized positions
        """
        if 'position' in overlay_data:
            # Get reference resolution from overlay or use defaults
            ref_width = OverlayCoordinateSystem.DEFAULT_REFERENCE_WIDTH
            ref_height = OverlayCoordinateSystem.DEFAULT_REFERENCE_HEIGHT
            
            overlay_data['position'] = OverlayCoordinateSystem.normalize_position_dict(
                overlay_data['position'],
                ref_width,
                ref_height
            )
        
        return overlay_data
