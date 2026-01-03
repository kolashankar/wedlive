"""
Wedding Data Mapper Service
Maps wedding data to template text overlay endpoints
"""
import logging
from datetime import datetime
from typing import Dict, Any
from dateutil import parser

logger = logging.getLogger(__name__)


class WeddingDataMapper:
    """Service to map wedding data to template endpoints"""
    
    @staticmethod
    def map_wedding_data(wedding: Dict[str, Any]) -> Dict[str, str]:
        """
        Convert wedding data to template endpoint values
        Returns dict with all available endpoints populated
        """
        try:
            bride_name = wedding.get('bride_name', '')
            groom_name = wedding.get('groom_name', '')
            
            # Extract first names
            bride_first = bride_name.split()[0] if bride_name else ''
            groom_first = groom_name.split()[0] if groom_name else ''
            
            # Format couple names
            couple_names = f"{bride_name} & {groom_name}" if bride_name and groom_name else ""
            
            # Format date
            event_date = wedding.get('event_date', '')
            formatted_date = WeddingDataMapper.format_date(event_date)
            
            # Calculate countdown
            countdown_days = WeddingDataMapper.calculate_countdown(event_date)
            
            # Theme settings
            theme_settings = wedding.get('theme_settings', {})
            
            return {
                'bride_name': bride_name,
                'groom_name': groom_name,
                'bride_first_name': bride_first,
                'groom_first_name': groom_first,
                'couple_names': couple_names,
                'event_date': formatted_date,
                'event_date_raw': event_date,
                'event_time': wedding.get('event_time', ''),
                'venue': wedding.get('venue', ''),
                'venue_address': wedding.get('venue_address', ''),
                'city': wedding.get('city', ''),
                'state': wedding.get('state', ''),
                'country': wedding.get('country', ''),
                'welcome_message': theme_settings.get('welcome_message', wedding.get('welcome_message', '')),
                'description': wedding.get('description', ''),
                'countdown_days': countdown_days,
                'custom_text_1': wedding.get('custom_text_1', ''),
                'custom_text_2': wedding.get('custom_text_2', ''),
                'custom_text_3': wedding.get('custom_text_3', ''),
                'custom_text_4': wedding.get('custom_text_4', ''),
                'custom_text_5': wedding.get('custom_text_5', ''),
            }
            
        except Exception as e:
            logger.error(f"[WEDDING_MAPPER] Error mapping wedding data: {str(e)}")
            return {}
    
    @staticmethod
    def format_date(date_string: str, format: str = '%B %d, %Y') -> str:
        """
        Format date string to readable format
        Default: "January 15, 2025"
        """
        if not date_string:
            return ''
        
        try:
            # Try parsing ISO format first
            if 'T' in date_string or '-' in date_string:
                date_obj = parser.isoparse(date_string.split('T')[0])
            else:
                date_obj = parser.parse(date_string)
            
            return date_obj.strftime(format)
        except Exception as e:
            logger.error(f"[DATE_FORMAT] Error formatting date '{date_string}': {str(e)}")
            return date_string
    
    @staticmethod
    def calculate_countdown(date_string: str) -> str:
        """
        Calculate days until wedding from today
        Returns string number of days
        """
        if not date_string:
            return ''
        
        try:
            # Parse date
            if 'T' in date_string or '-' in date_string:
                date_obj = parser.isoparse(date_string.split('T')[0])
            else:
                date_obj = parser.parse(date_string)
            
            # Calculate difference
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            delta = date_obj.replace(hour=0, minute=0, second=0, microsecond=0) - today
            
            days = max(0, delta.days)
            return str(days)
            
        except Exception as e:
            logger.error(f"[COUNTDOWN] Error calculating countdown for '{date_string}': {str(e)}")
            return ''
    
    @staticmethod
    def get_available_endpoints() -> Dict[str, str]:
        """
        Get list of all available endpoints with descriptions
        Used for template editor UI
        """
        return {
            'bride_name': "Bride's Full Name",
            'groom_name': "Groom's Full Name",
            'bride_first_name': "Bride's First Name",
            'groom_first_name': "Groom's First Name",
            'couple_names': "Couple Names (Bride & Groom)",
            'event_date': "Wedding Date (Formatted)",
            'event_time': "Wedding Time",
            'venue': "Venue Name",
            'venue_address': "Venue Address",
            'city': "City",
            'state': "State/Province",
            'country': "Country",
            'welcome_message': "Welcome Message",
            'description': "Wedding Description/Story",
            'countdown_days': "Days Until Wedding",
            'custom_text_1': "Custom Text 1",
            'custom_text_2': "Custom Text 2",
            'custom_text_3': "Custom Text 3",
            'custom_text_4': "Custom Text 4",
            'custom_text_5': "Custom Text 5",
        }
    
    @staticmethod
    def populate_overlay_text(overlay: Dict[str, Any], wedding_data: Dict[str, str]) -> str:
        """
        Get the actual text value for an overlay based on its endpoint
        """
        endpoint_key = overlay.get('endpoint_key', '')
        placeholder = overlay.get('placeholder_text', 'Sample Text')
        
        # Get value from wedding data, fallback to placeholder
        text = wedding_data.get(endpoint_key, placeholder)
        
        # If empty, use placeholder
        if not text:
            text = placeholder
        
        return text
