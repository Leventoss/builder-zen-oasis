import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiStatusProps {
  className?: string;
}

export default function ApiStatus({ className = '' }: ApiStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkApiStatus = async () => {
      try {
        const response = await fetch('/api/ping', { 
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (response.ok) {
          setIsOnline(true);
          setShowStatus(false);
        } else {
          setIsOnline(false);
          setShowStatus(true);
        }
      } catch (error) {
        setIsOnline(false);
        setShowStatus(true);
      }
    };

    // Initial check
    checkApiStatus();

    // Check every 30 seconds
    const intervalId = setInterval(checkApiStatus, 30000);

    // Hide status after 10 seconds if offline
    if (!isOnline && showStatus) {
      timeoutId = setTimeout(() => {
        setShowStatus(false);
      }, 10000);
    }

    return () => {
      clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOnline, showStatus]);

  // Don't show anything if online
  if (isOnline || !showStatus) {
    return null;
  }

  return (
    <div className={`fixed top-20 right-4 z-50 max-w-sm ${className}`}>
      <Alert className="bg-red-900/90 border-red-500/50 text-white">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>API Bağlantısı Yok - Örnek veriler gösteriliyor</span>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
