'use client';
import { motion } from 'framer-motion';
import BorderedPhoto from './components/BorderedPhoto';
import VideoTemplatePlayer from './components/VideoTemplatePlayer';

export default function EditorialGrid({ wedding, themeSettings, media, videoTemplate }) {
    const primaryColor = themeSettings?.primary_color || '#000';
    const bgUrl = themeSettings?.layout_page_background_url;

    return (
        <div className="min-h-screen bg-white p-4 md:p-12 relative">
             {bgUrl && (
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: `url('${bgUrl}')`, backgroundSize: 'cover' }} />
            )}

            {/* Video Template Section */}
            {videoTemplate && (
              <div className="max-w-7xl mx-auto mb-12 relative z-10">
                <VideoTemplatePlayer videoTemplate={videoTemplate} />
              </div>
            )}
            
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Typography - Removed names/date/location since in template */}
                <div className="mb-12 md:mb-24 border-b-2 border-black pb-8">
                     <h1 className="text-6xl md:text-8xl font-serif leading-none">
                         Editorial
                     </h1>
                </div>

                {/* Asymmetric Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-24">
                    {/* Main Feature - 7 cols */}
                    <div className="md:col-span-7">
                        <BorderedPhoto 
                            src={wedding.cover_image}
                            borderUrl={themeSettings?.couple_border_url}
                            alt="Couple"
                            className="w-full h-[600px] shadow-none"
                            aspectRatio="none"
                        />
                        <p className="mt-4 text-sm font-mono uppercase tracking-widest text-gray-500 text-right">Figure 1. The Happy Couple</p>
                    </div>

                    {/* Offset Column - 5 cols */}
                    <div className="md:col-span-5 flex flex-col gap-12 pt-0 md:pt-24">
                        <div className="p-8 bg-gray-50">
                            <h3 className="text-3xl font-serif italic mb-4">"A story of love."</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Join us as we celebrate the beginning of our new chapter together. 
                                We are thrilled to share this day with you.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <BorderedPhoto 
                                    src={wedding.bride_photo || wedding.cover_image}
                                    borderUrl={themeSettings?.bride_border_url || themeSettings?.bride_groom_border}
                                    aspectRatio="aspect-[3/4]"
                                 />
                             </div>
                             <div className="mt-8">
                                 <BorderedPhoto 
                                    src={wedding.groom_photo || wedding.cover_image}
                                    borderUrl={themeSettings?.groom_border_url || themeSettings?.bride_groom_border}
                                    aspectRatio="aspect-[3/4]"
                                 />
                             </div>
                        </div>
                    </div>
                </div>

                {/* Gallery Strip */}
                <div className="border-t-2 border-black pt-12">
                    <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Visual Diary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         {media?.recent_items?.slice(0, 4).map((item, idx) => (
                             <div key={idx} className="group cursor-pointer">
                                 <BorderedPhoto 
                                    src={item.thumbnail_url || item.url}
                                    borderUrl={themeSettings?.precious_moments_border_url}
                                    aspectRatio="aspect-[4/5]"
                                    className="grayscale group-hover:grayscale-0 transition-all duration-500"
                                 />
                             </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
