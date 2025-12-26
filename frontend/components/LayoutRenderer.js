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
 * @param {Function} onEnter - Callback for entering live stream
 */
export default function LayoutRenderer({ wedding, onEnter }) {
  const [layoutPhotos, setLayoutPhotos] = useState(null);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [borderDetails, setBorderDetails] = useState({}); // Store border data with masks
  const [borderLoadingErrors, setBorderLoadingErrors] = useState([]); // Track loading errors for debugging

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

  // Border Loading Errors Display
  if (borderLoadingErrors && borderLoadingErrors.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-2xl w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p><strong>Missing Border Assets Detected:</strong> {borderLoadingErrors.length} border(s) referenced in your theme configuration could not be loaded.</p>
                <div className="space-y-2">
                  {borderLoadingErrors.map(({ id, error }) => (
                    <div key={id} className="text-xs bg-red-50 p-2 rounded border border-red-200">
                      <div className="font-mono text-red-800">{id === 'global' ? 'Global Error' : `Border ID: ${id}`}</div>
                      <div className="text-red-600 mt-1">
                        {error.status === 404 ? 'Border not found (404)' : `Error ${error.status}: ${error.message}`}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-600 mt-3">
                  <p>To fix this issue:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Go to Theme Settings in your wedding management panel</li>
                    <li>Select different borders for each photo slot</li>
                    <li>Or upload the missing border assets</li>
                  </ul>
                </div>
                <button
                  onClick={() => window.location.href = `/weddings/manage/${wedding.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 mt-3"
                >
                  Go to Theme Settings
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

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

  // Background URLs (resolved by backend)
  const layoutPageBackgroundUrl =
    wedding.theme_settings?.layout_page_background_url ||
    wedding.theme_settings?.theme_assets?.layout_page_background_url ||
    wedding.theme_settings?.background_url ||
    wedding.theme_settings?.theme_assets?.background_url ||
    wedding.theme_settings?.hero_background ||
    wedding.theme_settings?.theme_assets?.hero_background ||
    null;

  const streamPageBackgroundUrl =
    wedding.theme_settings?.stream_page_background_url ||
    wedding.theme_settings?.theme_assets?.stream_page_background_url ||
    null;

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
    
    // Studio details - Include both logo and studio image
    studioDetails: {
      logo_url: wedding.theme_settings?.studio_details?.logo_url || null,
      studio_image_url: wedding.theme_settings?.studio_details?.studio_image_url || studioImage?.url || null,
      name: wedding.theme_settings?.studio_details?.name || '',
      email: wedding.theme_settings?.studio_details?.email || '',
      phone: wedding.theme_settings?.studio_details?.phone || '',
      website: wedding.theme_settings?.studio_details?.website || '',
      address: wedding.theme_settings?.studio_details?.address || '',
      show_details: wedding.theme_settings?.studio_details?.show_details !== false, // Default to true
    },
  };
  
  console.log('[PHASE 3] Final layoutConfig:', layoutConfig);

  return (
    <>
      <WatchLiveButton weddingId={wedding?.id} weddingStatus={wedding?.status} />
      <LayoutComponent 
        weddingData={wedding} 
        layoutConfig={layoutConfig}
        onEnter={onEnter} 
      />
    </>
  );
}