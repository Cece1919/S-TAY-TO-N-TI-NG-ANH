import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

const DATA_DIR = path.resolve(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}), 'utf-8');
  }
}

interface UserRecord {
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt: string;
  lastSyncedAt: string;
  appData: any;
}

function getUsers(): Record<string, UserRecord> {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading users file:', err);
    return {};
  }
}

function saveUsers(users: Record<string, UserRecord>) {
  try {
    ensureDataFile();
    const tempFile = `${USERS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), 'utf-8');
    fs.renameSync(tempFile, USERS_FILE);
  } catch (err) {
    console.error('Error saving users file:', err);
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// In-memory token store: token -> { email, expiresAt }
const tokens = new Map<string, { email: string; expiresAt: number }>();

function generateToken(email: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  // Token valid for 60 days
  const expiresAt = Date.now() + 60 * 24 * 60 * 60 * 1000;
  tokens.set(token, { email, expiresAt });
  return token;
}

function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const session = tokens.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    tokens.delete(token);
    return null;
  }
  return session.email;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateWithFallback(client: GoogleGenAI, prompt: string, config?: any) {
  const candidateModels = [
    'gemini-flash-lite-latest',
    'gemini-3-flash-preview',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];
  let lastError: any = null;
  for (const model of candidateModels) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} unavailable (${err?.message || err}), trying alternative model...`);
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Endpoints
  // 1. Register
  app.post('/api/auth/register', (req, res) => {
    try {
      const { email, password, name, initialData } = req.body;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Vui lòng nhập địa chỉ email hợp lệ (ví dụ: name@gmail.com).' });
      }
      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Mật khẩu bảo mật cá nhân phải có ít nhất 6 ký tự.' });
      }

      const cleanEmail = email.toLowerCase().trim();
      const users = getUsers();

      if (users[cleanEmail]) {
        return res.status(400).json({ error: 'Tài khoản này đã tồn tại trên hệ thống. Vui lòng chuyển sang tab Đăng nhập.' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);
      const now = new Date().toISOString();

      const userRecord: UserRecord = {
        email: cleanEmail,
        name: (name && typeof name === 'string' && name.trim()) ? name.trim() : cleanEmail.split('@')[0],
        passwordHash,
        salt,
        createdAt: now,
        lastLoginAt: now,
        lastSyncedAt: now,
        appData: initialData || {
          version: '1.0.0',
          customTerms: [],
          cardProgress: {},
          stats: {
            totalReviews: 0,
            streakDays: 1,
            lastStudyDate: now.split('T')[0],
            createdDate: now.split('T')[0],
          },
        },
      };

      users[cleanEmail] = userRecord;
      saveUsers(users);

      const token = generateToken(cleanEmail);
      return res.json({
        success: true,
        token,
        user: {
          email: userRecord.email,
          name: userRecord.name,
          lastSyncedAt: userRecord.lastSyncedAt,
        },
        appData: userRecord.appData,
      });
    } catch (err: any) {
      console.error('Register error:', err);
      return res.status(500).json({ error: 'Lỗi máy chủ khi đăng ký tài khoản. Vui lòng thử lại.' });
    }
  });

  // 2. Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Vui lòng nhập đầy đủ email và mật khẩu.' });
      }

      const cleanEmail = email.toLowerCase().trim();
      const users = getUsers();
      const user = users[cleanEmail];

      if (!user) {
        return res.status(401).json({ error: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại hoặc chuyển sang tab Đăng ký.' });
      }

      const testHash = hashPassword(password, user.salt);
      if (testHash !== user.passwordHash) {
        return res.status(401).json({ error: 'Mật khẩu không chính xác. Vui lòng thử lại.' });
      }

      const now = new Date().toISOString();
      user.lastLoginAt = now;
      users[cleanEmail] = user;
      saveUsers(users);

      const token = generateToken(cleanEmail);
      return res.json({
        success: true,
        token,
        user: {
          email: user.email,
          name: user.name,
          lastSyncedAt: user.lastSyncedAt,
        },
        appData: user.appData,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Lỗi máy chủ khi đăng nhập. Vui lòng thử lại.' });
    }
  });

  // 3. Current user verify
  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.query.token as string);
    const email = verifyToken(token);
    if (!email) {
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập.' });
    }

    const users = getUsers();
    const user = users[email];
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản.' });
    }

    return res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        lastSyncedAt: user.lastSyncedAt,
      },
      appData: user.appData,
    });
  });

  // 4. Push sync (upload progress from device to cloud)
  app.post('/api/sync/push', (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.body.token;
      const email = verifyToken(token) || req.body.email?.toLowerCase().trim();

      if (!email) {
        return res.status(401).json({ error: 'Cần đăng nhập để đồng bộ dữ liệu.' });
      }

      const { appData } = req.body;
      if (!appData || typeof appData !== 'object') {
        return res.status(400).json({ error: 'Dữ liệu đồng bộ không hợp lệ.' });
      }

      const users = getUsers();
      const user = users[email];
      if (!user) {
        return res.status(404).json({ error: 'Tài khoản không tồn tại trên máy chủ.' });
      }

      const now = new Date().toISOString();
      user.appData = appData;
      user.lastSyncedAt = now;
      users[email] = user;
      saveUsers(users);

      return res.json({
        success: true,
        lastSyncedAt: now,
      });
    } catch (err: any) {
      console.error('Sync push error:', err);
      return res.status(500).json({ error: 'Không thể đồng bộ dữ liệu lên máy chủ.' });
    }
  });

  // 5. Pull sync (download cloud progress to device)
  app.get('/api/sync/pull', (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.query.token as string);
      const email = verifyToken(token) || (req.query.email as string)?.toLowerCase().trim();

      if (!email) {
        return res.status(401).json({ error: 'Cần đăng nhập để lấy dữ liệu đồng bộ.' });
      }

      const users = getUsers();
      const user = users[email];
      if (!user) {
        return res.status(404).json({ error: 'Tài khoản không tồn tại.' });
      }

      return res.json({
        success: true,
        appData: user.appData,
        lastSyncedAt: user.lastSyncedAt,
      });
    } catch (err: any) {
      console.error('Sync pull error:', err);
      return res.status(500).json({ error: 'Không thể tải dữ liệu từ máy chủ.' });
    }
  });

  // 6. Natural Human Text-to-Speech (Gemini TTS)
  app.post('/api/ai/tts', async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required for TTS' });
      }

      const client = getGeminiClient();
      if (!client) {
        return res.status(503).json({ error: 'Gemini API not configured on server' });
      }

      const cleanText = text.slice(0, 600);
      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: 'Clear, natural, articulate academic English teacher with warm educational cadence',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = Buffer.from(base64Audio, 'base64');
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(audioBuffer);
      }

      return res.status(500).json({ error: 'No audio returned from Gemini TTS' });
    } catch (err: any) {
      console.warn('TTS generation warning:', err?.message || err);
      return res.status(500).json({ error: 'Failed to generate TTS audio', details: err?.message });
    }
  });

  // 7. AI Online Tutor Chat (Math M32 Copilot)
  app.post('/api/ai/ask-tutor', async (req, res) => {
    try {
      const { question, currentTerm } = req.body;
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'Vui lòng cung cấp câu hỏi' });
      }

      const client = getGeminiClient();
      if (!client) {
        return res.status(503).json({ error: 'Gemini API chưa sẵn sàng trên máy chủ' });
      }

      const prompt = `Bạn là Trợ lý Gia sư Toán Olympic và Tiếng Anh chuyên biệt của Math M32.
Đối tượng học sinh: Học sinh THCS (lớp 6-9) tại Việt Nam đang học Toán song ngữ và ôn thi các kỳ thi toán quốc tế (TIMO, ASMO, SASMO, HKIMO, AMC).

Yêu cầu giải đáp:
1. Độ chính xác khoa học tuyệt đối: Định nghĩa, ký hiệu toán học, công thức và suy luận phải chuẩn xác theo chuẩn Olympic quốc tế.
2. Sư phạm & Khơi gợi tư duy: Không chỉ đưa ra kết quả, hãy phân tích bản chất bài toán, hướng dẫn phương pháp suy luận từng bước (phản chứng, nguyên lý Dirichlet, tính chẵn lẻ, biến đổi đại số, bất đẳng thức, hình học trực quan...).
3. Song ngữ Anh - Việt: Kèm theo các thuật ngữ toán tiếng Anh tương ứng trong ngoặc đơn (ví dụ: số nguyên tố (prime number), ước chung lớn nhất (greatest common divisor - GCD), tam giác vuông (right triangle), cạnh huyền (hypotenuse)...) để học sinh nắm chắc từ vựng học thuật.
4. Trình bày thân thiện, súc tích (khoảng 150-250 từ), dùng bullet points hoặc các bước rõ ràng.
5. BẮT BUỘC TRÌNH BÀY CÔNG THỨC TOÁN HỌC BẰNG LATEX / MATHTYPE:
- Tất cả công thức, phương trình, phân số, luỹ thừa, căn thức, ký hiệu tập hợp PHẢI được viết bằng mã chuẩn LaTeX kẹp giữa cặp dấu $...$ cho công thức nội dòng (ví dụ: $x^2 + y^2 = z^2$, $\\frac{a}{b}$, $\\sqrt{n}$, $a \\le b$, $n \\in \\mathbb{N}$); và $$\\dots$$ cho công thức khối đặt riêng một dòng.
- Tuyệt đối không viết chữ thô như x/y hay x^2 hay sqrt(n), mà PHẢI viết dạng chuẩn LaTeX như $\\frac{x}{y}$, $x^2$, $\\sqrt{n}$ để hệ thống kết xuất công thức toán học sắc nét, chính xác như MathType.

${currentTerm ? `Chủ đề/Thuật ngữ hiện tại đang học: "${currentTerm.term}" (${currentTerm.vietnameseMeaning}) - Công thức: ${currentTerm.formulaOrRule}` : ''}

Câu hỏi của học sinh:
"${question}"`;

      const response = await generateWithFallback(client, prompt);

      const reply = response.text || 'Trợ lý đã nhận câu hỏi nhưng chưa có phản hồi. Vui lòng thử lại.';
      return res.json({ success: true, reply });
    } catch (err: any) {
      console.error('AI Tutor chat error:', err);
      return res.status(500).json({ error: 'Lỗi khi kết nối với AI online', details: err?.message });
    }
  });

  // 8. AI Olympiad Problem Generator
  app.post('/api/ai/generate-problem', async (req, res) => {
    try {
      const { term, exam } = req.body;
      if (!term) {
        return res.status(400).json({ error: 'Term information required' });
      }

      const client = getGeminiClient();
      if (!client) {
        return res.status(503).json({ error: 'Gemini API not configured' });
      }

      const customExam = exam || 'TIMO / SASMO';
      const prompt = `You are a Senior Olympiad Math Coach preparing problems for middle school students (Grades 6-9) for competitions like ${customExam}.
Create a high-quality, authentic math contest word problem focusing on the concept: "${term.term}" (${term.vietnameseMeaning}).

MANDATORY MATH FORMULA FORMATTING (LaTeX / MathType):
All mathematical formulas, fractions, powers, roots, equations, and expressions in problemEn, problemVi, hints, solutionSteps, and finalAnswer MUST be formatted in LaTeX enclosed with $...$ (or $$...$$ for block display). E.g. $\\frac{a}{b}$, $x^2 + y^2 = r^2$, $\\sqrt{n}$, $\\angle ABC = 90^\\circ$.

Return ONLY a valid JSON object strictly matching this schema:
{
  "title": "Short catchy title in Vietnamese",
  "olympiadExam": "${customExam} Grade 6-8",
  "gradeLevel": "Lớp 6-8",
  "problemEn": "The full Olympiad problem statement in clear academic English with $...$ LaTeX math",
  "problemVi": "Bản dịch tiếng Việt chính xác và sư phạm của bài toán kèm công thức LaTeX $...$",
  "hints": ["Gợi ý 1 bằng tiếng Việt kèm công thức $...$", "Gợi ý 2 bằng tiếng Việt"],
  "solutionSteps": ["Bước 1 lời giải chi tiết kèm công thức $...$", "Bước 2 lời giải chi tiết kèm công thức $...$", "Bước 3 kết luận"],
  "finalAnswer": "Đáp số cuối cùng dạng LaTeX chuẩn $...$"
}`;

      const response = await generateWithFallback(client, prompt, {
        responseMimeType: 'application/json',
        temperature: 0.7,
      });

      if (response.text) {
        const problem = JSON.parse(response.text);
        return res.json({ success: true, problem });
      }

      return res.status(500).json({ error: 'No data returned from AI' });
    } catch (err: any) {
      console.error('Problem generation error:', err);
      return res.status(500).json({ error: 'Lỗi khi tạo đề bài với AI', details: err?.message });
    }
  });

  // 9. AI Term Lookup & Synthesis
  app.post('/api/ai/lookup-term', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Vui lòng cung cấp thuật ngữ cần tra cứu' });
      }

      const client = getGeminiClient();
      if (!client) {
        return res.status(503).json({ error: 'Gemini API not configured' });
      }

      const prompt = `You are an expert Olympiad Math Coach & Bilingual Curriculum Designer for middle school students (Grades 6-9) preparing for competitions like TIMO, ASMO, SASMO, HKIMO.

The user is searching for the mathematical term or concept: "${query}" (could be in English or Vietnamese).

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

      const response = await generateWithFallback(client, prompt, {
        responseMimeType: 'application/json',
        temperature: 0.5,
      });

      if (response.text) {
        const termData = JSON.parse(response.text);
        return res.json({ success: true, term: termData });
      }

      return res.status(500).json({ error: 'No data returned from AI' });
    } catch (err: any) {
      console.error('Term lookup error:', err);
      return res.status(500).json({ error: 'Lỗi khi tra cứu thuật ngữ với AI', details: err?.message });
    }
  });

  // Vite middleware in dev, static files in prod
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Math M32 server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
