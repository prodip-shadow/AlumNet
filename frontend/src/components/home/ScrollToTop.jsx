'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      size="sm"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 h-10 px-4 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-primary-foreground/20 flex items-center gap-1.5 text-xs font-semibold"
      title="Scroll to Top"
    >
      <ChevronUp className="h-4 w-4 stroke-[2.5]" />
      <span>Back to Top</span>
    </Button>
  );
};

export default ScrollToTop;
