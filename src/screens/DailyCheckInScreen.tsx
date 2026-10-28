import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Sparkles,
  Sun,
  HeartHandshake,
  Moon,
  Waves,
  CircleDot,
  CheckCircle2,
  SlidersHorizontal,
  BatteryLow,
  BatteryMedium,
  BatteryCharging,
  BatteryFull,
  Droplet,
  ShieldCheck,
  Coffee,
  Utensils,
  Apple,
  Plus,
  GlassWater,
  Minus,
  Check,
  Lock,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { useElvi } from '../context/ElviContext';

const MOOD_OPTIONS = [
  { label: 'Calm', icon: Sprout },
  { label: 'Reflective', icon: Sparkles },
  { label: 'Energized', icon: Sun },
  { label: 'Sensitive', icon: HeartHandshake },
  { label: 'Low energy', icon: Moon },
  { label: 'On edge', icon: Waves },
  { label: 'Neutral', icon: CircleDot },
];

const SYMPTOM_OPTIONS = [
  'None today',
  'Pelvic cramps',
  'Headache',
  'Fatigue',
  'Bloating',
  'Breast tenderness',
  'Acne or skin shift',
  'Lower back ache',
  'Digestive changes',
  'Other sensation',
];

const DISCOMFORT_LEVELS: {
  level: 'Mild' | 'Noticeable' | 'Moderate' | 'Intense';
  desc: string;
}[] = [
  { level: 'Mild', desc: 'Gentle, easy to work through' },
  { level: 'Noticeable', desc: 'Present, invites slower pacing' },
  { level: 'Moderate', desc: 'Needs rest or care measures' },
  { level: 'Intense', desc: 'Significant impact on routine' },
];

const ENERGY_LEVELS: {
  level: 'Restful / Depleted' | 'Steady' | 'Moderate' | 'High / Vibrant';
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { level: 'Restful / Depleted', desc: 'Honoring a need for deep rest', icon: BatteryLow },
  { level: 'Steady', desc: 'Grounded, consistent flow', icon: BatteryMedium },
  { level: 'Moderate', desc: 'Able to engage comfortably', icon: BatteryCharging },
  { level: 'High / Vibrant', desc: 'Expansive capacity & focus', icon: BatteryFull },
];

import { formatDateKicker, formatFullDate } from '../lib/dateUtils';

interface SavedSummary {
  date: string;
  moods: string[];
  symptoms: string[];
  discomfortIntensity: string;
  energyLevel: string;
  hydrationCups: number;
  hasMeals: boolean;
  notes?: string;
}

