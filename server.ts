import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

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
