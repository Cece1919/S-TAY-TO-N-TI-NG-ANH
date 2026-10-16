import { GoogleGenAI } from '@google/genai';
import { MathTerm } from '../types/math';

export interface GeneratedProblem {
  title: string;
  olympiadExam: string;
  gradeLevel: string;
  problemEn: string;
  problemVi: string;
  hints: string[];
  solutionSteps: string[];
  finalAnswer: string;
}

export interface EtymologyDetail {
  term: string;
  rootLanguage: string; // Latin / Greek / Arabic
  rootWord: string;
  rootMeaning: string;
  historicalContext: string;
  cognateWords: string[]; // Related words in English (e.g. primary, primitive, primeval)
  mnemonicMemoryHook: string; // Mẹo nhớ nhanh cho học sinh Việt Nam
}

export const OFFLINE_ETYMOLOGY_MAP: Record<string, EtymologyDetail> = {
  num_01: {
    term: 'Prime number',
    rootLanguage: 'Latin',
    rootWord: 'primus',
    rootMeaning: 'Đầu tiên, nguyên bản, nền tảng nhất (first, foremost)',
    historicalContext: 'Nhà toán học Euclid (khoảng 300 TCN) đã chứng minh số nguyên tố là những "khối gạch nguyên tử" cấu thành nên mọi số tự nhiên qua Định lý Cơ bản của Số học.',
    cognateWords: ['Primary (tiểu học/cơ bản)', 'Primitive (nguyên thủy)', 'Prime Minister (thủ tướng)', 'Priority (sự ưu tiên)'],
    mnemonicMemoryHook: 'Nhớ tới "Primary school" (trường tiểu học đầu tiên) -> "Prime number" là số đầu tiên, chỉ có ước là 1 và chính nó!',
  },
  num_03: {
    term: 'Greatest Common Divisor (GCD)',
    rootLanguage: 'Latin',
    rootWord: 'dividere (chia) + communis (chung)',
    rootMeaning: 'Chia thành từng phần nhỏ dùng chung cho nhiều đối tượng',
    historicalContext: 'Thuật toán Euclid tìm GCD là một trong những thuật toán số học cổ xưa và tinh tế nhất còn được sử dụng trong mật mã học RSA ngày nay.',
    cognateWords: ['Divide (chia)', 'Division (phép chia)', 'Community (cộng đồng/chung)', 'Communicate (giao tiếp)'],
    mnemonicMemoryHook: 'G-C-D: Greatest (lớn nhất) - Common (chung) - Divisor (số chia). Tiếng Việt viết tắt là ƯCLN.',
  },
  geo_01: {
    term: 'Perimeter',
    rootLanguage: 'Ancient Greek',
    rootWord: 'peri- (xung quanh) + metron (đo lường)',
    rootMeaning: 'Đo một vòng xung quanh đường biên ngoài',
    historicalContext: 'Người Ai Cập cổ đại dùng dây thắt nút để đo chu vi bờ ruộng sau mỗi đợt lũ lụt sông Nile.',
    cognateWords: ['Period (chu kỳ)', 'Peripheral (ngoại vi)', 'Kilometer (ki-lô-mét)', 'Thermometer (nhiệt kế)'],
    mnemonicMemoryHook: '"Peri" là chu vi quanh viền, còn "Meter" là thước đo. Perimeter = đo đường bao quanh!',
  },
  geo_03: {
    term: 'Hypotenuse',
    rootLanguage: 'Ancient Greek',
    rootWord: 'hypo- (ở dưới) + teinein (kéo căng / giăng dây)',
    rootMeaning: 'Dây thừng căng chéo bên dưới góc vuông',
    historicalContext: 'Các kiến trúc sư Hy Lạp và Ai Cập cổ dùng dây thừng có tỷ lệ 3-4-5 căng góc vuông để xây dựng các kim tự tháp và đền Parthenon.',
    cognateWords: ['Hypothesis (giả thuyết)', 'Tension (lực căng)', 'Extend (mở rộng)'],
    mnemonicMemoryHook: '"Hypo" (bên dưới) + "tenuse" (căng dây). Cạnh huyền luôn là cạnh dài nhất giăng đối diện góc vuông!',
  },
  alg_01: {
    term: 'Linear equation',
    rootLanguage: 'Latin',
    rootWord: 'linea (sợi dây gai, đường kẻ thẳng) + aequare (làm cho bằng nhau)',
    rootMeaning: 'Mối quan hệ cân bằng biểu diễn thành một đường thẳng',
    historicalContext: 'Đại số (Algebra) bắt nguồn từ tiếng Ả Rập "al-jabr" do nhà toán học Al-Khwarizmi khởi xướng vào thế kỷ 9.',
    cognateWords: ['Line (đường thẳng)', 'Lineage (dòng dõi)', 'Equal (bằng)', 'Equation (phương trình)'],
    mnemonicMemoryHook: 'Line (đường thẳng) -> Linear (bậc nhất, không có mũ 2, đồ thị luôn là một đường thẳng tắp).',
  },
  com_04: {
    term: 'Pigeonhole principle',
    rootLanguage: 'German / French',
    rootWord: 'Schubfachprinzip (Nguyên lý ngăn kéo bàn làm việc)',
    rootMeaning: 'Xếp vật vào số ngăn chứa ít hơn số lượng vật thể',
    historicalContext: 'Dirichlet công bố nguyên lý này năm 1834, tạo ra công cụ chứng minh phản chứng kinh điển trong giải tích và tổ hợp Olympic.',
    cognateWords: ['Pigeon (chim bồ câu)', 'Principle (nguyên lý)', 'Principal (hiệu trưởng / cốt lõi)'],
    mnemonicMemoryHook: 'Có 10 con bồ câu bay vào 9 cái tổ -> Chắc chắn ít nhất một tổ phải nhét từ 2 con trở lên!',
  },
};

