'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to handle mobile viewport height issues
 * Addresses the iOS Safari address bar and Android Chrome behavior
 */
export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewportHeight = () => {
      // Get the actual viewport height
      const vh = window.innerHeight * 0.01;
      
      // Set CSS custom property
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      setViewportHeight(window.innerHeight);
    };

    // Initial calculation
    updateViewportHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', () => {
      // Delay to account for browser UI changes
      setTimeout(updateViewportHeight, 100);
    });

    // iOS Safari specific handling
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // Handle iOS Safari address bar show/hide
      let ticking = false;
      
      const handleScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            updateViewportHeight();
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
        window.removeEventListener('scroll', handleScroll);
      };
    }

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return viewportHeight;
}

/**
 * Hook to detect when mobile keyboard is visible
 */
export function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const viewportHeight = useViewportHeight();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialHeight = window.innerHeight;
    
    const checkKeyboard = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      // Consider keyboard visible if height decreased by more than 150px
      setIsKeyboardVisible(heightDifference > 150);
    };

    window.addEventListener('resize', checkKeyboard);
    
    return () => {
      window.removeEventListener('resize', checkKeyboard);
    };
  }, [viewportHeight]);

  return isKeyboardVisible;
}

/**
 * Hook to handle safe area insets
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setInsets({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
      });
    };

    updateInsets();
    
    window.addEventListener('resize', updateInsets);
    window.addEventListener('orientationchange', updateInsets);

    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('orientationchange', updateInsets);
    };
  }, []);

  return insets;
}