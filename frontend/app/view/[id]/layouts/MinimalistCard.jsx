'use client';
import { motion } from 'framer-motion';
import BorderedPhoto from './components/BorderedPhoto';
import VideoTemplatePlayer from './components/VideoTemplatePlayer';

export default function MinimalistCard({ wedding, themeSettings, media, videoTemplate }) {
  const secondaryColor = themeSettings?.secondary_color || '#333';
  const bgUrl = themeSettings?.layout_page_background_url;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 md:py-24 px-4 relative">
       {bgUrl && (
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: `url('${bgUrl}')`, backgroundSize: 'cover' }} />
       )}

       {/* Video Template Section */}
       {videoTemplate && (
         <div className="w-full max-w-4xl mb-8 relative z-10">
           <VideoTemplatePlayer videoTemplate={videoTemplate} />
         </div>
       )}

       <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.8 }}
         className="w-full max-w-4xl bg-white shadow-2xl overflow-hidden rounded-sm relative z-10"
       >
           <div className="grid grid-cols-1 md:grid-cols-2">
               {/* Left: Bride Photo */}
               <div className="h-[500px] md:h-auto bg-gray-100 relative">
                   <BorderedPhoto 
                        src={wedding.bride_photo || wedding.cover_image}
                        borderUrl={themeSettings?.bride_border_url}
                        alt="Bride"
                        className="w-full h-full"
                        aspectRatio="h-full"
                        imgClassName="object-cover"
                   />
               </div>

               {/* Right: Groom Photo */}
               <div className="h-[500px] md:h-auto bg-gray-100 relative">
                   <BorderedPhoto 
                        src={wedding.groom_photo || wedding.cover_image}
                        borderUrl={themeSettings?.groom_border_url}
                        alt="Groom"
                        className="w-full h-full"
                        aspectRatio="h-full"
                        imgClassName="object-cover"
                   />
               </div>
           </div>

           {/* Minimal Gallery Strip at Bottom */}
           {media?.recent_items?.length > 0 && (
               <div className="grid grid-cols-3 border-t border-gray-100">
                    {media.recent_items.slice(0, 3).map((item, i) => (
                        <div key={i} className="aspect-square relative group overflow-hidden bg-gray-50">
                             <BorderedPhoto 
                                src={item.thumbnail_url || item.url}
                                borderUrl={themeSettings?.precious_moments_border_url}
                                className="w-full h-full"
                                aspectRatio="none"
                             />
                        </div>
                    ))}
               </div>
           )}
       </motion.div>
    </div>
  );
}