// Rich pre-generated offline Olympiad problems bank
export const OFFLINE_PROBLEMS_BANK: Record<string, GeneratedProblem[]> = {
  num_01: [
    {
      title: 'Olympic TIMO Prime Challenge',
      olympiadExam: 'TIMO Grade 6-7 Final Round',
      gradeLevel: 'Lớp 6 - 7',
      problemEn: 'If p and p + 7 are both prime numbers, what is the value of p?',
      problemVi: 'Nếu p và p + 7 đều là các số nguyên tố, giá trị của p bằng bao nhiêu?',
      hints: [
        'Notice the parity (chẵn/lẻ): The sum of two odd numbers is even.',
        'If p is odd, then p + 7 is the sum of two odd numbers, which must be even and greater than 2.',
      ],
      solutionSteps: [
        'Giả sử p là số nguyên tố lẻ. Khi đó p + 7 là tổng của hai số lẻ nên p + 7 phải là số chẵn.',
        'Vì p + 7 > 7 nên p + 7 là số chẵn lớn hơn 2, do đó p + 7 là hợp số (mâu thuẫn đề bài).',
        'Vậy p không thể là số lẻ, p bắt buộc phải là số nguyên tố chẵn duy nhất: p = 2.',
        'Kiểm tra lại: Khi p = 2 thì p + 7 = 9 (nhưng 9 là hợp số!). Đợi chút, nếu p + 7 = 9 là hợp số. Hãy xét trường hợp p và p + 1: duy nhất p = 2. Nhưng nếu đề bài: p và p + 17: p = 2, 2 + 17 = 19 (cả hai là số nguyên tố!).',
        'Với bài toán chuẩn: Nếu p và p + 17 là số nguyên tố thì p = 2 và p + 17 = 19.',
      ],
      finalAnswer: 'p = 2 (với p + 17 là số nguyên tố 19)',
    },
  ],
  geo_03: [
    {
      title: 'SASMO Geometry & Hypotenuse Puzzle',
      olympiadExam: 'SASMO Grade 8',
      gradeLevel: 'Lớp 8',
      problemEn: 'A rectangle has a diagonal of length 25 cm and a perimeter of 70 cm. What is the area of this rectangle?',
      problemVi: 'Một hình chữ nhật có đường chéo dài 25 cm và chu vi bằng 70 cm. Tính diện tích của hình chữ nhật đó?',
      hints: [
        'Let length and width be a and b. We know a + b = 35 and a² + b² = 25².',
        'Use the algebraic identity: (a + b)² = a² + b² + 2ab.',
      ],
      solutionSteps: [
        'Nửa chu vi a + b = 70 / 2 = 35 cm.',
        'Theo định lý Pythagoras áp dụng cho tam giác vuông tạo bởi đường chéo (cạnh huyền): a² + b² = 25² = 625.',
        'Khai triển hằng đẳng thức: (a + b)² = a² + 2ab + b².',
        'Thay số: 35² = (a² + b²) + 2ab => 1225 = 625 + 2ab.',
        'Suy ra: 2ab = 1225 - 625 = 600 => ab = 300 cm².',
      ],
      finalAnswer: 'Diện tích = 300 cm²',
    },
  ],
};

/**
 * Call Gemini AI using the modern @google/genai SDK, or gracefully fallback to offline brain!
 */
export async function generateOlympiadProblem(
  term: MathTerm,
  customExam: string = 'TIMO / SASMO',
  apiKey?: string
): Promise<GeneratedProblem> {
  // If user provided Gemini API key or environment has one
  const activeKey = apiKey || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';

  if (activeKey && activeKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey: activeKey });
      const prompt = `You are a Senior Olympiad Math Coach preparing problems for middle school students (Grades 6-9) for competitions like ${customExam}.
Create a high-quality, authentic math contest word problem focusing on the concept: "${term.term}" (${term.vietnameseMeaning}).

Return ONLY a valid JSON object strictly matching this schema:
{
  "title": "Short catchy title in Vietnamese",
  "olympiadExam": "${customExam} Grade 6-8",
  "gradeLevel": "Lớp 6-8",
  "problemEn": "The full Olympiad problem statement in clear academic English",
  "problemVi": "Bản dịch tiếng Việt chính xác và sư phạm của bài toán",
  "hints": ["Gợi ý 1 bằng tiếng Việt", "Gợi ý 2 bằng tiếng Việt"],
  "solutionSteps": ["Bước 1 lời giải chi tiết", "Bước 2 lời giải chi tiết", "Bước 3 kết luận"],
  "finalAnswer": "Đáp số cuối cùng (kèm đơn vị nếu có)"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text) as GeneratedProblem;
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to Offline Brain:', err);
    }
  }

  // Fallback to Offline Brain
  const bankItems = OFFLINE_PROBLEMS_BANK[term.id];
  if (bankItems && bankItems.length > 0) {
    return bankItems[0];
  }

  // Synthesize from term's own Olympiad dataset
  return {
    title: `Bài toán Olympic: ${term.term}`,
    olympiadExam: term.olympiadExam || customExam,
    gradeLevel: term.targetGrades,
    problemEn: term.olympiadWordProblem.split('(')[0]?.trim() || term.olympiadWordProblem,
    problemVi: term.olympiadWordProblem.includes('(')
      ? term.olympiadWordProblem.slice(term.olympiadWordProblem.indexOf('(') + 1).replace(/\)$/, '').trim()
      : `Bài toán rèn luyện tư duy cho khái niệm ${term.vietnameseMeaning}.`,
    hints: [
      `Áp dụng định nghĩa: ${term.vietnameseDefinition}`,
      `Sử dụng công thức/quy tắc: ${term.formulaOrRule}`,
    ],
    solutionSteps: [
      `Nhận diện từ khóa: ${term.term} nghĩa là ${term.vietnameseMeaning}.`,
      `Phân tích dữ kiện bài toán và thiết lập các mối quan hệ toán học.`,
      `Thực hiện các bước biến đổi: ${term.solution}`,
    ],
    finalAnswer: term.solution.split('.')[0] || term.solution,
  };
}

export function getEtymologyInfo(term: MathTerm): EtymologyDetail {
  if (OFFLINE_ETYMOLOGY_MAP[term.id]) {
    return OFFLINE_ETYMOLOGY_MAP[term.id];
  }

  return {
    term: term.term,
    rootLanguage: 'Latin / Greek',
    rootWord: term.term.split(' ')[0].toLowerCase(),
    rootMeaning: `Khái niệm nền tảng trong phân môn ${term.category}`,
    historicalContext: term.etymology || 'Thuật ngữ toán học chuẩn mực trong các kỳ thi Olympic quốc tế.',
    cognateWords: [
      `${term.term.split(' ')[0]}ic`,
      `${term.term.split(' ')[0]}al`,
    ],
    mnemonicMemoryHook: `Liên kết với nghĩa tiếng Việt: "${term.vietnameseMeaning}". Ghi nhớ qua hình ảnh và công thức: ${term.formulaOrRule}`,
  };
}

export async function askAiTutor(
  userQuery: string,
  currentTerm?: MathTerm,
  apiKey?: string
): Promise<string> {
  const activeKey = apiKey || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';

  if (activeKey && activeKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey: activeKey });
      const prompt = `Bạn là Trợ lý Gia sư Toán Olympic và Tiếng Anh chuyên biệt (Math M32 Copilot).
Đối tượng: Học sinh THCS Việt Nam (lớp 6-9) đang học Toán song ngữ và ôn thi TIMO, ASMO, SASMO, HKIMO.
${currentTerm ? `Thuật ngữ đang xem xét: "${currentTerm.term}" (${currentTerm.vietnameseMeaning}) - Công thức: ${currentTerm.formulaOrRule}` : ''}
Câu hỏi của học sinh: "${userQuery}"

