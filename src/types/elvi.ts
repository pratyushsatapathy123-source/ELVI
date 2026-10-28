export type ScreenId =
  | 'today'
  | 'cycle-tracker'
  | 'daily-check-in'
  | 'health-timeline'
  | 'ai-companion'
  | 'pcos-care'
  | 'reports'
  | 'reminders'
  | 'settings'
  | 'auth'
  | 'onboarding';

export interface NavItemConfig {
  id: ScreenId;
  label: string;
  group: 'OVERVIEW' | 'TRACKING' | 'CARE & INSIGHTS' | 'PREFERENCES';
}

export interface PeriodRecord {
  id: string;
  startDate: string;
  endDate?: string;
  flowIntensity: 'Light' | 'Medium' | 'Heavy' | 'Spotting';
  notes?: string;
  isConfirmed?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface CheckInRecord {
  id: string;
  date: string;
  timestamp: string;
  moods: string[];
  symptoms: string[];
  discomfortIntensity: 'None noted' | 'Mild' | 'Noticeable' | 'Moderate' | 'Intense';
  energyLevel: 'Restful / Depleted' | 'Steady' | 'Moderate' | 'High / Vibrant';
  bleedingOrSpotting: boolean;
  notes: string;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
    extraItems: string[];
  };
  hydrationCups: number;
  createdAt?: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface TimelineEntry {
  id: string;
  userId?: string;
  dateLabel: string;
  isoDate: string;
  cycleDayLabel?: string;
  category: 'menstrual' | 'symptoms' | 'nourishment' | 'clinical' | 'notes' | 'insights';
  sourceBadge: string;
  timeLabel: string;
  title: string;
  description: string;
  tags?: string[];
  symptomCards?: { title: string; detail: string; status: 'reported' | 'none' }[];
  mealsSummary?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    hydration: string;
  };
  aiProposal?: {
    id: string;
    text: string;
    status: 'pending' | 'confirmed' | 'dismissed';
  };
  clinicalLab?: {
    docId: string;
    clinician: string;
    metrics: { label: string; value: string; unit: string; range: string; specimen: string }[];
  };
  insightData?: {
    id: string;
    category: string;
    clinicalSignificance: string;
    supportingDates: string[];
    recordsCount: number;
    confidence: string;
    isReviewed?: boolean;
    isDismissed?: boolean;
    uncertaintyNotice?: string;
  };
  isDemo?: boolean;
  dataOrigin?: string;
}

export interface LatencyMetrics {
  requestStartTime?: number;
  contextRetrievalMs?: number;
  timeToFirstTokenMs?: number;
  totalGenerationMs?: number;
  totalTurnMs?: number;
  chunksCount?: number;
}

export interface ChatMessage {
  id: string;
  userId?: string;
  sender: 'elvi' | 'user';
  title?: string;
  paragraphs: string[];
  timestamp: string;
  createdAt?: string;
  isError?: boolean;
  proposal?: {
    id: string;
    symptomTitle: string;
    symptomMeta: string;
    nourishmentTitle: string;
    nourishmentMeta: string;
    status: 'draft' | 'confirmed' | 'discarded';
  };
  latencyMetrics?: LatencyMetrics;
}

export interface ReminderItem {
  id: string;
  category: 'period' | 'checkin' | 'hydration' | 'wellbeing' | 'clinical';
  title: string;
  badgeText: string;
  secondaryBadge?: string;
  description: string;
  cadenceLabel: string;
  timeLabel: string;
  extraMeta?: string;
  clinicalNote?: string;
  active: boolean;
}

export interface ConsultationQuestion {
  id: string;
  numberLabel: string;
  text: string;
}

export interface CareNote {
  id: string;
  dateLabel: string;
  sourceLabel: string;
  quote: string;
  context: string;
}

export interface FullReportData {
  title: string;
  subtitle: string;
  dateWindow: string;
  dataCoverageNotice: string;
  cycleSummary: {
    recordedCyclesCount: number;
    averageLengthDays: string;
    patternNotes: string;
  };
  symptomAndMetabolicTrends: string[];
  nourishmentAndHydrationOverview: string;
  labHighlights: string[];
  questionsForClinician: string[];
  clinicalDisclaimer: string;
  computedStats?: any;
  isDemo?: boolean;
}

export interface GeneratedReportItem {
  id: string;
  title: string;
  subtitle: string;
  typeBadge: 'ELVI Generated Report' | 'Uploaded Clinical Record';
  dateRange: string;
  subDate: string;
  fullReport?: FullReportData;
  isDemo?: boolean;
}

export interface AiMemory {
  id: string;
  userId: string;
  text: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
  sourceReference?: string;
  isDemo?: boolean;
}
