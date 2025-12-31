'use client';
import React, { useState, useEffect } from 'react';
import { Heart, Calendar, MapPin, Clock, Play, Sparkles, Mail, Phone, Globe } from 'lucide-react';
import PhotoFrame from '@/components/PhotoFrame';
import BorderedPhotoGallery from '@/components/BorderedPhotoGallery';
import { format, parseISO, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';

/**
 * Layout 2: Center Focus
 * 
 * Structure:
 * - Hero: Large centered couple photo with couple names
 * - Welcome section with event details
 * - Event countdown
 * - Precious moments gallery (carousel style)
 * - Live stream section
 * - Studio logo only
 * 
 * Supported Slots: couplePhoto, preciousMoments, studioImage
 * NO bride/groom individual photos in this layout
 * All content, colors, fonts, borders are injected via props
 */
export default function Layout2({ 
  weddingData = {}, 
  layoutConfig = {},
  onEnter 
}) {
  const [countdown, setCountdown] = useState(null);

  // Extract data from props (NO HARDCODING)
  const {
    bride_name = '',
    groom_name = '',
    event_date = '',
    event_time = '',
    venue = '',
    playback_url = '',
    recording_url = '',
  } = weddingData;
  
  // For backward compatibility and display
  const bride_names = bride_name;
  const groom_names = groom_name;

  // Extract layout configuration
  const {
    font = 'Cormorant Garamond',
    primaryColor = '#3b82f6',
    secondaryColor = '#8b5cf6',
    welcomeMessage = 'Together Forever',
    description = '',
    couplePhoto = null,
    preciousMoments = [],
    studioDetails = {},
    heroBackground = null,
    liveBackground = null,
    preWeddingVideo = null,
    borders = {},
  } = layoutConfig;

  // Countdown timer logic
  useEffect(() => {
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
    backgroundImage: `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.85)), url(${heroBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {
    background: `linear-gradient(135deg, ${primaryColor}05, ${secondaryColor}05)`,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Center Focus with Couple Names */}
      <section 
        className="relative min-h-screen flex items-center justify-center py-20 px-4 sm:px-6"
        style={bgStyle}
      >
        <div className="max-w-4xl mx-auto w-full text-center">
          <Sparkles 
            className="w-12 h-12 mx-auto mb-6" 
            style={{ color: primaryColor }}
          />
          
          {/* CRITICAL: Couple Names - Always at top */}
          <h1 
            className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4"
            style={textStyle}
          >
            {bride_names} & {groom_names}
          </h1>
          
          <p 
            className="text-xl sm:text-2xl md:text-3xl mb-12"
            style={secondaryTextStyle}
          >
            {welcomeMessage}
          </p>

          {/* Centered Couple Photo */}
          {couplePhoto?.url ? (
            <div className="flex justify-center mb-12">
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
          ) : (
            <div className="w-full max-w-2xl mx-auto h-[300px] sm:h-[400px] md:h-[600px] bg-gray-100 rounded-lg flex items-center justify-center mb-12">
              <Heart className="w-24 sm:w-32 h-24 sm:h-32 text-gray-300" />
            </div>
          )}

          {/* Event Details - Inline */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-12 mt-8">
            {event_date && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 sm:w-6 h-5 sm:h-6" style={{ color: primaryColor }} />
                <span className="text-base sm:text-lg font-medium text-gray-700">
                  {format(parseISO(event_date), 'MMMM dd, yyyy')}
                </span>
              </div>
            )}
            {event_time && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 sm:w-6 h-5 sm:h-6" style={{ color: primaryColor }} />
                <span className="text-base sm:text-lg font-medium text-gray-700">{event_time}</span>
              </div>
            )}
            {venue && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 sm:w-6 h-5 sm:h-6" style={{ color: primaryColor }} />
                <span className="text-base sm:text-lg font-medium text-gray-700">{venue}</span>
              </div>
            )}
          </div>

          {description && (
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mt-8 leading-relaxed px-4">
              {description}
            </p>
          )}
        </div>
      </section>

      {/* Countdown Section */}
      {countdown && (
        <section 
          className="py-16 px-4 sm:px-6"
          style={{ 
            background: `linear-gradient(to right, ${primaryColor}10, ${secondaryColor}10)` 
          }}
        >
          <div className="max-w-5xl mx-auto">
            <h2 
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12"
              style={textStyle}
            >
              Our Big Day
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8">
              {[
                { label: 'Days', value: countdown.days },
                { label: 'Hours', value: countdown.hours },
                { label: 'Minutes', value: countdown.minutes },
                { label: 'Seconds', value: countdown.seconds },
              ].map(({ label, value }) => (
                <div 
                  key={label}
                  className="text-center p-4 sm:p-6 bg-white rounded-2xl shadow-lg"
                >
                  <div 
                    className="text-2xl sm:text-3xl md:text-5xl font-bold mb-2"
                    style={{ color: primaryColor }}
                  >
                    {value}
                  </div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pre-Wedding Video */}
      {preWeddingVideo && (
        <section className="py-20 px-4 sm:px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12"
              style={textStyle}
            >
              Our Love Story
            </h2>
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src={preWeddingVideo}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* Precious Moments Gallery - Carousel Style */}
      {preciousMoments?.length > 0 && (
        <section 
          className="py-20 px-4 sm:px-6"
          style={{ backgroundColor: `${secondaryColor}05` }}
        >
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12"
              style={textStyle}
            >
              Moments We Cherish
            </h2>
            <BorderedPhotoGallery
              photos={preciousMoments.map(photo => ({
                ...photo,
                border_url: borders?.preciousMoments || null
              }))}
              layout="carousel"
              primaryColor={primaryColor}
            />
          </div>
        </section>
      )}

      {/* Live Stream Section */}
      {(playback_url || recording_url) && (
        <section 
          className="py-20 px-4 sm:px-6"
          style={liveBackground ? {
            backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${liveBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : {
            background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`,
          }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12">
              <div className="text-center mb-8">
                <Play 
                  className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-6"
                  style={{ color: primaryColor }}
                />
                <h2 
                  className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4"
                  style={textStyle}
                >
                  Join Our Celebration
                </h2>
                <p className="text-base sm:text-lg text-gray-600">
                  Watch the ceremony live from anywhere in the world
                </p>
              </div>
              
              {onEnter ? (
                <div className="flex justify-center">
                  <button
                    onClick={onEnter}
                    className="px-8 sm:px-10 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    style={{
                      backgroundColor: primaryColor,
                      color: 'white',
                    }}
                  >
                    Enter Live Stream
                  </button>
                </div>
              ) : (
                <div className="aspect-video rounded-xl overflow-hidden shadow-xl bg-black">
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
          </div>
        </section>
      )}

      {/* Studio Partner - With Toggle Support */}
      {studioDetails?.logo_url && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 
              className="text-2xl md:text-3xl font-bold mb-8"
              style={textStyle}
            >
              Photography Partner
            </h2>
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
              <img
                src={studioDetails.logo_url}
                alt={studioDetails.name || "Studio partner"}
                className="h-20 sm:h-24 md:h-32 mx-auto object-contain mb-6"
              />
              
              {studioDetails.show_details && (
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
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
