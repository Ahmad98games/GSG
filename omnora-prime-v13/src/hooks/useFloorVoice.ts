
"use client";

import { useState, useCallback, useRef } from 'react';
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

  const fuse = new Fuse(intents, {
    keys: ['triggers'],
    threshold: 0.4
  });

  const speak = (text: string) => {
    if (typeof window === 'undefined') return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const processTranscript = useCallback((text: string) => {
    const cleanText = text.toLowerCase().trim();
    console.log('[FloorVoice] Processing:', cleanText);

    // Fuzzy match intent
    const result = fuse.search(cleanText);
    
    if (result.length > 0) {
      const intent = result[0].item;
      setLastIntent(intent.command);
      
      // Extract numbers if any (e.g. "log 500 units")
      const numbers = cleanText.match(/\d+/g);
      const params = {
        raw: cleanText,
        quantity: numbers ? parseInt(numbers[0]) : null
      };

      intent.action(params);
      speak(`Acknowledged. Triggering ${intent.command}.`);
    } else {
      speak("Command not recognized. Please repeat.");
    }
  }, [intents]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

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
