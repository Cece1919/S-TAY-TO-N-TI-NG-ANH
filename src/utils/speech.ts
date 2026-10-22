export interface SpeechOptions {
  rate?: number; // 0.8 to 1.0
  pitch?: number;
  lang?: string;
  forceWebSpeech?: boolean;
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
 * Returns the highest-fidelity natural/neural human voice available on the user's device.
 * Prioritizes Microsoft Online Natural, Apple Enhanced/Premium Siri, and Google HD voices.
 */
function getBestNaturalEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = cachedVoices && cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const enVoices = voices.filter((v) => v.lang.startsWith('en'));
  if (enVoices.length === 0) return voices[0] || null;

  // Score each voice to find the highest fidelity neural/natural voice
  const scored = enVoices.map((v) => {
    let score = 0;
    const name = v.name.toLowerCase();

    // 1. Microsoft Natural Online (Windows / Edge / macOS Edge)
    if (name.includes('natural') || name.includes('online (natural)')) score += 1000;

    // 2. Apple Premium & Enhanced Neural (macOS / iOS / iPadOS)
    if (name.includes('premium')) score += 850;
    if (name.includes('enhanced')) score += 750;
    if (name.includes('siri')) score += 600;

    // 3. Google Neural / HD voices (Chrome / Android)
    if (name.includes('google us english')) score += 700;
    if (name.includes('google uk english female')) score += 680;
    if (name.includes('google')) score += 500;

    // 4. High quality named voices
    if (name.includes('jenny')) score += 300;
    if (name.includes('aria')) score += 280;
    if (name.includes('guy')) score += 260;
    if (name.includes('ava')) score += 250;
    if (name.includes('samantha')) score += 200;
    if (name.includes('zoe')) score += 200;
    if (name.includes('daniel')) score += 180;
    if (name.includes('karen')) score += 150;
    if (name.includes('victoria')) score += 120;

    // Penalize robotic compact / legacy voices
    if (name.includes('compact')) score -= 400;
    if (name.includes('desktop')) score -= 100;

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
 * Speaks English text using enhanced human-like prosody, dynamic pitch contouring,
 * and natural sentence cadence ("ngắt nghỉ, lên xuống giọng mượt mà").
 */
export function speakEnglish(text: string, options: SpeechOptions = {}): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  const cleanSpoken = convertMathToSpokenEnglish(text);
  if (!cleanSpoken) return false;

  // Cancel any ongoing speech synthesis immediately
  window.speechSynthesis.cancel();
  activeUtterances.length = 0;

  try {
    const naturalVoice = getBestNaturalEnglishVoice();
    const thoughtUnits = splitIntoThoughtUnits(cleanSpoken);
    const baseRate = options.rate ?? 1.0;
    const basePitch = options.pitch ?? 1.0;

    thoughtUnits.forEach((unit, idx) => {
      const utterance = new SpeechSynthesisUtterance(unit.text);
      utterance.lang = options.lang || 'en-US';
      if (naturalVoice) utterance.voice = naturalVoice;

      // Fine-tune pitch contour and speech rate based on the linguistic role of each clause
      switch (unit.type) {
        case 'term':
          // Single vocabulary term: articulate, scholarly pace, warm pitch
          utterance.rate = Math.max(0.75, Math.min(1.2, baseRate * 0.88));
          utterance.pitch = Math.max(0.8, Math.min(1.3, basePitch * 1.02));
          break;

        case 'intro':
          // Introductory clause/condition: slightly higher engaging pitch, steady pace
          utterance.rate = Math.max(0.75, Math.min(1.2, baseRate * 0.90));
          utterance.pitch = Math.max(0.8, Math.min(1.3, basePitch * 1.03));
          break;

        case 'question':
          // Question prompt: rising question intonation contour
          utterance.rate = Math.max(0.75, Math.min(1.2, baseRate * 0.88));
          utterance.pitch = Math.max(0.8, Math.min(1.3, basePitch * 1.05));
          break;

        case 'conclusion':
          // Concluding declarative sentence: gentle falling finality cadence
          utterance.rate = Math.max(0.75, Math.min(1.2, baseRate * 0.87));
          utterance.pitch = Math.max(0.8, Math.min(1.3, basePitch * 0.96));
          break;

        case 'body':
        default:
          // Explanatory body: balanced neutral delivery
          utterance.rate = Math.max(0.75, Math.min(1.2, baseRate * 0.90));
          utterance.pitch = Math.max(0.8, Math.min(1.3, basePitch * 1.00));
          break;
      }

      // Memory retention to prevent garbage collection interrupts in Chrome / Safari
      activeUtterances.push(utterance);

      // Clean up when the final utterance finishes
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
