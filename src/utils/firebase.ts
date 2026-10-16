import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CardProgressMap, LearningStats, MathTerm } from '../types/math';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore with specific database ID if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Boot connection verification as mandated by skill guidelines
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is currently offline or unreachable.');
    }
  }
}
testConnection();

export interface SyncedUserData {
  userId: string;
  email: string;
  displayName?: string;
  cardProgress: CardProgressMap;
  customTerms: MathTerm[];
  stats: LearningStats;
  theme?: 'paper' | 'night';
  updatedAt: string;
}

/**
 * Save user learning progress and custom flashcards to Firestore for multi-device sync
 */
export async function saveUserDataToFirestore(
  userId: string,
  data: {
    cardProgress: CardProgressMap;
    customTerms: MathTerm[];
    stats: LearningStats;
    theme?: 'paper' | 'night';
  },
  user?: User | null
): Promise<void> {
  if (!userId) return;

  const userDocRef = doc(db, 'users', userId);
  const payload: SyncedUserData = {
    userId,
    email: user?.email || '',
    displayName: user?.displayName || user?.email?.split('@')[0] || 'Học viên Math M32',
    cardProgress: data.cardProgress || {},
    customTerms: data.customTerms || [],
    stats: data.stats,
    theme: data.theme || 'paper',
    updatedAt: new Date().toISOString(),
  };

  await setDoc(userDocRef, payload, { merge: true });
}

/**
 * Fetch remote user progress from Firestore
 */
export async function loadUserDataFromFirestore(userId: string): Promise<SyncedUserData | null> {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as SyncedUserData;
    }
    return null;
  } catch (err) {
    console.warn('Failed to load user data from Firestore:', err);
    return null;
  }
}

/**
 * Subscribe to real-time changes on user's cloud data for multi-device instant sync
 */
export function subscribeToUserData(
  userId: string,
  onData: (data: SyncedUserData) => void
): () => void {
  const userDocRef = doc(db, 'users', userId);
  return onSnapshot(
    userDocRef,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as SyncedUserData);
      }
    },
    (err) => {
      console.warn('Firestore subscription warning:', err);
    }
  );
}

/**
 * User Authentication Handlers
 */
export async function loginWithGoogleAccount(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName?.trim()) {
    try {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    } catch {
      // Non-blocking displayName update
    }
  }
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Friendly Vietnamese error messages for Firebase Auth errors
 */
export function getFriendlyAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Địa chỉ email không đúng định dạng. Vui lòng kiểm tra lại.';
    case 'auth/user-not-found':
      return 'Không tìm thấy tài khoản với email này. Bạn có thể chọn "Đăng ký" tài khoản mới.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Mật khẩu hoặc thông tin đăng nhập không chính xác.';
    case 'auth/email-already-in-use':
      return 'Email này đã được sử dụng. Vui lòng chọn "Đăng nhập" bằng mật khẩu của bạn.';
    case 'auth/weak-password':
      return 'Mật khẩu quá ngắn. Vui lòng đặt mật khẩu tối thiểu 6 ký tự để bảo mật.';
    case 'auth/popup-closed-by-user':
      return 'Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra đường truyền Internet.';
    default:
      return 'Không thể hoàn tất đăng nhập. Vui lòng thử lại sau giây lát.';
  }
}
