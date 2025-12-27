'use client';
import React, { useState, useEffect } from 'react';
import { Heart, Calendar, MapPin, Clock, Play, ArrowRight, Mail, Phone, Globe } from 'lucide-react';
import PhotoFrame from '@/components/PhotoFrame';
import BorderedPhotoGallery from '@/components/BorderedPhotoGallery';
import { format, parseISO, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

/**
 * Layout 3: Horizontal Timeline
 * 
 * Structure:
 * - Horizontal timeline layout with bride and groom photos side by side
 * - Journey/timeline visualization connecting the two
 * - Event milestones displayed linearly
 * - Couple photo appears at the convergence point
 * - Precious moments in horizontal scroll gallery
 * 
 * Supported Slots: bridePhoto, groomPhoto, couplePhoto, preciousMoments
 * All content is dynamically injected
 */
export default function Layout3({ 
  weddingData = {}, 
  layoutConfig = {},
  onEnter 
}) {
  const [countdown, setCountdown] = useState(null);

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

  const {
    font = 'Montserrat',
    primaryColor = '#ec4899',
    secondaryColor = '#8b5cf6',
    welcomeMessage = 'Our Journey Together',
    description = '',
    bridePhoto = null,
    groomPhoto = null,
    couplePhoto = null,
    preciousMoments = [],
    studioDetails = {},
    heroBackground = null,
    preWeddingVideo = null,
    borders = {},
  } = layoutConfig;

  useEffect(() => {
    if (!event_date) return;

    const updateCountdown = () => {
      try {
        const eventDateTime = parseISO(event_date);
        const now = new Date();
        
        const days = differenceInDays(eventDateTime, now);
        const hours = differenceInHours(eventDateTime, now) % 24;
        const minutes = differenceInMinutes(eventDateTime, now) % 60;

        setCountdown({ days, hours, minutes });
      } catch (error) {
        console.error('Error calculating countdown:', error);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [event_date]);

  const textStyle = {
    fontFamily: font,
    color: primaryColor,
  };

  const secondaryTextStyle = {
    fontFamily: font,
    color: secondaryColor,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Hero Section - Horizontal Timeline */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-7xl w-full">
          {/* CRITICAL: Couple Names First */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4" style={textStyle}>
              {bride_names} & {groom_names}
            </h1>
            <p className="text-xl md:text-2xl" style={secondaryTextStyle}>
              {welcomeMessage}
            </p>
          </div>

          {/* Timeline Layout */}
          <div className="relative">
            {/* Horizontal Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 transform -translate-y-1/2 z-0"
                 style={{ backgroundColor: secondaryColor, opacity: 0.3 }} />

            {/* Bride and Groom Side by Side */}
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 items-center z-10">
              {/* Bride Photo */}
              <div className="flex flex-col items-center">
                {bridePhoto ? (
                  <div className="w-64 h-64 mb-6 relative">
                    <PhotoFrame
                      src={bridePhoto.url}
                      maskUrl={borders?.bride}
                      maskData={layoutConfig?.borderMasks?.bride}
                      aspectRatio="1:1"
                      className="w-full h-full rounded-full shadow-2xl"
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 rounded-full bg-gray-200 flex items-center justify-center shadow-2xl mb-6 border-4"
                       style={{ borderColor: primaryColor }}>
                    <span className="text-gray-400">Bride Photo</span>
                  </div>
                )}
                <h2 className="text-3xl font-bold" style={textStyle}>{bride_names}</h2>
              </div>

              {/* Center Couple Photo */}
              <div className="flex flex-col items-center">
                {couplePhoto ? (
                  <div className="relative">
                    <div className="w-72 h-72 mb-6 relative">
                      <PhotoFrame
                        src={couplePhoto.url}
                        maskUrl={borders?.couple}
                        maskData={layoutConfig?.borderMasks?.couple}
                        aspectRatio="1:1"
                        className="w-full h-full rounded-full shadow-2xl"
                      />
                    </div>
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                      <Heart className="w-12 h-12" style={{ color: primaryColor, fill: primaryColor }} />
                    </div>
                  </div>
                ) : (
                  <div className="w-72 h-72 rounded-full bg-gray-200 flex items-center justify-center shadow-2xl mb-6 border-8"
                       style={{ borderColor: primaryColor }}>
                    <span className="text-gray-400">Couple Photo</span>
                  </div>
                )}
              </div>

              {/* Groom Photo */}
              <div className="flex flex-col items-center">
                {groomPhoto ? (
                  <div className="w-64 h-64 mb-6 relative">
                    <PhotoFrame
                      src={groomPhoto.url}
                      maskUrl={borders?.groom}
                      maskData={layoutConfig?.borderMasks?.groom}
                      aspectRatio="1:1"
                      className="w-full h-full rounded-full shadow-2xl"
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 rounded-full bg-gray-200 flex items-center justify-center shadow-2xl mb-6 border-4"
                       style={{ borderColor: secondaryColor }}>
                    <span className="text-gray-400">Groom Photo</span>
                  </div>
                )}
                <h2 className="text-3xl font-bold" style={secondaryTextStyle}>{groom_names}</h2>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="mt-20 text-center">
            <div className="inline-flex items-center gap-6 bg-white px-8 py-6 rounded-2xl shadow-lg">
              {event_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6" style={{ color: primaryColor }} />
                  <span className="text-lg" style={textStyle}>
                    {format(parseISO(event_date), 'MMMM dd, yyyy')}
                  </span>
                </div>
              )}
              {venue && (
                <>
                  <div className="w-px h-8 bg-gray-300" />
                  <div className="flex items-center gap-3">
                    <MapPin className="w-6 h-6" style={{ color: secondaryColor }} />
                    <span className="text-lg" style={secondaryTextStyle}>{venue}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Countdown */}
          {countdown && countdown.days >= 0 && (
            <div className="mt-12 text-center">
              <p className="text-sm uppercase tracking-widest mb-4" style={secondaryTextStyle}>
                Counting Down To Forever
              </p>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="text-5xl font-bold" style={textStyle}>{countdown.days}</div>
                  <div className="text-sm uppercase" style={secondaryTextStyle}>Days</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold" style={textStyle}>{countdown.hours}</div>
                  <div className="text-sm uppercase" style={secondaryTextStyle}>Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold" style={textStyle}>{countdown.minutes}</div>
                  <div className="text-sm uppercase" style={secondaryTextStyle}>Minutes</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Description Section */}
      {description && (
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg leading-relaxed" style={secondaryTextStyle}>
              {description}
            </p>
          </div>
        </section>
      )}

      {/* Precious Moments - Horizontal Scroll */}
      {preciousMoments && preciousMoments.length > 0 && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12" style={textStyle}>
              Precious Moments
            </h2>
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-6" style={{ width: 'max-content' }}>
                {preciousMoments.map((photo, index) => (
                  <div key={index} className="w-80 h-80 rounded-lg shadow-lg flex-shrink-0 relative">
                    <PhotoFrame
                      src={photo.url || photo.photo_url || photo.cdn_url}
                      maskUrl={borders?.preciousMoments || null}
                      maskData={layoutConfig?.borderMasks?.preciousMoments || null}
                      aspectRatio="1:1"
                      className="w-full h-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Live Stream Section */}
      {(playback_url || recording_url) && (
        <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-rose-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8" style={textStyle}>
              Join Our Celebration
            </h2>
            <button
              onClick={onEnter}
              className="inline-flex items-center gap-3 px-10 py-5 rounded-full text-white text-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              <Play className="w-6 h-6" fill="white" />
              Watch Live Stream
            </button>
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
