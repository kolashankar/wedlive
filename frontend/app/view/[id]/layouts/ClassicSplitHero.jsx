'use client';
import { motion } from 'framer-motion';
import BorderedPhoto from './components/BorderedPhoto';
import VideoTemplatePlayer from './components/VideoTemplatePlayer';

export default function ClassicSplitHero({ wedding, themeSettings, media, videoTemplate }) {
  const primaryColor = themeSettings?.primary_color || '#d4af37'; 
  const secondaryColor = themeSettings?.secondary_color || '#8b0000'; 
  
  const studioImage = themeSettings?.studio_details?.default_image_url || wedding?.branding?.default_image_url;
  
  console.log('ClassicSplitHero - videoTemplate:', videoTemplate);

  return (
    <div className="w-full bg-[#fffcf5] text-gray-800 overflow-hidden relative">
        {/* Background Texture/Image */}
        {themeSettings?.layout_page_background_url && (
            <div className="absolute inset-0 z-0 opacity-20" 
                 style={{ backgroundImage: `url('${themeSettings.layout_page_background_url}')`, backgroundSize: 'cover' }} />
        )}

      {/* Video Template Section */}
      {videoTemplate && (
        <div className="container mx-auto px-4 py-8">
          <VideoTemplatePlayer videoTemplate={videoTemplate} />
        </div>
      )}

      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col md:flex-row items-stretch">
        
        {/* Bride Side */}
        <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="w-full md:w-1/2 relative h-[50vh] md:h-screen"
        >
            <BorderedPhoto 
                src={wedding.bride_photo || wedding.cover_image}
                borderUrl={themeSettings?.bride_border_url || themeSettings?.bride_groom_border}
                alt="Bride"
                className="h-full w-full"
                aspectRatio="h-full"
                enableZoom={true}
            />
            <div className="absolute bottom-10 left-10 z-20 text-white">
                <h2 className="text-4xl font-serif font-bold drop-shadow-lg">{wedding.bride_name}</h2>
            </div>
        </motion.div>

        {/* Groom Side */}
        <motion.div 
             initial={{ x: 100, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ duration: 1, delay: 0.2 }}
             className="w-full md:w-1/2 relative h-[50vh] md:h-screen"
        >
             <BorderedPhoto 
                src={wedding.groom_photo || wedding.cover_image}
                borderUrl={themeSettings?.groom_border_url || themeSettings?.bride_groom_border}
                alt="Groom"
                className="h-full w-full"
                aspectRatio="h-full"
                enableZoom={true}
            />
             <div className="absolute bottom-10 right-10 z-20 text-white text-right">
                <h2 className="text-4xl font-serif font-bold drop-shadow-lg">{wedding.groom_name}</h2>
            </div>
        </motion.div>

        {/* Removed Central Overlay Card - info is in template video */}
      </div>

      {/* Precious Moments */}
      <div className="container mx-auto px-4 py-20">
           <motion.div
             initial={{ opacity: 0, y: 50 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="max-w-6xl mx-auto"
           >
               <h3 className="text-3xl font-serif text-center mb-12" style={{ color: secondaryColor }}>
                   Precious Moments
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {media?.recent_items?.slice(0, 6).map((item, index) => (
                       <motion.div 
                         key={item.id}
                         initial={{ opacity: 0, scale: 0.9 }}
                         whileInView={{ opacity: 1, scale: 1 }}
                         viewport={{ once: true }}
                         transition={{ delay: index * 0.1 }}
                       >
                           <BorderedPhoto 
                               src={item.thumbnail_url || item.url}
                               borderUrl={themeSettings?.precious_moments_border_url}
                               alt={item.caption || "Gallery Photo"}
                               className="shadow-xl rounded-lg bg-white"
                           />
                       </motion.div>
                   ))}
               </div>
           </motion.div>
      </div>

       {/* Studio Partner */}
       {studioLogo && (
        <div className="py-12 bg-white/50 text-center">
            <p className="text-sm uppercase tracking-widest text-gray-500 mb-4">Captured By</p>
            <div className="flex justify-center">
                 <div className="w-32 md:w-48 relative">
                     <BorderedPhoto 
                        src={studioLogo}
                        borderUrl={themeSettings?.studio_border_url}
                        alt="Studio"
                        aspectRatio="aspect-video"
                        className="bg-transparent shadow-none"
                     />
                 </div>
            </div>
        </div>
       )}
    </div>
  );
}
