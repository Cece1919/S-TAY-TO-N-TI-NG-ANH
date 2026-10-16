export interface SpeechOptions {
  rate?: number; // 0.8 to 1.0
  pitch?: number;
  lang?: string;
  forceWebSpeech?: boolean;
}

// Track active audio element to avoid overlapping speech
let currentAudioElement: HTMLAudioElement | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

// Pre-load voices on browser initialization
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices();
    } catch {
      // Ignore
    }
  };
  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
}

/**
 * Converts mathematical formulas, LaTeX symbols, and Olympic notation into natural spoken English
 * so speech sounds like an authentic human teacher rather than robotic syntax.
 */
export function convertMathToSpokenEnglish(raw: string): string {
  if (!raw) return '';

  return raw
    // LaTeX fractions: \frac{a}{b} -> a over b
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
    // Square roots: \sqrt{x} -> square root of x
    .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
    .replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '$1th root of $2')
    // Operators
    .replace(/\\times|\\cdot/g, ' times ')
    .replace(/\\div/g, ' divided by ')
    .replace(/\\pm/g, ' plus or minus ')
    .replace(/\\neq/g, ' is not equal to ')
    .replace(/\\approx/g, ' is approximately ')
    .replace(/\\le|\\leq/g, ' is less than or equal to ')
    .replace(/\\ge|\\geq/g, ' is greater than or equal to ')
    .replace(/\\pi/g, ' pi ')
    .replace(/\\degree|\^\\circ/g, ' degrees ')
    .replace(/\\angle/g, ' angle ')
    .replace(/\\triangle/g, ' triangle ')
    .replace(/\\perp/g, ' is perpendicular to ')
    .replace(/\\parallel/g, ' is parallel to ')
    .replace(/\\gcd/g, ' greatest common divisor ')
    .replace(/\\lcm/g, ' least common multiple ')
    .replace(/\\equiv/g, ' is congruent to ')
    .replace(/\\pmod\{([^}]+)\}/g, ' modulo $1')
    .replace(/\\bmod/g, ' mod ')
    // Exponents: a^2 -> a squared, a^3 -> a cubed, a^n -> a to the power of n
    .replace(/\^2\b/g, ' squared')
    .replace(/\^3\b/g, ' cubed')
    .replace(/\^\{([^}]+)\}/g, ' to the power of $1')
    .replace(/\^([a-zA-Z0-9])/g, ' to the power of $1')
    // Units
    .replace(/\bcm\^2\b/g, 'square centimeters')
    .replace(/\bm\^2\b/g, 'square meters')
    // Clean residual LaTeX tags and formatting
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[\{\}\$\\_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns the highest-fidelity natural/neural human voice available on the user's device
 */
function getBestNaturalEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const enVoices = voices.filter((v) => v.lang.startsWith('en'));
  if (enVoices.length === 0) return voices[0] || null;

  // 1. Microsoft Online Natural voices (Edge/Chrome on Windows & Mac: Jenny, Aria, Guy)
  const msNatural = enVoices.find(
    (v) => v.name.includes('Natural') || v.name.includes('Online (Natural)')
  );
  if (msNatural) return msNatural;

  // 2. Google High-Definition US / UK English (Chrome / Android)
  const googleNatural = enVoices.find(
    (v) =>
      v.name.includes('Google US English') ||
      v.name.includes('Google UK English') ||
      v.name.includes('Google')
  );
  if (googleNatural) return googleNatural;

  // 3. Apple Enhanced / Premium Siri Voices (Safari / iOS / macOS: Samantha Enhanced, Ava, Daniel)
  const appleEnhanced = enVoices.find(
    (v) => (v.name.includes('Enhanced') || v.name.includes('Premium')) && !v.name.includes('Compact')
  );
  if (appleEnhanced) return appleEnhanced;

  // 4. Well-tuned human voices
  const naturalNamed = enVoices.find((v) =>
    ['Samantha', 'Daniel', 'Ava', 'Victoria', 'Karen', 'Oliver', 'Allison'].some((name) =>
      v.name.includes(name)
    )
  );
  if (naturalNamed) return naturalNamed;

  // 5. Standard US / UK English
  const usGb = enVoices.find((v) => v.lang === 'en-US' || v.lang === 'en-GB');
  if (usGb) return usGb;

  return enVoices[0];
}

