#!/bin/bash
# Script to update studio section in all layouts

# This script updates Layout2.js through Layout8.js with the new studio toggle support

cd /app/frontend/components/layouts

for i in {2..8}; do
  file="Layout${i}.js"
  if [ -f "$file" ]; then
    echo "Updating $file..."
    
    # Use sed to replace the studio section
    # First, find the line with "Studio Partner - SIMPLIFIED"
    # Then replace everything until the closing section tag
    
    # Create backup
    cp "$file" "${file}.bak"
    
    # Update the file using Python for more complex replacement
    python3 << 'PYTHON_SCRIPT'
import re
import sys

file_path = "'$file'"

# Read the file
with open(file_path, 'r') as f:
    content = f.read()

# Pattern to match the old studio section
old_pattern = r'{/\* Studio Partner - SIMPLIFIED: Logo Only \*/}[\s\S]*?{studioDetails\?\.logo_url && \([\s\S]*?</section>[\s\S]*?\)\}'

# New studio section with toggle support
new_section = '''{/* Studio Partner - With Toggle Support */}
      {studioDetails?.logo_url && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 
              className="text-2xl md:text-3xl font-bold mb-8"
              style={textStyle}
            >
              Photography Partner
            </h2>
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
              {/* Studio Logo */}
              <img
                src={studioDetails.logo_url}
                alt={studioDetails.name || "Studio partner"}
                className="h-20 sm:h-24 md:h-32 mx-auto object-contain mb-6"
              />
              
              {/* Studio Details - Show only if toggle is ON */}
              {studioDetails.show_details && (
                <div className="mt-6 space-y-3 border-t pt-6">
                  {studioDetails.name && (
                    <h3 className="text-xl font-semibold" style={textStyle}>
                      {studioDetails.name}
                    </h3>
                  )}
                  <div className="flex flex-col items-center gap-2 text-gray-600">
                    {studioDetails.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${studioDetails.email}`} className="hover:underline">
                          {studioDetails.email}
                        </a>
                      </div>
                    )}
                    {studioDetails.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${studioDetails.phone}`} className="hover:underline">
                          {studioDetails.phone}
                        </a>
                      </div>
                    )}
                    {studioDetails.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <a 
                          href={studioDetails.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                    {studioDetails.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{studioDetails.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}'''

# Replace the old pattern with new section
updated_content = re.sub(old_pattern, new_section, content, flags=re.MULTILINE)

if updated_content != content:
    with open(file_path, 'w') as f:
        f.write(updated_content)
    print(f"Successfully updated {file_path}")
else:
    print(f"No changes needed for {file_path}")
PYTHON_SCRIPT
    
  fi
done

echo "All layouts updated!"