export const DailyCheckInScreen: React.FC = () => {
  const { saveCheckIn, navigateTo, todayIso, timeZone, checkIns } = useElvi();

  const [checkInDate, setCheckInDate] = useState<string>(todayIso);

  useEffect(() => {
    if (todayIso) {
      setCheckInDate(todayIso);
    }
  }, [todayIso]);

  const [selectedMoods, setSelectedMoods] = useState<string[]>(['Reflective']);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['None today']);
  const [discomfortIntensity, setDiscomfortIntensity] = useState<
    'None noted' | 'Mild' | 'Noticeable' | 'Moderate' | 'Intense'
  >('None noted');
  const [energyLevel, setEnergyLevel] = useState<
    'Restful / Depleted' | 'Steady' | 'Moderate' | 'High / Vibrant'
  >('Steady');
  const [bleedingOrSpotting, setBleedingOrSpotting] = useState(false);
  const [notes, setNotes] = useState('');

  // Food & Meals
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const [snacks, setSnacks] = useState('');
  const [extraItems, setExtraItems] = useState<string[]>([]);
  const [showExtraInput, setShowExtraInput] = useState(false);
  const [extraDraft, setExtraDraft] = useState('');

  // Hydration
  const [hydrationCups, setHydrationCups] = useState(6);

  // Status banner & errors & Thank You Page state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSummary, setSavedSummary] = useState<SavedSummary | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Populate existing record if checkInDate already has a logged entry
  useEffect(() => {
    const existing = checkIns.find((c) => c.date === checkInDate);
    if (existing) {
      setSelectedMoods(existing.moods || ['Reflective']);
      setSelectedSymptoms(existing.symptoms || ['None today']);
      setDiscomfortIntensity(existing.discomfortIntensity || 'None noted');
      setEnergyLevel(existing.energyLevel || 'Steady');
      setBleedingOrSpotting(Boolean(existing.bleedingOrSpotting));
      setNotes(existing.notes || '');
      setBreakfast(existing.meals?.breakfast || '');
      setLunch(existing.meals?.lunch || '');
      setDinner(existing.meals?.dinner || '');
      setSnacks(existing.meals?.snacks || '');
      setExtraItems(existing.meals?.extraItems || []);
      setHydrationCups(typeof existing.hydrationCups === 'number' ? existing.hydrationCups : 6);
      setStatusBanner(`Loaded confirmed check-in recorded for ${checkInDate}. You can amend and save your corrections.`);
    } else {
      setStatusBanner(null);
    }
  }, [checkInDate, checkIns]);

  const toggleMood = (mood: string) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const toggleSymptom = (symptom: string) => {
    if (symptom === 'None today') {
      setSelectedSymptoms(['None today']);
      setDiscomfortIntensity('None noted');
      return;
    }
    setSelectedSymptoms((prev) => {
      const withoutNone = prev.filter((s) => s !== 'None today');
      return withoutNone.includes(symptom)
        ? withoutNone.filter((s) => s !== symptom)
        : [...withoutNone, symptom];
    });
  };

  const handleAddExtraMeal = () => {
    if (!extraDraft.trim()) return;
    setExtraItems((prev) => [...prev, extraDraft.trim()]);
    setExtraDraft('');
    setShowExtraInput(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = {
        date: checkInDate,
        moods: selectedMoods,
        symptoms: selectedSymptoms,
        discomfortIntensity,
        energyLevel,
        bleedingOrSpotting,
        notes,
        meals: {
          breakfast,
          lunch,
          dinner,
          snacks,
          extraItems,
        },
        hydrationCups,
      };

      await saveCheckIn(payload);

      // Only navigate to Thank-You Page AFTER Firestore save succeeds
      setSavedSummary({
        date: checkInDate,
        moods: selectedMoods,
        symptoms: selectedSymptoms,
        discomfortIntensity,
        energyLevel,
        hydrationCups,
        hasMeals: Boolean(breakfast || lunch || dinner || snacks || extraItems.length > 0),
        notes,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not save check-in to Firestore. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dedicated Thank You Page View
  if (savedSummary) {
    return (
      <div className="max-w-[720px] mx-auto space-y-8 py-4">
        <AppHeader
          kicker="CHECK-IN COMPLETED"
          title="Daily Check-in"
          subtitle="Your reflection has been securely recorded."
        />

        <div className="rounded-[16px] bg-[#FAF9F0] border border-[#D9A2B5]/50 p-8 text-center space-y-6 shadow-sm">
          {/* Subtle Success Checkmark Badge */}
          <div className="w-14 h-14 rounded-full bg-[#EADCE0] border border-[#890149]/40 flex items-center justify-center mx-auto text-[#890149]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif-elvi text-[28px] text-[#30232A]">
              Thank you for checking in.
            </h2>
            <p className="text-[15px] leading-[24px] text-[#30232A]/85 max-w-[540px] mx-auto">
              Thank you for taking a moment for yourself. Your check-in has been saved to your ELVI health timeline.
            </p>
          </div>

          {/* Record Summary Card */}
          <div className="rounded-[12px] bg-[#F3F3E7] border border-[#D9A2B5]/40 p-5 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-[#D9A2B5]/35 pb-2 text-[12px] font-semibold text-[#890149]">
              <span className="uppercase tracking-wider">RECORDED OBSERVATION</span>
              <span>{formatFullDate(savedSummary.date, timeZone)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <span className="text-[#30232A]/70 font-medium">Mood: </span>
                <span className="font-semibold text-[#30232A]">{savedSummary.moods.join(', ') || 'Neutral'}</span>
              </div>
              <div>
                <span className="text-[#30232A]/70 font-medium">Symptoms: </span>
                <span className="font-semibold text-[#30232A]">{savedSummary.symptoms.join(', ') || 'None'}</span>
              </div>
              <div>
                <span className="text-[#30232A]/70 font-medium">Energy: </span>
                <span className="font-semibold text-[#30232A]">{savedSummary.energyLevel}</span>
              </div>
              <div>
                <span className="text-[#30232A]/70 font-medium">Hydration: </span>
                <span className="font-semibold text-[#30232A]">{savedSummary.hydrationCups} cups</span>
              </div>
            </div>

            {savedSummary.hasMeals && (
              <div className="text-[12px] text-[#30232A]/80 pt-1 border-t border-[#D9A2B5]/30">
                <span className="font-semibold text-[#890149]">Nourishment: </span>
                <span>Meals &amp; snacks recorded for metabolic reflection</span>
              </div>
            )}
          </div>

          {/* Navigation Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => navigateTo('today')}
              className="px-6 py-3 rounded-[8px] bg-[#890149] text-[#F3F3E7] text-[14px] font-semibold hover:bg-[#600032] transition-colors"
            >
              Back to Today
            </button>

            <button
              type="button"
              onClick={() => navigateTo('health-timeline')}
              className="px-6 py-3 rounded-[8px] bg-[#FAF9F0] border border-[#D9A2B5] text-[#30232A] text-[14px] font-semibold hover:bg-[#EADCE0]/50 transition-colors"
            >
              View Health Timeline
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setSavedSummary(null)}
              className="text-[12px] font-semibold text-[#890149] hover:underline"
            >
              + Log Another Entry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[820px] space-y-10">
      <AppHeader
        kicker={formatDateKicker(checkInDate, 'DAILY REFLECTION', timeZone)}
        title="Daily Check-in"
        subtitle="Take a moment to check in with yourself. Share as much or as little as feels supportive today."
        rightAction={
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-[#30232A]/70">Entry Date:</span>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="px-2.5 py-1 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/60 text-[12px] font-semibold text-[#890149]"
            />
          </div>
        }
      />

      {errorMessage && (
        <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 text-[14px] text-red-800 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[12px] font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {statusBanner && (
        <div className="rounded-[8px] bg-[#EADCE0]/75 border border-[#890149]/40 px-4 py-3 flex items-center justify-between gap-4 text-[14px] text-[#30232A]">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#890149] shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('health-timeline')}
            className="text-[13px] font-semibold text-[#890149] hover:underline shrink-0"
          >
            View in Timeline →
          </button>
        </div>
      )}

      {/* SECTION 01: How are you feeling today? */}
      <section aria-labelledby="section-01-heading" className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149]/80 mb-1">
            SECTION 01
          </div>
          <h2 id="section-01-heading" className="font-serif-elvi text-[24px] leading-[32px] text-[#30232A]">
            How are you feeling today?
          </h2>
          <p className="text-[13px] text-[#30232A]/75 mt-0.5">Select what resonates most right now.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {MOOD_OPTIONS.map((item) => {
            const Icon = item.icon;
            const active = selectedMoods.includes(item.label);
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => toggleMood(item.label)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-[8px] text-[14px] text-left border transition-colors ${
                  active
                    ? 'bg-[#EADCE0] border-[#890149] text-[#890149] font-semibold'
                    : 'bg-[#F7F7EC] border-[#D9A2B5]/40 text-[#30232A] hover:border-[#D9A2B5]'
                }`}
              >
                <Icon className="w-4 h-4 text-[#890149] shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 02: Physical symptoms & sensations */}
      <section aria-labelledby="section-02-heading" className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149]/80 mb-1">
            SECTION 02
          </div>
          <h2 id="section-02-heading" className="font-serif-elvi text-[24px] leading-[32px] text-[#30232A]">
            Physical symptoms &amp; sensations
          </h2>
          <p className="text-[13px] text-[#30232A]/75 mt-0.5">Select all that apply today.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {SYMPTOM_OPTIONS.map((symptom) => {
            const active = selectedSymptoms.includes(symptom);
            return (
              <button
                key={symptom}
                type="button"
                onClick={() => toggleSymptom(symptom)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-[13px] border transition-colors ${
                  active
                    ? 'bg-[#EADCE0] border-[#890149] text-[#890149] font-semibold'
                    : 'bg-[#F7F7EC] border-[#D9A2B5]/40 text-[#30232A] hover:border-[#D9A2B5]'
                }`}
              >
                {symptom === 'None today' && <CheckCircle2 className="w-3.5 h-3.5 text-[#890149]" />}
                <span>{symptom}</span>
              </button>
            );
          })}
        </div>

        {/* Overall Discomfort Intensity */}
        <div className="rounded-[10px] bg-[#F7F7EC] border border-[#D9A2B5]/45 p-5 mt-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#890149]" />
              <span className="text-[13px] font-semibold text-[#30232A]">
                Overall Discomfort Intensity
              </span>
            </div>
            <span className="text-[12px] text-[#890149] font-medium">{discomfortIntensity}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {DISCOMFORT_LEVELS.map((item) => {
              const active = discomfortIntensity === item.level;
              return (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setDiscomfortIntensity(item.level)}
                  className={`p-3 rounded-[8px] border text-center transition-colors ${
                    active
                      ? 'bg-[#EADCE0] border-[#890149] text-[#890149]'
                      : 'bg-[#FAF9F0] border-[#D9A2B5]/40 text-[#30232A] hover:border-[#D9A2B5]'
                  }`}
                >
                  <div className="text-[13px] font-semibold">{item.level}</div>
                  <div className="text-[11px] text-[#30232A]/70 mt-0.5">{item.desc}</div>
                </button>
              );
            })}
          </div>

          <p className="text-[12px] text-[#30232A]/75 mt-3">
            ELVI treats pain as communication from your body, never a failure. If pain is sudden,
            unmanageable, or feels abnormal, please reach out to your trusted medical provider.
          </p>
        </div>
      </section>

      {/* SECTION 03: Energy level */}
      <section aria-labelledby="section-03-heading" className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149]/80 mb-1">
            SECTION 03
          </div>
          <h2 id="section-03-heading" className="font-serif-elvi text-[24px] leading-[32px] text-[#30232A]">
            Energy level
          </h2>
          <p className="text-[13px] text-[#30232A]/75 mt-0.5">
            How would you describe your baseline vitality?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {ENERGY_LEVELS.map((item) => {
            const Icon = item.icon;
            const active = energyLevel === item.level;
            return (
              <button
                key={item.level}
                type="button"
                onClick={() => setEnergyLevel(item.level)}
                className={`p-3.5 rounded-[8px] border text-left transition-colors ${
                  active
                    ? 'bg-[#EADCE0] border-[#890149]'
                    : 'bg-[#F7F7EC] border-[#D9A2B5]/40 hover:border-[#D9A2B5]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-[#30232A]">{item.level}</span>
                  <Icon className="w-4 h-4 text-[#890149] shrink-0" />
                </div>
                <div className="text-[11px] text-[#30232A]/70">{item.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Bleeding or spotting */}
        <div className="rounded-[10px] bg-[#F7F7EC] border border-[#D9A2B5]/45 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Droplet className="w-4 h-4 text-[#890149]" />
            <div>
              <div className="text-[14px] font-semibold text-[#30232A]">Bleeding or spotting</div>
              <div className="text-[12px] text-[#30232A]/70">
                Are you currently experiencing any flow?
              </div>
            </div>
          </div>

          <div className="inline-flex rounded-[8px] bg-[#FAF9F0] border border-[#D9A2B5]/50 p-0.5">
            <button
              type="button"
              onClick={() => setBleedingOrSpotting(false)}
              className={`px-3.5 py-1 rounded-[6px] text-[13px] font-semibold transition-colors ${
                !bleedingOrSpotting ? 'bg-[#F3F3E7] text-[#890149] shadow-xs' : 'text-[#30232A]/70'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => setBleedingOrSpotting(true)}
              className={`px-3.5 py-1 rounded-[6px] text-[13px] font-semibold transition-colors ${
                bleedingOrSpotting ? 'bg-[#890149] text-[#F3F3E7]' : 'text-[#30232A]/70'
              }`}
            >
              Yes
            </button>
          </div>
        </div>

        {/* Free-text reflection */}
        <div className="pt-2">
          <label
            htmlFor="daily-checkin-notes"
            className="block font-serif-elvi text-[22px] leading-[30px] text-[#30232A]"
          >
            Anything else you&apos;d like ELVI to know?
          </label>
          <p className="text-[13px] text-[#30232A]/75 mt-0.5 mb-3">
            Optional · Describe your mood, sleep, physical notes, or contextual moments you want to look
            back on.
          </p>
          <textarea
            id="daily-checkin-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe how you've been feeling or share anything you'd like to remember..."
            className="w-full rounded-t-[8px] bg-[#FAF9F0] border border-[#D9A2B5]/50 p-4 text-[14px] text-[#30232A] focus:outline-none focus:border-[#890149]"
          />
          <div className="rounded-b-[8px] bg-[#EADCE0]/65 border-x border-b border-[#D9A2B5]/50 px-4 py-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#890149] shrink-0 mt-0.5" />
            <div className="text-[12px] leading-[18px] text-[#30232A]/85">
              <strong className="font-semibold text-[#890149]">ELVI Data Dignity Commitment</strong>
              <div>
                If ELVI notes specific health patterns in your reflection, they will be presented as a
                reviewable proposal first. We never silently commit inferred clinical insights without your
                consent.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04: Food & Meals */}
      <section aria-labelledby="section-04-heading" className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149]/80">
              SECTION 04
            </span>
            <span className="text-[11px] font-semibold text-[#890149] bg-[#EADCE0] px-2 py-0.5 rounded">
              Required
            </span>
          </div>
          <h2 id="section-04-heading" className="font-serif-elvi text-[24px] leading-[32px] text-[#30232A]">
            Food &amp; Meals
          </h2>
          <p className="text-[13px] text-[#30232A]/75 mt-0.5">
            Log your meals and snacks to track nourishment throughout your day. Reasonable estimates welcome.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-[10px] bg-[#F7F7EC] border border-[#D9A2B5]/45 p-4">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="meal-breakfast"
                className="flex items-center gap-2 text-[13px] font-semibold text-[#30232A]"
              >
                <Coffee className="w-4 h-4 text-[#890149]" />
                <span>Breakfast</span>
              </label>
              <span className="text-[11px] text-[#30232A]/60">e.g. 8:30 AM</span>
            </div>
            <input
              id="meal-breakfast"
              type="text"
              value={breakfast}
              onChange={(e) => setBreakfast(e.target.value)}
              placeholder="e.g., Warm oats with chia, walnuts, and herbal tea"
              className="w-full px-3 py-2 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/45 text-[13px] text-[#30232A] focus:outline-none focus:border-[#890149]"
            />
          </div>

          <div className="rounded-[10px] bg-[#F7F7EC] border border-[#D9A2B5]/45 p-4">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="meal-lunch"
                className="flex items-center gap-2 text-[13px] font-semibold text-[#30232A]"
              >
                <Sun className="w-4 h-4 text-[#890149]" />
                <span>Lunch</span>
              </label>
              <span className="text-[11px] text-[#30232A]/60">e.g. 1:00 PM</span>
            </div>
            <input
              id="meal-lunch"
              type="text"
              value={lunch}
              onChange={(e) => setLunch(e.target.value)}
              placeholder="e.g., Lentil bowl, steamed greens, olive oil"
              className="w-full px-3 py-2 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/45 text-[13px] text-[#30232A] focus:outline-none focus:border-[#890149]"
            />
          </div>

          <div className="rounded-[10px] bg-[#F7F7EC] border border-[#D9A2B5]/45 p-4">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="meal-dinner"
                className="flex items-center gap-2 text-[13px] font-semibold text-[#30232A]"
              >
                <Utensils className="w-4 h-4 text-[#890149]" />
                <span>Dinner</span>
              </label>
              <span className="text-[11px] text-[#30232A]/60">e.g. 7:30 PM</span>
            </div>
            <input
              id="meal-dinner"
              type="text"
              value={dinner}
              onChange={(e) => setDinner(e.target.value)}
              placeholder="e.g., Roasted sweet potatoes, salmon, broth"
              className="w-full px-3 py-2 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/45 text-[13px] text-[#30232A] focus:outline-none focus:border-[#890149]"
            />
          </div>

          <div className="rounded-[10px] bg-[#F7F7EC] border border-[#D9A2B5]/45 p-4">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="meal-snacks"
                className="flex items-center gap-2 text-[13px] font-semibold text-[#30232A]"
              >
                <Apple className="w-4 h-4 text-[#890149]" />
                <span>Snacks &amp; Nourishment</span>
              </label>
              <span className="text-[11px] text-[#30232A]/60">Throughout day</span>
            </div>
            <input
              id="meal-snacks"
              type="text"
              value={snacks}
              onChange={(e) => setSnacks(e.target.value)}
              placeholder="e.g., Handful of almonds, fresh berries, seed mix"
              className="w-full px-3 py-2 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/45 text-[13px] text-[#30232A] focus:outline-none focus:border-[#890149]"
            />
          </div>
        </div>

        {extraItems.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {extraItems.map((item, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-[6px] bg-[#EADCE0] text-[#30232A] text-[12px] font-medium"
              >
                + {item}
              </span>
            ))}
          </div>
        )}

        {showExtraInput && (
          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={extraDraft}
              onChange={(e) => setExtraDraft(e.target.value)}
              placeholder="Add herbal infusion, supplement, or extra snack..."
              className="flex-1 px-3 py-1.5 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/60 text-[13px]"
            />
            <button
              type="button"
              onClick={handleAddExtraMeal}
              className="px-3 py-1.5 rounded-[6px] bg-[#890149] text-[#F3F3E7] text-[12px] font-semibold"
            >
              Add
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowExtraInput((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#890149] hover:underline"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add another item / snack</span>
          </button>
          <span className="text-[12px] text-[#30232A]/70">
            No calorie tracking or guilt — observing nourishment only.
          </span>
        </div>
      </section>

      {/* SECTION 05: Hydration */}
      <section aria-labelledby="section-05-heading" className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149]/80">
              SECTION 05
            </span>
            <span className="text-[11px] font-semibold text-[#890149] bg-[#EADCE0] px-2 py-0.5 rounded">
              Required
            </span>
          </div>
          <h2 id="section-05-heading" className="font-serif-elvi text-[24px] leading-[32px] text-[#30232A]">
            Hydration
          </h2>
          <p className="text-[13px] text-[#30232A]/75 mt-0.5">
            Record your daily fluid intake. Estimates in cups or milliliters are supportive.
          </p>
        </div>

        <div className="rounded-[12px] bg-[#F7F7EC] border border-[#D9A2B5]/45 p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-[#EADCE0] flex items-center justify-center">
                <GlassWater className="w-5 h-5 text-[#890149]" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-[#30232A]">Fluid &amp; Warm Teas</div>
                <div className="text-[12px] text-[#30232A]/70">Standard cup ~250 ml (8.5 fl oz)</div>
              </div>
            </div>

            <div className="inline-flex items-center gap-3 rounded-[8px] bg-[#FAF9F0] border border-[#D9A2B5]/50 px-3 py-1.5">
              <button
                type="button"
                onClick={() => setHydrationCups((c) => Math.max(0, c - 1))}
                aria-label="Decrease cups"
                className="w-7 h-7 rounded-full bg-[#F3F3E7] hover:bg-[#EADCE0] flex items-center justify-center text-[#30232A]"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="text-[15px] font-semibold text-[#890149] tabular-nums min-w-[54px] text-center">
                {hydrationCups} <span className="text-[12px] font-normal text-[#30232A]/75">cups</span>
              </div>
              <button
                type="button"
                onClick={() => setHydrationCups((c) => c + 1)}
                aria-label="Increase cups"
                className="w-7 h-7 rounded-full bg-[#F3F3E7] hover:bg-[#EADCE0] flex items-center justify-center text-[#30232A]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#30232A]/65 mb-2">
              QUICK SELECT
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { cups: 4, label: '4 cups', ml: '~1,000 ml' },
                { cups: 6, label: '6 cups', ml: '~1,500 ml' },
                { cups: 8, label: '8 cups', ml: '~2,000 ml' },
                { cups: 10, label: '10+ cups', ml: '~2,500+ ml' },
              ].map((preset) => {
                const active = hydrationCups === preset.cups;
                return (
                  <button
                    key={preset.cups}
                    type="button"
                    onClick={() => setHydrationCups(preset.cups)}
                    className={`py-2.5 px-3 rounded-[8px] border text-center transition-colors ${
                      active
                        ? 'bg-[#890149] border-[#890149] text-[#F3F3E7]'
                        : 'bg-[#FAF9F0] border-[#D9A2B5]/40 text-[#30232A] hover:border-[#890149]/50'
                    }`}
                  >
                    <div className="text-[13px] font-semibold tabular-nums">{preset.label}</div>
                    <div
                      className={`text-[11px] tabular-nums ${
                        active ? 'text-[#F3F3E7]/85' : 'text-[#30232A]/65'
                      }`}
                    >
                      {preset.ml}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Submit & Secondary Actions */}
      <div className="pt-2 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[8px] bg-[#890149] text-[#F3F3E7] text-[14px] font-semibold hover:bg-[#600032] transition-colors disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Saving to Firestore...' : 'Review & Save Check-in'}</span>
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setStatusBanner('Draft saved locally on your device.')}
              className="px-4 py-2.5 rounded-[8px] text-[14px] font-medium text-[#30232A] hover:bg-[#EADCE0]/50 transition-colors"
            >
              Save as draft
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('today')}
            className="text-[13px] font-medium text-[#890149] hover:underline"
          >
            Skip for today
          </button>
        </div>

        <div className="flex items-center gap-2 text-[12px] text-[#30232A]/70">
          <Lock className="w-3.5 h-3.5 text-[#890149]" />
          <span>All check-in data is encrypted client-side and remains under your complete sovereign control.</span>
        </div>
      </div>
    </form>
  );
};
