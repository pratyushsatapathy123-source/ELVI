import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from '../lib/firebase';
import { getTodayIso, formatFullDate, parseIsoToDate, DEFAULT_TIMEZONE } from '../lib/dateUtils';
import { computeCycleStatistics, CycleStatistics } from '../services/cycleAnalytics';
import { analyzeLongitudinalPatterns } from '../services/patternAnalysisEngine';
import {
  ScreenId,
  PeriodRecord,
  CheckInRecord,
  TimelineEntry,
  ChatMessage,
  ReminderItem,
  ConsultationQuestion,
  CareNote,
  GeneratedReportItem,
  FullReportData,
  AiMemory,
  LatencyMetrics,
} from '../types/elvi';

export const DEMO_UID = 'elvi_demo_fixture_v1';

interface ElviContextValue {
  activeScreen: ScreenId;
  navigateTo: (screen: ScreenId) => void;
  isPeriodModalOpen: boolean;
  openPeriodModal: () => void;
  closePeriodModal: () => void;
  editingPeriod: PeriodRecord | null;
  setEditingPeriod: (p: PeriodRecord | null) => void;
  infoModal: 'safeguards' | 'dignity' | null;
  setInfoModal: (modal: 'safeguards' | 'dignity' | null) => void;

  // Runtime Date & Timezone
  todayIso: string;
  timeZone: string;
  setTimeZone: (tz: string) => void;

  // Auth, Email Verification & First-Login Onboarding
  currentUser: User | null;
  isAuthReady: boolean;
  isEmailVerified: boolean;
  markEmailVerified: () => void;
  isOnboardingCompleted: boolean;
  completeOnboarding: (
    pcosResponse: 'yes' | 'no',
    initialReport?: { fileName: string; base64Data: string; mimeType: string }
  ) => Promise<void>;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  activeUid: string | null;
  signInGoogle: () => Promise<void>;
  signOutApp: () => Promise<void>;

  // Cycle & Period Data
  periods: PeriodRecord[];
  addPeriodRecord: (record: Omit<PeriodRecord, 'id'>) => Promise<void>;
  updatePeriodRecord: (id: string, updates: Partial<PeriodRecord>) => Promise<void>;
  deletePeriodRecord: (id: string) => Promise<void>;
  cycleStats: CycleStatistics;
  calculatedCycleLength: number | null;
  calculatedPeriodDuration: number | null;

  // Check-ins
  checkIns: CheckInRecord[];
  saveCheckIn: (record: Omit<CheckInRecord, 'id' | 'date' | 'timestamp'> & { date?: string }) => Promise<void>;
  todayCheckedIn: boolean;

  // Timeline & Insights
  timelineEntries: TimelineEntry[];
  handleTimelineProposal: (entryId: string, action: 'confirmed' | 'dismissed') => Promise<void>;
  dismissTimelineInsight: (id: string) => void;
  toggleReviewTimelineInsight: (id: string) => void;
  reviewedInsightIds: string[];
  dismissedInsightIds: string[];

  // AI Companion & Health Memory
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  streamingAssistantText: string | null;
  lastLatencyMetrics: LatencyMetrics | null;
  sendMessage: (text: string) => Promise<void>;
  startNewConversation: () => void;
  handleChatProposal: (msgId: string, action: 'confirmed' | 'discarded') => Promise<void>;
  companionLanguage: 'English' | 'हिन्दी' | 'ଓଡ଼ିଆ';
  setCompanionLanguage: (lang: 'English' | 'हिन्दी' | 'ଓଡ଼ିଆ') => void;
  aiMemories: AiMemory[];
  clearMemories: () => Promise<void>;
  deleteMemoryItem: (id: string) => Promise<void>;
  newMemoryNotice: string | null;
  clearMemoryNotice: () => void;

  // PCOS / PCOD Care
  pcosStatus: 'confirmed' | 'monitoring' | 'unsure';
  setPcosStatus: (status: 'confirmed' | 'monitoring' | 'unsure') => void;
  weightMonitoringOptIn: boolean;
  setWeightMonitoringOptIn: (val: boolean) => void;
  consultationQuestions: ConsultationQuestion[];
  addConsultationQuestion: (text: string) => void;
  removeConsultationQuestion: (id: string) => void;
  careNotes: CareNote[];
  addCareNote: (quote: string, context: string) => void;

  // Reports
  reportList: GeneratedReportItem[];
  isSynthesizingReport: boolean;
  generateNewReport: (
    periodLabel: string,
    sourcesCount: number,
    selectedSourcesMap?: Record<string, boolean>
  ) => Promise<GeneratedReportItem>;
  uploadClinicalDocument: (fileName: string, base64Data?: string, mimeType?: string) => Promise<void>;

