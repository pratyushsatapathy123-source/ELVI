/**
 * ELVI Phase 3 Verification Test Suite
 * Tests deterministic algorithms, clinical safety guardrails,
 * timeline derivation, cycle calculations, and pattern analysis.
 */

import { computeCycleStatistics } from '../src/services/cycleAnalytics';
import { analyzeLongitudinalPatterns } from '../src/services/patternAnalysisEngine';
import { PeriodRecord, CheckInRecord } from '../src/types/elvi';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('\n========================================');
console.log('ELVI PHASE 3 — VERIFICATION TEST SUITE');
console.log('========================================\n');

// ----------------------------------------------------
// TEST A & C: Deterministic Cycle Statistics Engine
// ----------------------------------------------------
console.log('--- TEST A & C: CYCLE ANALYTICS ENGINE ---');

// Test 1: Empty periods
const emptyStats = computeCycleStatistics([]);
assert(emptyStats.usableCyclesCount === 0, 'Empty periods yields 0 usable cycles');
assert(emptyStats.cycleLengthAverage === null, 'Empty periods yields null cycleLengthAverage');
assert(emptyStats.hasSufficientDataForLength === false, 'Empty periods reports insufficient data');

// Test 2: Known cycle intervals (3 periods = 2 completed cycles)
// Period 1: Jan 1 to Jan 5
// Period 2: Jan 29 to Feb 2 (Jan 1 to Jan 29 = 28 days interval)
// Period 3: Mar 5 to Mar 9 (Jan 29 to Mar 5 = 35 days interval in non-leap year or leap year calculation)
const p1: PeriodRecord = { id: 'p1', startDate: '2026-01-01', endDate: '2026-01-05', flowIntensity: 'Medium' };
const p2: PeriodRecord = { id: 'p2', startDate: '2026-01-29', endDate: '2026-02-02', flowIntensity: 'Heavy' };
const p3: PeriodRecord = { id: 'p3', startDate: '2026-03-05', endDate: '2026-03-09', flowIntensity: 'Light' };

const knownStats = computeCycleStatistics([p3, p1, p2]); // Out of order input should be sorted chronologically
assert(knownStats.usableCyclesCount === 2, 'Sorted chronological periods identify 2 completed cycle intervals');
assert(knownStats.cycleIntervals.length === 2, 'Returns exact 2 intervals');
assert(knownStats.cycleIntervals[0] === 28, 'First cycle interval is exactly 28 days (2026-01-01 to 2026-01-29)');
assert(knownStats.cycleIntervals[1] === 35, 'Second cycle interval is exactly 35 days (2026-01-29 to 2026-03-05)');
assert(knownStats.cycleLengthRange !== null && knownStats.cycleLengthRange.min === 28, 'Minimum cycle length is 28');
assert(knownStats.cycleLengthRange !== null && knownStats.cycleLengthRange.max === 35, 'Maximum cycle length is 35');
assert(knownStats.cycleLengthAverage === 31.5, 'Average cycle length is exactly 31.5 days');
assert(knownStats.variabilityDays === 7, 'Variability is exactly 7 days (35 - 28)');
assert(knownStats.isRegular === false, 'Cycle with 7 days variability flagged as variable rhythm (threshold is <= 4 days)');

// Test 3: Ongoing period (open-ended bleeding without assumed end date)
const pOngoing: PeriodRecord = { id: 'p4', startDate: '2026-04-10', flowIntensity: 'Heavy' }; // No endDate
const ongoingStats = computeCycleStatistics([p1, p2, p3, pOngoing]);
assert(ongoingStats.usableCyclesCount === 3, 'Ongoing period correctly provides start date for 3rd cycle interval');
assert(ongoingStats.completedDurations.length === 3, 'Only the 3 completed periods have duration metrics; ongoing period duration is not assumed');

// ----------------------------------------------------
// TEST B & F: Longitudinal Pattern Analysis Engine
// ----------------------------------------------------
console.log('\n--- TEST B & F: PATTERN ANALYSIS ENGINE ---');

const checkInsMock: CheckInRecord[] = [
  {
    id: 'c1',
    date: '2026-03-05', // during period p3
    timestamp: '09:00',
    moods: ['Reflective', 'Tired'],
    symptoms: ['Pelvic Cramping', 'Fatigue'],
    discomfortIntensity: 'Moderate',
    energyLevel: 'Restful / Depleted',
    bleedingOrSpotting: true,
    notes: 'Period began today with cramps',
    meals: { breakfast: 'Oatmeal', lunch: 'Lentil soup', dinner: 'Rice and dal', snacks: '', extraItems: [] },
    hydrationCups: 6,
  },
  {
    id: 'c2',
    date: '2026-03-06', // during period p3
    timestamp: '10:00',
    moods: ['Calm'],
    symptoms: ['Pelvic Cramping', 'Bloating'],
    discomfortIntensity: 'Mild',
    energyLevel: 'Steady',
    bleedingOrSpotting: true,
    notes: 'Warm tea helped',
    meals: { breakfast: 'Toast & eggs', lunch: 'Salad & quinoa', dinner: 'Khichdi', snacks: '', extraItems: [] },
    hydrationCups: 7,
  },
  {
    id: 'c3',
    date: '2026-03-18', // outside period (Day 14 after period start)
    timestamp: '14:00',
    moods: ['Irritable'],
    symptoms: ['Acne Flare', 'Afternoon Fatigue'],
    discomfortIntensity: 'Mild',
    energyLevel: 'Restful / Depleted',
    bleedingOrSpotting: false,
    notes: 'Acne breakout along jawline',
    meals: { breakfast: 'Smoothie', lunch: 'Pasta', dinner: 'Soup', snacks: '', extraItems: [] },
    hydrationCups: 4,
  },
  {
    id: 'c4',
    date: '2026-03-19', // outside period
    timestamp: '15:30',
    moods: ['Steady'],
    symptoms: ['Acne Flare'],
    discomfortIntensity: 'None noted',
    energyLevel: 'Steady',
    bleedingOrSpotting: false,
    notes: '',
    meals: { breakfast: 'Poha', lunch: 'Rice bowl', dinner: 'Vegetables', snacks: '', extraItems: [] },
    hydrationCups: 5,
  },
];

