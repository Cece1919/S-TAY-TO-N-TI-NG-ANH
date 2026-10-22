import audioManifest from '../data/audioManifest.json';

export interface SpeechOptions {
  rate?: number; // 0.8 to 1.0
  pitch?: number;
  lang?: string;
  forceWebSpeech?: boolean;
}

// Global reference to active audio element for instant cancellation and pause
let currentAudioElement: HTMLAudioElement | null = null;

/**
 * Resolves relative audio paths safely across all environments (root domain, GitHub Pages subfolder, local dev)
 */
function getAudioUrl(relativePath: string): string {
  if (typeof window === 'undefined') return relativePath;
  try {
    const base = document.baseURI || window.location.href;
    const cleanRel = relativePath.replace(/^\.?\//, '');
    const url = new URL(base);
    if (!url.pathname.endsWith('/') && !url.pathname.match(/\.[a-zA-Z0-9]+$/)) {
      url.pathname += '/';
    }
    return new URL(cleanRel, url.href).href;
  } catch {
    return relativePath;
  }
}

// Global references to prevent garbage collection of active speech utterances
const activeUtterances: SpeechSynthesisUtterance[] = [];
let cachedVoices: SpeechSynthesisVoice[] = [];

// Pre-load voices on browser initialization
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    try {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        cachedVoices = v;
      }
    } catch {
      // Ignore
    }
  };
  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
}

/**
 * Converts mathematical formulas, LaTeX symbols, units, geometry notations,
 * and contest problem text into authentic, natural-sounding spoken English
 * with human-like breathing pauses and pedagogical clarity.
 */
