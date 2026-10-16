import { CardProgress, CardReviewHistory } from '../types/math';

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function createDefaultProgress(): CardProgress {
  return {
    interval: 1,
    easeFactor: 2.5,
    repetition: 0,
    dueDate: getTodayString(),
    lastReviewed: '',
    history: [],
  };
}

/**
 * Thuật toán Spaced Repetition cải tiến theo bảng quy chuẩn phản xạ:
 *
 * 1. LẠI (Again / Quality = 1):
 *    - Quên hoàn toàn hoặc chưa thuộc
 *    - Chu kỳ: 1 ngày (Ôn lại vào ngày mai)
 *    - Tác động: Đặt lại chu kỳ về vạch xuất phát, tăng độ khó D (giảm Ease Factor)
 *
 * 2. KHÓ (Hard / Quality = 2):
 *    - Nhớ nhưng phải suy nghĩ lâu, chưa trơn tru
 *    - Chu kỳ: 1 ngày -> 2 ngày -> 4 ngày (Tăng chậm thận trọng)
 *    - Sau mốc 4 ngày: tăng chậm thận trọng (interval * 1.2)
 *    - Tác động: Giữ nguyên hoặc tăng nhẹ chu kỳ, củng cố kiến thức còn chưa vững
 *
 * 3. TỐT (Good / Quality = 3):
 *    - Nhớ đúng với tốc độ tự nhiên
 *    - Chu kỳ: 1 ngày -> 2 ngày -> 3 ngày -> 5 ngày (Chu kỳ chuẩn bậc thang)
 *    - Sau mốc 5 ngày: nhân với hệ số Ease Factor (~2.5): 13 ngày -> 33 ngày -> vài tháng
 *
 * 4. DỄ (Easy / Quality = 4):
 *    - Nhìn là nhớ ngay, phản xạ tức thì
 *    - Nhảy cóc chu kỳ:
 *      • Lần đầu: lên 2 ngày
 *      • 1 ngày: nhảy lên 3 ngày
 *      • 2 ngày: nhảy lên 5 ngày
 *      • 3 ngày: nhảy lên 8 ngày
 *      • Sau đó: Thưởng khoảng cách xa hơn (x 1.3 Ease Factor)
 */
