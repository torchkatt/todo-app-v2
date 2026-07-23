import { useCallback, useEffect, useRef, useState } from 'react';

const SPANISH_LANG_PRIORITY = ['es-CO', 'es-419', 'es-ES', 'es-MX'];

function pickSpanishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const lang of SPANISH_LANG_PRIORITY) {
    const exact = voices.find((v) => v.lang === lang);
    if (exact) return exact;
  }
  return voices.find((v) => v.lang.startsWith('es')) ?? null;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/[*_#`]/g, '')
    .trim();
}

/**
 * Salida de voz para el chat con el asistente IA (accesibilidad: adultos
 * mayores, personas con discapacidad). Voz en español, elegida entre las
 * disponibles del navegador; sin selector de usuario ni control de idioma.
 */
export function useSpeechSynthesis() {
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!isSupported) return;
    const loadVoices = () => { voiceRef.current = pickSpanishVoice(window.speechSynthesis.getVoices()); };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(stripMarkdown(text));
    if (voiceRef.current) utterance.voice = voiceRef.current;
    utterance.lang = voiceRef.current?.lang || 'es-CO';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  return { isSupported, isSpeaking, speak, stop };
}
