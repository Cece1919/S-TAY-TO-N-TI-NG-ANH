export type CategoryId = 'number_theory' | 'geometry' | 'algebra' | 'combinatorics';

export interface CategoryInfo {
  id: CategoryId;
  nameVi: string;
  nameEn: string;
  icon: string;
  color: string;
  badgeBg: string;
  borderColor: string;
}

export interface MathTerm {
  id: string;
  category: CategoryId;
  term: string;
  phonetic: string;
  partOfSpeech: string;
  vietnameseMeaning: string;
  mathDefinition: string;
  vietnameseDefinition: string;
  formulaOrRule: string;
  olympiadWordProblem: string;
  solution: string;
  etymology: string;
  diagramSvg?: string;
  targetGrades: string;
  olympiadExam: string; // e.g. "TIMO / SASMO", "ASMO", "HKIMO"
  keyTokens?: string[]; // keywords for recall
}

export interface CardReviewHistory {
  date: string;
  quality: 1 | 2 | 3 | 4;
  interval: number;
  easeFactor: number;
}

export interface CardProgress {
  interval: number;         // Số ngày đến lần ôn tập tiếp theo
  easeFactor: number;       // Hệ số dễ nhớ (mặc định 2.5, tối thiểu 1.3)
  repetition: number;       // Số lần ôn tập thành công liên tiếp
  dueDate: string;          // YYYY-MM-DD
  lastReviewed: string;     // YYYY-MM-DD
  history: CardReviewHistory[];
}

export type CardProgressMap = Record<string, CardProgress>;

export interface LearningStats {
  totalReviews: number;
  streakDays: number;
  lastStudyDate: string;
  createdDate: string;
}

export interface AppDataStorage {
  version: string;
  customTerms: MathTerm[];
  cardProgress: CardProgressMap;
  stats: LearningStats;
  apiKey?: string;
}
