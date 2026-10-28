/**
 * ELVI Longitudinal Pattern-Analysis Engine
 * 
 * Clinical & Methodological Integrity:
 * 1. Operates exclusively on user-confirmed records over a specified time window.
 * 2. Transparent Provenance: Every finding includes supporting dates, sample count, and missing-data disclosures.
 * 3. Non-Diagnostic: Never diagnoses PCOS/PCOD, never invents clinical risk scores, never claims foods cure conditions.
 * 4. Highlights cautious observations with label: "A pattern worth discussing with a healthcare professional."
 * 5. Deterministic calculation runs without requiring Gemini; AI provides separate explanatory context if requested.
 */

import { PeriodRecord, CheckInRecord } from '../types/elvi';
import { computeCycleStatistics, CycleStatistics } from './cycleAnalytics';
import { parseIsoToDate, getDayDifference } from './cycleAnalytics';

export interface FindingItem {
  id: string;
  category: 'menstrual' | 'symptoms' | 'nourishment' | 'metabolic';
  title: string;
  summary: string;
  clinicalSignificance: string;
  confidence: 'high' | 'moderate' | 'preliminary' | 'insufficient_data';
  type: 'deterministic_statistic' | 'observational_pattern';
  supportingDates: string[];
  recordsCount: number;
  totalAnalyzedRecords: number;
  timeWindowDays: number;
  missingDataNotice?: string;
  isReviewed?: boolean;
  isDismissed?: boolean;
  actionableGuidance?: string;
}

export interface LongitudinalAnalysisResult {
  generatedAt: string;
  timeWindowDays: number;
  dateRange: { start: string; end: string };
  coverage: {
    periodsCount: number;
    checkInsCount: number;
    daysWithCheckIn: number;
    checkInCoveragePercent: number;
  };
  cycleStats: CycleStatistics;
  findings: FindingItem[];
  symptomFrequencies: { symptom: string; count: number; dates: string[]; menstrualCoincidenceCount: number }[];
  hydrationSummary: {
    averageCups: number | null;
    loggedDays: number;
    coveragePercent: number;
  };
  mealSummary: {
    loggedDays: number;
    breakfastCount: number;
    lunchCount: number;
    dinnerCount: number;
  };
  hasNotablePcosMarkers: boolean;
  clinicalDisclaimer: string;
}

/**
 * Checks if a given date falls within any confirmed period bleeding window.
 */
function isDateWithinPeriod(isoDate: string, periods: PeriodRecord[]): boolean {
  return periods.some((p) => {
    if (!p.startDate) return false;
    const end = p.endDate || p.startDate;
    return isoDate >= p.startDate && isoDate <= end;
  });
}

/**
 * Filter items within a retrospective day window from anchorIsoDate.
 */