  // Reminders
  reminders: ReminderItem[];
  toggleReminder: (id: string) => Promise<void>;
  addReminder: (item: Omit<ReminderItem, 'id'>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  discreetMode: boolean;
  setDiscreetMode: (val: boolean) => void;
  quietHoursLabel: string;
  setQuietHoursLabel: (val: string) => void;

  // Settings & Profile
  userProfile: {
    name: string;
    email: string;
    initials: string;
    planLabel: string;
  };
  updateUserProfile: (name: string, email: string) => Promise<void>;
  comfortableReading: boolean;
  setComfortableReading: (val: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (val: boolean) => void;
  enableMemory: boolean;
  setEnableMemory: (val: boolean) => void;
  contextPermissions: {
    cycleAndSymptoms: boolean;
    nourishmentAndLifestyle: boolean;
    clinicalDocuments: boolean;
  };
  toggleContextPermission: (key: 'cycleAndSymptoms' | 'nourishmentAndLifestyle' | 'clinicalDocuments') => void;
  reportGenerationManualReview: boolean;
  setReportGenerationManualReview: (val: boolean) => void;
}

const VALID_SCREENS: ScreenId[] = [
  'today',
  'cycle-tracker',
  'daily-check-in',
  'health-timeline',
  'ai-companion',
  'pcos-care',
  'reports',
  'reminders',
  'settings',
  'auth',
  'onboarding',
];

const ElviContext = createContext<ElviContextValue | undefined>(undefined);

function getScreenFromHash(): ScreenId {
  if (typeof window === 'undefined') return 'today';
  const raw = window.location.hash.replace(/^#\/?/, '').trim() as ScreenId;
  return VALID_SCREENS.includes(raw) ? raw : 'today';
}

export const ElviProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ScreenId>(getScreenFromHash);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PeriodRecord | null>(null);
  const [infoModal, setInfoModal] = useState<'safeguards' | 'dignity' | null>(null);

  // Timezone and dynamic date
  const [timeZone, setTimeZone] = useState<string>(DEFAULT_TIMEZONE);
  const [todayIso, setTodayIso] = useState<string>(() => getTodayIso(timeZone));

  // Authentication, Verification & Onboarding
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(true);

  const isEmailVerified = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.emailVerified) return true;
    if (currentUser.providerData.some((p) => p.providerId === 'google.com')) return true;
    if (typeof window !== 'undefined' && localStorage.getItem(`elvi_verified_${currentUser.uid}`) === 'true') {
      return true;
    }
    return false;
  }, [currentUser]);

  const markEmailVerified = () => {
    if (currentUser) {
      localStorage.setItem(`elvi_verified_${currentUser.uid}`, 'true');
      setCurrentUser({ ...currentUser, emailVerified: true } as User);
    }
  };

  // Core Data
  const [periods, setPeriods] = useState<PeriodRecord[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [rawStoredTimeline, setRawStoredTimeline] = useState<TimelineEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'elvi',
      title: 'Welcome to ELVI.',
      paragraphs: [
        'I am your calm, clinical-grade companion for menstrual and hormonal health.',
        'Everything you share remains private and consent-governed. I never diagnose conditions or prescribe medications, and any extracted observations are kept as unconfirmed drafts until you explicitly approve them.',
      ],
      timestamp: 'Just now',
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [streamingAssistantText, setStreamingAssistantText] = useState<string | null>(null);
  const [lastLatencyMetrics, setLastLatencyMetrics] = useState<LatencyMetrics | null>(null);
  const [companionLanguage, setCompanionLanguage] = useState<'English' | 'हिन्दी' | 'ଓଡ଼ିଆ'>('English');

  const [aiMemories, setAiMemories] = useState<AiMemory[]>([]);
  const [newMemoryNotice, setNewMemoryNotice] = useState<string | null>(null);

  const [pcosStatus, setPcosStatus] = useState<'confirmed' | 'monitoring' | 'unsure'>('monitoring');
  const [weightMonitoringOptIn, setWeightMonitoringOptIn] = useState(false);
  const [consultationQuestions, setConsultationQuestions] = useState<ConsultationQuestion[]>([
    {
      id: 'q-1',
      numberLabel: '01',
      text: 'Discuss whether fasting insulin panel should be re-evaluated alongside HbA1c to assess metabolic rhythm.',
    },
    {
      id: 'q-2',
      numberLabel: '02',
      text: 'Review persistent mid-luteal fatigue and ask about potential micronutrient or thyroid screening.',
    },
  ]);
  const [careNotes, setCareNotes] = useState<CareNote[]>([]);

  const [reportList, setReportList] = useState<GeneratedReportItem[]>([]);
  const [isSynthesizingReport, setIsSynthesizingReport] = useState(false);

  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [discreetMode, setDiscreetMode] = useState(true);
  const [quietHoursLabel, setQuietHoursLabel] = useState('10:30 PM to 7:30 AM');

  const [userProfile, setUserProfile] = useState({
    name: 'Member (Guest)',
    email: 'Not signed in',
    initials: 'M',
    planLabel: 'Personal Plan',
  });

  const [comfortableReading, setComfortableReading] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [enableMemory, setEnableMemory] = useState(true);
  const [contextPermissions, setContextPermissions] = useState({
    cycleAndSymptoms: true,
    nourishmentAndLifestyle: true,
    clinicalDocuments: false,
  });
  const [reportGenerationManualReview, setReportGenerationManualReview] = useState(true);

  // Health Insights on Timeline
  const [dismissedInsightIds, setDismissedInsightIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('elvi_dismissed_insights') || '[]');
    } catch {
      return [];
    }
  });

  const [reviewedInsightIds, setReviewedInsightIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('elvi_reviewed_insights') || '[]');
    } catch {
      return [];
    }
  });

  const dismissTimelineInsight = (id: string) => {
    setDismissedInsightIds((prev) => {
      const updated = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem('elvi_dismissed_insights', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleReviewTimelineInsight = (id: string) => {
    setReviewedInsightIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      localStorage.setItem('elvi_reviewed_insights', JSON.stringify(updated));
      return updated;
    });
  };

  // Active target UID: if in demo mode, target DEMO_UID; else if authenticated, target currentUser.uid; else null
  const activeUid = useMemo(() => {
    if (isDemoMode) return DEMO_UID;
    return currentUser ? currentUser.uid : null;
  }, [isDemoMode, currentUser]);

  // Sync activeScreen with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const target = getScreenFromHash();
      setActiveScreen(target);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Update dynamic date on interval or window focus
  useEffect(() => {
    const updateDate = () => {
      const current = getTodayIso(timeZone);
      setTodayIso(current);
    };

    updateDate();
    window.addEventListener('focus', updateDate);
    const interval = setInterval(updateDate, 60000); // Check every minute for midnight boundary
    return () => {
      window.removeEventListener('focus', updateDate);
      clearInterval(interval);
    };
  }, [timeZone]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsDemoMode(false);
        const name = user.displayName || user.email?.split('@')[0] || 'Member';
        const email = user.email || 'user@elvi-osfic.app';
        setUserProfile({
          name,
          email,
          initials: (name[0] || 'M').toUpperCase(),
          planLabel: 'Personal Plan',
        });

        try {
          const userDocSnap = await getDoc(doc(db, 'users', user.uid));
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setIsOnboardingCompleted(data.onboardingCompleted === true);
            if (data.pcosStatus) {
              setPcosStatus(data.pcosStatus);
            }
          } else {
            // New user without profile document -> requires onboarding
            const localDone = localStorage.getItem(`elvi_onboarded_${user.uid}`) === 'true';
            setIsOnboardingCompleted(localDone);
          }
        } catch (err) {
          console.warn('Could not load user profile doc:', err);
          const localDone = localStorage.getItem(`elvi_onboarded_${user.uid}`) === 'true';
          setIsOnboardingCompleted(localDone);
        }
      } else {
        if (!isDemoMode) {
          setIsOnboardingCompleted(false);
          setUserProfile({
            name: 'Member (Guest)',
            email: 'Not signed in',
            initials: 'M',
            planLabel: 'Personal Plan',
          });
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [isDemoMode]);

  // Sync with Firestore whenever activeUid changes
  useEffect(() => {
    if (!activeUid) {
      // Clear data if unauthenticated and not demo
      setPeriods([]);
      setCheckIns([]);
      setRawStoredTimeline([]);
      setReportList([]);
      setAiMemories([]);
      setReminders([]);
      setConsultationQuestions([]);
      setCareNotes([]);
      setTodayCheckedIn(false);
      return;
    }

    if (activeUid === DEMO_UID) {
      setUserProfile({
        name: 'Demo Patient (Synthetic)',
        email: 'synthetic.demo@elvi-osfic.test',
        initials: 'DP',
        planLabel: 'Synthetic Demo Fixture',
      });
    }

    // 1. Sync Cycles
    const cyclesPath = `users/${activeUid}/cycles`;
    const unsubCycles = onSnapshot(
      query(collection(db, cyclesPath), orderBy('startDate', 'desc')),
      (snapshot) => {
        const loaded: PeriodRecord[] = snapshot.docs.map((d) => d.data() as PeriodRecord);
        setPeriods(loaded);
      },
      (error) => handleFirestoreError(error, OperationType.GET, cyclesPath)
    );

    // 2. Sync Check-ins
    const checkinsPath = `users/${activeUid}/checkins`;
    const unsubCheckins = onSnapshot(
      query(collection(db, checkinsPath), orderBy('date', 'desc')),
      (snapshot) => {
        const loaded: CheckInRecord[] = snapshot.docs.map((d) => d.data() as CheckInRecord);
        setCheckIns(loaded);
        const hasToday = loaded.some((c) => c.date === todayIso);
        setTodayCheckedIn(hasToday);
      },
      (error) => handleFirestoreError(error, OperationType.GET, checkinsPath)
    );

    // 3. Sync Timeline (Stored entries & AI Companion proposals)
    const timelinePath = `users/${activeUid}/timeline`;
    const unsubTimeline = onSnapshot(
      query(collection(db, timelinePath), orderBy('isoDate', 'desc')),
      (snapshot) => {
        const loaded: TimelineEntry[] = snapshot.docs.map((d) => d.data() as TimelineEntry);
        setRawStoredTimeline(loaded);
      },
      (error) => handleFirestoreError(error, OperationType.GET, timelinePath)
    );

    // 4. Sync Reminders
    const remindersPath = `users/${activeUid}/reminders`;
    const unsubReminders = onSnapshot(
      collection(db, remindersPath),
      (snapshot) => {
        const loaded: ReminderItem[] = snapshot.docs.map((d) => d.data() as ReminderItem);
        setReminders(loaded);
      },
      (error) => handleFirestoreError(error, OperationType.GET, remindersPath)
    );

    // 5. Sync AI Memories
    const memoriesPath = `users/${activeUid}/ai_memories`;
    const unsubMemories = onSnapshot(
      collection(db, memoriesPath),
      (snapshot) => {
        const loaded: AiMemory[] = snapshot.docs.map((d) => d.data() as AiMemory);
        setAiMemories(loaded);
      },
      (error) => handleFirestoreError(error, OperationType.GET, memoriesPath)
    );

    // 6. Sync Generated Reports
    const reportsPath = `users/${activeUid}/reports`;
    const unsubReports = onSnapshot(
      collection(db, reportsPath),
      (snapshot) => {
        const loaded: GeneratedReportItem[] = snapshot.docs.map((d) => d.data() as GeneratedReportItem);
        setReportList(loaded);
      },
      (error) => handleFirestoreError(error, OperationType.GET, reportsPath)
    );

    // 7. Sync Consultation Questions
    const questionsPath = `users/${activeUid}/consultation_questions`;
    const unsubQuestions = onSnapshot(
      collection(db, questionsPath),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: ConsultationQuestion[] = snapshot.docs.map((d) => d.data() as ConsultationQuestion);
          setConsultationQuestions(loaded);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, questionsPath)
    );

    // 8. Sync Care Notes
    const careNotesPath = `users/${activeUid}/care_notes`;
    const unsubCareNotes = onSnapshot(
      collection(db, careNotesPath),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: CareNote[] = snapshot.docs.map((d) => d.data() as CareNote);
          setCareNotes(loaded);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, careNotesPath)
    );

    // 9. Sync Chat Messages
    const chatPath = `users/${activeUid}/chat_messages`;
    const unsubChat = onSnapshot(
      query(collection(db, chatPath), orderBy('createdAt', 'asc')),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: ChatMessage[] = snapshot.docs.map((d) => d.data() as ChatMessage);
          setChatMessages(loaded);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, chatPath)
    );

    return () => {
      unsubCycles();
      unsubCheckins();
      unsubTimeline();
      unsubReminders();
      unsubMemories();
      unsubReports();
      unsubQuestions();
      unsubCareNotes();
      unsubChat();
    };
  }, [activeUid, todayIso]);

  // Programmatic Cycle Statistics via cycleAnalytics service
  const cycleStats = useMemo(() => computeCycleStatistics(periods), [periods]);
  const calculatedCycleLength = cycleStats.cycleLengthAverage;
  const calculatedPeriodDuration = cycleStats.periodDurationAverage;

  // Unified, deduplicated Timeline derived directly from canonical health records
  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    const map = new Map<string, TimelineEntry>();

    // 1. Periods (Confirmed menstrual cycle events)
    for (const p of periods) {
      const id = `tl-cyc-${p.id}`;
      map.set(id, {
        id,
        userId: activeUid || undefined,
        dateLabel: formatFullDate(p.startDate, timeZone),
        isoDate: p.startDate,
        cycleDayLabel: 'Cycle Start',
        category: 'menstrual',
        sourceBadge: p.isDemo ? 'MENSTRUAL CYCLE · SYNTHETIC FIXTURE' : 'MENSTRUAL CYCLE · USER-REPORTED',
        timeLabel: 'Logged Entry',
        title: `Period Logged — Flow: ${p.flowIntensity}`,
        description: p.notes || (p.endDate ? `Recorded period from ${p.startDate} to ${p.endDate}.` : `Period started on ${p.startDate} (ongoing bleeding).`),
        tags: [p.flowIntensity, p.endDate ? 'Confirmed End Date' : 'Ongoing / Open'],
        ...(p.isDemo ? { isDemo: true, dataOrigin: 'synthetic_test_fixture' } : {}),
      });
    }

    // 2. Check-ins (Confirmed daily wellbeing observations)
    for (const c of checkIns) {
      const id = `tl-chk-${c.date}`;
      map.set(id, {
        id,
        userId: activeUid || undefined,
        dateLabel: formatFullDate(c.date, timeZone),
        isoDate: c.date,
        category: c.symptoms && c.symptoms.length > 0 && !c.symptoms.includes('None today') ? 'symptoms' : (c.meals?.breakfast || c.meals?.lunch || c.meals?.dinner || (c.hydrationCups || 0) > 0) ? 'nourishment' : 'symptoms',
        sourceBadge: c.isDemo ? 'DAILY CHECK-IN · SYNTHETIC FIXTURE' : 'DAILY CHECK-IN · USER-REPORTED',
        timeLabel: c.timestamp || 'Logged Check-in',
        title: `Daily Wellbeing · Energy: ${c.energyLevel}`,
        description: c.notes || `Moods: ${c.moods?.join(', ') || 'None noted'} · Discomfort: ${c.discomfortIntensity}`,
        symptomCards: c.symptoms?.map((s) => ({
          title: s,
          detail: s === 'None today' ? 'No adverse symptoms noted' : `Intensity: ${c.discomfortIntensity}`,
          status: s === 'None today' ? 'none' : 'reported',
        })),
        mealsSummary: c.meals
          ? {
              breakfast: c.meals.breakfast,
              lunch: c.meals.lunch,
              dinner: c.meals.dinner,
              hydration: `${c.hydrationCups || 0} cups (~${(c.hydrationCups || 0) * 250} ml)`,
            }
          : undefined,
        ...(c.isDemo ? { isDemo: true, dataOrigin: 'synthetic_test_fixture' } : {}),
      });
    }

    // 3. Clinical Documents & Reports
    for (const r of reportList) {
      const id = `tl-rep-${r.id}`;
      map.set(id, {
        id,
        userId: activeUid || undefined,
        dateLabel: r.subDate || formatFullDate(todayIso, timeZone),
        isoDate: todayIso,
        category: 'clinical',
        sourceBadge: r.typeBadge === 'Uploaded Clinical Record' ? 'CLINICAL DOCUMENT · USER-UPLOADED' : 'ELVI SUMMARY · SYSTEM SYNTHESIZED',
        timeLabel: 'Archived Document',
        title: r.title,
        description: r.subtitle,
        tags: [r.typeBadge],
        ...(r.isDemo ? { isDemo: true } : {}),
      });
    }

    // 4. Stored proposals / AI Companion approved entries
    for (const t of rawStoredTimeline) {
      if (!map.has(t.id) || t.aiProposal) {
        map.set(t.id, t);
      }
    }

    // 5. Longitudinal Pattern Insights (Dedicated Health Insights Category)
    const analysis = analyzeLongitudinalPatterns({
      periods,
      checkIns,
      timeWindowDays: 60,
      anchorDateIso: todayIso,
      userPcosStatus: pcosStatus,
    });

    for (const finding of analysis.findings) {
      if (dismissedInsightIds.includes(finding.id)) continue;
      // Only display insights that have sufficient supporting information
      if (finding.confidence === 'insufficient_data') continue;

      const id = `tl-ins-${finding.id}`;
      const latestSupportingDate = finding.supportingDates[0] || todayIso;

      map.set(id, {
        id,
        userId: activeUid || undefined,
        dateLabel: formatFullDate(latestSupportingDate, timeZone),
        isoDate: latestSupportingDate,
        category: 'insights',
        sourceBadge: 'ELVI HEALTH INSIGHT · OBSERVATIONAL PATTERN',
        timeLabel: 'Pattern Analysis',
        title: finding.title,
        description: finding.summary,
        tags: [finding.category.toUpperCase(), `${finding.recordsCount} records`],
        insightData: {
          id: finding.id,
          category: finding.category,
          clinicalSignificance: finding.clinicalSignificance,
          supportingDates: finding.supportingDates,
          recordsCount: finding.recordsCount,
          confidence: finding.confidence,
          isReviewed: reviewedInsightIds.includes(finding.id),
          isDismissed: false,
          uncertaintyNotice: finding.missingDataNotice,
        },
        ...(isDemoMode ? { isDemo: true } : {}),
      });
    }

    return Array.from(map.values()).sort((a, b) => (b.isoDate || '').localeCompare(a.isoDate || ''));
  }, [periods, checkIns, reportList, rawStoredTimeline, activeUid, timeZone, todayIso, pcosStatus, dismissedInsightIds, reviewedInsightIds]);

  const navigateTo = (screen: ScreenId) => {
    setActiveScreen(screen);
    window.location.hash = `#${screen}`;
  };

  const openPeriodModal = () => setIsPeriodModalOpen(true);
  const closePeriodModal = () => setIsPeriodModalOpen(false);

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  const signInGoogle = async () => {
    const cred = await loginWithGoogle();
    if (cred.user) {
      localStorage.setItem(`elvi_verified_${cred.user.uid}`, 'true');
    }
  };

  const completeOnboarding = async (
    pcosResponse: 'yes' | 'no',
    initialReport?: { fileName: string; base64Data: string; mimeType: string }
  ) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const userDocRef = doc(db, 'users', uid);

    const resolvedPcos: 'confirmed' | 'monitoring' = pcosResponse === 'yes' ? 'confirmed' : 'monitoring';
    const profileData: any = {
      userId: uid,
      email: currentUser.email || '',
      name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Member',
      initials: (currentUser.displayName?.[0] || currentUser.email?.[0] || 'M').toUpperCase(),
      pcosStatus: resolvedPcos,
      onboardingCompleted: true,
      hasUploadedInitialReport: Boolean(initialReport),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, profileData, { merge: true });
    localStorage.setItem(`elvi_onboarded_${uid}`, 'true');
    setIsOnboardingCompleted(true);
    setPcosStatus(resolvedPcos);

    if (initialReport) {
      await uploadClinicalDocument(
        initialReport.fileName,
        initialReport.base64Data,
        initialReport.mimeType
      );
    }

    navigateTo('today');
  };

  const signOutApp = async () => {
    await logoutUser();
    setIsDemoMode(false);
    setIsOnboardingCompleted(false);
    navigateTo('auth');
  };

  // Real Persistent Period Record Operations
  const addPeriodRecord = async (record: Omit<PeriodRecord, 'id'>) => {
    if (!activeUid) {
      throw new Error('Please sign in with Google or switch to Demo Mode to persist records.');
    }

    const newId = `cyc-${Date.now()}`;
    const newRecord: PeriodRecord & { userId: string; createdAt: string; updatedAt?: string; isDemo?: boolean; dataOrigin?: string } = {
      ...record,
      id: newId,
      userId: activeUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(isDemoMode ? { isDemo: true, dataOrigin: 'synthetic_test_fixture' } : {}),
    };

    const cycleDocRef = doc(db, `users/${activeUid}/cycles`, newId);
    await setDoc(cycleDocRef, newRecord);
  };

  const updatePeriodRecord = async (id: string, updates: Partial<PeriodRecord>) => {
    if (!activeUid) {
      throw new Error('Please sign in to update records.');
    }
    const cycleDocRef = doc(db, `users/${activeUid}/cycles`, id);
    await setDoc(
      cycleDocRef,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  };

  const deletePeriodRecord = async (id: string) => {
    if (!activeUid) return;
    await deleteDoc(doc(db, `users/${activeUid}/cycles`, id));
    await deleteDoc(doc(db, `users/${activeUid}/timeline`, `tl-cyc-${id}`)).catch(() => {});
  };

  // Real Persistent Daily Check-in Operation
  const saveCheckIn = async (record: Omit<CheckInRecord, 'id' | 'date' | 'timestamp'> & { date?: string }) => {
    if (!activeUid) {
      throw new Error('Please sign in with Google or switch to Demo Mode to persist daily check-ins.');
    }

    const entryDate = record.date || todayIso;
    const checkinId = `chk-${entryDate}`;
    const checkInPayload = {
      ...record,
      id: checkinId,
      userId: activeUid,
      date: entryDate,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(isDemoMode ? { isDemo: true, dataOrigin: 'synthetic_test_fixture' } : {}),
    };

    // 1. Save to checkins collection
    await setDoc(doc(db, `users/${activeUid}/checkins`, checkinId), checkInPayload);

    // 2. Synchronize to Health Timeline
    const timelineId = `tl-chk-${checkinId}`;
    const timelinePayload: TimelineEntry & { userId: string; isDemo?: boolean; dataOrigin?: string } = {
      id: timelineId,
      userId: activeUid,
      dateLabel: formatFullDate(entryDate, timeZone),
      isoDate: entryDate,
      category: 'symptoms',
      sourceBadge: isDemoMode ? 'DAILY CHECK-IN · SYNTHETIC FIXTURE' : 'DAILY CHECK-IN · USER-REPORTED',
      timeLabel: checkInPayload.timestamp,
      title: `Daily Wellbeing · Energy: ${record.energyLevel}`,
      description: record.notes || `Moods: ${record.moods.join(', ') || 'None noted'} · Discomfort: ${record.discomfortIntensity}`,
      symptomCards: record.symptoms.map((s) => ({
        title: s,
        detail: s === 'None today' ? 'No adverse symptoms noted' : `Intensity: ${record.discomfortIntensity}`,
        status: s === 'None today' ? 'none' : 'reported',
      })),
      mealsSummary: {
        breakfast: record.meals.breakfast,
        lunch: record.meals.lunch,
        dinner: record.meals.dinner,
        hydration: `${record.hydrationCups} cups (~${record.hydrationCups * 250} ml)`,
      },
      ...(isDemoMode ? { isDemo: true, dataOrigin: 'synthetic_test_fixture' } : {}),
    };

    await setDoc(doc(db, `users/${activeUid}/timeline`, timelineId), timelinePayload);
    setTodayCheckedIn(true);
  };

  const handleTimelineProposal = async (entryId: string, action: 'confirmed' | 'dismissed') => {
    if (!activeUid) return;
    const docRef = doc(db, `users/${activeUid}/timeline`, entryId);
    if (action === 'dismissed') {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, { 'aiProposal.status': 'confirmed' }, { merge: true });
    }
  };

  // AI Companion & Persistent Conversational Memory (Streaming & Optimized Context)
  const sendMessage = async (text: string) => {
    if (!text.trim() || isChatLoading) return;

    const userMsgId = `msg-${Date.now()}-u`;
    const nowIso = new Date().toISOString();
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      paragraphs: [text],
      timestamp: timeLabel,
      createdAt: nowIso,
      userId: activeUid || undefined,
      ...(isDemoMode ? { isDemo: true } : {}),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);
    setStreamingAssistantText('');

    // Persist user turn to Firestore
    if (activeUid) {
      setDoc(doc(db, `users/${activeUid}/chat_messages`, userMsgId), userMsg).catch((err) =>
        console.warn('Failed to persist user chat message:', err)
      );
    }

    try {
      // Gather minimal relevant conversation context (last 4 turns)
      const recentTurns = chatMessages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.paragraphs.join('\n'),
      }));

      const res = await fetch('/api/companion/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          message: text,
          language: companionLanguage,
          memoryEnabled: enableMemory,
          existingMemories: enableMemory ? aiMemories.map((m) => m.text) : [],
          recentTurns,
          recentContext: {
            latestPeriod: periods[0] || null,
            todayCheckedIn,
          },
          stream: true,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      if (!res.body) {
        throw new Error('Streaming response body is unavailable');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';
      let accumulatedRaw = '';
      let finalData: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n\n');
        streamBuffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;
          let eventType = 'message';
          let eventData = '';

          const blockLines = block.split('\n');
          for (const line of blockLines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6).trim();
            }
          }

          if (!eventData) continue;

          try {
            const parsed = JSON.parse(eventData);
            if (eventType === 'timing') {
              setLastLatencyMetrics((prev) => ({ ...prev, ...parsed }));
            } else if (eventType === 'delta') {
              accumulatedRaw += parsed.text;
              // Clean out partial tag prefix from display while streaming
              const tagIdx = accumulatedRaw.indexOf('<!--ELVI_');
              const displaySafe = tagIdx !== -1 ? accumulatedRaw.slice(0, tagIdx).trim() : accumulatedRaw;
              setStreamingAssistantText(displaySafe);
            } else if (eventType === 'done') {
              finalData = parsed;
            } else if (eventType === 'error') {
              throw new Error(parsed.error || 'AI Companion streaming interrupted');
            }
          } catch (pErr: any) {
            // Rethrow stream errors so they bubble to the main catch block and render the error message
            throw pErr;
          }
        }
      }

      const replyMsgId = `msg-${Date.now()}-a`;
      const cleanParagraphs =
        finalData?.paragraphs && finalData.paragraphs.length > 0
          ? finalData.paragraphs
          : accumulatedRaw
          ? [accumulatedRaw.replace(/<!--ELVI_[\s\S]*?-->/g, '').trim()]
          : ['I heard you and am here to support you.'];

      const replyMsg: ChatMessage = {
        id: replyMsgId,
        sender: 'elvi',
        paragraphs: cleanParagraphs,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
        userId: activeUid || undefined,
        proposal:
          finalData?.proposal && finalData.proposal.hasProposal
            ? {
                id: `prop-${Date.now()}`,
                symptomTitle: finalData.proposal.symptomTitle || 'Reported Sensation',
                symptomMeta: finalData.proposal.symptomMeta || 'Self-reported reflection',
                nourishmentTitle: finalData.proposal.nourishmentTitle || 'Supportive Nourishment',
                nourishmentMeta: finalData.proposal.nourishmentMeta || 'Self-reported note',
                status: 'draft',
              }
            : undefined,
        latencyMetrics: finalData?.timing,
        ...(isDemoMode ? { isDemo: true } : {}),
      };

      setChatMessages((prev) => [...prev, replyMsg]);
      setStreamingAssistantText(null);
      if (finalData?.timing) {
        setLastLatencyMetrics(finalData.timing);
      }

      // Persist assistant message to Firestore
      if (activeUid) {
        const firestorePayload: any = {
          id: replyMsgId,
          sender: 'elvi',
          paragraphs: cleanParagraphs,
          timestamp: replyMsg.timestamp,
          createdAt: replyMsg.createdAt,
          userId: activeUid,
        };
        if (replyMsg.proposal) firestorePayload.proposal = replyMsg.proposal;
        if (replyMsg.latencyMetrics) firestorePayload.latencyMetrics = replyMsg.latencyMetrics;
        if (isDemoMode) firestorePayload.isDemo = true;

        setDoc(doc(db, `users/${activeUid}/chat_messages`, replyMsgId), firestorePayload).catch((err) =>
          console.warn('Failed to persist assistant chat message:', err)
        );
      }

      // Asynchronously handle memory persistence without blocking user experience
      if (
        enableMemory &&
        finalData?.memoryToSave &&
        finalData.memoryToSave.shouldSaveMemory &&
        finalData.memoryToSave.text &&
        activeUid
      ) {
        const memoryText = finalData.memoryToSave.text.trim();
        const category = finalData.memoryToSave.category || 'lifestyle_continuity';

        // Check if an existing memory is on the same topic/category to update rather than duplicating
        const existing = aiMemories.find(
          (m) =>
            m.category === category &&
            (m.text.toLowerCase().includes(memoryText.toLowerCase().slice(0, 20)) ||
              memoryText.toLowerCase().includes(m.text.toLowerCase().slice(0, 20)))
        );

        if (existing) {
          const updated: AiMemory = {
            ...existing,
            text: memoryText,
            updatedAt: new Date().toISOString(),
            sourceReference: 'AI Companion Conversation',
          };
          await setDoc(doc(db, `users/${activeUid}/ai_memories`, existing.id), updated, { merge: true });
          setNewMemoryNotice(`ELVI updated context: "${memoryText.slice(0, 55)}..."`);
        } else {
          const memoryId = `mem-${Date.now()}`;
          const newMemory: AiMemory = {
            id: memoryId,
            userId: activeUid,
            text: memoryText,
            category,
            createdAt: new Date().toISOString(),
            sourceReference: 'AI Companion Conversation',
            ...(isDemoMode ? { isDemo: true } : {}),
          };
          await setDoc(doc(db, `users/${activeUid}/ai_memories`, memoryId), newMemory);
          setNewMemoryNotice(`ELVI noted: "${memoryText.slice(0, 55)}..."`);
        }
      }
    } catch (err: any) {
      console.error('AI Companion Streaming Error:', err);
      setStreamingAssistantText(null);
      const rawErrorText = err?.message || 'Reasoning service temporarily unavailable.';
      const isQuota = rawErrorText.includes('quota') || rawErrorText.includes('429');
      const isDemand = rawErrorText.includes('demand') || rawErrorText.includes('503');

      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        sender: 'elvi',
        isError: true,
        paragraphs: isQuota
          ? [
              'ELVI is currently unable to complete this query because the daily quota limit has been reached on the Free Tier (20 requests/day).',
              'The quota resets daily. Thank you for your patience.',
            ]
          : isDemand
          ? [
              'The AI companion service is currently experiencing high demand upstream.',
              'Please wait a few moments and try sending your question again.',
            ]
          : [
              'ELVI encountered an interruption while generating a response:',
              rawErrorText,
            ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const startNewConversation = () => {
    setStreamingAssistantText(null);
    setChatMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'elvi',
        title: 'New conversation started.',
        paragraphs: [
          'I am listening. Share whatever feelings, cycle shifts, meals, or reflections are present for you today.',
        ],
        timestamp: 'Just now',
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleChatProposal = async (msgId: string, action: 'confirmed' | 'discarded') => {
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.proposal) {
          if (action === 'confirmed' && activeUid) {
            const timelineId = `tl-chat-${Date.now()}`;
            const newTimeline: TimelineEntry & { userId: string; isDemo?: boolean } = {
              id: timelineId,
              userId: activeUid,
              dateLabel: `Confirmed from AI Companion · ${formatFullDate(todayIso, timeZone)}`,
              isoDate: todayIso,
              category: 'symptoms',
              sourceBadge: isDemoMode ? 'CONFIRMED FROM AI · SYNTHETIC FIXTURE' : 'CONFIRMED FROM AI · USER-APPROVED',
              timeLabel: 'Just now',
              title: `${m.proposal.symptomTitle} & ${m.proposal.nourishmentTitle}`,
              description: `${m.proposal.symptomMeta} · ${m.proposal.nourishmentMeta}`,
              ...(isDemoMode ? { isDemo: true } : {}),
            };
            setDoc(doc(db, `users/${activeUid}/timeline`, timelineId), newTimeline);
          }
          return { ...m, proposal: { ...m.proposal, status: action } };
        }
        return m;
      })
    );
  };

  const clearMemories = async () => {
    if (!activeUid) return;
    const colRef = collection(db, `users/${activeUid}/ai_memories`);
    const snapshot = await getDocs(colRef);
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, `users/${activeUid}/ai_memories`, d.id));
    }
    setAiMemories([]);
  };

  const deleteMemoryItem = async (id: string) => {
    if (!activeUid) return;
    await deleteDoc(doc(db, `users/${activeUid}/ai_memories`, id));
  };

  const clearMemoryNotice = () => setNewMemoryNotice(null);

  // PCOS Notes & Questions
  const addConsultationQuestion = async (text: string) => {
    if (!text.trim()) return;
    const newId = `q-${Date.now()}`;
    const newQ: ConsultationQuestion & { userId?: string } = {
      id: newId,
      numberLabel: String(consultationQuestions.length + 1).padStart(2, '0'),
      text: text.trim(),
      ...(activeUid ? { userId: activeUid } : {}),
    };
    setConsultationQuestions((prev) => [...prev, newQ]);
    if (activeUid) {
      await setDoc(doc(db, `users/${activeUid}/consultation_questions`, newId), newQ);
    }
  };

  const removeConsultationQuestion = async (id: string) => {
    setConsultationQuestions((prev) =>
      prev.filter((q) => q.id !== id).map((q, idx) => ({ ...q, numberLabel: String(idx + 1).padStart(2, '0') }))
    );
    if (activeUid) {
      await deleteDoc(doc(db, `users/${activeUid}/consultation_questions`, id)).catch(() => {});
    }
  };

  const addCareNote = async (quote: string, context: string) => {
    if (!quote.trim()) return;
    const newId = `cn-${Date.now()}`;
    const newNote: CareNote & { userId?: string } = {
      id: newId,
      dateLabel: `Logged ${formatFullDate(todayIso, timeZone)}`,
      sourceLabel: 'User-entered',
      quote: `“${quote.trim()}”`,
      context: context.trim() || 'Care Observation',
      ...(activeUid ? { userId: activeUid } : {}),
    };
    setCareNotes((prev) => [newNote, ...prev]);
    if (activeUid) {
      await setDoc(doc(db, `users/${activeUid}/care_notes`, newId), newNote);
    }
  };

  const handleSetPcosStatus = async (status: 'confirmed' | 'monitoring' | 'unsure') => {
    setPcosStatus(status);
    if (activeUid) {
      await setDoc(doc(db, 'users', activeUid), { pcosStatus: status, updatedAt: new Date().toISOString() }, { merge: true });
    }
  };

  const handleSetWeightMonitoringOptIn = async (val: boolean) => {
    setWeightMonitoringOptIn(val);
    if (activeUid) {
      await setDoc(doc(db, 'users', activeUid), { weightMonitoringOptIn: val, updatedAt: new Date().toISOString() }, { merge: true });
    }
  };

  // Real Server-Side Longitudinal Report Synthesis
  const generateNewReport = async (
    periodLabel: string,
    sourcesCount: number,
    selectedSourcesMap?: Record<string, boolean>
  ): Promise<GeneratedReportItem> => {
    setIsSynthesizingReport(true);
    try {
      const activeSources = selectedSourcesMap
        ? Object.keys(selectedSourcesMap).filter((k) => selectedSourcesMap[k])
        : ['cycles', 'symptoms', 'mood', 'food', 'hydration', 'notes', 'labs'];

      let daysCutoff = 60;
      if (periodLabel.includes('30')) daysCutoff = 30;
      else if (periodLabel.includes('90')) daysCutoff = 90;

      const dToday = new Date(todayIso);
      const cutoffDate = new Date(dToday.getTime() - daysCutoff * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const filteredPeriods = periods.filter((p) => p.startDate >= cutoffDate);
      const filteredCheckIns = checkIns.filter((c) => c.date >= cutoffDate);

      const res = await fetch('/api/reports/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportingPeriod: periodLabel,
          dateWindow: `${cutoffDate} to ${todayIso} (${daysCutoff} days)`,
          cycleLogs: filteredPeriods,
          checkInLogs: filteredCheckIns,
          labRecords: timelineEntries.filter((t) => t.category === 'clinical'),
          includedSources: activeSources,
          isDemo: isDemoMode || (periods.length === 0 && checkIns.length === 0),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || `Report synthesis returned HTTP ${res.status}`);
      }

      const data: FullReportData = await res.json();
      const reportId = `rep-${Date.now()}`;
      const item: GeneratedReportItem & { userId: string } = {
        id: reportId,
        userId: activeUid || 'guest',
        title: data.title || `ELVI Health Summary (${periodLabel})`,
        subtitle: `${sourcesCount} data domains synthesized · Ready for clinician review`,
        typeBadge: 'ELVI Generated Report',
        dateRange: data.dateWindow || periodLabel,
        subDate: `Generated ${formatFullDate(todayIso, timeZone)}`,
        fullReport: data,
        isDemo: isDemoMode || Boolean(data.isDemo),
      };

      if (activeUid) {
        const firestoreRecord: any = {
          ...item,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, `users/${activeUid}/reports`, reportId), firestoreRecord);
      } else {
        setReportList((prev) => [item, ...prev]);
      }
      return item;
    } catch (err: any) {
      console.error('Report Synthesis Error:', err);
      throw err;
    } finally {
      setIsSynthesizingReport(false);
    }
  };

  // Multimodal Clinical Extraction & Private Upload
  const uploadClinicalDocument = async (fileName: string, base64Data?: string, mimeType?: string) => {
    try {
      const docId = `doc-${Date.now()}`;
      const clinicalDocRecord = {
        id: docId,
        userId: activeUid || 'guest',
        fileName,
        mimeType: mimeType || 'application/pdf',
        uploadDate: todayIso,
        status: 'Uploaded — awaiting analysis',
        createdAt: new Date().toISOString(),
        isDemo: isDemoMode,
      };

      const item: GeneratedReportItem & { userId: string; isDemo?: boolean } = {
        id: docId,
        userId: activeUid || 'guest',
        title: fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
        subtitle: 'Uploaded — awaiting analysis',
        typeBadge: 'Uploaded Clinical Record',
        dateRange: `Uploaded ${formatFullDate(todayIso, timeZone)}`,
        subDate: 'Awaiting Analysis',
        isDemo: isDemoMode,
      };

      if (activeUid) {
        await setDoc(doc(db, `users/${activeUid}/clinical_documents`, docId), clinicalDocRecord);
        await setDoc(doc(db, `users/${activeUid}/reports`, docId), item);
      } else {
        setReportList((prev) => [item, ...prev]);
      }

      // If document payload is provided, process through private upload route
      if (base64Data) {
        fetch('/api/reports/upload-private', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: activeUid || 'guest',
            fileName,
            mimeType,
            base64Data,
          }),
        }).catch((err) => console.warn('Private upload logging error:', err));
      }
    } catch (err) {
      console.error('Upload Clinical Document Error:', err);
      throw err;
    }
  };

  // Reminders Operations
  const toggleReminder = async (id: string) => {
    const target = reminders.find((r) => r.id === id);
    if (!target) return;
    const updated = { ...target, active: !target.active };
    if (activeUid) {
      await setDoc(doc(db, `users/${activeUid}/reminders`, id), updated, { merge: true });
    } else {
      setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
  };

  const addReminder = async (item: Omit<ReminderItem, 'id'>) => {
    const newId = `rem-${Date.now()}`;
    const newItem: ReminderItem & { userId: string; isDemo?: boolean } = {
      ...item,
      id: newId,
      userId: activeUid || 'guest',
      ...(isDemoMode ? { isDemo: true } : {}),
    };
    if (activeUid) {
      await setDoc(doc(db, `users/${activeUid}/reminders`, newId), newItem);
    } else {
      setReminders((prev) => [...prev, newItem]);
    }
  };

  const deleteReminder = async (id: string) => {
    if (activeUid) {
      await deleteDoc(doc(db, `users/${activeUid}/reminders`, id));
    } else {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const updateUserProfile = async (name: string, email: string) => {
    const updated = {
      ...userProfile,
      name,
      email,
      initials: (name[0] || 'M').toUpperCase(),
    };
    setUserProfile(updated);
    if (activeUid && activeUid !== DEMO_UID) {
      await setDoc(doc(db, 'users', activeUid), updated, { merge: true });
    }
  };

  const toggleContextPermission = (key: 'cycleAndSymptoms' | 'nourishmentAndLifestyle' | 'clinicalDocuments') => {
    setContextPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ElviContext.Provider
      value={{
        activeScreen,
        navigateTo,
        isPeriodModalOpen,
        openPeriodModal,
        closePeriodModal,
        editingPeriod,
        setEditingPeriod,
        infoModal,
        setInfoModal,
        todayIso,
        timeZone,
        setTimeZone,
        currentUser,
        isAuthReady,
        isEmailVerified,
        markEmailVerified,
        isOnboardingCompleted,
        completeOnboarding,
        isDemoMode,
        toggleDemoMode,
        activeUid,
        signInGoogle,
        signOutApp,
        periods,
        addPeriodRecord,
        updatePeriodRecord,
        deletePeriodRecord,
        cycleStats,
        calculatedCycleLength,
        calculatedPeriodDuration,
        checkIns,
        saveCheckIn,
        todayCheckedIn,
        timelineEntries,
        handleTimelineProposal,
        dismissTimelineInsight,
        toggleReviewTimelineInsight,
        reviewedInsightIds,
        dismissedInsightIds,
        chatMessages,
        isChatLoading,
        streamingAssistantText,
        lastLatencyMetrics,
        sendMessage,
        startNewConversation,
        handleChatProposal,
        companionLanguage,
        setCompanionLanguage,
        aiMemories,
        clearMemories,
        deleteMemoryItem,
        newMemoryNotice,
        clearMemoryNotice,
        pcosStatus,
        setPcosStatus: handleSetPcosStatus,
        weightMonitoringOptIn,
        setWeightMonitoringOptIn: handleSetWeightMonitoringOptIn,
        consultationQuestions,
        addConsultationQuestion,
        removeConsultationQuestion,
        careNotes,
        addCareNote,
        reportList,
        isSynthesizingReport,
        generateNewReport,
        uploadClinicalDocument,
        reminders,
        toggleReminder,
        addReminder,
        deleteReminder,
        discreetMode,
        setDiscreetMode,
        quietHoursLabel,
        setQuietHoursLabel,
        userProfile,
        updateUserProfile,
        comfortableReading,
        setComfortableReading,
        reduceMotion,
        setReduceMotion,
        enableMemory,
        setEnableMemory,
        contextPermissions,
        toggleContextPermission,
        reportGenerationManualReview,
        setReportGenerationManualReview,
      }}
    >
      {children}
    </ElviContext.Provider>
  );
};

export const useElvi = () => {
  const context = useContext(ElviContext);
  if (!context) {
    throw new Error('useElvi must be used within an ElviProvider');
  }
  return context;
};
