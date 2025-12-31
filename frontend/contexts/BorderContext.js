'use client';
import { createContext, useContext, useState } from 'react';

const BorderContext = createContext();

export function BorderProvider({ children }) {
  const [currentBorders, setCurrentBorders] = useState({
    groom_border_id: null,
    bride_border_id: null,
    couple_border_id: null,
    cover_border_id: null,
    precious_moment_border_id: null
  });

  const updateBorder = (borderType, borderId) => {
    setCurrentBorders(prev => ({
      ...prev,
      [borderType]: borderId
    }));
  };

  const updateAllBorders = (borders) => {
    setCurrentBorders(borders);
  };

  return (
    <BorderContext.Provider value={{ currentBorders, updateBorder, updateAllBorders }}>
      {children}
    </BorderContext.Provider>
  );
}

export const useBorder = () => useContext(BorderContext);
