'use client';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Heart } from 'lucide-react';
import { format } from 'date-fns';
import Countdown from './Countdown';
import BorderedPhoto from './components/BorderedPhoto';

export default function CenterFocus({ wedding, themeSettings, media }) {
  const primaryColor = themeSettings?.primary_color || '#d4af37'; 
  const secondaryColor = themeSettings?.secondary_color || '#1a1a1a'; 
  const studioLogo = themeSettings?.studio_details?.logo_url || wedding?.branding?.logo_url;

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
        {themeSettings?.layout_page_background_url && (
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: `url('${themeSettings.layout_page_background_url}')`, backgroundSize: 'cover' }} />
        )}

        {/* Hero */}
        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <h1 className="text-5xl md:text-7xl font-serif mb-4" style={{ color: secondaryColor }}>
                    {wedding.bride_name} & {wedding.groom_name}
                </h1>
                <p className="text-xl md:text-2xl font-light tracking-wider uppercase text-gray-500">
                    Are Getting Married
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Info */}
                <div className="lg:col-span-3 text-center lg:text-right space-y-8 order-2 lg:order-1">
                    <motion.div 
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                         <div className="flex flex-col items-center lg:items-end">
                            <Calendar className="w-8 h-8 mb-2" style={{ color: primaryColor }} />
                            <h3 className="text-xl font-bold">{format(new Date(wedding.scheduled_date), 'MMMM d')}</h3>
                            <p className="text-gray-500">{format(new Date(wedding.scheduled_date), 'yyyy')}</p>
                         </div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                         <div className="flex flex-col items-center lg:items-end">
                            <MapPin className="w-8 h-8 mb-2" style={{ color: primaryColor }} />
                            <h3 className="text-xl font-bold">The Venue</h3>
                            <p className="text-gray-500">{wedding.location}</p>
                         </div>
                    </motion.div>
                </div>

                {/* Center Hero Image */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="lg:col-span-6 order-1 lg:order-2"
                >
                    <BorderedPhoto 
                        src={wedding.cover_image}
                        borderUrl={themeSettings?.couple_border_url}
                        alt="Couple"
                        className="w-full shadow-2xl rounded-lg"
                        aspectRatio="aspect-[4/5]"
                    />
                </motion.div>

                {/* Right Info (Countdown) */}
                <div className="lg:col-span-3 text-center lg:text-left order-3">
                     <motion.div 
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3 className="text-xl font-bold mb-4">Countdown</h3>
                        <Countdown targetDate={wedding.scheduled_date} color={secondaryColor} />
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
