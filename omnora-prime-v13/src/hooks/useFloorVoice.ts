
"use client";

import { useState, useCallback, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';

interface VoiceIntent {
  command: string;
  action: (params: any) => void;
  triggers: string[];
}

/**
 * Hands-Free Floor Operations Hook
 * Maps voice input to industrial intents with TTS feedback.
 */
export function useFloorVoice(intents: VoiceIntent[]) {
  const [isListening, setIsListening] = useState(false);
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Always keep the latest intents accessible without rebuilding Fuse
  const intentsRef = useRef(intents);
  intentsRef.current = intents;

  // Build a static Fuse instance once, using command names as search keys.
  // We search against command names (stable strings), then look up the live
  // action from intentsRef.current — this prevents Fuse from being rebuilt
  // on every render when intents[] is a new array reference.
  const fuse = useMemo(() => {
    // Snapshot the command/triggers structure for indexing (these don't change)
    return new Fuse(intents.map(i => ({ command: i.command, triggers: i.triggers })), {
      keys: ['triggers'],
      threshold: 0.4
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Stable — intentionally built once; actions are resolved via intentsRef

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

  const processTranscript = useCallback((text: string) => {
    const cleanText = text.toLowerCase().trim();
    console.log('[FloorVoice] Processing:', cleanText);

    // Fuzzy match against stable snapshot of command/triggers
    const result = fuse.search(cleanText);
    
    if (result.length > 0) {
      const matchedCommand = result[0].item.command;
      // Resolve live action from the ref (always uses latest callbacks)
      const liveIntent = intentsRef.current.find(i => i.command === matchedCommand);
      if (!liveIntent) return;

      setLastIntent(liveIntent.command);
      
      // Extract numbers if any (e.g. "log 500 units")
      const numbers = cleanText.match(/\d+/g);
      const params = {
        raw: cleanText,
        quantity: numbers ? parseInt(numbers[0]) : null
      };

      liveIntent.action(params);
      speak(`Acknowledged. Triggering ${liveIntent.command}.`);
    } else {
      speak("Command not recognized. Please repeat.");
    }
  }, [fuse, speak]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      processTranscript(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [processTranscript]);

  return {
    isListening,
    startListening,
    lastIntent,
    speak
  };
}

