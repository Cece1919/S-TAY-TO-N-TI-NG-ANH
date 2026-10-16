export interface SpeechOptions {
  rate?: number; // 0.8 to 1.0
  pitch?: number;
  lang?: string;
}

export function speakEnglish(text: string, options: SpeechOptions = {}): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Web Speech API is not supported in this environment');
    return false;
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text of LaTeX or punctuation if needed
    const cleanText = text
      .replace(/\\(text|gcd|lcm|frac|sqrt|cdot|times)/g, '')
      .replace(/[\{\}\$\\]/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = options.lang || 'en-US';
    utterance.rate = options.rate ?? 0.9;
    utterance.pitch = options.pitch ?? 1.0;

    // Try finding native English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => (v.lang === 'en-US' || v.lang === 'en-GB') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Speech synthesis error:', err);
    return false;
  }
}

export function playAudioFeedback(type: 'flip' | 'correct' | 'wrong' | 'complete'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'flip') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'correct') {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'wrong') {
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(190, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'complete') {
      // Arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.setValueAtTime(freq, now + idx * 0.08);
        g.gain.setValueAtTime(0.1, now + idx * 0.08);
        g.gain.linearRampToValueAtTime(0.001, now + idx * 0.08 + 0.18);
        o.start(now + idx * 0.08);
        o.stop(now + idx * 0.08 + 0.18);
      });
    }
  } catch {
    // Ignore audio context errors silently
  }
}

export function playChime(): void {
  playAudioFeedback('complete');
}
