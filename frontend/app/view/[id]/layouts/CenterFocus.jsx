'use client';
import { motion } from 'framer-motion';
import BorderedPhoto from './components/BorderedPhoto';
import VideoTemplatePlayer from './components/VideoTemplatePlayer';

export default function CenterFocus({ wedding, themeSettings, media, videoTemplate }) {
  const primaryColor = themeSettings?.primary_color || '#d4af37'; 
  const secondaryColor = themeSettings?.secondary_color || '#1a1a1a'; 
  const studioImage = themeSettings?.studio_details?.default_image_url || wedding?.branding?.default_image_url;

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
        {themeSettings?.layout_page_background_url && (
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: `url('${themeSettings.layout_page_background_url}')`, backgroundSize: 'cover' }} />
        )}

        {/* Video Template Section */}
        {videoTemplate && (
          <div className="container mx-auto px-4 py-8">
            <VideoTemplatePlayer videoTemplate={videoTemplate} />
          </div>
        )}

        {/* Hero - Removed names, date, location since template has them */}
        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Side - Bride Photo */}
                <div className="lg:col-span-6 order-1">
                    <motion.div 
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <BorderedPhoto 
                            src={wedding.bride_photo || wedding.cover_image}
                            borderUrl={themeSettings?.bride_border_url}
                            alt="Bride"
                            className="w-full shadow-2xl rounded-lg"
                            aspectRatio="aspect-[4/5]"
                        />
                    </motion.div>
                </div>

                {/* Right Side - Groom Photo */}
                <div className="lg:col-span-6 order-2">
                    <motion.div 
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <BorderedPhoto 
                            src={wedding.groom_photo || wedding.cover_image}
                            borderUrl={themeSettings?.groom_border_url}
                            alt="Groom"
                            className="w-full shadow-2xl rounded-lg"
                            aspectRatio="aspect-[4/5]"
                        />
                    </motion.div>
                </div>
            </div>
        </div>

        {/* Gallery Section */}
        <div className="bg-gray-50 py-20">
            <div className="container mx-auto px-4">
                <h3 className="text-3xl font-serif text-center mb-12" style={{ color: secondaryColor }}>Captured Moments</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                     {media?.recent_items?.slice(0, 4).map((item, index) => (
                         <motion.div 
                             key={item.id}
                             initial={{ opacity: 0, y: 30 }}
                             whileInView={{ opacity: 1, y: 0 }}
                             viewport={{ once: true }}
                             transition={{ delay: index * 0.1 }}
                         >
                             <BorderedPhoto 
                                src={item.thumbnail_url || item.url}
                                borderUrl={themeSettings?.precious_moments_border_url}
                                alt="Gallery"
                                className="shadow-lg bg-white p-2"
                             />
                         </motion.div>
                     ))}
                </div>
            </div>
        </div>

        {/* Footer/Studio */}
        {studioLogo && (
            <div className="py-8 text-center border-t">
                 <div className="w-24 mx-auto mb-2">
                     <BorderedPhoto src={studioLogo} borderUrl={themeSettings?.studio_border_url} className="bg-transparent" />
                 </div>
                 <p className="text-xs text-gray-400 uppercase">Photography Partner</p>
            </div>
        )}
    </div>
  );
}