export function convertMathToSpokenEnglish(raw: string): string {
  if (!raw) return '';

  let text = raw
    // 1. Remove Vietnamese text anywhere (e.g. parenthetical translations "- Tìm số nguyên tố...")
    .replace(/\([^\)]*[\u00C0-\u1EF9][^\)]*\)/g, '')
    // 2. Remove contest citation tags like (TIMO Grade 6), (SASMO Grade 8), (HKIMO Grade 7), (TIMO Grade 6-7)
    .replace(/\((?:TIMO|ASMO|SASMO|HKIMO|SEAMO|AMC)[^)]*\)/gi, '')
    // 3. Sequences: + ... + or + … + -> and so on up to
    .replace(/\+\s*(?:\.\.\.|…)\s*\+\s*/g, ' plus, and so on up to, ')
    // 4. Compound hyphens: 6-digit -> 6 digit, 25-meter -> 25 meter, 6-sided -> 6 sided
    .replace(/(\d+)-([a-zA-Z]+)/g, '$1 $2')
    // Clean remaining empty parentheses
    .replace(/\(\s*\)/g, ' ')
    // Fix trailing double punctuation like "? ." or ". ."
    .replace(/([?!.])\s*[?!.]+/g, '$1');

  // Term acronym expansion: (GCD) -> G, C, D; (LCM) -> L, C, M
  text = text
    .replace(/\(GCD\)/g, ', G, C, D')
    .replace(/\(LCM\)/g, ', L, C, M');

  // Math symbols & LaTeX
  text = text
    // LaTeX fractions: \frac{a}{b} -> a over b
    .replace(/\\frac\{1\}\{2\}/g, 'one half')
    .replace(/\\frac\{1\}\{3\}/g, 'one third')
    .replace(/\\frac\{1\}\{4\}/g, 'one quarter')
    .replace(/\\frac\{3\}\{4\}/g, 'three quarters')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
    // Square roots: \sqrt{x} -> square root of x
    .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
    .replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '$1th root of $2')
    // Relational operators & comparisons
    .replace(/\\approx|≈/g, ' is approximately ')
    .replace(/\\neq|≠|!=/g, ' is not equal to ')
    .replace(/\\le|\\leq|<=|≤/g, ' is less than or equal to ')
    .replace(/\\ge|\\geq|>=|≥/g, ' is greater than or equal to ')
    .replace(/\\times|\\cdot|×/g, ' times ')
    .replace(/\\div|÷/g, ' divided by ')
    .replace(/\\pm|±/g, ' plus or minus ')
    .replace(/\\pi|π/g, ' pi ')
    .replace(/\\degree|\^\\circ|°/g, ' degrees ')
    .replace(/\\perp|\\bot|⟂/g, ' is perpendicular to ')
    .replace(/\\parallel|\/\//g, ' is parallel to ')
    .replace(/\\triangle|△/g, ' triangle ')
    .replace(/\\angle|∠/g, ' angle ')
    .replace(/\\gcd/g, ' greatest common divisor ')
    .replace(/\\lcm/g, ' least common multiple ')
    .replace(/\\equiv/g, ' is congruent to ')
    .replace(/\\pmod\{([^}]+)\}/g, ' modulo $1')
    .replace(/\\bmod/g, ' mod ')
    // Factorials: 25! (factorial of 25) -> 25 factorial
    .replace(/(\d+)\!\s*(?:\(factorial of \d+\))?/gi, '$1 factorial')
    // Exponents: cm² -> square centimeters, etc.
    .replace(/\bcm\^2\b|cm²|square\s*cm\b/gi, 'square centimeters')
    .replace(/\bm\^2\b|m²|square\s*m\b/gi, 'square meters')
    .replace(/\bcm\^3\b|cm³/gi, 'cubic centimeters')
    .replace(/\bm\^3\b|m³/gi, 'cubic meters')
    .replace(/\^2\b/g, ' squared')
    .replace(/\^3\b/g, ' cubed')
    .replace(/\^\{([^}]+)\}/g, ' to the power of $1')
    .replace(/\^([a-zA-Z0-9])/g, ' to the power of $1')
    // Units with numbers: 70 cm -> 70 centimeters, 440 meters
    .replace(/(\d+)\s*cm\b/gi, '$1 centimeters')
    .replace(/(\d+)\s*m\b/gi, '$1 meters')
    .replace(/(\d+)\s*km\b/gi, '$1 kilometers')
    .replace(/(\d+)\s*kg\b/gi, '$1 kilograms')
    // Geometric points e.g. triangle ABC -> triangle A, B, C; segment AB -> segment A, B
    .replace(/\b(triangle|triangles|angle|angles|segment|line|points)\s+([A-Z]{2,4})\b/g, (match, prefix, pts) => {
      return `${prefix} ${pts.split('').join(', ')}`;
    })
    .replace(/\b([A-Z]{2})\s*=\s*([A-Z]{2})\b/g, (match, p1, p2) => {
      return `${p1.split('').join(', ')} equals ${p2.split('').join(', ')}`;
    })
    // Multiplication in algebra parentheses: 3(x - 2) -> 3 times, (x minus 2) - only if operator or single variable inside
    .replace(/(\d+)\s*\((?=[^)]*(?:[+\-*/^=]|\b[a-zA-Z]\b\s*[+\-*/]))([^)]+)\)/g, '$1 times, ($2)')
    // Relational equals & inequality in text: = -> equals, < -> is less than, > -> is greater than
    .replace(/\s*=\s*/g, ' equals ')
    .replace(/\s*<\s*/g, ' is less than ')
    .replace(/\s*>\s*/g, ' is greater than ')
    // Plus and Minus in equations
    .replace(/\s*\+\s*/g, ' plus ')
    .replace(/\s+-\s+/g, ' minus ')
    // Simple fractions like 22/7 -> 22 over 7
    .replace(/(\d+)\/(\d+)/g, '$1 over $2')
    // Clean residual LaTeX tags and formatting
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[\{\}\$\\_]/g, ' ')
    // Normalize punctuation, spacing and commas for smooth prosodic breathing
    .replace(/\s*,\s*/g, ', ')
    .replace(/,\s*,+/g, ', ')
    .replace(/\s+([.,?!])/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/([?!.])\s*[?!.]+/g, '$1')
    .trim();

  return text;
}

/**
 * Returns the highest-fidelity natural/neural male human voice available on the user's device.
 * Prioritizes deep, scholarly male neural voices (Brian, Guy, Ryan, Davis, Oliver, Daniel, Alex).
 */
function getBestNaturalEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = cachedVoices && cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const enVoices = voices.filter((v) => v.lang.startsWith('en'));
  if (enVoices.length === 0) return voices[0] || null;

  // Score each voice to find the highest fidelity neural/natural male educator voice
  const scored = enVoices.map((v) => {
    let score = 0;
    const name = v.name.toLowerCase();

    // 1. Male Natural voices (Microsoft Brian, Guy, Ryan, Davis, Christopher, Oliver)
    if (name.includes('brian')) score += 1500;
    if (name.includes('guy') || name.includes('ryan') || name.includes('davis') || name.includes('christopher')) score += 1200;
    if (name.includes('natural') || name.includes('online (natural)')) score += 1000;

    // 2. Apple Male voices (Alex, Daniel, Oliver, Jamie, Fred)
    if (name.includes('daniel') || name.includes('alex') || name.includes('oliver') || name.includes('jamie')) score += 950;
    if (name.includes('premium')) score += 850;
    if (name.includes('enhanced')) score += 750;
    if (name.includes('siri')) score += 600;

    // 3. Google Neural voices (Google US English Male)
    if (name.includes('google us english') && !name.includes('female')) score += 800;
    if (name.includes('google uk english male')) score += 800;
    if (name.includes('google')) score += 400;

    // Penalize robotic compact / legacy voices
    if (name.includes('compact')) score -= 400;
    if (name.includes('desktop')) score -= 100;

    // Penalize female voices when user requests deep male voice
    if (name.includes('female') || name.includes('jenny') || name.includes('aria') || name.includes('ava') || name.includes('samantha') || name.includes('karen') || name.includes('victoria')) {
      score -= 500;
    }

    // Locale preference: en-US, en-GB
    if (v.lang === 'en-US') score += 50;
    else if (v.lang === 'en-GB') score += 40;

    if (v.default && score > 0) score += 20;

    return { voice: v, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.voice || enVoices[0];
}

interface ThoughtUnit {
  text: string;
  type: 'term' | 'intro' | 'question' | 'conclusion' | 'body';
}

/**
 * Splits text into natural thought and breath units for prosodic inflection
 */
function splitIntoThoughtUnits(text: string): ThoughtUnit[] {
  // If it's a short title/term (<= 4 words without sentence punctuation), keep as single unit
  const wordCount = text.split(/\s+/).length;
  if (wordCount <= 4 && !/[.?!]/.test(text)) {
    return [{ text, type: 'term' }];
  }

  // Split on sentence boundaries (Safari/WebKit 100% compatible - no regex lookbehind)
  const matches = text.match(/[^.?!;]+[.?!;]+(?:\s+|$)|[^.?!;]+$/g);
  const rawUnits = matches ? matches.map((s) => s.trim()).filter(Boolean) : [text];

  if (rawUnits.length <= 1) {
    // Check for compound sentences with introductory condition
    const compoundMatch = text.match(/^(.*?[,;])\s+(find\b.*|what\b.*|how\b.*|calculate\b.*|determine\b.*)$/i);
    if (compoundMatch) {
      return [
        { text: compoundMatch[1], type: 'intro' },
        { text: compoundMatch[2], type: 'question' },
      ];
    }
    const isQ = text.endsWith('?') || /^(find|what|how|calculate|determine|show)\b/i.test(text);
    return [{ text, type: isQ ? 'question' : 'body' }];
  }

  return rawUnits.map((unit, idx) => {
    const isLast = idx === rawUnits.length - 1;
    const isFirst = idx === 0;
    const isQuestion = unit.endsWith('?') || /^(find|what|how|calculate|determine|show)\b/i.test(unit);

    if (isQuestion) return { text: unit, type: 'question' };
    if (isFirst && rawUnits.length > 1) return { text: unit, type: 'intro' };
    if (isLast) return { text: unit, type: 'conclusion' };
    return { text: unit, type: 'body' };
  });
}

/**
 * Enhanced Web Speech API synthesis with dynamic male prosody and natural pauses
 */
function speakViaEnhancedWebSpeech(cleanSpoken: string, options: SpeechOptions = {}): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  if (!cleanSpoken) return false;

  try {
    const naturalVoice = getBestNaturalEnglishVoice();
    const thoughtUnits = splitIntoThoughtUnits(cleanSpoken);
    const baseRate = options.rate ?? 1.0;
    // Set default base pitch to 0.92 for a deeper, resonant masculine educator tone
    const basePitch = (options.pitch ?? 1.0) * 0.92;

    thoughtUnits.forEach((unit, idx) => {
      const utterance = new SpeechSynthesisUtterance(unit.text);
      utterance.lang = options.lang || 'en-US';
      if (naturalVoice) utterance.voice = naturalVoice;

      switch (unit.type) {
        case 'term':
          // Articulate, scholarly pace, deep warm tone
          utterance.rate = Math.max(0.75, Math.min(1.2, baseRate * 0.88));
          utterance.pitch = Math.max(0.7, Math.min(1.2, basePitch * 1.00));
          break;

        case 'intro':
          // Introductory condition: engaging, steady pace
          utterance.rate = Math.max(0.75, Math.min(1.2, baseRate * 0.90));
          utterance.pitch = Math.max(0.7, Math.min(1.2, basePitch * 1.02));
          break;

        case 'question':
          // Question prompt: subtle rising inflection
          utterance.rate = Math.max(0.75, Math.min(1.2, baseRate * 0.88));
          utterance.pitch = Math.max(0.7, Math.min(1.2, basePitch * 1.04));
          break;

        case 'conclusion':
          // Concluding sentence: calm falling cadence
          utterance.rate = Math.max(0.75, Math.min(1.2, baseRate * 0.87));
          utterance.pitch = Math.max(0.7, Math.min(1.2, basePitch * 0.94));
          break;

        case 'body':
        default:
          utterance.rate = Math.max(0.75, Math.min(1.2, baseRate * 0.90));
          utterance.pitch = Math.max(0.7, Math.min(1.2, basePitch * 0.98));
          break;
      }

      activeUtterances.push(utterance);

      if (idx === thoughtUnits.length - 1) {
        utterance.onend = () => {
          activeUtterances.length = 0;
        };
        utterance.onerror = () => {
          activeUtterances.length = 0;
        };
      }

      window.speechSynthesis.speak(utterance);
    });

    return true;
  } catch (err) {
    console.warn('Web speech synthesis error:', err);
    return false;
  }
}

/**
 * Speaks English text using studio-recorded neural male educator audio files (edge-tts BrianMultilingualNeural)
 * for all 28 terms and 28 contest problems, with zero lag and instant playback.
 * Seamlessly falls back to enhanced male Web Speech API synthesis for dynamic or unlisted text.
 */
export function speakEnglish(text: string, options: SpeechOptions = {}): boolean {
  if (!text || typeof window === 'undefined') return false;

  // 1. Immediately stop any currently playing studio audio element
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch {
      // Ignore
    }
    currentAudioElement = null;
  }

  // 2. Immediately cancel any ongoing Web Speech synthesis
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      activeUtterances.length = 0;
    } catch {
      // Ignore
    }
  }

  const cleanSpoken = convertMathToSpokenEnglish(text);

  // 3. Fast lookup in studio audio manifest (unless forced to use Web Speech)
  if (!options.forceWebSpeech) {
    const normRaw = text.trim().toLowerCase();
    const normClean = cleanSpoken.trim().toLowerCase();
    const manifest = audioManifest as Record<string, string>;

    const matchedPath =
      manifest[normRaw] ||
      manifest[normClean] ||
      manifest[normRaw.replace(/[.,?!]+$/, '')] ||
      manifest[normClean.replace(/[.,?!]+$/, '')];

    if (matchedPath) {
      try {
        const fullAudioUrl = getAudioUrl(matchedPath);
        const audio = new Audio(fullAudioUrl);
        if (options.rate) {
          audio.playbackRate = Math.max(0.5, Math.min(2.0, options.rate));
        }
        currentAudioElement = audio;

        audio.onended = () => {
          if (currentAudioElement === audio) {
            currentAudioElement = null;
          }
        };

        audio.onerror = () => {
          if (currentAudioElement === audio) {
            currentAudioElement = null;
          }
          // Graceful fallback to enhanced Web Speech if media fails to load
          speakViaEnhancedWebSpeech(cleanSpoken, options);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Studio audio playback error, falling back to Web Speech:', err);
            speakViaEnhancedWebSpeech(cleanSpoken, options);
          });
        }
        return true;
      } catch (err) {
        console.warn('Audio initialization error:', err);
      }
    }
  }

  // 4. Fallback to enhanced male Web Speech API
  return speakViaEnhancedWebSpeech(cleanSpoken, options);
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
