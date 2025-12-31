"""
Layout Schema Configuration System
Defines supported slots, borders, backgrounds, and YouTube support for each layout
"""
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class PhotoSlot:
    """Defines a photo slot/placeholder in a layout"""
    name: str
    required: bool
    supports_border: bool
    max_count: int = 1  # For array types like preciousMoments
    description: str = ""

@dataclass
class BorderSlot:
    """Defines a border slot in a layout"""
    name: str
    applies_to: List[str]  # List of photo slot names
    description: str = ""

@dataclass
class LayoutSchema:
    """Complete schema definition for a layout"""
    layout_id: str
    name: str
    description: str
    
    # Photo placeholders supported
    photo_slots: Dict[str, PhotoSlot]
    
    # Border types supported
    border_slots: Dict[str, BorderSlot]
    
    # Background support
    supports_layout_background: bool = True
    supports_stream_background: bool = True
    
    # YouTube support
    supports_youtube: bool = True
    
    # Studio support
    supports_studio_image: bool = True


# Define all 8 layout schemas
LAYOUT_SCHEMAS = {
    "layout_1": LayoutSchema(
        layout_id="layout_1",
        name="Classic Split Hero",
        description="Side-by-side bride and groom photos with centered couple photo below",
        photo_slots={
            "bridePhoto": PhotoSlot(
                name="bridePhoto",
                required=False,
                supports_border=True,
                description="Bride's individual photo"
            ),
            "groomPhoto": PhotoSlot(
                name="groomPhoto",
                required=False,
                supports_border=True,
                description="Groom's individual photo"
            ),
            "couplePhoto": PhotoSlot(
                name="couplePhoto",
                required=True,
                supports_border=True,
                description="Main couple photo"
            ),
            "preciousMoments": PhotoSlot(
                name="preciousMoments",
                required=False,
                supports_border=True,
                max_count=5,  # Max 5 across all layouts
                description="Gallery photos with precious moments"
            ),
            "studioImage": PhotoSlot(
                name="studioImage",
                required=False,
                supports_border=True,
                description="Studio partner logo/photo"
            )
        },
        border_slots={
            "brideGroomBorder": BorderSlot(
                name="brideGroomBorder",
                applies_to=["bridePhoto", "groomPhoto"],
                description="Border for bride/groom photos (shared, groom mirrored)"
            ),
            "coupleBorder": BorderSlot(
                name="coupleBorder",
                applies_to=["couplePhoto"],
                description="Border for couple photo"
            ),
            "preciousMomentsBorder": BorderSlot(
                name="preciousMomentsBorder",
                applies_to=["preciousMoments"],
                description="Border for gallery photos"
            ),
            "studioBorder": BorderSlot(
                name="studioBorder",
                applies_to=["studioImage"],
                description="Border for studio image"
            )
        },
        supports_youtube=True,
        supports_studio_image=True
    ),
    
    "layout_2": LayoutSchema(
        layout_id="layout_2",
        name="Center Focus",
        description="Large centered couple photo as hero with gallery below",
        photo_slots={
            "couplePhoto": PhotoSlot(
                name="couplePhoto",
                required=True,
                supports_border=True,
                description="Main couple photo (hero image)"
            ),
            "preciousMoments": PhotoSlot(
                name="preciousMoments",
                required=False,
                supports_border=True,
                max_count=5,
                description="Gallery photos"
            ),
            "studioImage": PhotoSlot(
                name="studioImage",
                required=False,
                supports_border=True,
                description="Studio partner logo"
            )
        },
        border_slots={
            "coupleBorder": BorderSlot(
                name="coupleBorder",
                applies_to=["couplePhoto"],
                description="Border for couple photo"
            ),
            "preciousMomentsBorder": BorderSlot(
                name="preciousMomentsBorder",
                applies_to=["preciousMoments"],
                description="Border for gallery photos"
            ),
            "studioBorder": BorderSlot(
                name="studioBorder",
                applies_to=["studioImage"],
                description="Border for studio image"
            )
        },
        supports_youtube=True,
        supports_studio_image=True
    ),
    
    "layout_3": LayoutSchema(
        layout_id="layout_3",
        name="Horizontal Timeline",
        description="Journey-style layout with bride and groom photos connected by timeline",
        photo_slots={
            "bridePhoto": PhotoSlot(
                name="bridePhoto",
                required=False,
                supports_border=True,
                description="Bride's individual photo"
            ),
            "groomPhoto": PhotoSlot(
                name="groomPhoto",
                required=False,
                supports_border=True,
                description="Groom's individual photo"
            ),
            "couplePhoto": PhotoSlot(
                name="couplePhoto",
                required=True,
                supports_border=True,
                description="Main couple photo"
            ),
            "preciousMoments": PhotoSlot(
                name="preciousMoments",
                required=False,
                supports_border=True,
                max_count=5,
                description="Horizontal scrolling gallery"
            ),
             "studioImage": PhotoSlot(
                name="studioImage",
                required=False,
                supports_border=True,
                description="Studio partner logo"
            )
        },
        border_slots={
            "brideGroomBorder": BorderSlot(
                name="brideGroomBorder",
                applies_to=["bridePhoto", "groomPhoto"],
                description="Border for individual photos"
            ),
            "coupleBorder": BorderSlot(
                name="coupleBorder",
                applies_to=["couplePhoto"],
                description="Border for couple photo"
            ),
            "preciousMomentsBorder": BorderSlot(
                name="preciousMomentsBorder",
                applies_to=["preciousMoments"],
                description="Border for gallery photos"
            ),
            "studioBorder": BorderSlot(
                name="studioBorder",
                applies_to=["studioImage"],
                description="Border for studio image"
            )
        },
        supports_youtube=True,
        supports_studio_image=True
    ),
    
    "layout_4": LayoutSchema(
        layout_id="layout_4",
        name="Modern Scrapbook",
        description="Editorial magazine-inspired layout with multi-column text and images",
        photo_slots={
            "couplePhoto": PhotoSlot(
                name="couplePhoto",
                required=True,
                supports_border=True,
                description="Main couple photo for magazine cover"
            ),
            "bridePhoto": PhotoSlot(
                name="bridePhoto",
                required=False,
                supports_border=True,
                description="Bride feature photo"
            ),
            "groomPhoto": PhotoSlot(
                name="groomPhoto",
                required=False,
                supports_border=True,
                description="Groom feature photo"
            ),
            "preciousMoments": PhotoSlot(
                name="preciousMoments",
                required=False,
                supports_border=True,
                max_count=5,
                description="Gallery in magazine grid layout"
            ),
            "studioImage": PhotoSlot(
                name="studioImage",
                required=False,
                supports_border=True,
                description="Studio logo for credits"
            )
        },
        border_slots={
            "coupleBorder": BorderSlot(
                name="coupleBorder",
                applies_to=["couplePhoto"],
                description="Border for cover photo"
            ),
             "brideGroomBorder": BorderSlot(
                name="brideGroomBorder",
                applies_to=["bridePhoto", "groomPhoto"],
                description="Border for individual photos"
            ),
            "preciousMomentsBorder": BorderSlot(
                name="preciousMomentsBorder",
                applies_to=["preciousMoments"],
                description="Border for gallery photos"
            ),
            "studioBorder": BorderSlot(
                name="studioBorder",
                applies_to=["studioImage"],
                description="Border for studio image"
            )
        },
        supports_youtube=True,
        supports_studio_image=True
    ),
    
    "layout_5": LayoutSchema(
        layout_id="layout_5",
        name="Minimalist Card",
        description="Ultra-clean card-based design with emphasis on negative space",
        photo_slots={
            "couplePhoto": PhotoSlot(
                name="couplePhoto",
                required=True,
                supports_border=True,
                description="Main couple photo in card"
            ),
            "preciousMoments": PhotoSlot(
                name="preciousMoments",
                required=False,
                supports_border=True,
                max_count=5,
                description="Minimal gallery (3x3 grid max)"
            ),
            "studioImage": PhotoSlot(
                name="studioImage",
                required=False,
                supports_border=True,
                description="Studio logo minimal"
            )
        },
        border_slots={
            "coupleBorder": BorderSlot(
                name="coupleBorder",
                applies_to=["couplePhoto"],
                description="Border for couple photo"
            ),
             "preciousMomentsBorder": BorderSlot(
                name="preciousMomentsBorder",
                applies_to=["preciousMoments"],
                description="Border for gallery photos"
            ),
             "studioBorder": BorderSlot(
                name="studioBorder",
                applies_to=["studioImage"],
                description="Border for studio image"
            )
        },  
        supports_youtube=True,
        supports_studio_image=True
    ),
    
    "layout_6": LayoutSchema(
        layout_id="layout_6",
        name="Romantic Overlay",
        description="Full-screen couple photo with elegant text overlay and floating cards",
        photo_slots={
            "couplePhoto": PhotoSlot(
                name="couplePhoto",
                required=True,
                supports_border=True,
                description="Full-screen background couple photo"
            ),
            "bridePhoto": PhotoSlot(
                name="bridePhoto",
                required=False,
                supports_border=True,
                description="Bride photo (circular overlay)"
            ),
            "groomPhoto": PhotoSlot(
                name="groomPhoto",
                required=False,
                supports_border=True,
                description="Groom photo (circular overlay)"
            ),
            "preciousMoments": PhotoSlot(
                name="preciousMoments",
                required=False,
                supports_border=True,
                max_count=5,
                description="Floating card gallery"
            ),
             "studioImage": PhotoSlot(
                name="studioImage",
                required=False,
                supports_border=True,
                description="Studio partner logo"
            )
        },
        border_slots={
             "brideGroomBorder": BorderSlot(
                name="brideGroomBorder",
                applies_to=["bridePhoto", "groomPhoto"],
                description="Border for individual photos"
            ),
             "coupleBorder": BorderSlot(
                name="coupleBorder",
                applies_to=["couplePhoto"],
                description="Border for couple photo"
            ),
             "preciousMomentsBorder": BorderSlot(
                name="preciousMomentsBorder",
                applies_to=["preciousMoments"],
                description="Border for gallery photos"
            ),
             "studioBorder": BorderSlot(
                name="studioBorder",
                applies_to=["studioImage"],
                description="Border for studio image"
            )
        }, 
        supports_youtube=True,
        supports_studio_image=True
    ),
    
    "layout_7": LayoutSchema(
        layout_id="layout_7",
        name="Editorial Grid",
        description="Asymmetric grid layout inspired by editorial design with bold typography",
        photo_slots={
            "couplePhoto": PhotoSlot(
                name="couplePhoto",
                required=True,
                supports_border=True,
                description="Large feature photo in grid"
            ),
            "bridePhoto": PhotoSlot(
                name="bridePhoto",
                required=False,
                supports_border=True,
                description="Bride photo in offset grid position"
            ),
            "groomPhoto": PhotoSlot(
                name="groomPhoto",
                required=False,
                supports_border=True,
                description="Groom photo in offset grid position"
            ),
            "preciousMoments": PhotoSlot(
                name="preciousMoments",
                required=False,
                supports_border=True,
                max_count=5,
                description="Staggered grid gallery"
            ),
             "studioImage": PhotoSlot(
                name="studioImage",
                required=False,
                supports_border=True,
                description="Studio partner logo"
            )
        },
        border_slots={
            "brideGroomBorder": BorderSlot(
                name="brideGroomBorder",
                applies_to=["bridePhoto", "groomPhoto"],
                description="Border for individual photos"
            ),
            "coupleBorder": BorderSlot(
                name="coupleBorder",
                applies_to=["couplePhoto"],
                description="Border for couple photo"
            ),
             "preciousMomentsBorder": BorderSlot(
                name="preciousMomentsBorder",
                applies_to=["preciousMoments"],
                description="Border for gallery photos"
            ),
            "studioBorder": BorderSlot(
                name="studioBorder",
                applies_to=["studioImage"],
                description="Border for studio image"
            )
        },
        supports_youtube=True,
        supports_studio_image=True
    ),
    
    "layout_8": LayoutSchema(
        layout_id="layout_8",
        name="Zen Minimalist",
        description="Ultra-minimalist vertical flow with maximum white space",
        photo_slots={
            "couplePhoto": PhotoSlot(
                name="couplePhoto",
                required=True,
                supports_border=True,
                description="Primary couple photo (full-width)"
            ),
            "preciousMoments": PhotoSlot(
                name="preciousMoments",
                required=False,
                supports_border=True,
                max_count=3,  # Limited to 3 in this layout
                description="Three-column minimal gallery"
            ),
             "studioImage": PhotoSlot(
                name="studioImage",
                required=False,
                supports_border=True,
                description="Studio partner logo"
            )
        },
        border_slots={
             "coupleBorder": BorderSlot(
                name="coupleBorder",
                applies_to=["couplePhoto"],
                description="Border for couple photo"
            ),
             "preciousMomentsBorder": BorderSlot(
                name="preciousMomentsBorder",
                applies_to=["preciousMoments"],
                description="Border for gallery photos"
            ),
             "studioBorder": BorderSlot(
                name="studioBorder",
                applies_to=["studioImage"],
                description="Border for studio image"
            )
        },
        supports_youtube=True,
        supports_studio_image=True
    )
}


