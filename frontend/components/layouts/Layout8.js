'use client';
import React from 'react';
import { Calendar, MapPin, Play, Minus, Mail, Phone, Globe } from 'lucide-react';
import ExactFitPhotoFrame from '@/components/ExactFitPhotoFrame';
import { format, parseISO } from 'date-fns';

/**
 * Layout 8: Zen Minimalist
 * 
 * Structure:
 * - Ultra-minimalist vertical flow
 * - Maximum white space and breathing room
 * - Large, impactful typography
 * - Single-column layout
 * - Couple photo as primary focal point
 * - Subtle, elegant photo placements
 * - Monochromatic palette with accent color
 * 
 * Supported Slots: couplePhoto, preciousMoments (max 3)
 * Extreme simplicity and elegance
 */
export default function Layout8({ 
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
    font = 'CINZEL',
    primaryColor = '#18181b',
    secondaryColor = '#71717a',
    welcomeMessage = 'We\'re Getting Married',
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

  // Limit to 3 moments for extreme minimalism
  const displayMoments = preciousMoments.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Minimal */}
      <section className="min-h-screen flex items-center justify-center px-4 py-32">
        <div className="max-w-4xl w-full text-center space-y-20">
          {/* Decorative Line */}
          <div className="flex items-center justify-center gap-8">
            <Minus className="w-12 h-1" style={{ color: primaryColor }} />
            <Minus className="w-12 h-1" style={{ color: primaryColor }} />
            <Minus className="w-12 h-1" style={{ color: primaryColor }} />
          </div>

          {/* Names */}
          <div className="space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold tracking-wider" style={textStyle}>
              {bride_names}
            </h1>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-wider" style={textStyle}>
              {groom_names}
            </h1>
          </div>

          {/* Welcome Message */}
          <p className="text-2xl md:text-3xl font-light tracking-widest uppercase" style={secondaryTextStyle}>
            {welcomeMessage}
          </p>

          {/* Date */}
          {event_date && (
            <div className="space-y-3">
              <div className="w-px h-12 mx-auto" style={{ backgroundColor: secondaryColor }} />
              <p className="text-xl tracking-widest uppercase" style={secondaryTextStyle}>
                {format(parseISO(event_date), 'MMMM dd, yyyy')}
              </p>
            </div>
          )}

          {/* Decorative Line */}
          <div className="flex items-center justify-center gap-8">
            <Minus className="w-12 h-1" style={{ color: primaryColor }} />
            <Minus className="w-12 h-1" style={{ color: primaryColor }} />
            <Minus className="w-12 h-1" style={{ color: primaryColor }} />
          </div>
        </div>
      </section>

      {/* Couple Photo - Full Width */}
      {couplePhoto?.url && (
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="aspect-[16/10] overflow-hidden">
              <img 
                src={couplePhoto.url} 
                alt="Couple"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Description */}
      {description && (
        <section className="py-32 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xl md:text-2xl leading-relaxed font-light" style={secondaryTextStyle}>
              {description}
            </p>
          </div>
        </section>
      )}

      {/* Event Details - Vertical Stack */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center space-y-16">
          {event_date && (
            <div className="space-y-4">
              <Calendar className="w-8 h-8 mx-auto" style={{ color: primaryColor }} />
              <div className="w-16 h-px mx-auto" style={{ backgroundColor: secondaryColor }} />
              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={secondaryTextStyle}>
                  Date
                </p>
                <p className="text-2xl font-bold" style={textStyle}>
                  {format(parseISO(event_date), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
          )}

          {venue && (
            <div className="space-y-4">
              <MapPin className="w-8 h-8 mx-auto" style={{ color: primaryColor }} />
              <div className="w-16 h-px mx-auto" style={{ backgroundColor: secondaryColor }} />
              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={secondaryTextStyle}>
                  Location
                </p>
                <p className="text-2xl font-bold" style={textStyle}>
                  {venue}
                </p>
              </div>
            </div>
          )}

          {(playback_url || recording_url) && (
            <div className="space-y-8 pt-12">
              <div className="w-16 h-px mx-auto" style={{ backgroundColor: primaryColor }} />
              <button
                onClick={onEnter}
                className="inline-flex items-center gap-4 px-12 py-4 border-2 text-lg font-bold tracking-wider uppercase transition-all hover:text-white"
                style={{ 
                  borderColor: primaryColor,
                  color: primaryColor,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Play className="w-5 h-5" />
                Join Ceremony
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Precious Moments - Three Column */}
      {displayMoments.length > 0 && (
        <section className="py-32 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-20">
              <div className="w-16 h-px mx-auto mb-8" style={{ backgroundColor: primaryColor }} />
              <h2 className="text-4xl font-bold tracking-wider" style={textStyle}>
                Moments
              </h2>
            </div>

            {/* Three Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {displayMoments.map((photo, index) => (
                <div key={index} className="space-y-4">
                  <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                    <img 
                      src={photo.url || photo.photo_url || photo.cdn_url}
                      alt={`Moment ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-widest" style={secondaryTextStyle}>
                      {`0${index + 1}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pre-Wedding Video */}
      {preWeddingVideo && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-16 h-px mx-auto mb-8" style={{ backgroundColor: primaryColor }} />
              <h2 className="text-4xl font-bold tracking-wider" style={textStyle}>
                Our Story
              </h2>
            </div>
            <div className="aspect-video overflow-hidden bg-black">
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

      {/* Studio Details - Minimal Footer */}
      {studioDetails?.name && (
        <section className="py-20 px-4 border-t border-gray-200">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="w-8 h-px mx-auto" style={{ backgroundColor: secondaryColor }} />
            <p className="text-xs uppercase tracking-widest" style={secondaryTextStyle}>
              Photography
            </p>
            <p className="text-xl font-bold" style={textStyle}>{studioDetails.name}</p>
          </div>
        </section>
      )}
    </div>
  );
}