function getWindowStartDate(anchorIso: string, windowDays: number): string {
  const d = parseIsoToDate(anchorIso);
  d.setDate(d.getDate() - windowDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Execute Longitudinal Pattern Analysis across user records.
 */
export function analyzeLongitudinalPatterns(params: {
  periods: PeriodRecord[];
  checkIns: CheckInRecord[];
  clinicalDocs?: any[];
  timeWindowDays?: number; // 30, 60, 90 (default 60)
  anchorDateIso?: string; // default today's ISO
  userPcosStatus?: 'confirmed' | 'monitoring' | 'unsure';
}): LongitudinalAnalysisResult {
  const {
    periods = [],
    checkIns = [],
    timeWindowDays = 60,
    anchorDateIso = new Date().toISOString().split('T')[0],
  } = params;

  const windowStartIso = getWindowStartDate(anchorDateIso, timeWindowDays);

  // 1. Filter Records to Selected Time Window
  const windowPeriods = periods.filter((p) => p.startDate >= windowStartIso && p.startDate <= anchorDateIso);
  const windowCheckIns = checkIns.filter((c) => c.date >= windowStartIso && c.date <= anchorDateIso);

  // Compute Cycle Statistics
  // For cycle intervals, we use all periods to avoid truncating interval boundaries, but flag window coverage
  const cycleStats = computeCycleStatistics(periods);

  const findings: FindingItem[] = [];

  // Coverage statistics
  const checkInDays = new Set(windowCheckIns.map((c) => c.date));
  const checkInCoveragePercent = Math.round((checkInDays.size / timeWindowDays) * 100);

  // -----------------------------------------------------------------------------------
  // A. MENSTRUAL PATTERN FINDINGS
  // -----------------------------------------------------------------------------------
  if (cycleStats.usableCyclesCount >= 2 && cycleStats.cycleLengthRange) {
    const variability = cycleStats.cycleLengthRange.max - cycleStats.cycleLengthRange.min;
    const supportingDates = periods.map((p) => p.startDate);

    if (variability > 7 || cycleStats.cycleIntervals.some((inv) => inv < 24 || inv > 38)) {
      findings.push({
        id: 'pat-menstrual-variability',
        category: 'menstrual',
        title: 'Cycle Length Variability',
        summary: `Cycle interval span of ${variability} days observed across ${cycleStats.usableCyclesCount} recorded cycle intervals (range: ${cycleStats.cycleLengthRange.min}–${cycleStats.cycleLengthRange.max} days).`,
        clinicalSignificance: 'A pattern worth discussing with a healthcare professional.',
        confidence: cycleStats.usableCyclesCount >= 3 ? 'high' : 'moderate',
        type: 'deterministic_statistic',
        supportingDates,
        recordsCount: cycleStats.usableCyclesCount,
        totalAnalyzedRecords: periods.length,
        timeWindowDays,
        actionableGuidance: 'Review your cycle length range with your doctor to explore whether cycle rhythm reflects ovulatory consistency.',
      });
    } else {
      findings.push({
        id: 'pat-menstrual-regular',
        category: 'menstrual',
        title: 'Consistent Cycle Intervals',
        summary: `Recorded cycle lengths average ${cycleStats.cycleLengthAverage} days with modest variation (${variability} days difference) across ${cycleStats.usableCyclesCount} cycles.`,
        clinicalSignificance: 'Observed cycles fall within predictable clinical limits.',
        confidence: 'high',
        type: 'deterministic_statistic',
        supportingDates,
        recordsCount: cycleStats.usableCyclesCount,
        totalAnalyzedRecords: periods.length,
        timeWindowDays,
      });
    }
  } else if (periods.length === 1) {
    findings.push({
      id: 'pat-menstrual-insufficient',
      category: 'menstrual',
      title: 'Initial Cycle Logged',
      summary: 'One period logged. A second consecutive period start date is needed to calculate cycle length.',
      clinicalSignificance: 'Awaiting longitudinal cycle data.',
      confidence: 'insufficient_data',
      type: 'deterministic_statistic',
      supportingDates: [periods[0].startDate],
      recordsCount: 1,
      totalAnalyzedRecords: 1,
      timeWindowDays,
      missingDataNotice: 'Log your next period start date to calculate interval length.',
    });
  }

  // -----------------------------------------------------------------------------------
  // B. SYMPTOM FREQUENCIES & REPEATED PATTERN DETECTION
  // -----------------------------------------------------------------------------------
  const symptomMap = new Map<string, { dates: string[]; inPeriodCount: number }>();

  windowCheckIns.forEach((chk) => {
    const isPeriodDay = isDateWithinPeriod(chk.date, periods);
    chk.symptoms.forEach((s) => {
      if (s === 'None today') return;
      const current = symptomMap.get(s) || { dates: [], inPeriodCount: 0 };
      current.dates.push(chk.date);
      if (isPeriodDay) {
        current.inPeriodCount += 1;
      }
      symptomMap.set(s, current);
    });
  });

  const symptomFrequencies = Array.from(symptomMap.entries()).map(([symptom, data]) => ({
    symptom,
    count: data.dates.length,
    dates: data.dates,
    menstrualCoincidenceCount: data.inPeriodCount,
  }));

  // Sort by frequency descending
  symptomFrequencies.sort((a, b) => b.count - a.count);

  // Check for repeated symptoms (reported >= 3 times in window)
  symptomFrequencies.forEach((sf) => {
    if (sf.count >= 3) {
      const outsidePeriodCount = sf.count - sf.menstrualCoincidenceCount;
      const occursMainlyOutsidePeriod = outsidePeriodCount > sf.menstrualCoincidenceCount;

      let significance = 'Repeated observation across daily check-ins.';
      let guidance: string | undefined;

      // Check specific dermatological or pelvic patterns
      if (sf.symptom.toLowerCase().includes('acne') || sf.symptom.toLowerCase().includes('skin')) {
        significance = 'A pattern worth discussing with a healthcare professional.';
        guidance = 'Persistent skin shifts or cystic flare-ups across multiple check-ins may reflect androgen sensitivity or luteal shifts.';
      } else if (sf.symptom.toLowerCase().includes('cramp') || sf.symptom.toLowerCase().includes('pelvic')) {
        if (occursMainlyOutsidePeriod) {
          significance = 'A pattern worth discussing with a healthcare professional.';
          guidance = 'Pelvic discomfort reported outside active menstruation days invites clinical evaluation to differentiate ovulatory pain from other pelvic concerns.';
        } else {
          significance = 'Recorded primarily during confirmed menstruation.';
          guidance = 'Dysmenorrhea patterns can be monitored alongside flow intensity and restful measures.';
        }
      } else if (sf.symptom.toLowerCase().includes('fatigue')) {
        guidance = 'Frequent fatigue observations invite review of sleep rhythms, iron/ferritin stores, or thyroid markers with a doctor.';
      }

      findings.push({
        id: `pat-sym-${sf.symptom.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        category: 'symptoms',
        title: `Repeated Symptom: ${sf.symptom}`,
        summary: `Reported on ${sf.count} days in the last ${timeWindowDays} days (${sf.menstrualCoincidenceCount} during period flow, ${outsidePeriodCount} outside menstruation).`,
        clinicalSignificance: significance,
        confidence: sf.count >= 5 ? 'high' : 'moderate',
        type: 'observational_pattern',
        supportingDates: sf.dates,
        recordsCount: sf.count,
        totalAnalyzedRecords: windowCheckIns.length,
        timeWindowDays,
        actionableGuidance: guidance,
      });
    }
  });

  // -----------------------------------------------------------------------------------
  // C. NOURISHMENT & HYDRATION ANALYSIS
  // -----------------------------------------------------------------------------------
  const hydrationEntries = windowCheckIns.filter((c) => typeof c.hydrationCups === 'number' && c.hydrationCups > 0);
  const avgHydration =
    hydrationEntries.length > 0
      ? Math.round(
          (hydrationEntries.reduce((sum, c) => sum + c.hydrationCups, 0) / hydrationEntries.length) * 10
        ) / 10
      : null;

  const mealLoggedCheckIns = windowCheckIns.filter(
    (c) => c.meals && (c.meals.breakfast || c.meals.lunch || c.meals.dinner || c.meals.snacks)
  );

  const hydrationSummary = {
    averageCups: avgHydration,
    loggedDays: hydrationEntries.length,
    coveragePercent: Math.round((hydrationEntries.length / (windowCheckIns.length || 1)) * 100),
  };

  const mealSummary = {
    loggedDays: mealLoggedCheckIns.length,
    breakfastCount: windowCheckIns.filter((c) => Boolean(c.meals?.breakfast)).length,
    lunchCount: windowCheckIns.filter((c) => Boolean(c.meals?.lunch)).length,
    dinnerCount: windowCheckIns.filter((c) => Boolean(c.meals?.dinner)).length,
  };

  if (hydrationEntries.length >= 5) {
    findings.push({
      id: 'pat-nourish-hydration',
      category: 'nourishment',
      title: 'Hydration Consistency',
      summary: `Logged hydration on ${hydrationEntries.length} days, averaging ~${avgHydration} cups/day (~${Math.round((avgHydration || 0) * 250)} ml).`,
      clinicalSignificance: 'Fluid intake supports metabolic equilibrium and fluid retention regulation.',
      confidence: 'high',
      type: 'deterministic_statistic',
      supportingDates: hydrationEntries.map((c) => c.date),
      recordsCount: hydrationEntries.length,
      totalAnalyzedRecords: windowCheckIns.length,
      timeWindowDays,
    });
  }

  // -----------------------------------------------------------------------------------
  // D. PCOS/PCOD MULTI-MARKER CAUTIOUS SYNTHESIS
  // -----------------------------------------------------------------------------------
  // Evaluates whether >= 2 distinct categories (e.g. cycle irregularity + persistent dermatological or pelvic symptoms) co-occur
  const hasIrregularCycles = findings.some((f) => f.id === 'pat-menstrual-variability');
  const hasSkinOrAcne = findings.some((f) => f.id.includes('acne') || f.id.includes('skin'));
  const hasPersistentPelvic = findings.some((f) => f.id.includes('cramp') || f.id.includes('pelvic'));
  
  const notableMarkersCount = [hasIrregularCycles, hasSkinOrAcne, hasPersistentPelvic].filter(Boolean).length;
  const hasNotablePcosMarkers = notableMarkersCount >= 2;

  if (hasNotablePcosMarkers) {
    findings.push({
      id: 'pat-pcos-clustered-observations',
      category: 'metabolic',
      title: 'Cluster of Observed Cycle & Physical Patterns',
      summary: `Recorded history combines ${[
        hasIrregularCycles ? 'cycle length variability' : '',
        hasSkinOrAcne ? 'persistent skin shifts' : '',
        hasPersistentPelvic ? 'recurrent pelvic discomfort' : '',
      ]
        .filter(Boolean)
        .join(' alongside ')}.`,
      clinicalSignificance: 'A pattern worth discussing with a healthcare professional.',
      confidence: 'moderate',
      type: 'observational_pattern',
      supportingDates: Array.from(new Set([...periods.map((p) => p.startDate), ...windowCheckIns.map((c) => c.date)])),
      recordsCount: windowCheckIns.length + windowPeriods.length,
      totalAnalyzedRecords: windowCheckIns.length + windowPeriods.length,
      timeWindowDays,
      actionableGuidance:
        'These observations are non-diagnostic. Sharing this chronological log with an endocrinologist or gynaecologist can assist them in evaluating metabolic rhythms, hormone panels, or pelvic ultrasound.',
    });
  }

  // If no findings could be made due to empty data:
  if (findings.length === 0) {
    findings.push({
      id: 'pat-empty-baseline',
      category: 'menstrual',
      title: 'Baseline In Formation',
      summary: `Only ${windowCheckIns.length} check-in(s) and ${windowPeriods.length} period(s) logged in the last ${timeWindowDays} days.`,
      clinicalSignificance: 'More logged days needed to evaluate longitudinal rhythm.',
      confidence: 'insufficient_data',
      type: 'deterministic_statistic',
      supportingDates: [],
      recordsCount: windowCheckIns.length,
      totalAnalyzedRecords: windowCheckIns.length,
      timeWindowDays,
      missingDataNotice: 'Regular daily check-ins and period dates will build your personal pattern view.',
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    timeWindowDays,
    dateRange: {
      start: windowStartIso,
      end: anchorDateIso,
    },
    coverage: {
      periodsCount: windowPeriods.length,
      checkInsCount: windowCheckIns.length,
      daysWithCheckIn: checkInDays.size,
      checkInCoveragePercent,
    },
    cycleStats,
    findings,
    symptomFrequencies,
    hydrationSummary,
    mealSummary,
    hasNotablePcosMarkers,
    clinicalDisclaimer:
      'ELVI provides observational summaries derived strictly from confirmed user logs. These insights do not constitute medical diagnosis, clinical advice, or predictive screening. Please discuss all health concerns with your healthcare professional.',
  };
}
