'use client';
import React from 'react';
import { Calendar, MapPin, Clock, Play, Minus, Mail, Phone, Globe } from 'lucide-react';
import { format, parseISO } from 'date-fns';

/**
 * Layout 5: Minimalist Card
 * 
 * Ultra-clean card-based design featuring:
 * - Maximum negative space
 * - Floating card containers
 * - Monochromatic color scheme
 * - Simple, elegant typography
 * - Focus on essential information only
 * 
 * Supported Slots: couplePhoto, preciousMoments (max 9)
 * No borders - pure minimalism
 */
export default function Layout5({ 
  weddingData = {}, 
  layoutConfig = {},
  onEnter 
}) {
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
    primaryColor = '#000000',
    secondaryColor = '#737373',
    welcomeMessage = 'Together',
    description = '',
    couplePhoto = null,
    preciousMoments = [],
    studioDetails = {},
    preWeddingVideo = null,
  } = layoutConfig;

  const textStyle = {
    fontFamily: font,
    color: primaryColor,
  };

  const secondaryTextStyle = {
    fontFamily: font,
    color: secondaryColor,
  };

  // Minimalist card style
  const cardStyle = {
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  };

  return (
    <div 
      className="min-h-screen py-20 px-4"
      style={{ 
        backgroundColor: '#fafafa',
        fontFamily: font,
      }}
    >
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Hero Card */}
        <div 
          className="p-12 md:p-20 text-center"
          style={cardStyle}
        >
          {/* Minimalist Divider */}
          <div className="flex items-center justify-center mb-8">
            <Minus className="w-12 h-12" style={{ color: primaryColor, strokeWidth: 1 }} />
          </div>

          {/* CRITICAL: Couple Names First */}
          <p className="text-3xl sm:text-4xl md:text-5xl font-light mb-2" style={textStyle}>
            {bride_names}
          </p>
          <p className="text-xl sm:text-2xl mb-2" style={secondaryTextStyle}>
            &
          </p>
          <p className="text-3xl sm:text-4xl md:text-5xl font-light mb-8" style={textStyle}>
            {groom_names}
          </p>

          {/* Welcome Message */}
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight mb-8"
            style={secondaryTextStyle}
          >
            {welcomeMessage}
          </h2>

          {/* Divider */}
          <div className="flex items-center justify-center my-12">
            <div className="w-px h-12" style={{ backgroundColor: secondaryColor, opacity: 0.3 }} />
          </div>

          {/* Event Date - Large */}
          {event_date && (
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-widest" style={secondaryTextStyle}>
                Save the Date
              </p>
              <p className="text-4xl font-light tracking-wide" style={textStyle}>
                {format(parseISO(event_date), 'MMMM d, yyyy')}
              </p>
            </div>
          )}
        </div>

        {/* Couple Photo Card */}
        {couplePhoto?.url && (
          <div style={cardStyle} className="overflow-hidden">
            <div className="aspect-[16/10] relative">
              <img
                src={couplePhoto.url}
                alt={`${bride_names} & ${groom_names}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Description Card */}
        {description && (
          <div className="p-12 md:p-16" style={cardStyle}>
            <p 
              className="text-lg md:text-xl font-light leading-relaxed text-center max-w-2xl mx-auto"
              style={secondaryTextStyle}
            >
              {description}
            </p>
          </div>
        )}

        {/* Event Details Card */}
        <div className="p-12 md:p-16" style={cardStyle}>
          <div className="space-y-10">
            {/* Date */}
            {event_date && (
              <div className="flex items-start gap-6">
                <Calendar 
                  className="w-6 h-6 mt-1 flex-shrink-0" 
                  style={{ color: primaryColor, strokeWidth: 1.5 }} 
                />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest mb-2" style={secondaryTextStyle}>
                    Date
                  </p>
                  <p className="text-xl font-light" style={textStyle}>
                    {format(parseISO(event_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}

            {/* Time */}
            {event_time && (
              <div className="flex items-start gap-6">
                <Clock 
                  className="w-6 h-6 mt-1 flex-shrink-0" 
                  style={{ color: primaryColor, strokeWidth: 1.5 }} 
                />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest mb-2" style={secondaryTextStyle}>
                    Time
                  </p>
                  <p className="text-xl font-light" style={textStyle}>
                    {event_time}
                  </p>
                </div>
              </div>
            )}

            {/* Venue */}
            {venue && (
              <div className="flex items-start gap-6">
                <MapPin 
                  className="w-6 h-6 mt-1 flex-shrink-0" 
                  style={{ color: primaryColor, strokeWidth: 1.5 }} 
                />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest mb-2" style={secondaryTextStyle}>
                    Location
                  </p>
                  <p className="text-xl font-light" style={textStyle}>
                    {venue}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pre-Wedding Video Card */}
        {preWeddingVideo && (
          <div style={cardStyle} className="overflow-hidden">
            <div className="p-8 text-center border-b" style={{ borderColor: '#f0f0f0' }}>
              <p className="text-xs uppercase tracking-widest" style={secondaryTextStyle}>
                Our Story
              </p>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                src={preWeddingVideo.replace('watch?v=', 'embed/')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Gallery Card - 3x3 Grid */}
        {preciousMoments?.length > 0 && (
          <div style={cardStyle}>
            <div className="p-8 text-center border-b" style={{ borderColor: '#f0f0f0' }}>
              <p className="text-xs uppercase tracking-widest" style={secondaryTextStyle}>
                Moments
              </p>
            </div>
            <div className="grid grid-cols-3 gap-0">
              {preciousMoments.slice(0, 9).map((photo, index) => (
                <div 
                  key={index}
                  className="aspect-square relative overflow-hidden group"
                  style={{
                    borderRight: (index % 3) !== 2 ? '1px solid #f0f0f0' : 'none',
                    borderBottom: index < 6 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <img
                    src={photo.url || photo.photo_url || photo.cdn_url}
                    alt={`Moment ${index + 1}`}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Stream Card */}
        {(playback_url || recording_url || onEnter) && (
          <div className="p-12 md:p-16 text-center" style={cardStyle}>
            <Play 
              className="w-12 h-12 mx-auto mb-6" 
              style={{ color: primaryColor, strokeWidth: 1 }} 
            />
            
            <h2 className="text-3xl md:text-4xl font-light mb-4" style={textStyle}>
              Watch Live
            </h2>
            
            <p className="text-lg font-light mb-12 max-w-md mx-auto" style={secondaryTextStyle}>
              Join us for the ceremony
            </p>

            {onEnter ? (
              <button
                onClick={onEnter}
                className="px-12 py-4 transition-all duration-300 hover:opacity-70"
                style={{
                  ...textStyle,
                  border: `1px solid ${primaryColor}`,
                  backgroundColor: 'transparent',
                }}
              >
                <span className="text-sm uppercase tracking-widest font-medium">
                  Enter
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
        )}

        {/* Studio Partner - With Toggle Support */}
        {studioDetails?.logo_url && (
          <div className="py-12 text-center" style={cardStyle}>
            <p className="text-xs uppercase tracking-widest mb-6" style={secondaryTextStyle}>
              Photography Partner
            </p>
            <div className="inline-block bg-white rounded-lg shadow-lg p-6">
              <img
                src={studioDetails.logo_url}
                alt={studioDetails.name || "Studio partner"}
                className="h-20 sm:h-24 mx-auto object-contain mb-6"
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
        )}

        {/* Minimalist Footer */}
        <div className="py-16 text-center">
          <div className="flex items-center justify-center mb-6">
            <Minus className="w-8 h-8" style={{ color: secondaryColor, strokeWidth: 1 }} />
          </div>
          <p className="text-xs uppercase tracking-widest" style={secondaryTextStyle}>
            {event_date ? format(parseISO(event_date), 'yyyy') : '2025'}
          </p>
        </div>

      </div>
    </div>
  );
}
