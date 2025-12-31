'use client';
import { motion } from 'framer-motion';
import { ArrowDownRight } from 'lucide-react'; 
import BorderedPhoto from './components/BorderedPhoto';

export default function ModernScrapbook({ wedding, themeSettings, media }) {
    const primaryColor = themeSettings?.primary_color || '#e85d75';
    const bgUrl = themeSettings?.layout_page_background_url;

    return (
        <div className="min-h-screen bg-[#f8f5f2] p-4 md:p-8 overflow-hidden font-sans relative">
             {bgUrl && (
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: `url('${bgUrl}')`, backgroundSize: 'cover' }} />
            )}

            {/* Header */}
            <header className="relative z-10 flex flex-col md:flex-row justify-between items-end border-b-4 border-black pb-6 mb-12 max-w-7xl mx-auto">
                <div>
                    <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-none uppercase">
                        The<br/><span style={{ color: primaryColor }}>Wedding</span>
                    </h1>
                </div>
                <div className="text-right mt-4 md:mt-0">
                    <p className="text-xl font-bold uppercase tracking-widest bg-black text-white px-2 inline-block">Vol. 01</p>
                    <p className="text-sm font-medium mt-1">Special Edition</p>
                </div>
            </header>

            {/* Grid */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto">
                
                {/* Hero Couple - 8 cols */}
                <div className="md:col-span-8 relative group">
                    <div className="absolute -top-6 -right-6 z-20">
                         <ArrowDownRight className="w-16 h-16" style={{ color: primaryColor }} />
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white p-2"
                    >
                        <BorderedPhoto 
                            src={wedding.cover_image}
                            borderUrl={themeSettings?.couple_border_url}
                            alt="Couple"
                            className="w-full h-[500px] md:h-[600px]"
                            aspectRatio="none"
                        />
                         <div className="absolute bottom-0 left-0 bg-white p-4 md:p-6 border-t-4 border-r-4 border-black max-w-[80%]">
                            <h2 className="text-3xl md:text-5xl font-bold uppercase leading-none mb-1">{wedding.bride_name}</h2>
                            <h2 className="text-3xl md:text-5xl font-bold uppercase leading-none text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500" style={{ WebkitTextStroke: '1px black' }}>& {wedding.groom_name}</h2>
                        </div>
                    </motion.div>
                </div>

                {/* Sidebar Info - 4 cols */}
                <div className="md:col-span-4 flex flex-col gap-6">
                    {/* Date Box */}
                    <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex-grow flex flex-col justify-center text-center transform hover:-rotate-1 transition-transform">
                        <p className="text-lg font-bold uppercase mb-2">Save The Date</p>
                        <div className="text-6xl font-black" style={{ color: primaryColor }}>
                             {new Date(wedding.scheduled_date).getDate()}
                        </div>
                        <div className="text-2xl font-bold uppercase border-y-2 border-black py-2 my-2">
                             {new Date(wedding.scheduled_date).toLocaleString('default', { month: 'long' }).toUpperCase()}
                        </div>
                         <div className="text-xl font-bold">
                             {new Date(wedding.scheduled_date).getFullYear()}
                        </div>
                    </div>

                    {/* Bride & Groom Small Photos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-2 border-black bg-white p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                             <BorderedPhoto 
                                src={wedding.bride_photo || "/placeholder.jpg"}
                                borderUrl={themeSettings?.bride_border_url || themeSettings?.bride_groom_border}
                                aspectRatio="aspect-square"
                             />
                             <p className="text-center font-bold text-xs mt-1 uppercase">The Bride</p>
                        </div>
                        <div className="border-2 border-black bg-white p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                             <BorderedPhoto 
                                src={wedding.groom_photo || "/placeholder.jpg"}
                                borderUrl={themeSettings?.groom_border_url || themeSettings?.bride_groom_border}
                                aspectRatio="aspect-square"
                             />
                             <p className="text-center font-bold text-xs mt-1 uppercase">The Groom</p>
                        </div>
                    </div>
                </div>

                 {/* Gallery Strip */}
                 {media?.recent_items?.slice(0, 4).map((item, idx) => (
                     <div key={idx} className="md:col-span-3">
                         <motion.div
                             whileHover={{ y: -5 }}
                             className="bg-white p-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                         >
                             <BorderedPhoto 
                                src={item.thumbnail_url || item.url}
                                borderUrl={themeSettings?.precious_moments_border_url}
                                aspectRatio="aspect-square"
                                className="mb-2 border border-black"
                             />
                             <p className="font-mono text-[10px] uppercase text-center truncate">{item.caption || `Moment ${idx+1}`}</p>
                         </motion.div>
                     </div>
                 ))}
                 
                 {/* Studio Credit */}
                 {themeSettings?.studio_details?.logo_url && (
                    <div className="md:col-span-12 mt-8 flex justify-end">
                        <div className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full">
                            <span className="text-xs font-bold uppercase">Photos by</span>
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-white">
                                <img src={themeSettings.studio_details.logo_url} className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                 )}
            </div>
        </div>
    );
}
