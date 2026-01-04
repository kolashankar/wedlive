'use client';
import { motion } from 'framer-motion';
import BorderedPhoto from './components/BorderedPhoto';
import VideoTemplatePlayer from './components/VideoTemplatePlayer';

export default function ZenMinimalist({ wedding, themeSettings, media, videoTemplate }) {
    const primaryColor = themeSettings?.primary_color || '#6b7280';
    const bgUrl = themeSettings?.layout_page_background_url;

    return (
        <div className="min-h-screen bg-white text-gray-800 font-light relative">
            {bgUrl && (
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: `url('${bgUrl}')`, backgroundSize: 'cover' }} />
            )}

            {/* Video Template Section */}
            {videoTemplate && (
              <div className="max-w-3xl mx-auto px-6 pt-12 relative z-10">
                <VideoTemplatePlayer videoTemplate={videoTemplate} />
              </div>
            )}

            <div className="max-w-3xl mx-auto px-6 py-24 relative z-10 text-center">
                
                {/* Vertical Flow Header - Removed names/date/location since in template */}
                <div className="flex flex-col items-center gap-8 mb-24">
                     <span className="h-24 w-[1px] bg-gray-300 block"></span>
                     <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Union</p>
                </div>

                {/* Photo Grid - Bride, Couple, Groom */}
                <div className="mb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <BorderedPhoto 
                        src={wedding.bride_photo || wedding.cover_image}
                        borderUrl={themeSettings?.bride_border_url}
                        alt="Bride"
                        className="w-full shadow-sm"
                        aspectRatio="aspect-[3/4]"
                    />
                    <BorderedPhoto 
                        src={wedding.cover_image}
                        borderUrl={themeSettings?.couple_border_url}
                        alt="Couple"
                        className="w-full shadow-sm"
                        aspectRatio="aspect-[3/4]"
                    />
                    <BorderedPhoto 
                        src={wedding.groom_photo || wedding.cover_image}
                        borderUrl={themeSettings?.groom_border_url}
                        alt="Groom"
                        className="w-full shadow-sm"
                        aspectRatio="aspect-[3/4]"
                    />
                </div>

                {/* Minimal Gallery */}
                <div className="grid grid-cols-3 gap-12">
                     {media?.recent_items?.slice(0, 3).map((item, idx) => (
                         <div key={idx} className="flex flex-col items-center gap-4">
                             <BorderedPhoto 
                                src={item.thumbnail_url || item.url}
                                borderUrl={themeSettings?.precious_moments_border_url}
                                aspectRatio="aspect-[3/4]"
                                className="w-full grayscale hover:grayscale-0 transition-all duration-700"
                             />
                             <span className="text-[10px] uppercase tracking-widest text-gray-300">0{idx+1}</span>
                         </div>
                     ))}
                </div>

                {/* Footer Line */}
                <div className="mt-24 flex justify-center">
                    <span className="h-24 w-[1px] bg-gray-300 block"></span>
                </div>
            </div>
        </div>
    );
}
