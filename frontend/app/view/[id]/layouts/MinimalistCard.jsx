'use client';
import { motion } from 'framer-motion';
import Countdown from './Countdown';
import BorderedPhoto from './components/BorderedPhoto';

export default function MinimalistCard({ wedding, themeSettings, media }) {
  const secondaryColor = themeSettings?.secondary_color || '#333';
  const bgUrl = themeSettings?.layout_page_background_url;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 md:py-24 px-4 relative">
       {bgUrl && (
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: `url('${bgUrl}')`, backgroundSize: 'cover' }} />
       )}

       <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.8 }}
         className="w-full max-w-4xl bg-white shadow-2xl overflow-hidden rounded-sm relative z-10"
       >
           <div className="grid grid-cols-1 md:grid-cols-2">
               {/* Left: Photo */}
               <div className="h-[500px] md:h-auto bg-gray-100 relative">
                   <BorderedPhoto 
                        src={wedding.cover_image}
                        borderUrl={themeSettings?.couple_border_url}
                        alt="Couple"
                        className="w-full h-full"
                        aspectRatio="h-full"
                        imgClassName="object-cover"
                   />
               </div>

               {/* Right: Text */}
               <div className="p-12 md:p-16 flex flex-col justify-center text-center">
                   <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-6">Save the Date</p>
                   
                   <h1 className="text-4xl md:text-5xl font-serif mb-2 text-gray-900 leading-tight">
                       {wedding.bride_name}
                   </h1>
                   <span className="text-2xl font-serif italic text-gray-400 mb-2">&</span>
                   <h1 className="text-4xl md:text-5xl font-serif mb-8 text-gray-900 leading-tight">
                       {wedding.groom_name}
                   </h1>

                   <div className="w-12 h-1 bg-gray-900 mx-auto mb-8" style={{ backgroundColor: secondaryColor }} />

                   <div className="space-y-2 mb-10">
                       <p className="text-lg font-medium">{new Date(wedding.scheduled_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                       <p className="text-gray-500">{wedding.location}</p>
                   </div>
                   
                   <div className="scale-75 origin-center">
                        <Countdown targetDate={wedding.scheduled_date} color={secondaryColor} />
                   </div>
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