def get_layout_schema(layout_id: str) -> Optional[LayoutSchema]:
    """Get schema for a specific layout"""
    return LAYOUT_SCHEMAS.get(layout_id)


def get_supported_photo_placeholders(layout_id: str) -> List[str]:
    """Get list of supported photo placeholder names for a layout"""
    schema = get_layout_schema(layout_id)
    if not schema:
        return []
    return list(schema.photo_slots.keys())


def get_supported_border_slots(layout_id: str) -> List[str]:
    """Get list of supported border slot names for a layout"""
    schema = get_layout_schema(layout_id)
    if not schema:
        return []
    return list(schema.border_slots.keys())


def validate_photo_placeholder(layout_id: str, placeholder_name: str) -> bool:
    """Check if a photo placeholder is supported by the layout"""
    schema = get_layout_schema(layout_id)
    if not schema:
        return False
    return placeholder_name in schema.photo_slots


def get_placeholder_max_count(layout_id: str, placeholder_name: str) -> int:
    """Get max photo count for a placeholder"""
    schema = get_layout_schema(layout_id)
    if not schema or placeholder_name not in schema.photo_slots:
        return 1
    return schema.photo_slots[placeholder_name].max_count


def supports_youtube(layout_id: str) -> bool:
    """Check if layout supports YouTube videos"""
    schema = get_layout_schema(layout_id)
    return schema.supports_youtube if schema else False


def supports_studio_image(layout_id: str) -> bool:
    """Check if layout supports studio images"""
    schema = get_layout_schema(layout_id)
    return schema.supports_studio_image if schema else False
