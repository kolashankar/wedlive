'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const FontContext = createContext();

export function FontProvider({ children }) {
  const [currentFont, setCurrentFont] = useState('Great Vibes');
  const [fontMappings] = useState({
    'Inter': 'var(--font-inter), sans-serif',
    'Great Vibes': 'var(--font-greatvibes), cursive',
    'Playfair Display': 'var(--font-playfair), serif',
    'Cinzel': 'var(--font-cinzel), serif',
    'Montserrat': 'var(--font-montserrat), sans-serif',
    'Lato': 'var(--font-lato), sans-serif',
    'Caveat': 'var(--font-caveat), cursive',
    'Bebas Neue': 'var(--font-bebas), cursive',
    'Rozha One': 'var(--font-rozha), serif',
    'Pinyon Script': 'var(--font-pinyon), cursive'
  });

  const updateFont = (fontName) => {
    setCurrentFont(fontName);
  };

  return (
    <FontContext.Provider value={{ currentFont, fontMappings, updateFont }}>
      {children}
    </FontContext.Provider>
  );
}

export const useFont = () => useContext(FontContext);
