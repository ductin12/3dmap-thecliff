/**
 * Utility for High-Quality Vietnamese Audio Narration & Text-To-Speech (TTS)
 * Combines Gemini AI Audio Synthesis with Smart Natural Vietnamese Speech Synthesis
 */

export interface TtsOptions {
  id?: string;
  text: string;
  title?: string;
  voiceStyle?: string;
  speechRate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
  onLoading?: (isLoading: boolean) => void;
}

// Clean and optimize Vietnamese text for speech pronunciation
export function normalizeVietnameseForSpeech(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/24\/7/g, 'hai mươi tư trên bảy')
    .replace(/(\d+)\s*m\b/gi, '$1 mét')
    .replace(/(\d+)\s*km\b/gi, '$1 ki-lô-mét')
    .replace(/(\d+)\s*ha\b/gi, '$1 héc-ta')
    .replace(/&/g, 'và')
    .replace(/(\d+)-(\d+)/g, '$1 đến $2')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Get the best available Vietnamese voice from browser Web Speech API
export function getBestVietnameseVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Search priority for high quality Vietnamese voices
  const vietnameseVoices = voices.filter(
    (v) => v.lang.toLowerCase().includes('vi') || v.name.toLowerCase().includes('vietnam')
  );

  if (vietnameseVoices.length === 0) return null;

  // Prefer Natural / Online / Google / Microsoft / Apple high quality voices
  const preferredNames = [
    'google tiếng việt',
    'microsoft hoaimy',
    'microsoft namminh',
    'apple linh',
    'apple thu',
    'natural',
    'online'
  ];

  for (const preferred of preferredNames) {
    const matched = vietnameseVoices.find((v) => v.name.toLowerCase().includes(preferred));
    if (matched) return matched;
  }

  return vietnameseVoices[0];
}

// Voice manager class handling playback for both AI audio and Web Speech
export class AudioNarrator {
  private currentAudioElement: HTMLAudioElement | null = null;
  private isPlayingWebSpeech = false;

  public async speak(options: TtsOptions): Promise<{ type: 'ai' | 'web'; success: boolean }> {
    this.stop();

    const {
      id,
      text,
      title,
      voiceStyle = '',
      speechRate = 0.95,
      onStart,
      onEnd,
      onError,
      onLoading
    } = options;

    const normalizedText = normalizeVietnameseForSpeech(text);

    // If user requested Web Speech directly
    if (voiceStyle === 'web_natural') {
      return this.speakWithWebSpeech(normalizedText, speechRate, onStart, onEnd, onError);
    }

    // Use VieNeu-TTS Streaming API
    try {
      const voice = voiceStyle;
      if (onLoading) onLoading(true);
      
      // Step 2: Use caching backend API to get audio URL
      let audioUrl = '';
      if (voice) {
         try {
            const res = await fetch('/api/tts/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, text: normalizedText, voice_id: voice })
            });
            const data = await res.json();
            if (data.success && data.url) {
              audioUrl = data.url;
            }
         } catch (e) {
            console.warn('Failed to call /api/tts/generate, falling back to direct URL', e);
         }
      }

      // Fallback to direct stream URL if backend fails
      if (!audioUrl) {
         audioUrl = `https://tts.thecliff.io.vn/stream?text=${encodeURIComponent(normalizedText)}${voice ? `&voice_id=${encodeURIComponent(voice)}` : ''}`;
      }

      // Step 3: Stream and play the Audio
      const audio = new Audio(audioUrl);
      this.currentAudioElement = audio;

      audio.playbackRate = speechRate;
      
      // Wait for audio to be ready to play
      audio.oncanplay = () => {
        if (onLoading) onLoading(false);
      };
      
      audio.onplay = () => {
        if (onLoading) onLoading(false); // Fallback if oncanplay didn't fire
        onStart?.();
      };
      
      audio.onended = () => {
        this.currentAudioElement = null;
        onEnd?.();
      };
      
      audio.onerror = (e) => {
        console.warn('VieNeu-TTS API playback error, falling back to Web Speech:', e);
        if (onLoading) onLoading(false);
        this.speakWithWebSpeech(normalizedText, speechRate, onStart, onEnd, onError);
      };

      await audio.play();
      return { type: 'ai', success: true };

    } catch (err: any) {
      if (onLoading) onLoading(false);
      console.warn('TTS initialization failed, falling back to Web Speech:', err);
      return this.speakWithWebSpeech(normalizedText, speechRate, onStart, onEnd, onError);
    }
  }

  private speakWithWebSpeech(
    text: string,
    rate: number,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: string) => void
  ): { type: 'web'; success: boolean } {
    if (!('speechSynthesis' in window)) {
      onError?.('Trình duyệt không hỗ trợ đọc giọng nói.');
      return { type: 'web', success: false };
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = Math.max(0.7, Math.min(1.2, rate));
    utterance.pitch = 1.0;

    const voice = getBestVietnameseVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      this.isPlayingWebSpeech = true;
      onStart?.();
    };

    utterance.onend = () => {
      this.isPlayingWebSpeech = false;
      onEnd?.();
    };

    utterance.onerror = (event) => {
      this.isPlayingWebSpeech = false;
      if (event.error !== 'canceled') {
        onError?.(`Lỗi phát âm thanh: ${event.error}`);
      }
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    return { type: 'web', success: true };
  }

  public stop(): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isPlayingWebSpeech = false;
  }

  public pause(): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  public resume(): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.play();
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }
}

export const globalAudioNarrator = new AudioNarrator();
