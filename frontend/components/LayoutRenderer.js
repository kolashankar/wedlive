'use client';
import dynamic from 'next/dynamic';
import { Loader2, AlertCircle } from 'lucide-react';
import { getYouTubeEmbedUrl } from '@/lib/youtubeParser';
import { useState, useEffect } from 'react';
import WatchLiveButton from '@/components/WatchLiveButton';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Dynamic imports for layouts with loading states
const Layout1 = dynamic(() => import('@/components/layouts/Layout1'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  ),
});

const Layout2 = dynamic(() => import('@/components/layouts/Layout2'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  ),
});

const Layout3 = dynamic(() => import('@/components/layouts/Layout3'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-purple-50">
      <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
    </div>
  ),
});

const Layout4 = dynamic(() => import('@/components/layouts/Layout4'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
    </div>
  ),
});

const Layout5 = dynamic(() => import('@/components/layouts/Layout5'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-black" />
    </div>
  ),
});

const Layout6 = dynamic(() => import('@/components/layouts/Layout6'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
    </div>
  ),
});

const Layout7 = dynamic(() => import('@/components/layouts/Layout7'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-red-500" />
    </div>
  ),
});

const Layout8 = dynamic(() => import('@/components/layouts/Layout8'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
    </div>
  ),
});

// Layout component map
const LAYOUT_COMPONENTS = {
  layout_1: Layout1,
  layout_2: Layout2,
  layout_3: Layout3,
  layout_4: Layout4,
  layout_5: Layout5,
  layout_6: Layout6,
  layout_7: Layout7,
  layout_8: Layout8,
};

/**
 * LayoutRenderer - Schema-Driven Layout System (PHASE 3 UPDATE)
 * 
 * Renders layouts based on layout_id and injects all data dynamically.
 * NOW USES: layout_photos API for photo data (NEW SYSTEM)
 * 
 * @param {Object} wedding - Wedding data from API
 * @param {Object} videoTemplate - Video template data from API
 * @param {Function} onEnter - Callback for entering live stream
 */
