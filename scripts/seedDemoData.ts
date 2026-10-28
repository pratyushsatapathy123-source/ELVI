/**
 * ELVI Idempotent Synthetic Demo Data Seed Script
 * Targets dedicated test account: `users/elvi_demo_fixture_v1`
 * Generates relative dates calculated from the current runtime date (Asia/Kolkata timezone).
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTodayIso, parseIsoToDate } from '../src/lib/dateUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

export const DEMO_UID = 'elvi_demo_fixture_v1';
export const SEED_BATCH_ID = 'seed_batch_2026_demo_v1';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

function getOffsetDate(baseIso: string, offsetDays: number): string {
  const d = parseIsoToDate(baseIso);
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function cleanupDemoData() {
  console.log(`[Seed Cleanup] Purging previous seed batch ${SEED_BATCH_ID} for UID: ${DEMO_UID}...`);
  const subcollections = ['cycles', 'checkins', 'timeline', 'clinical_documents', 'reports', 'reminders', 'ai_memories', 'chat_messages'];

  let totalDeleted = 0;
  for (const sub of subcollections) {
    const colRef = collection(db, `users/${DEMO_UID}/${sub}`);
    const snapshot = await getDocs(colRef);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.seedBatchId === SEED_BATCH_ID || data.isDemo === true) {
        await deleteDoc(doc(db, `users/${DEMO_UID}/${sub}`, docSnap.id));
        totalDeleted++;
      }
    }
  }
  await deleteDoc(doc(db, 'users', DEMO_UID));
  console.log(`[Seed Cleanup] Deleted ${totalDeleted} demo fixture documents.`);
}

export async function seedDemoData() {
  const todayIso = getTodayIso('Asia/Kolkata');
  console.log(`[Seed] Current anchor date in Asia/Kolkata: ${todayIso}`);

  // 1. User Profile Document
  const profileDoc = {
    userId: DEMO_UID,
    name: 'Demo Patient (Synthetic)',
    email: 'synthetic.demo@elvi-osfic.test',
    initials: 'DP',
    planLabel: 'Synthetic Demo Fixture',
    pcosStatus: 'monitoring',
    weightMonitoringOptIn: false,
    interfaceLanguage: 'English',
    comfortableReading: false,
    reduceMotion: false,
    enableMemory: true,
    discreetMode: true,
    quietHoursLabel: '10:30 PM to 7:30 AM',
    isDemo: true,
    dataOrigin: 'synthetic_test_fixture',
    seedBatchId: SEED_BATCH_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', DEMO_UID), profileDoc);

  // 2. Historical Periods (3 consecutive recorded periods with varying lengths)
  // Cycle 1: Started 62 days ago, ended 57 days ago (5 days flow)
  // Cycle 2: Started 32 days ago, ended 28 days ago (4 days flow) -> 30-day cycle interval
  // Cycle 3: Started 2 days ago, currently ongoing -> 30-day cycle interval
  const periods = [
    {
      id: 'demo-cycle-1',
      userId: DEMO_UID,
      startDate: getOffsetDate(todayIso, -62),
      endDate: getOffsetDate(todayIso, -57),
      flowIntensity: 'Medium',
      notes: 'Synthetic fixture: Normal flow onset with mild lower abdomen cramp.',
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-cycle-2',
      userId: DEMO_UID,
      startDate: getOffsetDate(todayIso, -32),
      endDate: getOffsetDate(todayIso, -28),
      flowIntensity: 'Heavy',
      notes: 'Synthetic fixture: Heavier flow on days 1-2, lighter spotting day 4.',
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-cycle-3',
      userId: DEMO_UID,
      startDate: getOffsetDate(todayIso, -2),
      endDate: getOffsetDate(todayIso, 2),
      flowIntensity: 'Medium',
      notes: 'Synthetic fixture: Current cycle onset, steady manageable sensations.',
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const p of periods) {
    await setDoc(doc(db, `users/${DEMO_UID}/cycles`, p.id), p);
  }

  // 3. Daily Check-ins across recent days (including intentional gaps for missing data testing)
  // Days: -10, -8, -6, -3, -2, -1, 0 (Today)
  const checkins = [
    {
      id: 'demo-chk-1',
      userId: DEMO_UID,
      date: getOffsetDate(todayIso, -10),
      timestamp: '8:45 PM',
      moods: ['Calm', 'Reflective'],
      symptoms: ['None today'],
      discomfortIntensity: 'None noted',
      energyLevel: 'Steady',
      bleedingOrSpotting: false,
      notes: 'Synthetic fixture: Felt calm throughout the workday. Evening walk.',
      meals: {
        breakfast: 'Steel-cut oats with flaxseeds and blueberries',
        lunch: 'Quinoa bowl with chickpeas and roasted zucchini',
        dinner: 'Baked salmon with steamed broccoli',
        snacks: 'Small handful of almonds',
        extraItems: [],
      },
      hydrationCups: 7,
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
    },
    {
      id: 'demo-chk-2',
      userId: DEMO_UID,
      date: getOffsetDate(todayIso, -8),
      timestamp: '9:15 PM',
      moods: ['Sensitive', 'Low energy'],
      symptoms: ['Bloating', 'Fatigue'],
      discomfortIntensity: 'Mild',
      energyLevel: 'Restful / Depleted',
      bleedingOrSpotting: false,
      notes: 'Synthetic fixture: Noticeable digestive heaviness in the afternoon.',
      meals: {
        breakfast: 'Warm cinnamon oatmeal',
        lunch: 'Lentil vegetable soup',
        dinner: 'Tofu stir-fry with brown rice',
        snacks: 'Walnuts and peppermint tea',
        extraItems: [],
      },
      hydrationCups: 6,
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
    },
    {
      id: 'demo-chk-3',
      userId: DEMO_UID,
      date: getOffsetDate(todayIso, -6),
      timestamp: '8:30 PM',
      moods: ['Energized'],
      symptoms: ['None today'],
      discomfortIntensity: 'None noted',
      energyLevel: 'High / Vibrant',
      bleedingOrSpotting: false,
      notes: 'Synthetic fixture: Clear mental focus. Gentle morning yoga.',
      meals: {
        breakfast: 'Poached eggs on seeded toast with avocado',
        lunch: 'Mixed greens salad with grilled chicken and olive oil',
        dinner: 'Stir-fried vegetables with lentils',
        snacks: 'Pumpkin seeds',
        extraItems: [],
      },
      hydrationCups: 8,
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
    },
    {
      id: 'demo-chk-4',
      userId: DEMO_UID,
      date: getOffsetDate(todayIso, -2),
      timestamp: '10:00 AM',
      moods: ['Reflective'],
      symptoms: ['Pelvic cramps', 'Lower back ache'],
      discomfortIntensity: 'Noticeable',
      energyLevel: 'Steady',
      bleedingOrSpotting: true,
      notes: 'Synthetic fixture: First day of period bleeding. Applied heat pad.',
      meals: {
        breakfast: 'Warm rice porridge with ginger and sesame seeds',
        lunch: 'Vegetable broth with steamed greens',
        dinner: 'Lentil stew with carrots and cumin',
        snacks: 'Chamomile tea',
        extraItems: [],
      },
      hydrationCups: 7,
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
    },
    {
      id: 'demo-chk-5',
      userId: DEMO_UID,
      date: todayIso,
      timestamp: '9:00 AM',
      moods: ['Calm'],
      symptoms: ['Pelvic cramps'],
      discomfortIntensity: 'Mild',
      energyLevel: 'Steady',
      bleedingOrSpotting: true,
      notes: 'Synthetic fixture: Day 3 flow. Cramping lighter than yesterday.',
      meals: {
        breakfast: 'Warm chia pudding with walnuts and ginger infusion',
        lunch: 'Lentil soup with greens',
        dinner: '',
        snacks: '',
        extraItems: [],
      },
      hydrationCups: 5,
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
    },
  ];

  for (const c of checkins) {
    await setDoc(doc(db, `users/${DEMO_UID}/checkins`, c.id), c);
  }

  // 4. Health Timeline entries projection
  const timeline = [
    {
      id: 'demo-tl-1',
      userId: DEMO_UID,
      dateLabel: `Today — ${todayIso}`,
      isoDate: todayIso,
      cycleDayLabel: 'Cycle Day 3',
      category: 'menstrual',
      sourceBadge: 'MENSTRUAL CYCLE · SYNTHETIC FIXTURE',
      timeLabel: '9:00 AM',
      title: 'Period Day 3 — Flow: Medium',
      description: 'Synthetic fixture: Ongoing cycle recording. Mild manageable sensations.',
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
    },
    {
      id: 'demo-tl-2',
      userId: DEMO_UID,
      dateLabel: `Recorded ${getOffsetDate(todayIso, -2)}`,
      isoDate: getOffsetDate(todayIso, -2),
      cycleDayLabel: 'Cycle Day 1',
      category: 'symptoms',
      sourceBadge: 'DAILY CHECK-IN · SYNTHETIC FIXTURE',
      timeLabel: '10:00 AM',
      title: 'Period Start & Pelvic Sensation',
      description: 'Synthetic fixture: Noticeable lower back ache and cramping.',
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
    },
    {
      id: 'demo-tl-3',
      userId: DEMO_UID,
      dateLabel: `Recorded ${getOffsetDate(todayIso, -8)}`,
      isoDate: getOffsetDate(todayIso, -8),
      category: 'nourishment',
      sourceBadge: 'NOURISHMENT · SYNTHETIC FIXTURE',
      timeLabel: '9:15 PM',
      title: 'Meals & Hydration Recorded',
      description: 'Synthetic fixture: 6 cups water, warm oatmeal and peppermint tea.',
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
    },
    {
      id: 'demo-tl-4',
      userId: DEMO_UID,
      dateLabel: `Recorded ${getOffsetDate(todayIso, -14)}`,
      isoDate: getOffsetDate(todayIso, -14),
      category: 'clinical',
      sourceBadge: 'SYNTHETIC TEST FIXTURE · NOT A REAL LAB RESULT',
      timeLabel: 'Test Fixture #SYNTH-9901',
      title: 'Synthetic Test Panel (Educational Fixture)',
      description: 'Synthetic test panel for testing structured table extraction and report synthesis.',
      clinicalLab: {
        docId: '#SYNTH-9901',
        clinician: 'Synthetic Test Fixture',
        metrics: [
          { label: 'FASTING INSULIN', value: '7.8', unit: 'µIU/mL', range: '2.6 – 24.9 µIU/mL', specimen: 'Serum' },
          { label: 'TOTAL TESTOSTERONE', value: '34', unit: 'ng/dL', range: '15 – 70 ng/dL', specimen: 'Serum' },
          { label: 'TSH', value: '1.92', unit: 'mIU/L', range: '0.40 – 4.50 mIU/L', specimen: 'Serum' },
        ],
      },
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
    },
  ];

  for (const t of timeline) {
    await setDoc(doc(db, `users/${DEMO_UID}/timeline`, t.id), t);
  }

  // 5. Consent-based AI Memories
  const memories = [
    {
      id: 'demo-mem-1',
      userId: DEMO_UID,
      text: 'User mentioned mild postprandial bloating when having large wheat-based meals during late luteal phase.',
      category: 'nourishment_preference',
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-mem-2',
      userId: DEMO_UID,
      text: 'Prefers warm infusions (ginger, peppermint) over cold water during cycle days 1–3.',
      category: 'lifestyle_continuity',
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const m of memories) {
    await setDoc(doc(db, `users/${DEMO_UID}/ai_memories`, m.id), m);
  }

  // 6. Reminders
  const reminders = [
    {
      id: 'demo-rem-1',
      userId: DEMO_UID,
      category: 'period',
      title: 'Upcoming Period Estimate',
      badgeText: 'Estimated Date · Calculated from 3 cycles',
      description: 'Scheduled 2 days before calculated window.',
      cadenceLabel: 'Every cycle (adaptive interval)',
      timeLabel: 'Alert at 9:00 AM',
      active: true,
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-rem-2',
      userId: DEMO_UID,
      category: 'checkin',
      title: 'Evening Reflection & Check-in',
      badgeText: 'Daily Prompt',
      description: 'Covers symptoms, mood, energy, food & hydration.',
      cadenceLabel: 'Every day',
      timeLabel: '8:30 PM',
      active: true,
      isDemo: true,
      dataOrigin: 'synthetic_test_fixture',
      seedBatchId: SEED_BATCH_ID,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const r of reminders) {
    await setDoc(doc(db, `users/${DEMO_UID}/reminders`, r.id), r);
  }

  // 7. Verification read-back
  const readCycles = await getDocs(collection(db, `users/${DEMO_UID}/cycles`));
  const readCheckins = await getDocs(collection(db, `users/${DEMO_UID}/checkins`));
  const readTimeline = await getDocs(collection(db, `users/${DEMO_UID}/timeline`));
  const readMemories = await getDocs(collection(db, `users/${DEMO_UID}/ai_memories`));
  const readReminders = await getDocs(collection(db, `users/${DEMO_UID}/reminders`));

  console.log('--- SEED RESULTS VERIFIED VIA FIRESTORE READ-BACK ---');
  console.log(`Database ID: ${firebaseConfig.firestoreDatabaseId}`);
  console.log(`Target Document Path: users/${DEMO_UID}`);
  console.log(`Cycles written & verified: ${readCycles.size}`);
  console.log(`Check-ins written & verified: ${readCheckins.size}`);
  console.log(`Timeline entries written & verified: ${readTimeline.size}`);
  console.log(`AI Memories written & verified: ${readMemories.size}`);
  console.log(`Reminders written & verified: ${readReminders.size}`);
  console.log(`Total Synthetic Records in Firestore: ${1 + readCycles.size + readCheckins.size + readTimeline.size + readMemories.size + readReminders.size}`);
}

async function main() {
  const isCleanup = process.argv.includes('--cleanup');
  if (isCleanup) {
    await cleanupDemoData();
  } else {
    await cleanupDemoData();
    await seedDemoData();
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
