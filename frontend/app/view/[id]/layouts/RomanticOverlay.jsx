'use client';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import BorderedPhoto from './components/BorderedPhoto';
import VideoTemplatePlayer from './components/VideoTemplatePlayer';

export default function RomanticOverlay({ wedding, themeSettings, media, videoTemplate }) {
    const primaryColor = themeSettings?.primary_color || '#e91e63';
    
    // Background handling - use video if provided, else cover image
    const bgImage = themeSettings?.layout_page_background_url || wedding.cover_image || "/placeholder.jpg";

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-black">
            {/* Full Screen Background */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={bgImage} 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-60 blur-sm scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* Video Template Section */}
            {videoTemplate && (
              <div className="relative z-10 container mx-auto px-4 py-8">
                <VideoTemplatePlayer videoTemplate={videoTemplate} />
              </div>
            )}

            {/* Content Container - Removed names/date since in template */}
            <div className="relative z-10 container mx-auto px-4 h-screen flex flex-col justify-center items-center text-center text-white">
                
                {/* Bride & Groom Floating Bubbles */}
                <div className="absolute top-1/4 w-full max-w-4xl flex justify-between px-4 pointer-events-none opacity-50 md:opacity-100">
                     <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 6 }}>
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-white/30">
                            <BorderedPhoto 
                                src={wedding.bride_photo || wedding.cover_image} 
                                borderUrl={themeSettings?.bride_border_url} 
                                className="w-full h-full"
                                aspectRatio="none"
                            />
                        </div>
                     </motion.div>
                     <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 6, delay: 1 }}>
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-white/30">
                            <BorderedPhoto 
                                src={wedding.groom_photo || wedding.cover_image} 
                                borderUrl={themeSettings?.groom_border_url} 
                                className="w-full h-full"
                                aspectRatio="none"
                            />
                        </div>
                     </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2 }}
                >
                    <div className="mb-6 flex justify-center">
                        <Heart className="w-12 h-12 animate-pulse" style={{ fill: primaryColor, stroke: 'none' }} />
                    </div>
                </motion.div>

                {/* Floating Cards (Gallery Preview) */}
                <div className="absolute bottom-10 w-full flex justify-center gap-4 overflow-x-auto pb-4 no-scrollbar px-4">
                     {media?.recent_items?.slice(0, 5).map((item, idx) => (
                         <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 + idx * 0.2 }}
                            className="w-24 h-32 md:w-32 md:h-40 flex-shrink-0 rounded-lg overflow-hidden border border-white/20 shadow-lg relative group cursor-pointer bg-black/50"
                         >
                             <BorderedPhoto 
                                src={item.thumbnail_url || item.url}
                                borderUrl={themeSettings?.precious_moments_border_url}
                                className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
                                aspectRatio="none"
                             />
                         </motion.div>
                     ))}
                </div>
            </div>
        </div>
    );
}
