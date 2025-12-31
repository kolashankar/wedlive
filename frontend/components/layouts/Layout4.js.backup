'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Play, Award, BookOpen, Image as ImageIcon, Mail, Phone, Globe } from 'lucide-react';
import ExactFitPhotoFrame from '@/components/ExactFitPhotoFrame';
import { format, parseISO, differenceInDays } from 'date-fns';

/**
 * Layout 4: Magazine Style
 * 
 * Editorial magazine-inspired layout with:
 * - Magazine cover with couple photo and headline
 * - Multi-column feature article layout
 * - Photo spread sections
 * - Editorial grid gallery
 * - Professional typography and spacing
 * 
 * Supported Slots: couplePhoto, bridePhoto, groomPhoto, preciousMoments
 * No borders - clean editorial style
 */
export default function Layout4({ 
  weddingData = {}, 
  layoutConfig = {},
  onEnter 
}) {
  const [daysUntil, setDaysUntil] = useState(null);

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
    font = 'Inter',
    primaryColor = '#1f2937',
    secondaryColor = '#6b7280',
    welcomeMessage = 'A Love Story',
    description = '',
    couplePhoto = null,
    bridePhoto = null,
    groomPhoto = null,
    preciousMoments = [],
    studioDetails = {},
    heroBackground = null,
    preWeddingVideo = null,
    borders = {},
  } = layoutConfig;

  useEffect(() => {
    if (event_date) {
      try {
        const eventDateTime = parseISO(event_date);
        const days = differenceInDays(eventDateTime, new Date());
        setDaysUntil(days);
      } catch (error) {
        console.error('Error calculating days:', error);
      }
    }
  }, [event_date]);

  const textStyle = {
    fontFamily: font,
    color: primaryColor,
  };

  const secondaryTextStyle = {
    fontFamily: font,
    color: secondaryColor,
  };

  const accentStyle = {
    fontFamily: font,
    color: primaryColor,
    borderColor: primaryColor,
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: font }}>
      {/* Magazine Cover Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50">
        {heroBackground && (
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url(${heroBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        
        <div className="max-w-7xl mx-auto px-8 py-20 grid md:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left: Cover Photo */}
          <div className="relative">
            {couplePhoto?.url ? (
              <div className="relative">
                <div className="absolute -inset-4 border-2" style={{ borderColor: primaryColor, opacity: 0.2 }} />
                <ExactFitPhotoFrame
                  src={couplePhoto.url}
                  alt={`${bride_names} & ${groom_names}`}
                  maskUrl={borders?.couple}
                  
                  className="w-full h-[600px] shadow-2xl"
                />
              </div>
            ) : (
              <div className="w-full h-[600px] bg-gray-200 flex items-center justify-center">
                <ImageIcon className="w-32 h-32 text-gray-400" />
              </div>
            )}
          </div>

          {/* Right: Magazine Title & Info */}
          <div className="space-y-8">
            {/* Issue Info */}
            <div className="flex items-center gap-4 text-sm" style={secondaryTextStyle}>
              <span className="px-4 py-1 border" style={{ borderColor: secondaryColor }}>
                ISSUE {event_date ? format(parseISO(event_date), 'MM.yyyy') : '01.2025'}
              </span>
              {daysUntil !== null && daysUntil > 0 && (
                <span>{daysUntil} DAYS TO GO</span>
              )}
            </div>

            {/* CRITICAL: Couple Names First */}
            <div className="space-y-2 mb-8">
              <p className="text-4xl sm:text-5xl md:text-6xl font-light tracking-wide" style={textStyle}>
                {bride_names}
              </p>
              <p className="text-2xl sm:text-3xl" style={secondaryTextStyle}>& </p>
              <p className="text-4xl sm:text-5xl md:text-6xl font-light tracking-wide" style={textStyle}>
                {groom_names}
              </p>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h2 
                className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight uppercase"
                style={textStyle}
              >
                {welcomeMessage}
              </h2>
              <div className="w-20 h-1" style={{ backgroundColor: primaryColor }} />
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-2 gap-6 pt-8 border-t" style={{ borderColor: secondaryColor }}>
              {event_date && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider" style={secondaryTextStyle}>
                    Date
                  </p>
                  <p className="font-medium" style={textStyle}>
                    {format(parseISO(event_date), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}
              {event_time && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider" style={secondaryTextStyle}>
                    Time
                  </p>
                  <p className="font-medium" style={textStyle}>
                    {event_time}
                  </p>
                </div>
              )}
            </div>

            {venue && (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider" style={secondaryTextStyle}>
                  Venue
                </p>
                <p className="font-medium" style={textStyle}>
                  {venue}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Article Section */}
      {description && (
        <section className="py-20 px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-12 gap-12">
              {/* Article Title */}
              <div className="md:col-span-4">
                <div className="sticky top-8">
                  <BookOpen className="w-8 h-8 mb-4" style={{ color: primaryColor }} />
                  <h2 className="text-3xl font-bold mb-4" style={textStyle}>
                    Their Story
                  </h2>
                  <div className="w-12 h-1 mb-6" style={{ backgroundColor: primaryColor }} />
                  <p className="text-sm" style={secondaryTextStyle}>
                    A feature article
                  </p>
                </div>
              </div>

              {/* Article Content - Multi-column */}
              <div className="md:col-span-8">
                <div className="prose prose-lg max-w-none">
                  <p 
                    className="text-lg leading-relaxed"
                    style={{ 
                      ...textStyle,
                      columnCount: window.innerWidth > 768 ? 2 : 1,
                      columnGap: '3rem',
                      textAlign: 'justify'
                    }}
                  >
                    {description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Photo Spread - Bride & Groom */}
      {(bridePhoto?.url || groomPhoto?.url) && (
        <section className="py-20 px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center" style={textStyle}>
              THE COUPLE
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Bride */}
              {bridePhoto?.url && (
                <div className="space-y-6">
                  <div className="relative overflow-hidden" style={{ paddingBottom: '125%' }}>
                    <img
                      src={bridePhoto.url}
                      alt={bride_names}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-light tracking-wide" style={textStyle}>
                      {bride_names}
                    </p>
                    <p className="text-sm mt-2" style={secondaryTextStyle}>
                      THE BRIDE
                    </p>
                  </div>
                </div>
              )}

              {/* Groom */}
              {groomPhoto?.url && (
                <div className="space-y-6">
                  <div className="relative overflow-hidden" style={{ paddingBottom: '125%' }}>
                    <img
                      src={groomPhoto.url}
                      alt={groom_names}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-light tracking-wide" style={textStyle}>
                      {groom_names}
                    </p>
                    <p className="text-sm mt-2" style={secondaryTextStyle}>
                      THE GROOM
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Pre-Wedding Video Feature */}
      {preWeddingVideo && (
        <section className="py-20 px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-widest mb-4" style={secondaryTextStyle}>
                FEATURED VIDEO
              </p>
              <h2 className="text-4xl font-bold" style={textStyle}>
                Watch Their Journey
              </h2>
            </div>
            <div className="aspect-video bg-black rounded-none overflow-hidden shadow-2xl">
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

      {/* Editorial Grid Gallery */}
      {preciousMoments?.length > 0 && (
        <section className="py-20 px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-widest mb-4" style={secondaryTextStyle}>
                PHOTO ESSAY
              </p>
              <h2 className="text-4xl font-bold" style={textStyle}>
                Captured Moments
              </h2>
            </div>

            {/* Masonry Grid */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
              {preciousMoments.slice(0, 12).map((photo, index) => (
                <div 
                  key={index}
                  className="break-inside-avoid mb-6"
                >
                  <div className="relative overflow-hidden bg-gray-200 group">
                    <img
                      src={photo.url || photo.photo_url || photo.cdn_url}
                      alt={`Moment ${index + 1}`}
                      className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                  </div>
                  {photo.caption && (
                    <p className="text-xs mt-2 italic" style={secondaryTextStyle}>
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Live Stream Feature */}
      {(playback_url || recording_url || onEnter) && (
        <section className="py-20 px-8 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block px-6 py-2 border mb-8" style={{ borderColor: primaryColor }}>
              <p className="text-xs uppercase tracking-widest" style={textStyle}>
                LIVE BROADCAST
              </p>
            </div>
            
            <h2 className="text-5xl font-bold mb-6" style={textStyle}>
              Join The Celebration
            </h2>
            
            <p className="text-lg mb-12 max-w-2xl mx-auto" style={secondaryTextStyle}>
              Watch the ceremony unfold in real-time from anywhere in the world
            </p>

            {onEnter ? (
              <button
                onClick={onEnter}
                className="group relative px-12 py-4 overflow-hidden transition-all duration-300"
                style={{
                  ...accentStyle,
                  border: `2px solid ${primaryColor}`,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className="relative z-10 text-lg font-medium tracking-wide uppercase flex items-center gap-3">
                  <Play className="w-5 h-5" />
                  Enter Live Stream
                </span>
              </button>
            ) : playback_url && (
              <div className="aspect-video bg-black">
                <video
                  src={playback_url}
                  controls
                  className="w-full h-full"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Studio Partner - With Toggle Support */}
      {studioDetails?.logo_url && (
        <section className="py-16 px-4 sm:px-8 bg-gray-900">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">
              Photography Partner
            </p>
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 inline-block">
              <img
                src={studioDetails.logo_url}
                alt={studioDetails.name || "Studio partner"}
                className="h-20 sm:h-24 md:h-32 mx-auto object-contain mb-6"
              />
              
              {studioDetails.show_details && (
                <div className="mt-6 space-y-3 border-t pt-6 text-gray-900">
                  {studioDetails.name && (
                    <h3 className="text-xl font-semibold">{studioDetails.name}</h3>
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

      {/* Magazine Footer */}
      <footer className="py-8 px-8 bg-black text-white">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            {event_date ? format(parseISO(event_date), 'yyyy') : '2025'} • {bride_names} & {groom_names} • Wedding Edition
          </p>
        </div>
      </footer>
    </div>
  );
}
