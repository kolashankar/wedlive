'use client';
import { motion } from 'framer-motion';
import BorderedPhoto from './components/BorderedPhoto';

export default function ZenMinimalist({ wedding, themeSettings, media }) {
    const primaryColor = themeSettings?.primary_color || '#6b7280';
    const bgUrl = themeSettings?.layout_page_background_url;

    return (
        <div className="min-h-screen bg-white text-gray-800 font-light relative">
            {bgUrl && (
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: `url('${bgUrl}')`, backgroundSize: 'cover' }} />
            )}

            <div className="max-w-3xl mx-auto px-6 py-24 relative z-10 text-center">
                
                {/* Vertical Flow Header */}
                <div className="flex flex-col items-center gap-8 mb-24">
                     <span className="h-24 w-[1px] bg-gray-300 block"></span>
                     <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Union</p>
                     
                     <h1 className="text-4xl md:text-6xl font-serif tracking-wide leading-tight text-gray-800">
                         {wedding.bride_name} <br/>
                         <span className="text-2xl text-gray-300 block my-4">+</span>
                         {wedding.groom_name}
                     </h1>

                     <p className="text-sm font-mono text-gray-500 uppercase tracking-widest mt-8">
                         {new Date(wedding.scheduled_date).toDateString()} — {wedding.location}
                     </p>
                </div>

                {/* Central Focus Image */}
                <div className="mb-24">
                    <BorderedPhoto 
                        src={wedding.cover_image}
                        borderUrl={themeSettings?.couple_border_url}
                        alt="Couple"
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
