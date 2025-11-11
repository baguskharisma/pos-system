'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface SnapScriptLoaderProps {
  onReady?: () => void;
  onError?: () => void;
}

/**
 * Load Midtrans Snap.js script
 * This component should be placed in the layout or page where payment is needed
 */
export function SnapScriptLoader({ onReady, onError }: SnapScriptLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';

  const snapUrl = isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';

  useEffect(() => {
    // Check if snap is already loaded
    if (typeof window !== 'undefined' && window.snap) {
      setIsLoaded(true);
      onReady?.();
    }
  }, [onReady]);

  return (
    <Script
      src={snapUrl}
      data-client-key={clientKey}
      strategy="afterInteractive"
      onLoad={() => {
        console.log('✅ Midtrans Snap.js loaded');
        setIsLoaded(true);
        onReady?.();
      }}
      onError={() => {
        console.error('❌ Failed to load Midtrans Snap.js');
        onError?.();
      }}
    />
  );
}

// Extend Window interface
declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
      hide: () => void;
      show: () => void;
    };
  }
}
