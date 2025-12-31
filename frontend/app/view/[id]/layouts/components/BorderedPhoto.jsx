'use client';
import { cn } from "@/lib/utils";

export default function BorderedPhoto({ 
  src, 
  alt = "Photo", 
  borderUrl, 
  className, 
  imgClassName, 
  aspectRatio = "aspect-[3/4]",
  enableZoom = true
}) {
  return (
    <div className={cn("relative overflow-hidden group", aspectRatio, className)}>
      {/* Main Image */}
      <img 
        src={src || "/placeholder.jpg"} 
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-transform duration-700 w-full",
          enableZoom && "group-hover:scale-110",
          imgClassName
        )}
      />
      
      {/* Border Overlay */}
      {borderUrl && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <img 
            src={borderUrl} 
            alt="Border" 
            className="w-full h-full object-fill"
          />
        </div>
      )}
    </div>
  );
}