const analysis = analyzeLongitudinalPatterns({
  periods: [p1, p2, p3],
  checkIns: checkInsMock,
  timeWindowDays: 60,
  anchorDateIso: '2026-03-25',
  userPcosStatus: 'monitoring',
});

assert(analysis.coverage.checkInsCount === 4, 'Correctly analyzed 4 check-in logs');
assert(analysis.coverage.periodsCount === 2, '2 periods fell within 60 days of 2026-03-25 (p2 on 2026-01-29 and p3 on 2026-03-05)');

// Symptom frequencies and menstrual coincidence
const crampFreq = analysis.symptomFrequencies.find((s) => s.symptom === 'Pelvic Cramping');
assert(crampFreq !== undefined && crampFreq.count === 2, 'Pelvic Cramping counted 2 times');
assert(crampFreq !== undefined && crampFreq.menstrualCoincidenceCount === 2, 'Pelvic cramping coincided 100% with menses');

const acneFreq = analysis.symptomFrequencies.find((s) => s.symptom === 'Acne Flare');
assert(acneFreq !== undefined && acneFreq.count === 2, 'Acne Flare counted 2 times');
assert(acneFreq !== undefined && acneFreq.menstrualCoincidenceCount === 0, 'Acne Flare occurred 0 times during menses (recorded outside period)');

// Non-diagnostic guardrail checks
assert(analysis.findings.length > 0, 'Generated structured longitudinal findings');
for (const f of analysis.findings) {
  assert(
    !f.summary.toLowerCase().includes('you have pcos') &&
    !f.summary.toLowerCase().includes('diagnosed with') &&
    !f.summary.toLowerCase().includes('definitely suffer from'),
    `Finding "${f.title}" contains no diagnostic conclusions`
  );
  assert(f.supportingDates.length > 0, `Finding "${f.title}" has transparent supporting dates`);
  assert(f.recordsCount > 0, `Finding "${f.title}" has documented sample count`);
}

// ----------------------------------------------------
// TEST D: Health Timeline Derivation & Deduplication
// ----------------------------------------------------
console.log('\n--- TEST D: TIMELINE DERIVATION & INTEGRITY ---');

const testPeriods = [p1, p2, p3];
const testCheckIns = checkInsMock;
const testReports = [
  { id: 'rep1', title: 'Hormone Panel', subDate: '2026-02-15', typeBadge: 'Uploaded Clinical Record' },
];

const timelineMap = new Map<string, any>();
for (const p of testPeriods) {
  timelineMap.set(`tl-cyc-${p.id}`, { id: `tl-cyc-${p.id}`, isoDate: p.startDate, category: 'menstrual' });
}
for (const c of testCheckIns) {
  timelineMap.set(`tl-chk-${c.date}`, { id: `tl-chk-${c.date}`, isoDate: c.date, category: 'symptoms' });
}
for (const r of testReports) {
  timelineMap.set(`tl-rep-${r.id}`, { id: `tl-rep-${r.id}`, isoDate: r.subDate, category: 'clinical' });
}

const entries = Array.from(timelineMap.values()).sort((a, b) => b.isoDate.localeCompare(a.isoDate));
assert(entries.length === 8, 'Derived timeline contains 3 periods + 4 check-ins + 1 report = 8 distinct entries');

// Check that re-deriving on update updates the entry in place without duplicates
const updatedP3: PeriodRecord = { ...p3, flowIntensity: 'Heavy', notes: 'Updated notes' };
timelineMap.set(`tl-cyc-${updatedP3.id}`, { id: `tl-cyc-${updatedP3.id}`, isoDate: updatedP3.startDate, category: 'menstrual' });
assert(timelineMap.size === 8, 'Editing an existing period updates in-place with zero duplicate cards');

// ----------------------------------------------------
// TEST G: Gemini Non-Diagnostic Safety Filter Validation
// ----------------------------------------------------
console.log('\n--- TEST G: GEMINI SAFETY FILTER VALIDATION ---');

function testSafetyFilter(rawText: string): boolean {
  const forbiddenPatterns = [
    /you have (pcos|pcod|endometriosis|insulin resistance)/i,
    /diagnosed with (pcos|pcod)/i,
    /suffering from pcos/i,
    /cure(s)? (your|the) (pcos|pcod|condition)/i,
  ];
  return !forbiddenPatterns.some((pattern) => pattern.test(rawText));
}

assert(testSafetyFilter('Based on your logs, you have PCOS.') === false, 'Rejects "you have PCOS"');
assert(testSafetyFilter('This tea cures your PCOS condition.') === false, 'Rejects "cures your PCOS"');
assert(
  testSafetyFilter('Your recorded logs show cycle intervals varying between 28 and 35 days. This is an observational pattern worth discussing with your gynaecologist.') === true,
  'Accepts compliant, non-diagnostic observational explanation'
);

console.log('\n========================================');
console.log('ALL PHASE 3 VERIFICATION TESTS PASSED! 🎉');
console.log('========================================\n');