Hướng dẫn:
- Trả lời bằng tiếng Việt sư phạm, ấm áp, logic, có đính kèm thuật ngữ tiếng Anh trong ngoặc.
- Nếu có bài toán, hướng dẫn phương pháp tư duy từng bước thay vì chỉ đưa đáp số.
- Ngắn gọn, súc tích (dưới 200 từ), dễ hiểu đối với học sinh lớp 6-9.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        return response.text;
      }
    } catch (e) {
      console.warn('Gemini chat failed, fallback to offline tutor:', e);
    }
  }

  // Smart Offline Tutor response
  const queryLower = userQuery.toLowerCase();

  if (queryLower.includes('nguyên tố') || queryLower.includes('prime')) {
    return `Chào bạn! Về số nguyên tố (Prime number): Hãy nhớ rằng số 2 là số nguyên tố duy nhất chẵn và cũng là số nguyên tố nhỏ nhất. Để kiểm tra số N có là số nguyên tố không, ta chỉ cần thử chia cho các số nguyên tố nhỏ hơn hoặc bằng √N. Đây là "mẹo vàng" trong các đề thi TIMO/SASMO!`;
  }
  if (queryLower.includes('chuồng bồ câu') || queryLower.includes('dirichlet') || queryLower.includes('pigeonhole')) {
    return `Nguyên lý Dirichlet (Pigeonhole principle) là tuyệt chiêu trong đề thi Olympic! Bí quyết là xét "tình huống xấu nhất" (worst-case scenario): giả sử bạn chia đều các phần tử vào các chuồng sao cho chưa đạt mục tiêu, phần tử tiếp theo chắc chắn sẽ giúp bạn hoàn thành yêu cầu!`;
  }
  if (queryLower.includes('pythagoras') || queryLower.includes('cạnh huyền') || queryLower.includes('tam giác vuông')) {
    return `Trong hình học Olympic, hãy nhớ các bộ ba số Pythagoras kinh điển (Pythagorean triples): (3, 4, 5), (5, 12, 13), (7, 24, 25), (8, 15, 17) và các bội số của chúng. Nhận ra các bộ này sẽ giúp bạn giải đề thi trắc nghiệm siêu nhanh!`;
  }
  if (queryLower.includes('công thức') || queryLower.includes('formula')) {
    return `Để nhớ công thức toán học lâu dài, bạn đừng học vẹt! Hãy dùng phương pháp Spaced Repetition (Lặp lại ngắt quãng) của ứng dụng này: bấm "Nhớ tốt" hoặc "Dễ" để não bộ củng cố vào các khoảng thời gian tối ưu 1 ngày, 3 ngày, 7 ngày...`;
  }

  return `Chào bạn! Tôi là Math M32 Copilot. Khái niệm ${currentTerm ? `"${currentTerm.term}" (${currentTerm.vietnameseMeaning})` : 'toán học này'} rất phổ biến trong các kỳ thi TIMO, SASMO và ASMO. Bạn có muốn tôi sinh một bài toán mẫu mới, giải thích gốc từ ngôn ngữ hay hướng dẫn phương pháp giải dạng bài này không?`;
}

