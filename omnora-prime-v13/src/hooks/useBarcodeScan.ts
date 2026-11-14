// src/hooks/useBarcodeScan.ts
import { useEffect, useRef } from 'react';

export type ScanContext =
  | 'pos'
  | 'inventory'
  | 'audit'
  | 'gate_pass'
  | 'pairing'
  | 'hardware_test'
  | 'all';

// Global active scan context store
let globalActiveContext: ScanContext = 'all';

export function setScanContext(context: ScanContext): void {
  globalActiveContext = context;
}

export function getScanContext(): ScanContext {
  return globalActiveContext;
}

export interface BarcodeScanOptions {
  enabled?: boolean;
  context?: ScanContext;
  minBarcodeLength?: number;
  debounceMs?: number;
  allowInInputs?: boolean;
}

/**
 * Bulletproof hook to detect and capture USB HID barcode scanner input.
 * Protects against accidental triggers when modals are open or text fields are focused.
 */
export function useBarcodeScan(
  onScan: (barcode: string) => void,
  enabledOrOptions: boolean | BarcodeScanOptions = true,
  explicitContext?: ScanContext
) {
  // Normalize parameters for backwards-compatibility
  const options: BarcodeScanOptions =
    typeof enabledOrOptions === 'boolean'
      ? { enabled: enabledOrOptions, context: explicitContext }
      : enabledOrOptions;

  const {
    enabled = true,
    context = explicitContext || 'all',
    minBarcodeLength = 3,
    debounceMs = 500,
    allowInInputs = false,
  } = options;

  const buffer = useRef<string[]>([]);
  const lastKeyTime = useRef<number>(0);
  const lastScanTimestamp = useRef<number>(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  // Manage context lifecycle
  useEffect(() => {
    if (context && context !== 'all') {
      const prevContext = globalActiveContext;
      setScanContext(context);
      return () => {
        // Restore previous context or default to 'all'
        if (globalActiveContext === context) {
          setScanContext(prevContext === context ? 'all' : prevContext);
        }
      };
    }
  }, [context]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTime.current;
      lastKeyTime.current = now;

      // 1. Context validation: Ignore if context doesn't match active global context
      if (
        context !== 'all' &&
        globalActiveContext !== 'all' &&
        globalActiveContext !== context
      ) {
        buffer.current = [];
        return;
      }

      // 2. Modal / Dialog open check: Never fire scans while a dialog/modal is open
      const isModalOpen = Boolean(
        document.querySelector('[role="dialog"]') ||
        document.querySelector('[aria-modal="true"]') ||
        document.querySelector('[data-state="open"]')
      );
      if (isModalOpen && context !== 'hardware_test') {
        buffer.current = [];
        return;
      }

      // 3. Focused input check: Do not hijack keystrokes if an input, textarea, or contentEditable is focused
      if (!allowInInputs && document.activeElement) {
        const activeTag = document.activeElement.tagName.toUpperCase();
        const isInputField =
          activeTag === 'INPUT' ||
          activeTag === 'TEXTAREA' ||
          activeTag === 'SELECT' ||
          (document.activeElement as HTMLElement).isContentEditable;

        // Allow if specifically tagged with data-barcode-target
        const isDedicatedTarget = document.activeElement.hasAttribute('data-barcode-target');
        if (isInputField && !isDedicatedTarget) {
          buffer.current = [];
          return;
        }
      }

      // 4. Processing carriage return / enter from scanner
      if (e.key === 'Enter') {
        const scanned = buffer.current.join('').trim();
        buffer.current = [];

        // Check min barcode length (minimum 3 characters)
        if (scanned.length >= minBarcodeLength) {
          // 5. Debounce check: Prevent double scans within 500ms
          if (now - lastScanTimestamp.current < debounceMs) {
            console.warn('[BARCODE] Ignored duplicate scan within debounce window:', scanned);
            e.preventDefault();
            return;
          }

          lastScanTimestamp.current = now;
          onScanRef.current(scanned);
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      // If the gap between keys is too long (>85ms), it's likely a human typing, not a barcode scanner
      if (timeSinceLastKey > 85) {
        buffer.current = [];
      }

      // Only buffer single visible characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        buffer.current.push(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled, context, minBarcodeLength, debounceMs, allowInInputs]);
}
