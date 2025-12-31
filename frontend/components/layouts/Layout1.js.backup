'use client';
import React, { useState, useMemo } from 'react';
import { Heart, Calendar, MapPin, Clock, Play, Phone, Mail, Globe, User } from 'lucide-react';
import PhotoFrame from '@/components/PhotoFrame';
import BorderTransparencyChecker from '@/components/BorderTransparencyChecker';
import BorderedPhotoGallery from '@/components/BorderedPhotoGallery';
import { format, parseISO, formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';

/**
 * Layout 1: Classic Split Hero
 * 
 * Structure:
 * - Hero: Bride photo (left) | Groom photo (right) with couple photo centered below
 * - Welcome section with event details
 * - Countdown timer
 * - Precious moments gallery
 * - Live stream section
 * - Studio details
 * 
 * Supported Slots: bridePhoto, groomPhoto, couplePhoto, preciousMoments, studioImage
 * All content, colors, fonts, borders are injected via props
 */
export default function Layout1({ 
  weddingData = {}, 
  layoutConfig = {},
  onEnter 
}) {
  const [countdown, setCountdown] = useState(null);

  // Extract data from props (NO HARDCODING)
  // FIXED: Use correct field names from API (bride_name, groom_name - singular)
  const {
    bride_name = '',
    groom_name = '',
    scheduled_date = '',
    location = '',
    playback_url = '',
    recording_url = '',
  } = weddingData;
  
  // For backward compatibility and display
  const bride_names = bride_name;
  const groom_names = groom_name;
  const event_date = scheduled_date;
  const event_time = scheduled_date ? new Date(scheduled_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
  const venue = location;

  // Extract layout configuration
  const {
    font = 'Playfair Display',
    primaryColor = '#f43f5e',
    secondaryColor = '#a855f7',
    welcomeMessage = 'Welcome to our wedding',
    description = '',
    bridePhoto = null,
    groomPhoto = null,
    couplePhoto = null,
    preciousMoments = [],
    studioDetails = {},
    heroBackground = null,
    liveBackground = null,
    preWeddingVideo = null,
    borders = {},
  } = layoutConfig;

  // Countdown timer logic
  React.useEffect(() => {
    if (!event_date) return;

    const updateCountdown = () => {
      try {
        const eventDateTime = parseISO(event_date);
        const now = new Date();
        
        const days = differenceInDays(eventDateTime, now);
        const hours = differenceInHours(eventDateTime, now) % 24;
        const minutes = differenceInMinutes(eventDateTime, now) % 60;
        const seconds = differenceInSeconds(eventDateTime, now) % 60;

        setCountdown({ days, hours, minutes, seconds });
      } catch (error) {
        console.error('Error calculating countdown:', error);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event_date]);

  // Dynamic styles based on injected colors and fonts
  const textStyle = {
    fontFamily: font,
    color: primaryColor,
  };

  const secondaryTextStyle = {
    fontFamily: font,
    color: secondaryColor,
  };

  const bgStyle = heroBackground ? {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${heroBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {
    background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Split Layout with Couple Names (ALWAYS DISPLAYED) */}
      <section 
        className="relative min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8"
        style={bgStyle}
      >
        <div className="max-w-7xl mx-auto w-full">
          {/* CRITICAL: Couple Names - Always at top of hero */}
          <div className="text-center mb-12">
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4"
              style={textStyle}
            >
              {bride_names} & {groom_names}
            </h1>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)` }}></div>
              <Heart className="w-8 h-8" style={{ color: primaryColor }} />
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)` }}></div>
            </div>
          </div>
          
          {/* Bride & Groom Photos - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Bride Photo */}
            <div className="flex flex-col items-center">
              {bridePhoto?.url ? (
                <div className="w-full max-w-sm">
                  <PhotoFrame
                    src={bridePhoto.url}
                    alt={bride_names}
                    maskUrl={borders?.bride}
                    maskData={layoutConfig?.borderMasks?.bride}
                    aspectRatio="4:5"
                    className="w-full max-w-sm"
                  />
                  <h3 
                    className="text-3xl md:text-4xl font-bold text-center mt-6"
                    style={textStyle}
                  >
                    {bride_names}
                  </h3>
                </div>
              ) : (
                <div className="w-full max-w-sm h-[400px] md:h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-24 h-24 text-gray-300" />
                </div>
              )}
            </div>

            {/* Groom Photo */}
            <div className="flex flex-col items-center">
              {groomPhoto?.url ? (
                <div className="w-full max-w-sm">
                  <PhotoFrame
                    src={groomPhoto.url}
                    alt={groom_names}
                    maskUrl={borders?.groom}
                    maskData={layoutConfig?.borderMasks?.groom}
                    aspectRatio="4:5"
                    className="w-full max-w-sm"
                  />
                  <h3 
                    className="text-3xl md:text-4xl font-bold text-center mt-6"
                    style={textStyle}
                  >
                    {groom_names}
                  </h3>
                </div>
              ) : (
                <div className="w-full max-w-sm h-[400px] md:h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-24 h-24 text-gray-300" />
                </div>
              )}
            </div>
          </div>

          {/* Couple Photo - Centered */}
          {couplePhoto?.url && (
            <div className="flex justify-center mt-12">
              <div className="w-full max-w-2xl">
                <PhotoFrame
                  src={couplePhoto.url}
                  alt={`${bride_names} & ${groom_names}`}
                  maskUrl={borders?.couple}
                  maskData={layoutConfig?.borderMasks?.couple}
                  aspectRatio="4:5"
                  className="w-full max-w-2xl"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Welcome Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <Heart 
            className="w-16 h-16 mx-auto mb-6" 
            style={{ color: primaryColor }}
          />
          <h1 
            className="text-4xl md:text-6xl font-bold mb-6"
            style={textStyle}
          >
            {welcomeMessage}
          </h1>
          <p 
            className="text-xl md:text-2xl mb-8"
            style={secondaryTextStyle}
          >
            {bride_names} & {groom_names}
          </p>
          {description && (
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              {description}
            </p>
          )}

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {event_date && (
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                <Calendar className="w-8 h-8 mb-3" style={{ color: primaryColor }} />
                <h4 className="font-semibold text-gray-700 mb-2">Date</h4>
                <p className="text-gray-600">
                  {format(parseISO(event_date), 'MMMM dd, yyyy')}
                </p>
              </div>
            )}
            {event_time && (
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                <Clock className="w-8 h-8 mb-3" style={{ color: primaryColor }} />
                <h4 className="font-semibold text-gray-700 mb-2">Time</h4>
                <p className="text-gray-600">{event_time}</p>
              </div>
            )}
            {venue && (
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                <MapPin className="w-8 h-8 mb-3" style={{ color: primaryColor }} />
                <h4 className="font-semibold text-gray-700 mb-2">Venue</h4>
                <p className="text-gray-600">{venue}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Countdown Timer */}
      {countdown && (
        <section className="py-16 px-4" style={{ backgroundColor: `${primaryColor}08` }}>
          <div className="max-w-4xl mx-auto text-center">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-12"
              style={textStyle}
            >
              Counting Down to Forever
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {[
                { label: 'Days', value: countdown.days },
                { label: 'Hours', value: countdown.hours },
                { label: 'Minutes', value: countdown.minutes },
                { label: 'Seconds', value: countdown.seconds },
              ].map(({ label, value }) => (
                <div 
                  key={label}
                  className="p-6 bg-white rounded-lg shadow-lg"
                >
                  <div 
                    className="text-4xl md:text-5xl font-bold mb-2"
                    style={{ color: primaryColor }}
                  >
                    {value}
                  </div>
                  <div className="text-gray-600 text-sm md:text-base">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pre-Wedding Video */}
      {preWeddingVideo && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 
              className="text-3xl md:text-4xl font-bold text-center mb-12"
              style={textStyle}
            >
              Our Story
            </h2>
            <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
              <iframe
                src={preWeddingVideo.replace('watch?v=', 'embed/')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* Precious Moments Gallery */}
      {preciousMoments?.length > 0 && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-3xl md:text-4xl font-bold text-center mb-12"
              style={textStyle}
            >
              Our Precious Moments
            </h2>
            <BorderedPhotoGallery
              photos={preciousMoments.map(photo => ({
                ...photo,
                border_url: borders?.preciousMoments || null,
                mask_data: layoutConfig?.borderMasks?.preciousMoments || null
              }))}
              layout="grid"
              primaryColor={primaryColor}
            />
          </div>
        </section>
      )}

      {/* Live Stream Section */}
      {(playback_url || recording_url) && (
        <section 
          className="py-20 px-4"
          style={liveBackground ? {
            backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url(${liveBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : {
            background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`,
          }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <Play 
              className="w-16 h-16 mx-auto mb-6 text-white"
            />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Watch Live
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join us as we celebrate our special day
            </p>
            {onEnter ? (
              <button
                onClick={onEnter}
                className="px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                style={{
                  backgroundColor: primaryColor,
                  color: 'white',
                }}
              >
                Enter Live Stream
              </button>
            ) : (
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl bg-black">
                {playback_url && (
                  <video
                    src={playback_url}
                    controls
                    className="w-full h-full"
                  />
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Studio Partner - With Toggle Support: ON = full details, OFF = studio image only */}
      {(studioDetails?.logo_url || studioDetails?.studio_image_url || studioDetails?.default_image_url) && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 
              className="text-2xl md:text-3xl font-bold mb-8"
              style={textStyle}
            >
              Photography Partner
            </h2>
            <div className="bg-white rounded-xl shadow-lg p-8">
              
              {/* PROMPT 6: Show full details when toggle is ON */}
              {studioDetails.show_details && studioDetails.logo_url && (
                <>
                  {/* Studio Logo */}
                  <img
                    src={studioDetails.logo_url}
                    alt={studioDetails.name || "Studio partner"}
                    className="h-24 md:h-32 mx-auto object-contain mb-6"
                  />
                  
                  {/* Studio Details */}
                  <div className="mt-6 space-y-3 border-t pt-6">
                    {studioDetails.name && (
                      <h3 className="text-xl font-semibold" style={textStyle}>
                        {studioDetails.name}
                      </h3>
                    )}
                    <div className="flex flex-col items-center gap-2 text-gray-600">
                      {studioDetails.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${studioDetails.email}`} className="hover:underline">
                            {studioDetails.email}
                          </a>
                        </div>
                      )}
                      {studioDetails.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${studioDetails.phone}`} className="hover:underline">
                            {studioDetails.phone}
                          </a>
                        </div>
                      )}
                      {studioDetails.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <a 
                            href={studioDetails.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                      {studioDetails.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{studioDetails.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* PROMPT 6: Show only studio image when toggle is OFF */}
              {!studioDetails.show_details && (studioDetails.studio_image_url || studioDetails.default_image_url) && (
                <div className="w-full">
                  <img
                    src={studioDetails.studio_image_url || studioDetails.default_image_url}
                    alt="Studio"
                    className="w-full max-h-96 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Debug Section - Border Transparency Checker */}
      {process.env.NODE_ENV === 'development' && (
        <section className="py-16 px-4 bg-gray-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">Debug: Border Transparency</h2>
            <p className="text-center text-gray-600 mb-8">
              Test border transparency with different backgrounds. Checkerboard pattern should show through transparent areas.
            </p>
            
            {/* Instructions for background removal verification */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Background Removal Verification:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Upload a border with black background in admin panel</li>
                <li>• Enable "Remove Black Background" option</li>
                <li>• Check processed image shows checkerboard through transparent areas</li>
                <li>• Original should show black, processed should show transparency</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2 text-center">Bride Border</h4>
                <BorderTransparencyChecker borderUrl={borders?.bride} />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 text-center">Groom Border</h4>
                <BorderTransparencyChecker borderUrl={borders?.groom} />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 text-center">Couple Border</h4>
                <BorderTransparencyChecker borderUrl={borders?.couple} />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 text-center">Precious Moments Border</h4>
                <BorderTransparencyChecker borderUrl={borders?.preciousMoments} />
              </div>
            </div>
            
            {/* Status indicators */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Transparency Working</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span>Black Background Detected</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
