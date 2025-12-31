'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Countdown({ targetDate, color = '#8b0000' }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ];

  if (!timeLeft.days && !timeLeft.hours) return null;

  return (
    <div className="flex justify-center gap-4">
      {timeUnits.map((unit, index) => (
        <div key={index} className="flex flex-col items-center">
          <div className="relative w-16 h-20 perspective-1000 group">
             {/* Glassmorphism Card with Flip Animation */}
            <motion.div 
                key={unit.value}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{ duration: 0.6, type: 'spring' }}
                className="w-full h-full bg-white/30 backdrop-blur-md rounded-lg shadow-lg border border-white/50 flex items-center justify-center overflow-hidden"
                style={{ color: color }}
            >
               <span className="text-3xl font-bold font-mono">{String(unit.value || 0).padStart(2, '0')}</span>
            </motion.div>
          </div>
          <span className="text-xs font-semibold uppercase mt-2 tracking-wider" style={{ color: color }}>
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