export default function LayoutRenderer({ wedding, videoTemplate, onEnter }) {
  const [layoutPhotos, setLayoutPhotos] = useState(null);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [borderDetails, setBorderDetails] = useState({}); // Store border data with masks
  const [borderLoadingErrors, setBorderLoadingErrors] = useState([]); // Track loading errors for debugging

  // Debug log for video template
  useEffect(() => {
    console.log('[LayoutRenderer] Video Template Debug:', {
      hasVideoTemplate: !!videoTemplate,
      videoTemplateId: videoTemplate?.id,
      videoTemplateName: videoTemplate?.name,
      videoTemplateData: videoTemplate
    });
  }, [videoTemplate]);

  // Fetch layout photos from new API
  useEffect(() => {
    const fetchLayoutPhotos = async () => {
      if (!wedding?.id) {
        setIsLoadingPhotos(false);
        return;
      }

      try {
        const api = (await import('@/lib/api')).default;
        const response = await api.get(`/api/weddings/${wedding.id}/layout-photos`);
        
        if (response.status === 200 && response.data) {
          console.log('[PHASE 3] Layout photos fetched:', response.data);
          setLayoutPhotos(response.data.photos || {});
        } else {
          console.warn('[PHASE 3] Failed to fetch layout photos:', response.status);
          setLayoutPhotos({});
        }
      } catch (error) {
        console.error('[PHASE 3] Error fetching layout photos:', error);
        setLayoutPhotos({});
      } finally {
        setIsLoadingPhotos(false);
      }
    };

    fetchLayoutPhotos();
  }, [wedding?.id]);

  // FIX 2: Listen for background updates and reload wedding data
  useEffect(() => {
    const handleBackgroundUpdate = () => {
      console.log('[FIX 2] Background update detected in LayoutRenderer, triggering re-render');
      // Force component to re-render with new background by updating a key or state
      // The parent component will pass updated wedding prop with new backgrounds
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('wedding-backgrounds-updated', handleBackgroundUpdate);
      
      return () => {
        window.removeEventListener('wedding-backgrounds-updated', handleBackgroundUpdate);
      };
    }
  }, []);

  // Fetch border details with mask data - Enhanced error handling for Phase 6
  useEffect(() => {
    const fetchBorderDetails = async () => {
      if (!wedding?.theme_settings?.theme_assets) return;

      const borderIds = [
        wedding.theme_settings.theme_assets.borders?.bride_border_id,
        wedding.theme_settings.theme_assets.borders?.groom_border_id,
        wedding.theme_settings.theme_assets.borders?.couple_border_id,
        wedding.theme_settings.theme_assets.borders?.precious_moments_border_id
      ].filter(Boolean);

      if (borderIds.length === 0) return;

      try {
        const api = (await import('@/lib/api')).default;
        const borderPromises = borderIds.map(async (borderId) => {
          try {
            console.log(`[LayoutRenderer] Loading border ${borderId}...`);
            const response = await api.get(`/api/theme-assets/borders/${borderId}`);
            
            // Validate mask data structure
            const borderData = response.data;
            if (borderData && borderData.mask_data) {
              console.log(`[LayoutRenderer] Border ${borderId} loaded successfully:`, {
                hasSvgPath: !!borderData.mask_data.svg_path,
                hasPolygonPoints: borderData.mask_data.polygon_points?.length || 0,
                cdnUrl: !!borderData.cdn_url
              });
            } else {
              console.warn(`[LayoutRenderer] Border ${borderId} missing mask data`);
            }
            
            return { id: borderId, data: borderData, success: true };
          } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message;
            
            console.error(`[LayoutRenderer] Border ${borderId} failed to load:`, {
              status,
              message,
              url: `/api/theme-assets/borders/${borderId}`
            });
            
            // Enhanced error handling for different status codes
            if (status === 404) {
              console.warn(`[LayoutRenderer] Border ${borderId} not found (404) - may need to be uploaded`);
            } else if (status >= 500) {
              console.error(`[LayoutRenderer] Server error for border ${borderId}: ${status}`);
            }
            
            return { id: borderId, data: null, success: false, error: { status, message } };
          }
        });

        const borderResults = await Promise.all(borderPromises);
        const borderMap = {};
        const failedBorders = [];
        
        borderResults.forEach(({ id, data, success, error }) => {
          if (success && data) {
            borderMap[id] = data;
          } else {
            failedBorders.push({ id, error });
          }
        });
        
        // Log summary for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log(`[LayoutRenderer] Border loading summary:`, {
            total: borderIds.length,
            successful: Object.keys(borderMap).length,
            failed: failedBorders.length,
            failedIds: failedBorders.map(f => f.id)
          });
        }
        
        setBorderDetails(borderMap);
        setBorderLoadingErrors(failedBorders);
      } catch (error) {
        console.error('[LayoutRenderer] Failed to fetch border details:', error);
        setBorderLoadingErrors([{ id: 'global', error: { message: 'Failed to load borders' } }]);
        setBorderDetails({});
      }
    };

    fetchBorderDetails();
  }, [wedding]);

  // FIX REACT ERROR #310: Move this useEffect BEFORE any conditional returns
  // This hook applies layout page background to body element for ALL sections coverage
  // Guard against SSR - only run on client side
  const layoutPageBackgroundUrlForEffect = wedding?.backgrounds?.layout_page_background_url || null;
  useEffect(() => {
    // Ensure we're in the browser environment
    if (typeof window === 'undefined' || !layoutPageBackgroundUrlForEffect) {
      return;
    }

    // Store original body styles
    const originalBackground = document.body.style.background;
    const originalBackgroundImage = document.body.style.backgroundImage;
    const originalBackgroundSize = document.body.style.backgroundSize;
    const originalBackgroundPosition = document.body.style.backgroundPosition;
    const originalBackgroundAttachment = document.body.style.backgroundAttachment;
    const originalBackgroundRepeat = document.body.style.backgroundRepeat;
    const originalMinHeight = document.body.style.minHeight;
    
    // Apply background to body element - covers ALL sections across entire page
    document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)), url(${layoutPageBackgroundUrlForEffect})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed'; // Fixed to viewport - applies to all sections
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.minHeight = '100vh';
    
    console.log('[FIX 1] Layout background applied to body element (all sections):', layoutPageBackgroundUrlForEffect);
    
    // Cleanup function to restore original styles when component unmounts
    return () => {
      document.body.style.background = originalBackground;
      document.body.style.backgroundImage = originalBackgroundImage;
      document.body.style.backgroundSize = originalBackgroundSize;
      document.body.style.backgroundPosition = originalBackgroundPosition;
      document.body.style.backgroundAttachment = originalBackgroundAttachment;
      document.body.style.backgroundRepeat = originalBackgroundRepeat;
      document.body.style.minHeight = originalMinHeight;
      console.log('[FIX 1] Restored original body background');
    };
  }, [layoutPageBackgroundUrlForEffect]);

  // CRITICAL: Enhanced safety checks to prevent React errors
  if (!wedding || typeof wedding !== 'object') {
    console.error('LayoutRenderer: Invalid wedding prop', wedding);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-red-500 text-lg">Invalid wedding data</p>
        </div>
      </div>
    );
  }

  // Show loading while fetching photos
  if (isLoadingPhotos) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading layout...</p>
        </div>
      </div>
    );
  }

  // Border Loading Errors Display - Only show in development or if critical
  // COMMENTED OUT to prevent blocking the page - borders are optional
  // if (borderLoadingErrors && borderLoadingErrors.length > 0) {
  //   console.warn('[LayoutRenderer] Border loading errors (non-blocking):', borderLoadingErrors);
  // }

  // Ensure theme_settings exists and is valid
  if (!wedding.theme_settings || typeof wedding.theme_settings !== 'object') {
    console.error('LayoutRenderer: Missing or invalid theme_settings', wedding.theme_settings);
    
    // Create default theme_settings to prevent crashes
    wedding.theme_settings = {
      layout_id: 'layout_1',
      custom_font: 'Playfair Display',
      primary_color: '#f43f5e',
      secondary_color: '#a855f7',
      pre_wedding_video: '',
      studio_details: {
        studio_id: '',
        logo_url: '',
        studio_image_url: '',
      },
      custom_messages: {
        welcome_text: 'Welcome to our wedding',
        description: ''
      },
      theme_assets: {}
    };
  }

  // Extract layout configuration
  const layoutId = wedding.theme_settings?.layout_id || wedding.theme_settings?.theme_id || 'layout_1';
  const LayoutComponent = LAYOUT_COMPONENTS[layoutId] || Layout1;

  // FIX 1: Use resolved background URLs from backend (wedding.backgrounds)
  // The backend already resolves background IDs to URLs in the backgrounds object
  const layoutPageBackgroundUrl = wedding.backgrounds?.layout_page_background_url || null;
  const streamPageBackgroundUrl = wedding.backgrounds?.stream_page_background_url || null;

  // Enhanced Debug for background URLs
  console.log('[LAYOUT_RENDERER] Background Debug:', {
    hasBackgroundsObject: !!wedding.backgrounds,
    layoutPageBackgroundUrl,
    streamPageBackgroundUrl,
    wedding_backgrounds: wedding.backgrounds
  });
  
  // CRITICAL: Log if no background URL found
  if (!layoutPageBackgroundUrl) {
    console.warn('[LAYOUT_RENDERER] No layout background URL found!');
    console.log('[LAYOUT_RENDERER] wedding.backgrounds:', wedding.backgrounds);
  }

  // ========== PHASE 3: NEW PHOTO SYSTEM ==========
  // Extract photos from layout_photos API response (NEW)
  console.log('[PHASE 3] Layout photos from API:', layoutPhotos);
  
  // Map photos from new system - handle both single photos and arrays
  const bridePhoto = layoutPhotos?.bridePhoto ? {
    url: layoutPhotos.bridePhoto.url,
    type: 'photo'
  } : null;
  
  const groomPhoto = layoutPhotos?.groomPhoto ? {
    url: layoutPhotos.groomPhoto.url,
    type: 'photo'
  } : null;
  
  const couplePhoto = layoutPhotos?.couplePhoto ? {
    url: layoutPhotos.couplePhoto.url,
    type: 'photo'
  } : null;

  // preciousMoments is an array in the API response
  const preciousMoments = Array.isArray(layoutPhotos?.preciousMoments) 
    ? layoutPhotos.preciousMoments.map(p => ({
        url: p.url,
        photo_url: p.url, // Some layouts use photo_url
        cdn_url: p.url,   // Some layouts use cdn_url
        type: 'photo'
      }))
    : [];
  
  const studioImage = layoutPhotos?.studioImage ? {
    url: layoutPhotos.studioImage.url,
    type: 'photo'
  } : null;
  
  console.log('[PHASE 3] Mapped photos:', { 
    bridePhoto: !!bridePhoto, 
    groomPhoto: !!groomPhoto, 
    couplePhoto: !!couplePhoto, 
    preciousMoments: preciousMoments.length,
    studioImage: !!studioImage
  });

  // FIX: Convert YouTube URL to embed URL
  const videoUrl = wedding.theme_settings?.pre_wedding_video || null;
  const embedVideoUrl = videoUrl ? (getYouTubeEmbedUrl(videoUrl) || videoUrl) : null;

  // Prepare layout configuration (injected data)
  const layoutConfig = {
    // Style inputs
    font: wedding.theme_settings?.custom_font || 'Playfair Display',
    primaryColor: wedding.theme_settings?.primary_color || '#f43f5e',
    secondaryColor: wedding.theme_settings?.secondary_color || '#a855f7',
    
    // Text content
    welcomeMessage: wedding.theme_settings?.custom_messages?.welcome_text || 'Welcome to our wedding',
    description: wedding.theme_settings?.custom_messages?.description || '',
    
    // Photos - FROM NEW LAYOUT_PHOTOS API (PHASE 3)
    bridePhoto,
    groomPhoto,
    couplePhoto,
    preciousMoments,
    studioImage,
    
    // Backgrounds - From theme_assets
    heroBackground: layoutPageBackgroundUrl,
    liveBackground: streamPageBackgroundUrl || wedding.theme_settings?.theme_assets?.live_background || null,
    
    // Video - Converted to embed URL
    preWeddingVideo: embedVideoUrl,
    
    // Video Template - Pass actual videoTemplate object with overlay data
    templateVideoWeddingId: wedding.id,
    hasTemplateVideo: !!videoTemplate?.id, // Use videoTemplate prop instead of wedding.template_assignment
    videoTemplateData: videoTemplate, // CRITICAL FIX: Pass the actual template data with overlays
    
    // Borders - Use resolved URLs from backend theme_assets with mask data
    borders: {
      bride: wedding.theme_settings?.theme_assets?.bride_border_url || null,
      groom: wedding.theme_settings?.theme_assets?.groom_border_url || null,
      couple: wedding.theme_settings?.theme_assets?.couple_border_url || null,
      preciousMoments: wedding.theme_settings?.theme_assets?.precious_moments_border_url || null,
    },
    
    // Border mask data for CSS masking
    borderMasks: {
      bride: borderDetails[wedding.theme_settings?.theme_assets?.borders?.bride_border_id]?.mask_data || null,
      groom: borderDetails[wedding.theme_settings?.theme_assets?.borders?.groom_border_id]?.mask_data || null,
      couple: borderDetails[wedding.theme_settings?.theme_assets?.borders?.couple_border_id]?.mask_data || null,
      preciousMoments: borderDetails[wedding.theme_settings?.theme_assets?.borders?.precious_moments_border_id]?.mask_data || null,
    },
    
    // Studio details - Use default_image_url (studio image)
    studioDetails: {
      default_image_url: wedding.theme_settings?.studio_details?.default_image_url || null,
      logo_url: wedding.theme_settings?.studio_details?.logo_url || null, // Kept for backward compatibility
      name: wedding.theme_settings?.studio_details?.name || '',
      email: wedding.theme_settings?.studio_details?.email || '',
      phone: wedding.theme_settings?.studio_details?.phone || '',
      website: wedding.theme_settings?.studio_details?.website || '',
      address: wedding.theme_settings?.studio_details?.address || '',
      show_details: wedding.theme_settings?.studio_details?.show_details !== false, // Default to true
    },
  };
  
  console.log('[PHASE 3] Final layoutConfig:', layoutConfig);

  // FIX 2: Apply layout page background with fixed attachment to the entire page
  const layoutPageBackgroundStyle = layoutPageBackgroundUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)), url(${layoutPageBackgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // FIX 4: Fixed to viewport for parallax effect
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh', // FIX 4: Ensure background covers full viewport height
        width: '100%',
      }
    : { minHeight: '100vh', width: '100%' }; // Ensure consistent sizing even without background

  console.log('[LAYOUT_RENDERER] Layout Background Debug:', {
    hasStyle: !!layoutPageBackgroundStyle,
    url: layoutPageBackgroundUrl,
    hasBackgroundsObject: !!wedding.backgrounds,
    wedding_backgrounds: wedding.backgrounds
  });
  
  // Log warning if background is expected but not found
  if (!layoutPageBackgroundUrl && wedding.backgrounds?.layout_page_background_id) {
    console.warn('[LAYOUT_RENDERER] Layout background ID exists but URL is missing!', {
      id: wedding.backgrounds.layout_page_background_id,
      backgrounds: wedding.backgrounds
    });
  }

  return (
    <div 
      style={layoutPageBackgroundStyle} 
      className="min-h-screen w-full"
    >
      <WatchLiveButton weddingId={wedding?.id} weddingStatus={wedding?.status} />
      <LayoutComponent 
        weddingData={wedding} 
        layoutConfig={layoutConfig}
        onEnter={onEnter} 
      />
    </div>
  );
}