// In-memory audio cache for high-fidelity studio voice clips
const audioCache = new Map<string, string>();

/**
 * Speaks English text using studio-quality neural native speech with fallback
 */
export function speakEnglish(text: string, options: SpeechOptions = {}): boolean {
  if (typeof window === 'undefined') return false;

  const cleanSpoken = convertMathToSpokenEnglish(text);
  if (!cleanSpoken) return false;

  // Cancel any ongoing audio playback
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch {
      // Ignore
    }
    currentAudioElement = null;
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // 1. Check if high-definition neural studio audio is in cache
  const cachedUrl = audioCache.get(cleanSpoken);
  if (cachedUrl) {
    try {
      const audio = new Audio(cachedUrl);
      currentAudioElement = audio;
      audio.playbackRate = options.rate ?? 1.0;
      audio.play().catch(() => {
        speakViaEnhancedWebSpeech(cleanSpoken, options);
      });
      return true;
    } catch {
      // fallback
    }
  }

  // 2. Fetch authentic, lifelike human voice from Gemini TTS
  if (!options.forceWebSpeech) {
    fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanSpoken, voice: 'Kore' }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Server TTS response not OK');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audioCache.set(cleanSpoken, url);

        if (currentAudioElement) {
          try {
            currentAudioElement.pause();
          } catch {
            // Ignore
          }
        }
        const audio = new Audio(url);
        currentAudioElement = audio;
        audio.playbackRate = options.rate ?? 1.0;
        return audio.play();
      })
      .catch((err) => {
        // Fallback gracefully to enhanced browser voice
        console.warn('Falling back to local natural speech engine:', err);
        speakViaEnhancedWebSpeech(cleanSpoken, options);
      });

    return true;
  }

  // Method 2: Enhanced Web Speech Engine with highest-ranking natural voice
  return speakViaEnhancedWebSpeech(cleanSpoken, options);
}

function speakViaEnhancedWebSpeech(cleanText: string, options: SpeechOptions): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  try {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = options.lang || 'en-US';
    // Natural cadence: 0.92x is crisp, scholarly and perfectly intelligible
    utterance.rate = options.rate ?? 0.92;
    utterance.pitch = options.pitch ?? 1.0;

    const naturalVoice = getBestNaturalEnglishVoice();
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    return false;
  }
}

/**
 * Organic, acoustic sound synthesis with harmonic overtones (Singing bowl / Marimba chime)
 * Replaces harsh robotic square-wave beeps with warm, scholarly resonance.
 */
export function playAudioFeedback(type: 'flip' | 'correct' | 'wrong' | 'complete'): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'flip') {
      // Soft organic book-page tactile sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.08);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.07);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'correct') {
      // Warm marimba major triad (E5 + G#5) with harmonic resonance
      const notes = [659.25, 830.61]; // E5, G#5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        oscHarmonic.type = 'triangle';

        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        oscHarmonic.frequency.setValueAtTime(freq * 2, now + i * 0.04); // 2nd harmonic for warm acoustic tone

        const start = now + i * 0.04;
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

        osc.connect(gain);
        oscHarmonic.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        oscHarmonic.start(start);
        osc.stop(start + 0.35);
        oscHarmonic.stop(start + 0.35);
      });
    } else if (type === 'wrong') {
      // Muted, gentle marimba low tone (supportive, not jarring)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'complete') {
      // Lush acoustic chime arpeggio (C5 - E5 - G5 - C6) with natural decay
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const overtone = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        overtone.type = 'triangle';

        const startTime = now + idx * 0.09;
        osc.frequency.setValueAtTime(freq, startTime);
        overtone.frequency.setValueAtTime(freq * 2, startTime);

        gain.gain.setValueAtTime(0.06, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

        osc.connect(gain);
        overtone.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        overtone.start(startTime);
        osc.stop(startTime + 0.6);
        overtone.stop(startTime + 0.6);
      });
    }
  } catch {
    // Ignore audio context errors silently
  }
}

export function playChime(): void {
  playAudioFeedback('complete');
}
