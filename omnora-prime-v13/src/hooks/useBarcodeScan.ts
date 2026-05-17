// src/hooks/useBarcodeScan.ts
import { useEffect, useRef } from 'react';

/**
 * Hook to detect and capture global barcode scanner input.
 * USB HID scanners simulate keyboard input at extremely high speeds (<50ms between keys).
 */
export function useBarcodeScan(
  onScan: (barcode: string) => void,
  enabled: boolean = true
) {
  const buffer = useRef<string[]>([]);
  const lastKeyTime = useRef<number>(0);
  const MIN_BARCODE_LENGTH = 4;

  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTime.current;
      lastKeyTime.current = now;
      
      if (e.key === 'Enter') {
        const scanned = buffer.current.join('');
        if (scanned.length >= MIN_BARCODE_LENGTH) {
          // It's a valid barcode scan
          onScan(scanned);
          e.preventDefault();
        }
        buffer.current = [];
        return;
      }
      
      // If the gap between keys is too long (>100ms), it's likely a human typing.
      if (timeSinceLastKey > 100) {
        buffer.current = [];
      }
      
      // Only buffer single characters (ignore Shift, Alt, etc.)
      if (e.key.length === 1) {
        buffer.current.push(e.key);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan, enabled]);
}