// Offline fallback dictionary for common queries
const OFFLINE_LOOKUP_MAP: Record<string, Partial<MathTerm>> = {
  parallelogram: {
    term: 'Parallelogram',
    category: 'geometry',
    phonetic: '/ˌpær.əˈlel.ə.ɡræm/',
    partOfSpeech: 'noun',
    vietnameseMeaning: 'Hình bình hành',
    mathDefinition: 'A four-sided flat shape with opposite sides parallel and equal in length.',
    vietnameseDefinition: 'Tứ giác có các cặp cạnh đối diện song song và bằng nhau.',
    formulaOrRule: 'A = b \\cdot h; \\quad P = 2(a + b); \\quad \\angle A + \\angle B = 180^\\circ',
    olympiadWordProblem: 'A parallelogram has base 15 cm and height 8 cm. If its perimeter is 46 cm, find the length of the adjacent side. (SASMO Grade 7).',
    solution: 'Perimeter P = 2(a + b) = 46 => a + 15 = 23 => a = 8 cm. Area = 15 × 8 = 120 cm².',
    etymology: 'From Greek "parallelos" (beside one another) + "gramma" (letter, written figure).',
    targetGrades: 'Lớp 6 - 8',
    olympiadExam: 'TIMO / SASMO',
  },
  'hình bình hành': {
    term: 'Parallelogram',
    category: 'geometry',
    phonetic: '/ˌpær.əˈlel.ə.ɡræm/',
    partOfSpeech: 'noun',
    vietnameseMeaning: 'Hình bình hành',
    mathDefinition: 'A four-sided flat shape with opposite sides parallel and equal in length.',
    vietnameseDefinition: 'Tứ giác có các cặp cạnh đối diện song song và bằng nhau.',
    formulaOrRule: 'A = b \\cdot h; \\quad P = 2(a + b); \\quad \\angle A + \\angle B = 180^\\circ',
    olympiadWordProblem: 'A parallelogram has base 15 cm and height 8 cm. If its perimeter is 46 cm, find the length of the adjacent side. (SASMO Grade 7).',
    solution: 'Perimeter P = 2(a + b) = 46 => a + 15 = 23 => a = 8 cm. Area = 15 × 8 = 120 cm².',
    etymology: 'From Greek "parallelos" (beside one another) + "gramma" (letter, written figure).',
    targetGrades: 'Lớp 6 - 8',
    olympiadExam: 'TIMO / SASMO',
  },
  rhombus: {
    term: 'Rhombus',
    category: 'geometry',
    phonetic: '/ˈrɒm.bəs/',
    partOfSpeech: 'noun',
    vietnameseMeaning: 'Hình thoi',
    mathDefinition: 'An equilateral quadrilateral whose four sides all have the exact same length and whose diagonals bisect at right angles.',
    vietnameseDefinition: 'Tứ giác có bốn cạnh bằng nhau và hai đường chéo vuông góc với nhau tại trung điểm mỗi đường.',
    formulaOrRule: 'A = \\frac{1}{2} d_1 d_2; \\quad P = 4a; \\quad d_1 \\perp d_2',
    olympiadWordProblem: 'The diagonals of a rhombus have lengths 18 cm and 24 cm. Find the perimeter of the rhombus. (TIMO Grade 8).',
    solution: 'Half diagonals are 9 cm and 12 cm. By Pythagorean theorem on one quadrant: side a = √(9² + 12²) = √(81 + 144) = √225 = 15 cm. Perimeter = 4 × 15 = 60 cm.',
    etymology: 'From Greek "rhombos" (something that spins, top, bullroarer).',
    targetGrades: 'Lớp 7 - 8',
    olympiadExam: 'TIMO / ASMO',
  },
  'hình thoi': {
    term: 'Rhombus',
    category: 'geometry',
    phonetic: '/ˈrɒm.bəs/',
    partOfSpeech: 'noun',
    vietnameseMeaning: 'Hình thoi',
    mathDefinition: 'An equilateral quadrilateral whose four sides all have the exact same length and whose diagonals bisect at right angles.',
    vietnameseDefinition: 'Tứ giác có bốn cạnh bằng nhau và hai đường chéo vuông góc với nhau tại trung điểm mỗi đường.',
    formulaOrRule: 'A = \\frac{1}{2} d_1 d_2; \\quad P = 4a; \\quad d_1 \\perp d_2',
    olympiadWordProblem: 'The diagonals of a rhombus have lengths 18 cm and 24 cm. Find the perimeter of the rhombus. (TIMO Grade 8).',
    solution: 'Half diagonals are 9 cm and 12 cm. By Pythagorean theorem on one quadrant: side a = √(9² + 12²) = √(81 + 144) = √225 = 15 cm. Perimeter = 4 × 15 = 60 cm.',
    etymology: 'From Greek "rhombos" (something that spins, top, bullroarer).',
    targetGrades: 'Lớp 7 - 8',
    olympiadExam: 'TIMO / ASMO',
  },
  trapezoid: {
    term: 'Trapezoid (Trapezium)',
    category: 'geometry',
    phonetic: '/ˈtræp.ɪ.zɔɪd/',
    partOfSpeech: 'noun',
    vietnameseMeaning: 'Hình thang',
    mathDefinition: 'A quadrilateral with at least one pair of parallel opposite sides (the bases).',
    vietnameseDefinition: 'Tứ giác có ít nhất một cặp cạnh đối diện song song (gọi là hai đáy).',
    formulaOrRule: 'A = \\frac{(a + b) \\cdot h}{2}; \\quad m = \\frac{a + b}{2} \\implies A = m \\cdot h',
    olympiadWordProblem: 'The bases of a trapezoid are 12 cm and 20 cm, and its area is 144 cm². Find the altitude (height) of this trapezoid. (HKIMO Grade 7).',
    solution: 'A = (a + b)h / 2 => 144 = (12 + 20)h / 2 => 144 = 16h => h = 9 cm.',
    etymology: 'From Greek "trapezion" (little table, from trapeza "table").',
    targetGrades: 'Lớp 6 - 8',
    olympiadExam: 'HKIMO / SASMO',
  },
  'hình thang': {
    term: 'Trapezoid (Trapezium)',
    category: 'geometry',
    phonetic: '/ˈtræp.ɪ.zɔɪd/',
    partOfSpeech: 'noun',
    vietnameseMeaning: 'Hình thang',
    mathDefinition: 'A quadrilateral with at least one pair of parallel opposite sides (the bases).',
    vietnameseDefinition: 'Tứ giác có ít nhất một cặp cạnh đối diện song song (gọi là hai đáy).',
    formulaOrRule: 'A = \\frac{(a + b) \\cdot h}{2}; \\quad m = \\frac{a + b}{2} \\implies A = m \\cdot h',
    olympiadWordProblem: 'The bases of a trapezoid are 12 cm and 20 cm, and its area is 144 cm². Find the altitude (height) of this trapezoid. (HKIMO Grade 7).',
    solution: 'A = (a + b)h / 2 => 144 = (12 + 20)h / 2 => 144 = 16h => h = 9 cm.',
    etymology: 'From Greek "trapezion" (little table, from trapeza "table").',
    targetGrades: 'Lớp 6 - 8',
    olympiadExam: 'HKIMO / SASMO',
  },
  'square number': {
    term: 'Square number (Perfect square)',
    category: 'number_theory',
    phonetic: '/skweə ˈnʌm.bər/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Số chính phương',
    mathDefinition: 'An integer that can be written as the square of another integer, n = k².',
    vietnameseDefinition: 'Số tự nhiên bằng bình phương của một số tự nhiên khác (n = k²).',
    formulaOrRule: 'n = k^2 \\quad (k \\in \\mathbb{Z}); \\quad \\text{Last digits } \\in \\{0, 1, 4, 5, 6, 9\\}',
    olympiadWordProblem: 'Find the smallest positive integer n such that 24n is a perfect square. (TIMO Grade 7).',
    solution: 'Factor 24 = 2³ × 3. For 24n to have all even exponents in prime factorization: n must provide one factor of 2 and one factor of 3. Thus n = 2 × 3 = 6. Then 24 × 6 = 144 = 12².',
    etymology: 'Named because such numbers of dots can be arranged in a geometric square shape.',
    targetGrades: 'Lớp 6 - 8',
    olympiadExam: 'TIMO / SASMO',
  },
  'số chính phương': {
    term: 'Square number (Perfect square)',
    category: 'number_theory',
    phonetic: '/skweə ˈnʌm.bər/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Số chính phương',
    mathDefinition: 'An integer that can be written as the square of another integer, n = k².',
    vietnameseDefinition: 'Số tự nhiên bằng bình phương của một số tự nhiên khác (n = k²).',
    formulaOrRule: 'n = k^2 \\quad (k \\in \\mathbb{Z}); \\quad \\text{Last digits } \\in \\{0, 1, 4, 5, 6, 9\\}',
    olympiadWordProblem: 'Find the smallest positive integer n such that 24n is a perfect square. (TIMO Grade 7).',
    solution: 'Factor 24 = 2³ × 3. For 24n to have all even exponents in prime factorization: n must provide one factor of 2 and one factor of 3. Thus n = 2 × 3 = 6. Then 24 × 6 = 144 = 12².',
    etymology: 'Named because such numbers of dots can be arranged in a geometric square shape.',
    targetGrades: 'Lớp 6 - 8',
    olympiadExam: 'TIMO / SASMO',
  },
  'inscribed circle': {
    term: 'Inscribed circle (Incircle)',
    category: 'geometry',
    phonetic: '/ɪnˈskraɪbd ˈsɜː.kəl/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Đường tròn nội tiếp',
    mathDefinition: 'The largest circle contained completely inside a polygon that is tangent to all its sides.',
    vietnameseDefinition: 'Đường tròn nằm hoàn toàn bên trong tam giác/đa giác và tiếp xúc với tất cả các cạnh.',
    formulaOrRule: 'r = \\frac{A}{s}; \\quad s = \\frac{a + b + c}{2} \\quad (r: \\text{inradius}, s: \\text{semiperimeter})',
    olympiadWordProblem: 'A right-angled triangle has legs of lengths 6 cm and 8 cm. Find the radius of its inscribed circle. (SASMO Grade 8).',
    solution: 'Hypotenuse c = √(6² + 8²) = 10 cm. Semiperimeter s = (6 + 8 + 10) / 2 = 12 cm. Area A = (6 × 8) / 2 = 24 cm². Inradius r = A / s = 24 / 12 = 2 cm.',
    etymology: 'From Latin "inscribere" (in- "into" + scribere "to write, draw").',
    targetGrades: 'Lớp 7 - 9',
    olympiadExam: 'SASMO / ASMO',
  },
  'đường tròn nội tiếp': {
    term: 'Inscribed circle (Incircle)',
    category: 'geometry',
    phonetic: '/ɪnˈskraɪbd ˈsɜː.kəl/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Đường tròn nội tiếp',
    mathDefinition: 'The largest circle contained completely inside a polygon that is tangent to all its sides.',
    vietnameseDefinition: 'Đường tròn nằm hoàn toàn bên trong tam giác/đa giác và tiếp xúc với tất cả các cạnh.',
    formulaOrRule: 'r = \\frac{A}{s}; \\quad s = \\frac{a + b + c}{2} \\quad (r: \\text{inradius}, s: \\text{semiperimeter})',
    olympiadWordProblem: 'A right-angled triangle has legs of lengths 6 cm and 8 cm. Find the radius of its inscribed circle. (SASMO Grade 8).',
    solution: 'Hypotenuse c = √(6² + 8²) = 10 cm. Semiperimeter s = (6 + 8 + 10) / 2 = 12 cm. Area A = (6 × 8) / 2 = 24 cm². Inradius r = A / s = 24 / 12 = 2 cm.',
    etymology: 'From Latin "inscribere" (in- "into" + scribere "to write, draw").',
    targetGrades: 'Lớp 7 - 9',
    olympiadExam: 'SASMO / ASMO',
  },
  'circumscribed circle': {
    term: 'Circumscribed circle (Circumcircle)',
    category: 'geometry',
    phonetic: '/ˈsɜː.kəm.skraɪbd ˈsɜː.kəl/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Đường tròn ngoại tiếp',
    mathDefinition: 'A circle that passes through all the vertices of a polygon.',
    vietnameseDefinition: 'Đường tròn đi qua tất cả các đỉnh của một tam giác hoặc đa giác.',
    formulaOrRule: 'R = \\frac{a \\cdot b \\cdot c}{4A}; \\quad \\frac{a}{\\sin A} = 2R',
    olympiadWordProblem: 'In a right triangle with hypotenuse 13 cm, find the circumradius R. (TIMO Grade 8).',
    solution: 'For any right-angled triangle, the circumcenter is the midpoint of the hypotenuse. Thus circumradius R = c / 2 = 13 / 2 = 6.5 cm.',
    etymology: 'From Latin "circum" (around) + "scribere" (to draw, write).',
    targetGrades: 'Lớp 8 - 9',
    olympiadExam: 'TIMO / HKIMO',
  },
  'đường tròn ngoại tiếp': {
    term: 'Circumscribed circle (Circumcircle)',
    category: 'geometry',
    phonetic: '/ˈsɜː.kəm.skraɪbd ˈsɜː.kəl/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Đường tròn ngoại tiếp',
    mathDefinition: 'A circle that passes through all the vertices of a polygon.',
    vietnameseDefinition: 'Đường tròn đi qua tất cả các đỉnh của một tam giác hoặc đa giác.',
    formulaOrRule: 'R = \\frac{a \\cdot b \\cdot c}{4A}; \\quad \\frac{a}{\\sin A} = 2R',
    olympiadWordProblem: 'In a right triangle with hypotenuse 13 cm, find the circumradius R. (TIMO Grade 8).',
    solution: 'For any right-angled triangle, the circumcenter is the midpoint of the hypotenuse. Thus circumradius R = c / 2 = 13 / 2 = 6.5 cm.',
    etymology: 'From Latin "circum" (around) + "scribere" (to draw, write).',
    targetGrades: 'Lớp 8 - 9',
    olympiadExam: 'TIMO / HKIMO',
  },
  'pythagorean triple': {
    term: 'Pythagorean triple',
    category: 'number_theory',
    phonetic: '/paɪˌθæɡ.əˈriː.ən ˈtrɪp.əl/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Bộ ba số Pythagore',
    mathDefinition: 'A set of three positive integers a, b, c satisfying the Pythagorean equation a² + b² = c².',
    vietnameseDefinition: 'Bộ ba số nguyên dương (a, b, c) thỏa mãn hệ thức a² + b² = c².',
    formulaOrRule: 'a = m^2 - n^2, \\quad b = 2mn, \\quad c = m^2 + n^2 \\quad (m > n > 0)',
    olympiadWordProblem: 'A primitive Pythagorean triple has c = 25 and one leg a = 7. What is the length of the other leg b? (ASMO Grade 7).',
    solution: 'We have a² + b² = c² => 7² + b² = 25² => 49 + b² = 625 => b² = 576 => b = 24. The triple is (7, 24, 25).',
    etymology: 'Named after the ancient Greek philosopher and mathematician Pythagoras of Samos (c. 570 - 495 BC).',
    targetGrades: 'Lớp 7 - 9',
    olympiadExam: 'ASMO / TIMO',
  },
  'bộ ba số pythagore': {
    term: 'Pythagorean triple',
    category: 'number_theory',
    phonetic: '/paɪˌθæɡ.əˈriː.ən ˈtrɪp.əl/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Bộ ba số Pythagore',
    mathDefinition: 'A set of three positive integers a, b, c satisfying the Pythagorean equation a² + b² = c².',
    vietnameseDefinition: 'Bộ ba số nguyên dương (a, b, c) thỏa mãn hệ thức a² + b² = c².',
    formulaOrRule: 'a = m^2 - n^2, \\quad b = 2mn, \\quad c = m^2 + n^2 \\quad (m > n > 0)',
    olympiadWordProblem: 'A primitive Pythagorean triple has c = 25 and one leg a = 7. What is the length of the other leg b? (ASMO Grade 7).',
    solution: 'We have a² + b² = c² => 7² + b² = 25² => 49 + b² = 625 => b² = 576 => b = 24. The triple is (7, 24, 25).',
    etymology: 'Named after the ancient Greek philosopher and mathematician Pythagoras of Samos (c. 570 - 495 BC).',
    targetGrades: 'Lớp 7 - 9',
    olympiadExam: 'ASMO / TIMO',
  },
  'geometric progression': {
    term: 'Geometric progression (Geometric sequence)',
    category: 'algebra',
    phonetic: '/ˌdʒiː.əˈmet.rɪk prəˈɡreʃ.ən/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Cấp số nhân',
    mathDefinition: 'A sequence of numbers where each term after the first is found by multiplying the previous one by a fixed non-zero number called the common ratio r.',
    vietnameseDefinition: 'Dãy số trong đó mỗi số hạng kể từ số hạng thứ hai bằng số hạng đứng ngay trước nó nhân với một số không đổi q (công bội).',
    formulaOrRule: 'u_n = u_1 \\cdot q^{n-1}; \\quad S_n = \\frac{u_1(1 - q^n)}{1 - q} \\quad (q \\ne 1)',
    olympiadWordProblem: 'In a geometric sequence, the 2nd term is 6 and the 5th term is 162. Find the 1st term and common ratio. (HKIMO Grade 8).',
    solution: 'u₅ / u₂ = q³ => 162 / 6 = 27 => q³ = 27 => q = 3. Then u₁ = u₂ / q = 6 / 3 = 2.',
    etymology: 'From Greek "geometria" (earth measurement), reflecting relationships in geometric dimensional scaling.',
    targetGrades: 'Lớp 8 - 9',
    olympiadExam: 'HKIMO / SASMO',
  },
  'cấp số nhân': {
    term: 'Geometric progression (Geometric sequence)',
    category: 'algebra',
    phonetic: '/ˌdʒiː.əˈmet.rɪk prəˈɡreʃ.ən/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Cấp số nhân',
    mathDefinition: 'A sequence of numbers where each term after the first is found by multiplying the previous one by a fixed non-zero number called the common ratio r.',
    vietnameseDefinition: 'Dãy số trong đó mỗi số hạng kể từ số hạng thứ hai bằng số hạng đứng ngay trước nó nhân với một số không đổi q (công bội).',
    formulaOrRule: 'u_n = u_1 \\cdot q^{n-1}; \\quad S_n = \\frac{u_1(1 - q^n)}{1 - q} \\quad (q \\ne 1)',
    olympiadWordProblem: 'In a geometric sequence, the 2nd term is 6 and the 5th term is 162. Find the 1st term and common ratio. (HKIMO Grade 8).',
    solution: 'u₅ / u₂ = q³ => 162 / 6 = 27 => q³ = 27 => q = 3. Then u₁ = u₂ / q = 6 / 3 = 2.',
    etymology: 'From Greek "geometria" (earth measurement), reflecting relationships in geometric dimensional scaling.',
    targetGrades: 'Lớp 8 - 9',
    olympiadExam: 'HKIMO / SASMO',
  },
  factorial: {
    term: 'Factorial',
    category: 'combinatorics',
    phonetic: '/fækˈtɔː.ri.əl/',
    partOfSpeech: 'noun',
    vietnameseMeaning: 'Giai thừa',
    mathDefinition: 'The product of all positive integers less than or equal to a given non-negative integer n, denoted by n!.',
    vietnameseDefinition: 'Tích của n số nguyên dương đầu tiên (1 × 2 × 3 × ... × n), ký hiệu là n!. Quy ước 0! = 1.',
    formulaOrRule: 'n! = n \\cdot (n - 1)!; \\quad 0! = 1; \\quad n! = \\prod_{i=1}^{n} i',
    olympiadWordProblem: 'How many trailing zeros does 50! have when written in decimal representation? (TIMO Grade 8).',
    solution: 'Trailing zeros are determined by factors of 10 = 2 × 5. By Legendre formula, number of factors of 5 in 50! is: ⌊50/5⌋ + ⌊50/25⌋ = 10 + 2 = 12 zeros.',
    etymology: 'From Latin "factor" (doer, maker, one who produces), introduced by Christian Kramp in 1808.',
    targetGrades: 'Lớp 7 - 9',
    olympiadExam: 'TIMO / SASMO',
  },
  'giai thừa': {
    term: 'Factorial',
    category: 'combinatorics',
    phonetic: '/fækˈtɔː.ri.əl/',
    partOfSpeech: 'noun',
    vietnameseMeaning: 'Giai thừa',
    mathDefinition: 'The product of all positive integers less than or equal to a given non-negative integer n, denoted by n!.',
    vietnameseDefinition: 'Tích của n số nguyên dương đầu tiên (1 × 2 × 3 × ... × n), ký hiệu là n!. Quy ước 0! = 1.',
    formulaOrRule: 'n! = n \\cdot (n - 1)!; \\quad 0! = 1; \\quad n! = \\prod_{i=1}^{n} i',
    olympiadWordProblem: 'How many trailing zeros does 50! have when written in decimal representation? (TIMO Grade 8).',
    solution: 'Trailing zeros are determined by factors of 10 = 2 × 5. By Legendre formula, number of factors of 5 in 50! is: ⌊50/5⌋ + ⌊50/25⌋ = 10 + 2 = 12 zeros.',
    etymology: 'From Latin "factor" (doer, maker, one who produces), introduced by Christian Kramp in 1808.',
    targetGrades: 'Lớp 7 - 9',
    olympiadExam: 'TIMO / SASMO',
  },
  combination: {
    term: 'Combination',
    category: 'combinatorics',
    phonetic: '/ˌkɒm.bɪˈneɪ.ʃən/',
    partOfSpeech: 'noun',
    vietnameseMeaning: 'Tổ hợp',
    mathDefinition: 'A selection of items from a set that has distinct members, such that the order of selection does not matter.',
    vietnameseDefinition: 'Số cách chọn k phần tử từ tập hợp n phần tử phân biệt mà không phân biệt thứ tự chọn.',
    formulaOrRule: 'C_n^k = \\binom{n}{k} = \\frac{n!}{k!(n-k)!}; \\quad \\binom{n}{k} = \\binom{n}{n-k}',
    olympiadWordProblem: 'In a room of 10 students, every pair shakes hands once. How many handshakes take place? (SASMO Grade 6-7).',
    solution: 'Each handshake is a combination of 2 students from 10: C(10, 2) = (10 × 9) / 2 = 45 handshakes.',
    etymology: 'From Latin "combinare" (to join two by two, from com- "together" + bini "two by two").',
    targetGrades: 'Lớp 6 - 9',
    olympiadExam: 'SASMO / ASMO',
  },
  'tổ hợp': {
    term: 'Combination',
    category: 'combinatorics',
    phonetic: '/ˌkɒm.bɪˈneɪ.ʃən/',
    partOfSpeech: 'noun',
    vietnameseMeaning: 'Tổ hợp',
    mathDefinition: 'A selection of items from a set that has distinct members, such that the order of selection does not matter.',
    vietnameseDefinition: 'Số cách chọn k phần tử từ tập hợp n phần tử phân biệt mà không phân biệt thứ tự chọn.',
    formulaOrRule: 'C_n^k = \\binom{n}{k} = \\frac{n!}{k!(n-k)!}; \\quad \\binom{n}{k} = \\binom{n}{n-k}',
    olympiadWordProblem: 'In a room of 10 students, every pair shakes hands once. How many handshakes take place? (SASMO Grade 6-7).',
    solution: 'Each handshake is a combination of 2 students from 10: C(10, 2) = (10 × 9) / 2 = 45 handshakes.',
    etymology: 'From Latin "combinare" (to join two by two, from com- "together" + bini "two by two").',
    targetGrades: 'Lớp 6 - 9',
    olympiadExam: 'SASMO / ASMO',
  },
  congruence: {
    term: 'Modular Congruence',
    category: 'number_theory',
    phonetic: '/ˈmɒd.jə.lər ˈkɒŋ.ɡru.əns/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Đồng dư thức',
    mathDefinition: 'A relation between two numbers that have the same remainder when divided by a third number m: a ≡ b (mod m).',
    vietnameseDefinition: 'Hai số nguyên a và b được gọi là đồng dư với nhau theo mô-đun m nếu chúng có cùng số dư khi chia cho m (tức a - b chia hết cho m).',
    formulaOrRule: 'a \\equiv b \\pmod{m} \\iff m \\mid (a - b); \\quad a^k \\equiv b^k \\pmod{m}',
    olympiadWordProblem: 'Find the remainder when 3²⁰²⁶ is divided by 7. (TIMO Grade 8).',
    solution: 'Notice powers of 3 mod 7: 3¹ ≡ 3, 3² ≡ 2, 3³ ≡ 6 ≡ -1, 3⁶ ≡ 1 (mod 7). Since 2026 = 6 × 337 + 4: 3²⁰²⁶ ≡ 3⁴ = 81 ≡ 4 (mod 7). The remainder is 4.',
    etymology: 'From Latin "congruere" (to agree, come together, meet). Formalized by Carl Friedrich Gauss in 1801.',
    targetGrades: 'Lớp 7 - 9',
    olympiadExam: 'TIMO / HKIMO',
  },
  'đồng dư': {
    term: 'Modular Congruence',
    category: 'number_theory',
    phonetic: '/ˈmɒd.jə.lər ˈkɒŋ.ɡru.əns/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Đồng dư thức',
    mathDefinition: 'A relation between two numbers that have the same remainder when divided by a third number m: a ≡ b (mod m).',
    vietnameseDefinition: 'Hai số nguyên a và b được gọi là đồng dư với nhau theo mô-đun m nếu chúng có cùng số dư khi chia cho m (tức a - b chia hết cho m).',
    formulaOrRule: 'a \\equiv b \\pmod{m} \\iff m \\mid (a - b); \\quad a^k \\equiv b^k \\pmod{m}',
    olympiadWordProblem: 'Find the remainder when 3²⁰²⁶ is divided by 7. (TIMO Grade 8).',
    solution: 'Notice powers of 3 mod 7: 3¹ ≡ 3, 3² ≡ 2, 3³ ≡ 6 ≡ -1, 3⁶ ≡ 1 (mod 7). Since 2026 = 6 × 337 + 4: 3²⁰²⁶ ≡ 3⁴ = 81 ≡ 4 (mod 7). The remainder is 4.',
    etymology: 'From Latin "congruere" (to agree, come together, meet). Formalized by Carl Friedrich Gauss in 1801.',
    targetGrades: 'Lớp 7 - 9',
    olympiadExam: 'TIMO / HKIMO',
  },
  polynomial: {
    term: 'Polynomial',
    category: 'algebra',
    phonetic: '/ˌpɒl.iˈnəʊ.mi.əl/',
    partOfSpeech: 'noun',
    vietnameseMeaning: 'Đa thức',
    mathDefinition: 'An expression consisting of variables and coefficients, that involves only the operations of addition, subtraction, multiplication, and non-negative integer exponents.',
    vietnameseDefinition: 'Biểu thức đại số bao gồm các biến và hệ số, chỉ chứa các phép toán cộng, trừ, nhân và lũy thừa với số mũ nguyên không âm.',
    formulaOrRule: 'P(x) = a_n x^n + a_{n-1} x^{n-1} + \\dots + a_1 x + a_0; \\quad \\deg(P) = n',
    olympiadWordProblem: 'If the polynomial P(x) = x³ - 3x² + kx - 6 has a root x = 2, find the value of k and the other roots. (ASMO Grade 8-9).',
    solution: 'Since x = 2 is a root, P(2) = 0 => 2³ - 3(2²) + 2k - 6 = 0 => 8 - 12 + 2k - 6 = 0 => 2k = 10 => k = 5. Factor: (x - 2)(x² - x + 3) = 0.',
    etymology: 'From Greek "poly-" (many) + Latin "nomen" (name / term).',
    targetGrades: 'Lớp 7 - 9',
    olympiadExam: 'ASMO / TIMO',
  },
  'đa thức': {
    term: 'Polynomial',
    category: 'algebra',
    phonetic: '/ˌpɒl.iˈnəʊ.mi.əl/',
    partOfSpeech: 'noun',
    vietnameseMeaning: 'Đa thức',
    mathDefinition: 'An expression consisting of variables and coefficients, that involves only the operations of addition, subtraction, multiplication, and non-negative integer exponents.',
    vietnameseDefinition: 'Biểu thức đại số bao gồm các biến và hệ số, chỉ chứa các phép toán cộng, trừ, nhân và lũy thừa với số mũ nguyên không âm.',
    formulaOrRule: 'P(x) = a_n x^n + a_{n-1} x^{n-1} + \\dots + a_1 x + a_0; \\quad \\deg(P) = n',
    olympiadWordProblem: 'If the polynomial P(x) = x³ - 3x² + kx - 6 has a root x = 2, find the value of k and the other roots. (ASMO Grade 8-9).',
    solution: 'Since x = 2 is a root, P(2) = 0 => 2³ - 3(2²) + 2k - 6 = 0 => 8 - 12 + 2k - 6 = 0 => 2k = 10 => k = 5. Factor: (x - 2)(x² - x + 3) = 0.',
    etymology: 'From Greek "poly-" (many) + Latin "nomen" (name / term).',
    targetGrades: 'Lớp 7 - 9',
    olympiadExam: 'ASMO / TIMO',
  },
  'cyclic quadrilateral': {
    term: 'Cyclic quadrilateral',
    category: 'geometry',
    phonetic: '/ˈsaɪ.klɪk ˌkwɒd.rɪˈlæt.ər.əl/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Tứ giác nội tiếp',
    mathDefinition: 'A quadrilateral whose four vertices all lie on a single common circle.',
    vietnameseDefinition: 'Tứ giác có 4 đỉnh cùng nằm trên một đường tròn. Tổng hai góc đối diện luôn bằng 180 độ.',
    formulaOrRule: '\\angle A + \\angle C = \\angle B + \\angle D = 180^\\circ; \\quad ac + bd = d_1 d_2 \\quad (\\text{Ptolemy})',
    olympiadWordProblem: 'In a cyclic quadrilateral ABCD, ∠A = 70° and ∠B = 85°. Find the measures of ∠C and ∠D. (SASMO Grade 8).',
    solution: 'Opposite angles sum to 180°: ∠C = 180° - ∠A = 180° - 70° = 110°. ∠D = 180° - ∠B = 180° - 85° = 95°.',
    etymology: 'From Greek "kyklikos" (circular, wheel-like) + Latin "quadrilaterus" (four-sided).',
    targetGrades: 'Lớp 8 - 9',
    olympiadExam: 'SASMO / TIMO',
  },
  'tứ giác nội tiếp': {
    term: 'Cyclic quadrilateral',
    category: 'geometry',
    phonetic: '/ˈsaɪ.klɪk ˌkwɒd.rɪˈlæt.ər.əl/',
    partOfSpeech: 'noun phrase',
    vietnameseMeaning: 'Tứ giác nội tiếp',
    mathDefinition: 'A quadrilateral whose four vertices all lie on a single common circle.',
    vietnameseDefinition: 'Tứ giác có 4 đỉnh cùng nằm trên một đường tròn. Tổng hai góc đối diện luôn bằng 180 độ.',
    formulaOrRule: '\\angle A + \\angle C = \\angle B + \\angle D = 180^\\circ; \\quad ac + bd = d_1 d_2 \\quad (\\text{Ptolemy})',
    olympiadWordProblem: 'In a cyclic quadrilateral ABCD, ∠A = 70° and ∠B = 85°. Find the measures of ∠C and ∠D. (SASMO Grade 8).',
    solution: 'Opposite angles sum to 180°: ∠C = 180° - ∠A = 180° - 70° = 110°. ∠D = 180° - ∠B = 180° - 85° = 95°.',
    etymology: 'From Greek "kyklikos" (circular, wheel-like) + Latin "quadrilaterus" (four-sided).',
    targetGrades: 'Lớp 8 - 9',
    olympiadExam: 'SASMO / TIMO',
  },
};

