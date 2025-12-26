'use client';
import React from 'react';
import { Calendar, MapPin, Clock, Play, Quote, ChevronRight, Mail, Phone, Globe } from 'lucide-react';
import ExactFitPhotoFrame from '@/components/ExactFitPhotoFrame';
import { format, parseISO } from 'date-fns';

/**
 * Layout 7: Editorial Grid
 * 
 * Structure:
 * - Asymmetric grid layout inspired by editorial design
 * - Large feature couple photo with text blocks
 * - Bride and groom photos in offset grid positions
 * - Staggered precious moments gallery
 * - Bold typography with geometric shapes
 * - Modern, artistic composition
 * 
 * Supported Slots: couplePhoto, bridePhoto, groomPhoto, preciousMoments
 * Focus on visual hierarchy and negative space
 */
export default function Layout7({ 
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
    font = 'BEBAS NEUE',
    primaryColor = '#ef4444',
    secondaryColor = '#f97316',
    welcomeMessage = 'THE UNION',
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

  const textStyle = {
    fontFamily: font,
    color: primaryColor,
  };

  const secondaryTextStyle = {
    fontFamily: font,
    color: secondaryColor,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Grid Section */}
      <section className="min-h-screen grid grid-cols-12 gap-0">
        {/* Left Column - Text */}
        <div className="col-span-12 md:col-span-5 bg-black text-white flex flex-col justify-center p-12 md:p-20">
          <div className="mb-8">
            <div className="w-20 h-2 mb-6" style={{ backgroundColor: primaryColor }} />
            {/* CRITICAL: Couple Names First */}
            <p className="text-4xl sm:text-5xl md:text-6xl mb-4" style={{ fontFamily: font, color: primaryColor }}>
              {bride_names}
            </p>
            <p className="text-2xl sm:text-3xl mb-4 text-white/50" style={{ fontFamily: font }}>
              &
            </p>
            <p className="text-4xl sm:text-5xl md:text-6xl mb-8" style={{ fontFamily: font, color: primaryColor }}>
              {groom_names}
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight" style={{ fontFamily: font, color: secondaryColor }}>
              {welcomeMessage}
            </h2>
          </div>

          {/* Event Details */}
          <div className="space-y-4 mb-12">
            {event_date && (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/50">Date</p>
                  <p className="text-lg font-bold">{format(parseISO(event_date), 'MMMM dd, yyyy')}</p>
                </div>
              </div>
            )}
            {event_time && (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center" style={{ backgroundColor: secondaryColor }}>
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/50">Time</p>
                  <p className="text-lg font-bold">{event_time}</p>
                </div>
              </div>
            )}
            {venue && (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-white">
                  <MapPin className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/50">Venue</p>
                  <p className="text-lg font-bold">{venue}</p>
                </div>
              </div>
            )}
          </div>

          {/* CTA Button */}
          {(playback_url || recording_url) && (
            <button
              onClick={onEnter}
              className="inline-flex items-center justify-between gap-4 px-8 py-5 text-white text-xl font-bold transition-all group"
              style={{ backgroundColor: primaryColor }}
            >
              <span style={{ fontFamily: font }}>WATCH LIVE</span>
              <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          )}
        </div>

        {/* Right Column - Large Couple Photo */}
        <div className="col-span-12 md:col-span-7 relative">
          {couplePhoto?.url ? (
            <div className="h-full w-full">
              <img 
                src={couplePhoto.url}
                alt="Couple"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-2xl">Couple Photo</span>
            </div>
          )}
          
          {/* Overlay Number */}
          <div className="absolute top-12 right-12">
            <div className="text-white/20 text-9xl font-bold leading-none" style={{ fontFamily: font }}>
              01
            </div>
          </div>
        </div>
      </section>

      {/* Description Section */}
      {description && (
        <section className="py-32 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <Quote className="w-16 h-16 mb-8" style={{ color: primaryColor }} />
            <p className="text-3xl md:text-4xl leading-relaxed font-light" style={{ color: secondaryColor }}>
              {description}
            </p>
          </div>
        </section>
      )}

      {/* Bride and Groom Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Bride */}
            {bridePhoto && (
              <div className="space-y-8">
                <div className="aspect-[3/4] overflow-hidden">
                  <ExactFitPhotoFrame
                    src={bridePhoto.url}
                    maskUrl={borders?.bride}
                    
                    className="w-full h-full"
                  />
                </div>
                <div>
                  <div className="w-12 h-1 mb-4" style={{ backgroundColor: primaryColor }} />
                  <h3 className="text-4xl font-bold" style={textStyle}>{bride_names}</h3>
                </div>
              </div>
            )}

            {/* Groom */}
            {groomPhoto && (
              <div className="space-y-8 md:mt-20">
                <div className="aspect-[3/4] overflow-hidden">
                  <ExactFitPhotoFrame
                    src={groomPhoto.url}
                    maskUrl={borders?.groom}
                    
                    className="w-full h-full"
                  />
                </div>
                <div>
                  <div className="w-12 h-1 mb-4" style={{ backgroundColor: secondaryColor }} />
                  <h3 className="text-4xl font-bold" style={secondaryTextStyle}>{groom_names}</h3>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Precious Moments - Staggered Grid */}
      {preciousMoments && preciousMoments.length > 0 && (
        <section className="py-20 px-4 bg-black text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-8 mb-16">
              <div className="w-20 h-1" style={{ backgroundColor: primaryColor }} />
              <h2 className="text-6xl font-bold" style={{ fontFamily: font }}>
                MOMENTS
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {preciousMoments.map((photo, index) => (
                <div 
                  key={index}
                  className={`aspect-square overflow-hidden ${
                    index % 7 === 0 ? 'md:col-span-2 md:row-span-2' : ''
                  }`}
                >
                  <img 
                    src={photo.url || photo.photo_url || photo.cdn_url}
                    alt={`Moment ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pre-Wedding Video */}
      {preWeddingVideo && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <div className="w-20 h-2 mb-6" style={{ backgroundColor: primaryColor }} />
              <h2 className="text-6xl font-bold" style={textStyle}>
                OUR STORY
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

      {/* Studio Partner - With Toggle Support */}
      {studioDetails?.logo_url && (
        <section className="py-16 px-4 sm:px-6 bg-gray-50 border-t-4" style={{ borderColor: primaryColor }}>
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-xs uppercase tracking-widest mb-6" style={secondaryTextStyle}>
              Photography Partner
            </p>
            <div className="inline-block bg-white rounded-xl shadow-lg p-6 sm:p-8">
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
