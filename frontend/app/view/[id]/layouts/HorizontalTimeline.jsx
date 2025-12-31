'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { format, isValid } from 'date-fns';
import BorderedPhoto from './components/BorderedPhoto';

export default function HorizontalTimeline({ wedding, themeSettings, media }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);
  const primaryColor = themeSettings?.primary_color || '#d4af37'; 
  const bgUrl = themeSettings?.layout_page_background_url;

  const getFormattedDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return isValid(date) ? format(date, 'MMMM d, yyyy') : '';
    } catch (e) { return ''; }
  };

  const timelineEvents = [
    { 
        type: 'intro',
        title: "Our Story", 
        date: "The Beginning", 
        image: wedding.bride_photo || wedding.cover_image,
        border: themeSettings?.bride_border_url || themeSettings?.bride_groom_border
    },
    { 
        type: 'couple',
        title: "The Couple", 
        date: "Together Forever", 
        image: wedding.cover_image,
        border: themeSettings?.couple_border_url
    },
    { 
        type: 'groom',
        title: "The Groom", 
        date: wedding.groom_name, 
        image: wedding.groom_photo || wedding.cover_image,
        border: themeSettings?.groom_border_url || themeSettings?.bride_groom_border
    },
    ...(media?.recent_items?.slice(0, 5).map(item => ({
        type: 'moment',
        title: "Moments",
        date: getFormattedDate(item.created_at),
        image: item.url,
        border: themeSettings?.precious_moments_border_url
    })) || [])
  ];

  return (
    <div className="bg-[#fffcf5] text-gray-800 min-h-[300vh]" ref={containerRef}>
      {bgUrl && (
          <div className="fixed inset-0 z-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: `url('${bgUrl}')`, backgroundSize: 'cover' }} />
      )}

      {/* Fixed Title */}
      <div className="fixed top-8 left-0 w-full text-center z-20 pointer-events-none">
          <h1 className="text-3xl md:text-5xl font-serif font-bold" style={{ color: themeSettings?.secondary_color || '#8b0000' }}>
              {wedding.bride_name} & {wedding.groom_name}
          </h1>
      </div>

      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        <motion.div style={{ x }} className="flex gap-12 md:gap-32 px-12 md:px-32 items-center">
            
            {/* Start Card */}
            <div className="min-w-[300px] md:min-w-[400px] flex flex-col justify-center items-center p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border-t-4" style={{ borderColor: primaryColor }}>
                <h2 className="text-4xl md:text-6xl font-serif mb-6 text-center">Journey</h2>
                <div className="w-20 h-1 mb-6" style={{ backgroundColor: primaryColor }} />
                <p className="text-center italic text-gray-600">Swipe or scroll to walk through our timeline.</p>
                <div className="mt-8 text-4xl animate-bounce">→</div>
            </div>

            {/* Timeline Cards */}
            {timelineEvents.map((event, index) => (
                <div key={index} className="min-w-[350px] md:min-w-[500px] relative group">
                     {/* Connector Line */}
                     <div className="absolute top-1/2 -left-32 w-32 h-1 bg-gray-300 hidden md:block" />
                     
                     <div className="relative transform transition-transform duration-500 hover:-translate-y-4">
                        <BorderedPhoto 
                            src={event.image}
                            borderUrl={event.border}
                            alt={event.title}
                            className="w-full shadow-2xl bg-white"
                            aspectRatio="aspect-[3/4]"
                        />
                        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg whitespace-nowrap z-30 border" style={{ borderColor: primaryColor }}>
                            <p className="text-sm font-bold uppercase tracking-widest text-gray-500">{event.date}</p>
                            <h3 className="text-xl font-serif font-bold" style={{ color: primaryColor }}>{event.title}</h3>
                        </div>
                     </div>
                </div>
            ))}
            
            {/* End Spacer */}
            <div className="min-w-[200px]" />
        </motion.div>
      </div>
    </div>
  );
}