export function calculateNextState(
  current: CardProgress | undefined,
  quality: 1 | 2 | 3 | 4,
  today: string = getTodayString()
): CardProgress {
  const progress: CardProgress = current
    ? { ...current, history: [...(current.history || [])] }
    : createDefaultProgress();

  const currInterval = progress.interval || 1;
  const rep = progress.repetition || 0;
  let nextEase = progress.easeFactor || 2.5;
  let nextRepetition = rep;
  let nextInterval = 1;

  switch (quality) {
    case 1: {
      // 1. LẠI (Again): Quên hoàn toàn hoặc chưa thuộc
      // Đặt lại chu kỳ về vạch xuất phát, tăng độ khó D (giảm Ease Factor)
      nextRepetition = 0;
      nextInterval = 1;
      nextEase = Math.max(1.3, Number((nextEase - 0.2).toFixed(2)));
      break;
    }

    case 2: {
      // 2. KHÓ (Hard): Nhớ nhưng phải suy nghĩ lâu, chưa trơn tru
      // Chu kỳ: 1 ngày -> 2 ngày -> 4 ngày (Tăng chậm thận trọng)
      nextRepetition = rep + 1;
      nextEase = Math.max(1.3, Number((nextEase - 0.15).toFixed(2)));

      if (rep === 0 || currInterval <= 1) {
        nextInterval = 1;
      } else if (currInterval === 1 || rep === 1) {
        nextInterval = 2;
      } else if (currInterval === 2 || rep === 2) {
        nextInterval = 4;
      } else {
        // Sau mốc 4 ngày: Tăng chậm thận trọng (~1.2x)
        nextInterval = Math.max(currInterval + 1, Math.round(currInterval * 1.2));
      }
      break;
    }

    case 3: {
      // 3. TỐT (Good): Nhớ đúng với tốc độ tự nhiên
      // Chu kỳ: 1 ngày -> 2 ngày -> 3 ngày -> 5 ngày (Chu kỳ chuẩn bậc thang)
      // Sau mốc 5 ngày: nhân với hệ số Ease Factor (~2.5) => 13 ngày -> 33 ngày -> vài tháng
      nextRepetition = rep + 1;

      if (rep === 0) {
        nextInterval = 1;
      } else if (currInterval === 1 || rep === 1) {
        nextInterval = 2;
      } else if (currInterval === 2 || rep === 2) {
        nextInterval = 3;
      } else if (currInterval === 3 || rep === 3) {
        nextInterval = 5;
      } else {
        // Sau mốc 5 ngày: 5 * 2.5 = 12.5 -> 13 ngày; 13 * 2.5 = 32.5 -> 33 ngày; 33 * 2.5 = 82.5 -> vài tháng
        nextInterval = Math.round(currInterval * nextEase);
      }
      break;
    }

    case 4: {
      // 4. DỄ (Easy): Nhìn là nhớ ngay, phản xạ tức thì
      // Nhảy cóc chu kỳ:
      // • Lần đầu: lên 2 ngày
      // • 1 ngày: nhảy lên 3 ngày
      // • 2 ngày: nhảy lên 5 ngày
      // • 3 ngày: nhảy lên 8 ngày
      // • Sau đó: Thưởng khoảng cách xa hơn (x 1.3 Ease Factor)
      nextRepetition = rep + 1;
      nextEase = Number((nextEase + 0.15).toFixed(2));

      if (rep === 0) {
        nextInterval = 2; // Lần đầu: lên 2 ngày
      } else if (currInterval === 1) {
        nextInterval = 3; // 1 ngày: nhảy lên 3 ngày
      } else if (currInterval === 2) {
        nextInterval = 5; // 2 ngày: nhảy lên 5 ngày
      } else if (currInterval === 3) {
        nextInterval = 8; // 3 ngày: nhảy lên 8 ngày
      } else {
        // Sau các mốc trên: Thưởng khoảng cách xa hơn (x 1.3 Ease Factor)
        nextInterval = Math.round(currInterval * nextEase * 1.3);
      }
      break;
    }
  }

  // Ngày đến hạn ôn tập tiếp theo
  const nextDueDate = addDays(today, nextInterval);

  const historyItem: CardReviewHistory = {
    date: today,
    quality,
    interval: nextInterval,
    easeFactor: nextEase,
  };

  return {
    interval: nextInterval,
    easeFactor: nextEase,
    repetition: nextRepetition,
    dueDate: nextDueDate,
    lastReviewed: today,
    history: [...progress.history, historyItem],
  };
}

/**
 * Preview next interval label for each quality button matching the prompt table:
 * 1. LẠI: "1 ngày (Ngày mai)"
 * 2. KHÓ: "X ngày"
 * 3. TỐT: "X ngày"
 * 4. DỄ: "X ngày"
 */
export function previewNextIntervals(current: CardProgress | undefined): Record<1 | 2 | 3 | 4, string> {
  const q1 = calculateNextState(current, 1);
  const q2 = calculateNextState(current, 2);
  const q3 = calculateNextState(current, 3);
  const q4 = calculateNextState(current, 4);

  return {
    1: '1 ngày (Ngày mai)',
    2: `${q2.interval} ngày`,
    3: `${q3.interval} ngày`,
    4: `${q4.interval} ngày`,
  };
}

export function isCardDue(progress: CardProgress | undefined, today: string = getTodayString()): boolean {
  if (!progress) return true; // never reviewed -> due!
  if (!progress.dueDate) return true;
  return progress.dueDate <= today;
}

export function getCardMasteryLevel(progress: CardProgress | undefined): 'new' | 'learning' | 'review' | 'mastered' {
  if (!progress || progress.repetition === 0) return 'new';
  if (progress.interval >= 21) return 'mastered';
  if (progress.interval >= 6) return 'review';
  return 'learning';
}
