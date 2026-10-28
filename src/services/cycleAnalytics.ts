/**
 * ELVI Cycle Analytics Service
 * Reusable, deterministic calculations for menstrual cycles and rhythm metrics.
 * 
 * Strict Clinical Guardrails:
 * 1. Cycle length is computed ONLY from consecutive confirmed period start dates.
 * 2. Period duration is computed ONLY when a confirmed end date exists; never assume an end date.
 * 3. Never fabricates predictions, fertility windows, ovulation dates, or luteal estimates.
 * 4. Explicitly returns insufficient-data states when history is inadequate.
 */

import { PeriodRecord } from '../types/elvi';
import { parseIsoToDate } from '../lib/dateUtils';

export { parseIsoToDate };

export interface CycleStatistics {
  usableCyclesCount: number; // Completed cycles (intervals between start dates)
  recordedPeriodsCount: number; // Total periods logged
  hasSufficientDataForLength: boolean; // >= 2 periods needed
  hasSufficientDataForPattern: boolean; // >= 3 periods needed
  
  // Cycle Length (Days between consecutive start dates)
  cycleLengthAverage: number | null;
  cycleLengthRange: { min: number; max: number } | null;
  cycleIntervals: number[]; // e.g. [28, 31, 35]
  
  // Period Duration (Days of bleeding: end - start + 1)
  periodDurationAverage: number | null;
  periodDurationRange: { min: number; max: number } | null;
  completedDurations: number[]; // durations of periods that have end dates
  
  // Clinical Rhythm Observations
  isRegular: boolean | null; // null if insufficient data
  variabilityDays: number | null; // max - min interval
  irregularityNotice?: string;
  dataSufficiencyMessage: string;
}

/**
 * Calculates day difference between two YYYY-MM-DD ISO date strings.
 */
export function getDayDifference(startIso: string, endIso: string): number {
  const dStart = parseIsoToDate(startIso);
  const dEnd = parseIsoToDate(endIso);
  return Math.round((dEnd.getTime() - dStart.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Compute reliable, deterministic cycle statistics from confirmed period records.
 */
export function computeCycleStatistics(periods: PeriodRecord[]): CycleStatistics {
  if (!periods || periods.length === 0) {
    return {
      usableCyclesCount: 0,
      recordedPeriodsCount: 0,
      hasSufficientDataForLength: false,
      hasSufficientDataForPattern: false,
      cycleLengthAverage: null,
      cycleLengthRange: null,
      cycleIntervals: [],
      periodDurationAverage: null,
      periodDurationRange: null,
      completedDurations: [],
      isRegular: null,
      variabilityDays: null,
      dataSufficiencyMessage: 'No period records logged yet. Log your period dates to track cycle metrics.',
    };
  }

  // Filter valid records with a start date and sort chronologically (oldest to newest)
  const validPeriods = periods
    .filter((p) => Boolean(p.startDate && p.startDate.match(/^\d{4}-\d{2}-\d{2}$/)))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  // 1. Calculate Period Durations (where confirmed endDate exists and endDate >= startDate)
  const durations: number[] = [];
  for (const p of validPeriods) {
    if (p.endDate && p.endDate.match(/^\d{4}-\d{2}-\d{2}$/) && p.endDate >= p.startDate) {
      const duration = getDayDifference(p.startDate, p.endDate) + 1;
      // Clinical sanity bound: bleeding duration between 1 and 21 days
      if (duration >= 1 && duration <= 21) {
        durations.push(duration);
      }
    }
  }

  const periodDurationAverage =
    durations.length > 0
      ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
      : null;

  const periodDurationRange =
    durations.length > 0
      ? { min: Math.min(...durations), max: Math.max(...durations) }
      : null;

  // 2. Calculate Cycle Intervals (consecutive start dates)
  const intervals: number[] = [];
  for (let i = 1; i < validPeriods.length; i++) {
    const prevStart = validPeriods[i - 1].startDate;
    const currStart = validPeriods[i].startDate;
    const diff = getDayDifference(prevStart, currStart);

    // Plausible physiological interval between distinct cycle starts: 15 to 120 days
    if (diff >= 15 && diff <= 120) {
      intervals.push(diff);
    }
  }

  const usableCyclesCount = intervals.length;
  const hasSufficientDataForLength = intervals.length >= 1; // at least 2 consecutive start dates
  const hasSufficientDataForPattern = intervals.length >= 2; // at least 3 periods / 2 intervals

  let cycleLengthAverage: number | null = null;
  let cycleLengthRange: { min: number; max: number } | null = null;
  let isRegular: boolean | null = null;
  let variabilityDays: number | null = null;
  let irregularityNotice: string | undefined;

  if (hasSufficientDataForLength) {
    cycleLengthAverage = Math.round((intervals.reduce((a, b) => a + b, 0) / intervals.length) * 10) / 10;
    cycleLengthRange = { min: Math.min(...intervals), max: Math.max(...intervals) };
    variabilityDays = cycleLengthRange.max - cycleLengthRange.min;

    if (hasSufficientDataForPattern) {
      // FIGO criteria: cycle variability > 7-9 days or any cycle < 24 or > 38 days indicates irregularity
      const hasOutlier = intervals.some((inv) => inv < 24 || inv > 38);
      const highVariability = variabilityDays >= 7;
      isRegular = !hasOutlier && !highVariability;

      if (!isRegular) {
        irregularityNotice = `Observed cycle length variation of ${variabilityDays} days across recorded cycles. Intervals range from ${cycleLengthRange.min} to ${cycleLengthRange.max} days.`;
      }
    }
  }

  // Construct honest sufficiency message
  let dataSufficiencyMessage = '';
  if (validPeriods.length === 0) {
    dataSufficiencyMessage = 'No valid period dates recorded.';
  } else if (validPeriods.length === 1) {
    dataSufficiencyMessage = '1 period recorded. A second consecutive period start date is needed to calculate cycle length.';
  } else if (!hasSufficientDataForPattern) {
    dataSufficiencyMessage = '1 cycle interval computed. A third period is required to evaluate pattern variability.';
  } else {
    dataSufficiencyMessage = `Calculated across ${intervals.length} consecutive cycle interval(s).`;
  }

  return {
    usableCyclesCount,
    recordedPeriodsCount: validPeriods.length,
    hasSufficientDataForLength,
    hasSufficientDataForPattern,
    cycleLengthAverage,
    cycleLengthRange,
    cycleIntervals: intervals,
    periodDurationAverage,
    periodDurationRange,
    completedDurations: durations,
    isRegular,
    variabilityDays,
    irregularityNotice,
    dataSufficiencyMessage,
  };
}
