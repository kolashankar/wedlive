'use client';
import React from 'react';
import { Calendar, MapPin, Clock, Play, Heart, Sparkles, Mail, Phone, Globe } from 'lucide-react';
import ExactFitPhotoFrame from '@/components/ExactFitPhotoFrame';
import { format, parseISO } from 'date-fns';

/**
 * Layout 6: Romantic Overlay
 * 
 * Structure:
 * - Full-screen couple photo with text overlay
 * - Floating transparent cards for information
 * - Bride and groom photos as circular overlays
 * - Dreamy, romantic aesthetic with subtle animations
 * - Minimalist precious moments in floating cards
 * 
 * Supported Slots: couplePhoto, bridePhoto, groomPhoto, preciousMoments (max 6)
 * Heavy use of transparency and layering
 */
export default function Layout6({ 
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
    font = 'Pinyon Script',
    primaryColor = '#fbbf24',
    secondaryColor = '#f59e0b',
    welcomeMessage = 'Forever Starts Today',
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

  // Limit precious moments to 6 for this layout
  const displayMoments = preciousMoments.slice(0, 6);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section - Full Screen with Overlay */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background Couple Photo */}
        {couplePhoto?.url ? (
          <div className="absolute inset-0">
            <img 
              src={couplePhoto.url} 
              alt="Couple"
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900 to-black" />
        )}

        {/* Content Overlay */}
        <div className="relative z-10 text-center px-4 py-20">
          {/* CRITICAL: Couple Names First */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8 sm:mb-12 px-4">
            {bridePhoto?.url && (
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                <img src={bridePhoto.url} alt={bride_names} className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="bg-white/20 backdrop-blur-md px-6 sm:px-8 py-4 sm:py-6 rounded-2xl">
              <p className="text-2xl sm:text-3xl md:text-5xl text-white font-bold">
                {bride_names} <Heart className="inline w-6 sm:w-8 h-6 sm:h-8 mx-2 sm:mx-3" style={{ color: primaryColor, fill: primaryColor }} /> {groom_names}
              </p>
            </div>

            {groomPhoto?.url && (
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                <img src={groomPhoto.url} alt={groom_names} className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Welcome Message */}
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-8 text-white drop-shadow-2xl px-4" style={{ fontFamily: font }}>
            {welcomeMessage}
          </h2>

          {/* Event Details Card */}
          <div className="inline-block bg-white/10 backdrop-blur-lg px-10 py-8 rounded-3xl shadow-2xl">
            {event_date && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-white" />
                <span className="text-xl text-white font-semibold">
                  {format(parseISO(event_date), 'MMMM dd, yyyy')}
                </span>
              </div>
            )}
            {event_time && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-white" />
                <span className="text-xl text-white font-semibold">{event_time}</span>
              </div>
            )}
            {venue && (
              <div className="flex items-center justify-center gap-3">
                <MapPin className="w-6 h-6 text-white" />
                <span className="text-xl text-white font-semibold">{venue}</span>
              </div>
            )}
          </div>

          {/* Join Button */}
          {(playback_url || recording_url) && (
            <div className="mt-12">
              <button
                onClick={onEnter}
                className="inline-flex items-center gap-3 px-12 py-6 rounded-full text-white text-xl font-bold shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                style={{ backgroundColor: primaryColor }}
              >
                <Play className="w-6 h-6" fill="white" />
                Join Live Celebration
              </button>
            </div>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 text-white opacity-30">
          <Sparkles className="w-12 h-12" />
        </div>
        <div className="absolute bottom-10 right-10 text-white opacity-30">
          <Sparkles className="w-12 h-12" />
        </div>
      </section>

      {/* Description Section */}
      {description && (
        <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/5 backdrop-blur-md px-12 py-10 rounded-3xl border border-white/10">
              <p className="text-xl text-white/90 text-center leading-relaxed" style={{ fontFamily: font }}>
                {description}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Precious Moments - Floating Cards */}
      {displayMoments.length > 0 && (
        <section className="py-20 px-4 bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16 text-white" style={{ fontFamily: font }}>
              Our Precious Moments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayMoments.map((photo, index) => (
                <div 
                  key={index} 
                  className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                >
                  <div className="aspect-square">
                    <img 
                      src={photo.url || photo.photo_url || photo.cdn_url}
                      alt={`Moment ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pre-Wedding Video */}
      {preWeddingVideo && (
        <section className="py-20 px-4 bg-black">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-12 text-white" style={{ fontFamily: font }}>
              Our Love Story
            </h2>
            <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl">
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
        <section className="py-16 px-4 sm:px-6 bg-gray-950 border-t border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm uppercase tracking-widest text-white/50 mb-6">
              Photography Partner
            </p>
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 inline-block">
              <img
                src={studioDetails.logo_url}
                alt={studioDetails.name || "Studio partner"}
                className="h-20 sm:h-24 md:h-32 mx-auto object-contain mb-6"
              />
              
              {studioDetails.show_details && (
                <div className="mt-6 space-y-3 border-t pt-6">
                  {studioDetails.name && (
                    <h3 className="text-xl font-semibold text-gray-900">{studioDetails.name}</h3>
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
