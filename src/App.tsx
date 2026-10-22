/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MathTerm, CardProgressMap, LearningStats } from './types/math';
import { INITIAL_TERMS } from './data/mathVocabData';
import { Navbar } from './components/Navbar';
import { FlashcardTab } from './components/FlashcardTab';
import { TermLookupTab } from './components/TermLookupTab';
import { AiCopilotTab } from './components/AiCopilotTab';
import { VocabLibraryTab } from './components/VocabLibraryTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import {
  loadAppData,
  saveAppData,
  updateCardProgress,
  DEFAULT_STATS,
} from './utils/storage';
import { calculateNextState, isCardDue, getTodayString } from './utils/sm2';

import { User } from 'firebase/auth';
import {
  auth,
  onAuthStateChanged,
  saveUserDataToFirestore,
  loadUserDataFromFirestore,
  subscribeToUserData,
  SyncedUserData,
} from './utils/firebase';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'flashcard' | 'lookup' | 'ai' | 'library' | 'analytics'>('flashcard');
  const [theme, setTheme] = useState<'paper' | 'night'>('paper'); // Default to Eye-Care Warm Paper mode
  const [customTerms, setCustomTerms] = useState<MathTerm[]>([]);
  const [cardProgress, setCardProgress] = useState<CardProgressMap>({});
  const [stats, setStats] = useState<LearningStats>(DEFAULT_STATS);
  const [apiKey, setApiKey] = useState<string>('');
  const [aiFocusTerm, setAiFocusTerm] = useState<MathTerm | null>(null);

  // User authentication & cross-device sync state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('offline');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Load local data on mount
  const refreshStorageData = useCallback(() => {
    const data = loadAppData();
    setCustomTerms(data.customTerms || []);
    setCardProgress(data.cardProgress || {});
    setStats(data.stats || DEFAULT_STATS);
    setApiKey(data.apiKey || '');
  }, []);

  useEffect(() => {
    refreshStorageData();
  }, [refreshStorageData]);

  // Firebase Auth listener and automatic cross-device sync
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        setSyncStatus('syncing');
        try {
          const remoteData = await loadUserDataFromFirestore(user.uid);
          const localData = loadAppData();

          if (remoteData) {
            // Merge remote and local data intelligently: prioritize most up-to-date learning progress
            const mergedCardProgress: CardProgressMap = {
              ...localData.cardProgress,
              ...remoteData.cardProgress,
            };

            // Merge custom terms deduplicating by ID
            const termIdMap = new Map<string, MathTerm>();
            (remoteData.customTerms || []).forEach((t) => termIdMap.set(t.id, t));
            (localData.customTerms || []).forEach((t) => {
              if (!termIdMap.has(t.id)) termIdMap.set(t.id, t);
            });
            const mergedTerms = Array.from(termIdMap.values());

            // Merge stats
            const mergedStats: LearningStats = {
              totalReviews: Math.max(localData.stats?.totalReviews || 0, remoteData.stats?.totalReviews || 0),
              streakDays: Math.max(localData.stats?.streakDays || 1, remoteData.stats?.streakDays || 1),
              lastStudyDate: remoteData.stats?.lastStudyDate || localData.stats?.lastStudyDate || getTodayString(),
              createdDate: localData.stats?.createdDate || remoteData.stats?.createdDate || getTodayString(),
            };

            const targetTheme = remoteData.theme || theme;

            // Save merged state to localStorage
            saveAppData({
              version: '1.0.0',
              customTerms: mergedTerms,
              cardProgress: mergedCardProgress,
              stats: mergedStats,
              apiKey: localData.apiKey,
            });

            setCardProgress(mergedCardProgress);
            setCustomTerms(mergedTerms);
            setStats(mergedStats);
            if (targetTheme === 'paper' || targetTheme === 'night') {
              setTheme(targetTheme);
            }

            // Also ensure cloud has merged data
            await saveUserDataToFirestore(
              user.uid,
              {
                cardProgress: mergedCardProgress,
                customTerms: mergedTerms,
                stats: mergedStats,
                theme: targetTheme,
              },
              user
            );

            setSyncStatus('synced');
            setLastSyncTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
          } else {
            // First time login: upload local learning history to cloud
            await saveUserDataToFirestore(
              user.uid,
              {
                cardProgress: localData.cardProgress,
                customTerms: localData.customTerms,
                stats: localData.stats,
                theme,
              },
              user
            );
            setSyncStatus('synced');
            setLastSyncTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
          }

          // Subscribe to real-time changes made from other devices/tabs
          unsubscribeSnapshot = subscribeToUserData(user.uid, (cloudData: SyncedUserData) => {
            if (cloudData) {
              setCardProgress(cloudData.cardProgress || {});
              setCustomTerms(cloudData.customTerms || []);
              setStats(cloudData.stats || DEFAULT_STATS);
              if (cloudData.theme) setTheme(cloudData.theme);
              saveAppData({
                version: '1.0.0',
                customTerms: cloudData.customTerms || [],
                cardProgress: cloudData.cardProgress || {},
                stats: cloudData.stats || DEFAULT_STATS,
                apiKey: loadAppData().apiKey,
              });
              setSyncStatus('synced');
              setLastSyncTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
            }
          });
        } catch (err) {
          console.warn('Sync error:', err);
          setSyncStatus('error');
        }
      } else {
        setSyncStatus('offline');
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Combined terms list
  const allTerms = useMemo(() => {
    return [...INITIAL_TERMS, ...customTerms];
  }, [customTerms]);

  // Due cards count for today
  const today = getTodayString();
  const dueCount = useMemo(() => {
    return allTerms.filter((term) => isCardDue(cardProgress[term.id], today)).length;
  }, [allTerms, cardProgress, today]);

  // Review card with SM-2 logic
  const handleReviewCard = useCallback(
    (wordId: string, quality: 1 | 2 | 3 | 4) => {
      const current = cardProgress[wordId];
      const nextProgress = calculateNextState(current, quality, today);
      const updatedStorage = updateCardProgress(wordId, nextProgress);

      setCardProgress({ ...updatedStorage.cardProgress });
      setStats({ ...updatedStorage.stats });

      // Automatically sync to cloud if logged in
      if (currentUser) {
        setSyncStatus('syncing');
        saveUserDataToFirestore(
          currentUser.uid,
          {
            cardProgress: updatedStorage.cardProgress,
            customTerms,
            stats: updatedStorage.stats,
            theme,
          },
          currentUser
        )
          .then(() => {
            setSyncStatus('synced');
            setLastSyncTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
          })
          .catch((err) => {
            console.warn('Background sync warning:', err);
            setSyncStatus('error');
          });
      }
    },
    [cardProgress, today, currentUser, customTerms, theme]
  );

  // Add custom term
  const handleAddCustomTerm = useCallback(
    (newTerm: MathTerm) => {
      const data = loadAppData();
      const updatedCustom = [newTerm, ...data.customTerms];
      data.customTerms = updatedCustom;
      saveAppData(data);
      setCustomTerms(updatedCustom);

      // Automatically sync to cloud if logged in
      if (currentUser) {
        setSyncStatus('syncing');
        saveUserDataToFirestore(
          currentUser.uid,
          {
            cardProgress,
            customTerms: updatedCustom,
            stats,
            theme,
          },
          currentUser
        )
          .then(() => {
            setSyncStatus('synced');
            setLastSyncTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
          })
          .catch((err) => {
            console.warn('Background sync warning:', err);
            setSyncStatus('error');
          });
      }
    },
    [cardProgress, stats, theme, currentUser]
  );

  // Open in AI Copilot
  const handleOpenAiForTerm = useCallback((term: MathTerm) => {
    setAiFocusTerm(term);
    setActiveTab('ai');
  }, []);

  // Save API key
  const handleSaveApiKey = useCallback((newKey: string) => {
    const data = loadAppData();
    data.apiKey = newKey;
    saveAppData(data);
    setApiKey(newKey);
  }, []);

  // Reset progress
  const handleResetProgress = useCallback(() => {
    const fresh = {
      version: '1.0.0',
      customTerms: [],
      cardProgress: {},
      stats: DEFAULT_STATS,
      apiKey: '',
    };
    saveAppData(fresh);
    refreshStorageData();
    if (currentUser) {
      saveUserDataToFirestore(currentUser.uid, {
        cardProgress: {},
        customTerms: [],
        stats: DEFAULT_STATS,
        theme,
      }, currentUser).catch(() => {});
    }
  }, [refreshStorageData, currentUser, theme]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'paper' ? 'night' : 'paper';
    setTheme(nextTheme);
    if (currentUser) {
      saveUserDataToFirestore(
        currentUser.uid,
        {
          cardProgress,
          customTerms,
          stats,
          theme: nextTheme,
        },
        currentUser
      ).catch(() => {});
    }
  };

  const handleManualSync = useCallback(async () => {
    if (!currentUser) return;
    setSyncStatus('syncing');
    await saveUserDataToFirestore(
      currentUser.uid,
      {
        cardProgress,
        customTerms,
        stats,
        theme,
      },
      currentUser
    );
    setSyncStatus('synced');
    setLastSyncTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
  }, [currentUser, cardProgress, customTerms, stats, theme]);

  const isPaper = theme === 'paper';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isPaper
          ? 'bg-[#faf7f2] text-slate-800 selection:bg-amber-200 selection:text-slate-900'
          : 'bg-[#0f141f] text-slate-100 selection:bg-indigo-500/30 selection:text-white'
      }`}
    >
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dueCount={dueCount}
        streakDays={stats.streakDays || 1}
        totalCards={allTerms.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        syncStatus={syncStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'flashcard' && (
          <FlashcardTab
            terms={allTerms}
            cardProgress={cardProgress}
            onReviewCard={handleReviewCard}
            onOpenAiForTerm={handleOpenAiForTerm}
            theme={theme}
          />
        )}

        {activeTab === 'lookup' && (
          <TermLookupTab
            existingTerms={allTerms}
            onAddTerm={handleAddCustomTerm}
            onNavigateToFlashcards={(termId) => {
              setActiveTab('flashcard');
            }}
            savedApiKey={apiKey}
            onSaveApiKey={handleSaveApiKey}
            theme={theme}
          />
        )}

        {activeTab === 'ai' && (
          <AiCopilotTab
            terms={allTerms}
            initialTerm={aiFocusTerm}
            savedApiKey={apiKey}
            onSaveApiKey={handleSaveApiKey}
            theme={theme}
          />
        )}

        {activeTab === 'library' && (
          <VocabLibraryTab
            terms={allTerms}
            cardProgress={cardProgress}
            onAddCustomTerm={handleAddCustomTerm}
            onSelectForAi={handleOpenAiForTerm}
            theme={theme}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            terms={allTerms}
            cardProgress={cardProgress}
            stats={stats}
            onDataImported={refreshStorageData}
            onResetProgress={handleResetProgress}
            theme={theme}
          />
        )}
      </main>

      {/* Academic Footer */}
      <footer
        className={`border-t py-6 px-4 text-xs text-center transition-colors ${
          isPaper
            ? 'border-[#e8e4dc] bg-[#f8f5ee] text-slate-500'
            : 'border-slate-900 bg-[#0c101a] text-slate-500'
        }`}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`font-academic-serif font-bold ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
              Math M32
            </span>
            <span>·</span>
            <span>Spaced Repetition SM-2</span>
            <span>·</span>
            <span className={isPaper ? 'text-slate-600' : 'text-slate-400'}>TIMO / ASMO / SASMO / HKIMO</span>
          </div>
          <div className={`flex items-center gap-2 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Toán Song Ngữ THCS Lớp 6 - 9</span>
            <span>·</span>
            <span>Chế độ bảo vệ thị lực học sinh</span>
          </div>
        </div>
      </footer>

      {/* Personalized Cross-Device Authentication & Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        theme={theme}
        syncStatus={syncStatus}
        lastSyncTime={lastSyncTime}
        onManualSync={handleManualSync}
        cardCount={allTerms.length}
      />
    </div>
  );
}
