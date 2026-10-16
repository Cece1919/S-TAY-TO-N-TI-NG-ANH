import { AppDataStorage, CardProgressMap, LearningStats, MathTerm } from '../types/math';
import { getTodayString } from './sm2';

const STORAGE_KEY = 'mathvocab_ai_v1_data';

export const DEFAULT_STATS: LearningStats = {
  totalReviews: 0,
  streakDays: 1,
  lastStudyDate: getTodayString(),
  createdDate: getTodayString(),
};

export function loadAppData(): AppDataStorage {
  if (typeof window === 'undefined') {
    return {
      version: '1.0.0',
      customTerms: [],
      cardProgress: {},
      stats: DEFAULT_STATS,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        version: '1.0.0',
        customTerms: [],
        cardProgress: {},
        stats: DEFAULT_STATS,
      };
    }
    const data = JSON.parse(raw) as AppDataStorage;
    return {
      version: data.version || '1.0.0',
      customTerms: data.customTerms || [],
      cardProgress: data.cardProgress || {},
      stats: data.stats || DEFAULT_STATS,
      apiKey: data.apiKey || '',
    };
  } catch (e) {
    console.error('Failed to parse localStorage data:', e);
    return {
      version: '1.0.0',
      customTerms: [],
      cardProgress: {},
      stats: DEFAULT_STATS,
    };
  }
}

export function saveAppData(data: AppDataStorage): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function updateCardProgress(
  wordId: string,
  progress: import('../types/math').CardProgress
): AppDataStorage {
  const data = loadAppData();
  const today = getTodayString();

  // Streak calculation
  const lastDate = data.stats.lastStudyDate;
  let newStreak = data.stats.streakDays || 1;
  if (lastDate && lastDate !== today) {
    const lastTime = new Date(lastDate).getTime();
    const currTime = new Date(today).getTime();
    const diffDays = Math.round((currTime - lastTime) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  }

  data.cardProgress[wordId] = progress;
  data.stats = {
    ...data.stats,
    totalReviews: (data.stats.totalReviews || 0) + 1,
    streakDays: newStreak,
    lastStudyDate: today,
  };

  saveAppData(data);
  return data;
}

export function exportDataAsJson(data: AppDataStorage): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mathvocab_ai_backup_${getTodayString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importDataFromJson(jsonString: string): AppDataStorage | null {
  try {
    const parsed = JSON.parse(jsonString) as AppDataStorage;
    if (!parsed.cardProgress || typeof parsed.cardProgress !== 'object') {
      throw new Error('Invalid MathVocab data format');
    }
    const cleanData: AppDataStorage = {
      version: parsed.version || '1.0.0',
      customTerms: Array.isArray(parsed.customTerms) ? parsed.customTerms : [],
      cardProgress: parsed.cardProgress || {},
      stats: parsed.stats || DEFAULT_STATS,
      apiKey: parsed.apiKey || '',
    };
    saveAppData(cleanData);
    return cleanData;
  } catch (err) {
    console.error('Failed to import MathVocab data:', err);
    return null;
  }
}