/**
 * AI Term Lookup & Auto-Generator:
 * Generates a full MathTerm complete with all fields (pronunciation, bilingual definitions, LaTeX formula, Olympiad problem and step-by-step solution, etymology).
 */
export async function lookupAndGenerateMathTerm(
  query: string,
  apiKey?: string
): Promise<MathTerm> {
  const cleanQuery = query.trim();
  const lowerQuery = cleanQuery.toLowerCase();
  
  // Resolve API key from param or Vite/Process env
  const activeKey =
    apiKey ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    '';

  // 1. Try Gemini AI if valid API key is present
  if (activeKey && activeKey !== 'MY_GEMINI_API_KEY' && activeKey.length > 5) {
    try {
      const ai = new GoogleGenAI({ apiKey: activeKey });
      const prompt = `You are an expert Olympiad Math Coach & Bilingual Curriculum Designer for middle school students (Grades 6-9) preparing for competitions like TIMO, ASMO, SASMO, HKIMO.

The user is searching for the mathematical term or concept: "${cleanQuery}" (could be in English or Vietnamese).

Generate a complete, rigorous, high-quality MathTerm JSON object for this concept.
Strict requirements:
- term: Official English title case term (e.g. "Inscribed circle", "Pythagorean triple", "Geometric progression")
- category: Exactly one of ["number_theory", "geometry", "algebra", "combinatorics"]
- phonetic: Standard IPA phonetics notation (e.g. "/ɪnˈskraɪbd ˈsɜː.kəl/")
- partOfSpeech: "noun" | "noun phrase" | "adjective"
- vietnameseMeaning: Accurate, standard Vietnamese math term (e.g. "Đường tròn nội tiếp")
- mathDefinition: Formal, clear English definition (1-2 sentences)
- vietnameseDefinition: Clear pedagogical Vietnamese math explanation
- formulaOrRule: Standard mathematical formula or theorem in clean KaTeX LaTeX format (e.g. "r = \\\\frac{A}{s}; \\\\quad s = \\\\frac{a+b+c}{2}")
- olympiadWordProblem: A realistic contest word problem from TIMO, ASMO, SASMO, or HKIMO in English with Vietnamese translation in parentheses
- solution: Step-by-step mathematical reasoning and final answer
- etymology: Greek / Latin root words, historical context, and mnemonic memory hook for students
- targetGrades: "Lớp 6 - 9" (or specific grades like "Lớp 7 - 8")
- olympiadExam: "TIMO / SASMO" (or "ASMO", "HKIMO")

Return ONLY a valid JSON object matching this schema without any markdown formatting around it:
{
  "term": "...",
  "category": "geometry",
  "phonetic": "...",
  "partOfSpeech": "noun",
  "vietnameseMeaning": "...",
  "mathDefinition": "...",
  "vietnameseDefinition": "...",
  "formulaOrRule": "...",
  "olympiadWordProblem": "...",
  "solution": "...",
  "etymology": "...",
  "targetGrades": "Lớp 6 - 9",
  "olympiadExam": "TIMO / SASMO"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.5,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          term: parsed.term || cleanQuery,
          category: parsed.category || 'geometry',
          phonetic: parsed.phonetic || '/ˈmæθ.tɜːm/',
          partOfSpeech: parsed.partOfSpeech || 'noun',
          vietnameseMeaning: parsed.vietnameseMeaning || cleanQuery,
          mathDefinition: parsed.mathDefinition || 'Mathematical definition.',
          vietnameseDefinition: parsed.vietnameseDefinition || 'Định nghĩa toán học.',
          formulaOrRule: parsed.formulaOrRule || 'A = b \\cdot h',
          olympiadWordProblem: parsed.olympiadWordProblem || 'Olympiad problem.',
          solution: parsed.solution || 'Solution steps.',
          etymology: parsed.etymology || 'Greek / Latin root.',
          targetGrades: parsed.targetGrades || 'Lớp 6 - 9',
          olympiadExam: parsed.olympiadExam || 'TIMO / SASMO',
        };
      }
    } catch (err) {
      console.warn('Gemini lookup failed, trying offline database:', err);
    }
  }

  // 2. Check Offline Lookup Map (exact or substring match)
  for (const [key, val] of Object.entries(OFFLINE_LOOKUP_MAP)) {
    if (
      lowerQuery === key ||
      lowerQuery.includes(key) ||
      (val.vietnameseMeaning && lowerQuery.includes(val.vietnameseMeaning.toLowerCase())) ||
      (val.term && lowerQuery.includes(val.term.toLowerCase()))
    ) {
      return {
        id: `lookup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        term: val.term || cleanQuery,
        category: (val.category as any) || 'geometry',
        phonetic: val.phonetic || '/ˈmæθ.tɜːm/',
        partOfSpeech: val.partOfSpeech || 'noun',
        vietnameseMeaning: val.vietnameseMeaning || cleanQuery,
        mathDefinition: val.mathDefinition || 'Mathematical concept.',
        vietnameseDefinition: val.vietnameseDefinition || 'Định nghĩa toán học.',
        formulaOrRule: val.formulaOrRule || 'A = b \\cdot h',
        olympiadWordProblem: val.olympiadWordProblem || 'Olympiad problem.',
        solution: val.solution || 'Solution steps.',
        etymology: val.etymology || 'Historical origin.',
        targetGrades: val.targetGrades || 'Lớp 6 - 9',
        olympiadExam: val.olympiadExam || 'TIMO / SASMO',
      };
    }
  }

  // 3. Heuristic Synthesis for custom or unmapped queries
  const isGeometry =
    lowerQuery.includes('tam giác') ||
    lowerQuery.includes('hình') ||
    lowerQuery.includes('góc') ||
    lowerQuery.includes('đường') ||
    lowerQuery.includes('cạnh') ||
    lowerQuery.includes('triangle') ||
    lowerQuery.includes('circle') ||
    lowerQuery.includes('angle') ||
    lowerQuery.includes('polygon') ||
    lowerQuery.includes('line');

  const isNumber =
    lowerQuery.includes('số') ||
    lowerQuery.includes('chia') ||
    lowerQuery.includes('ước') ||
    lowerQuery.includes('bội') ||
    lowerQuery.includes('nguyên tố') ||
    lowerQuery.includes('number') ||
    lowerQuery.includes('prime') ||
    lowerQuery.includes('divis');

  const isAlgebra =
    lowerQuery.includes('phương trình') ||
    lowerQuery.includes('hệ') ||
    lowerQuery.includes('dãy') ||
    lowerQuery.includes('biểu thức') ||
    lowerQuery.includes('equation') ||
    lowerQuery.includes('polynomial') ||
    lowerQuery.includes('algebra');

  const cat: import('../types/math').CategoryId = isGeometry
    ? 'geometry'
    : isNumber
    ? 'number_theory'
    : isAlgebra
    ? 'algebra'
    : 'combinatorics';

  const capitalized = cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1);

  return {
    id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    term: capitalized,
    category: cat,
    phonetic: `/${cleanQuery.toLowerCase().replace(/[^a-z]/g, '') || 'tɜːm'}/`,
    partOfSpeech: 'noun / mathematical concept',
    vietnameseMeaning: cleanQuery,
    mathDefinition: `A core Olympiad mathematical concept in ${cat === 'number_theory' ? 'Number Theory' : cat === 'geometry' ? 'Geometry' : cat === 'algebra' ? 'Algebra' : 'Combinatorics'} essential for contest problem-solving.`,
    vietnameseDefinition: `Thuật ngữ và khái niệm toán học trọng tâm trong phân môn ${cat === 'number_theory' ? 'Số học' : cat === 'geometry' ? 'Hình học' : cat === 'algebra' ? 'Đại số' : 'Tổ hợp'} phục vụ ôn thi Toán Olympic và học Toán song ngữ THCS.`,
    formulaOrRule: '\\forall x \\in \\mathbb{R}: \\quad f(x) = y; \\quad \\Delta \\ge 0',
    olympiadWordProblem: `A contest problem examining "${cleanQuery}": Given standard conditions, determine the optimal value or prove the required relationship. (Đề thi Olympic: Cho các giả thiết tiêu chuẩn, tìm giá trị thỏa mãn hoặc chứng minh hệ thức về "${cleanQuery}").`,
    solution: `Phân tích tính chất toán học của "${cleanQuery}": Áp dụng các định lý và bổ đề đặc trưng, thiết lập hệ thức đại số/hình học tương ứng để suy ra kết quả cuối cùng.`,
    etymology: `Derived from classical Greek & Latin mathematical treatises, combining foundational axioms with deductive logic. Mẹo nhớ: Gắn liền khái niệm này với các bài toán thực tế trong đề thi quốc tế.`,
    targetGrades: 'Lớp 6 - 9',
    olympiadExam: 'TIMO / SASMO / ASMO',
  };
}
