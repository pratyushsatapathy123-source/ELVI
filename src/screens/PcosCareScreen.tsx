import React, { useState, useMemo } from 'react';
import {
  BriefcaseMedical,
  Info,
  Clock,
  Scale,
  SlidersHorizontal,
  ShieldCheck,
  HelpCircle,
  X,
  Plus,
  FileText,
  Lock,
  Bell,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Check,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { useElvi } from '../context/ElviContext';
import { analyzeLongitudinalPatterns, FindingItem } from '../services/patternAnalysisEngine';

export const PcosCareScreen: React.FC = () => {
  const {
    pcosStatus,
    setPcosStatus,
    weightMonitoringOptIn,
    setWeightMonitoringOptIn,
    consultationQuestions,
    addConsultationQuestion,
    removeConsultationQuestion,
    careNotes,
    addCareNote,
    navigateTo,
    periods,
    checkIns,
    todayIso,
  } = useElvi();

  const [timeWindowDays, setTimeWindowDays] = useState<30 | 60 | 90>(60);
  const [reviewedFindingIds, setReviewedFindingIds] = useState<string[]>([]);
  const [dismissedFindingIds, setDismissedFindingIds] = useState<string[]>([]);

  // AI Explanation State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  // Compute longitudinal pattern analysis dynamically
  const analysis = useMemo(() => {
    return analyzeLongitudinalPatterns({
      periods,
      checkIns,
      timeWindowDays,
      anchorDateIso: todayIso,
      userPcosStatus: pcosStatus,
    });
  }, [periods, checkIns, timeWindowDays, todayIso, pcosStatus]);

  const [addingQuestion, setAddingQuestion] = useState(false);
  const [questionDraft, setQuestionDraft] = useState('');

  const [addingNote, setAddingNote] = useState(false);
  const [noteQuoteDraft, setNoteQuoteDraft] = useState('');
  const [noteContextDraft, setNoteContextDraft] = useState('');

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionDraft.trim()) return;
    addConsultationQuestion(questionDraft);
    setQuestionDraft('');
    setAddingQuestion(false);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteQuoteDraft.trim()) return;
    addCareNote(noteQuoteDraft, noteContextDraft);
    setNoteQuoteDraft('');
    setNoteContextDraft('');
    setAddingNote(false);
  };

  const handleToggleReview = (id: string) => {
    setReviewedFindingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDismissFinding = (id: string) => {
    setDismissedFindingIds((prev) => [...prev, id]);
  };

  const handleRequestAiExplanation = async () => {
    setIsExplaining(true);
    setExplainError(null);
    try {
      const res = await fetch('/api/analytics/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findings: analysis.findings,
          cycleStats: analysis.cycleStats,
          coverage: analysis.coverage,
          userPcosStatus: pcosStatus,
          timeWindowDays,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not generate explanation');
      }
      setAiExplanation(data.explanation);
    } catch (err: any) {
      setExplainError(err?.message || 'AI pattern reflection is temporarily unavailable.');
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="max-w-[920px] space-y-10">
      <AppHeader
        kicker="HORMONAL & METABOLIC HEALTH · DEDICATED CARE SPACE"
        title="PCOS/PCOD Care"
        subtitle="Understand your personal patterns, prepare for clinical conversations, and organise supportive care at your own pace."
        rightAction={
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#FAF9F0] border border-[#D9A2B5]/55 text-[12px] font-medium text-[#30232A]">
            <ShieldCheck className="w-4 h-4 text-[#890149]" />
            <span>Consent-governed records</span>
          </div>
        }
      />

      {/* Personal Care Profile Card */}
      <section
        aria-labelledby="personal-care-profile-heading"
        className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/50 p-6 space-y-4"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BriefcaseMedical className="w-4 h-4 text-[#890149]" />
            <h2 id="personal-care-profile-heading" className="text-[15px] font-semibold text-[#30232A]">
              Personal Care Profile
            </h2>
          </div>
          <span className="text-[12px] font-semibold text-[#890149]">✎ Update status</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'confirmed' as const,
              title: 'I have a confirmed diagnosis',
              desc: 'Diagnosed by an endocrinologist or gynaecologist',
            },
            {
              id: 'monitoring' as const,
              title: "I'm monitoring symptoms",
              desc: 'Tracking variations, cycle lengths, and physical signs',
            },
            {
              id: 'unsure' as const,
              title: "I'm not sure yet",
              desc: 'Gathering observations for an upcoming doctor check',
            },
          ].map((option) => {
            const active = pcosStatus === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setPcosStatus(option.id)}
                className={`p-4 rounded-[10px] border text-left transition-colors flex items-start gap-3 ${
                  active
                    ? 'bg-[#F3F3E7] border-[#890149]'
                    : 'bg-[#F7F7EC] border-[#D9A2B5]/40 hover:border-[#D9A2B5]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    active ? 'border-[#890149] bg-[#890149]' : 'border-[#D9A2B5]'
                  }`}
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-[#F3F3E7]" />}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[13px] font-semibold ${
                        active ? 'text-[#890149]' : 'text-[#30232A]'
                      }`}
                    >
                      {option.title}
                    </span>
                    {active && (
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#EADCE0] text-[#890149]">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] leading-[18px] text-[#30232A]/75 mt-1">{option.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-start gap-2 text-[12px] text-[#30232A]/75 pt-1">
          <Info className="w-4 h-4 text-[#890149] shrink-0 mt-0.5" />
          <span>
            <strong className="font-semibold text-[#30232A]">Clinical Boundary:</strong> ELVI never infers
            or assigns a diagnosis from symptoms or cycle tracking. Your care profile guides context and
            organisation, not clinical conclusions.
          </span>
        </div>
      </section>

      {/* RETROSPECTIVE & LONGITUDINAL PATTERN ANALYSIS */}
      <section aria-labelledby="retrospective-heading" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149]/80 mb-1">
              OBSERVATIONAL WINDOW
            </div>
            <h2 id="retrospective-heading" className="font-serif-elvi text-[22px] text-[#30232A]">
              Recorded Symptom &amp; Cycle Patterns
            </h2>
            <p className="text-[14px] text-[#30232A]/80 mt-0.5">
              Based on {analysis.coverage.checkInsCount} daily check-ins and {analysis.coverage.periodsCount} period records over your selected window.
            </p>
          </div>

          {/* Time Window Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-[8px] bg-[#FAF9F0] border border-[#D9A2B5]/50 self-start sm:self-auto">
            {([30, 60, 90] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setTimeWindowDays(days)}
                className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
                  timeWindowDays === days
                    ? 'bg-[#890149] text-[#F3F3E7] font-semibold shadow-xs'
                    : 'text-[#30232A]/70 hover:text-[#30232A] hover:bg-[#F3F3E7]'
                }`}
              >
                Past {days} days
              </button>
            ))}
          </div>
        </div>

        {/* 4 Retrospective Dimension Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Hormonal Rhythm */}
          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                  HORMONAL RHYTHM
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                  analysis.cycleStats.isRegular ? 'bg-[#EADCE0]/70 text-[#890149]' : 'bg-[#F3F3E7] text-[#30232A]/80'
                }`}>
                  {analysis.cycleStats.usableCyclesCount >= 2
                    ? analysis.cycleStats.isRegular ? 'Regular rhythm' : 'Variable intervals'
                    : 'Preliminary data'}
                </span>
              </div>
              <div className="text-[14px] font-semibold text-[#30232A]">Cycle Length Variability</div>
              {analysis.cycleStats.usableCyclesCount >= 1 && analysis.cycleStats.cycleLengthRange ? (
                <>
                  <div className="text-[20px] font-bold text-[#890149] tabular-nums mt-0.5">
                    {analysis.cycleStats.cycleLengthRange.min === analysis.cycleStats.cycleLengthRange.max
                      ? `${analysis.cycleStats.cycleLengthAverage} days`
                      : `${analysis.cycleStats.cycleLengthRange.min}–${analysis.cycleStats.cycleLengthRange.max} days`}
                  </div>
                  <div className="text-[12px] text-[#30232A]/70 mt-0.5">
                    Average length: {analysis.cycleStats.cycleLengthAverage} days across {analysis.cycleStats.usableCyclesCount} interval(s)
                  </div>
                </>
              ) : (
                <div className="mt-2 text-[13px] text-[#30232A]/70 italic">
                  {analysis.cycleStats.dataSufficiencyMessage}
                </div>
              )}
            </div>

            {/* Cycle Intervals or Informational fallback */}
            {analysis.cycleStats.cycleIntervals.length > 0 ? (
              <div className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/35 p-3">
                <div className="text-[11px] font-medium text-[#30232A]/70 mb-2">Recorded intervals in window:</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.cycleStats.cycleIntervals.map((interval, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-[#FAF9F0] border border-[#D9A2B5]/40 text-[12px] font-semibold text-[#890149] tabular-nums">
                      Cycle {i + 1}: {interval}d
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/35 p-3 text-[12px] text-[#30232A]/75">
                Log consecutive period start dates in the Cycle Tracker to reveal rhythm variability.
              </div>
            )}

            <div className="rounded-[6px] bg-[#F3F3E7] px-3 py-2 text-[11px] leading-[16px] text-[#30232A]/75">
              Cycle metrics are kept as structured observations for collaborative review with your physician.
            </div>
          </div>

          {/* Card 2: Dermatological & Physical Signs */}
          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                  DERMATOLOGICAL &amp; PHYSICAL SIGNS
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F3F3E7] text-[#30232A]/80">
                  User-reported
                </span>
              </div>
              <div className="text-[14px] font-semibold text-[#30232A]">Skin &amp; Physical Observations</div>

              {analysis.symptomFrequencies.length > 0 ? (
                <div className="space-y-2">
                  {analysis.symptomFrequencies.slice(0, 3).map((sym) => {
                    const outsideCount = Math.max(0, sym.count - sym.menstrualCoincidenceCount);
                    const pct = analysis.coverage.checkInsCount > 0 ? Math.round((sym.count / analysis.coverage.checkInsCount) * 100) : 0;
                    return (
                      <div key={sym.symptom} className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/35 p-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[13px] font-medium text-[#30232A]">{sym.symptom}</div>
                          <div className="text-[11px] text-[#30232A]/65">
                            {sym.menstrualCoincidenceCount > 0 ? `${sym.menstrualCoincidenceCount} during menses` : ''}
                            {sym.menstrualCoincidenceCount > 0 && outsideCount > 0 ? ' • ' : ''}
                            {outsideCount > 0 ? `${outsideCount} outside menses` : ''}
                          </div>
                        </div>
                        <span className="text-[12px] font-semibold text-[#890149] tabular-nums px-2 py-0.5 rounded bg-[#EADCE0]/50">
                          {sym.count}x ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/35 p-3 text-[12px] text-[#30232A]/70 italic">
                  No physical symptoms logged in Daily Check-in within this {timeWindowDays}-day period.
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#30232A]/65">
              Reflects symptoms submitted in Daily Check-ins.
            </div>
          </div>

          {/* Card 3: Metabolic & Vitality */}
          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                  METABOLIC &amp; NOURISHMENT
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F3F3E7] text-[#30232A]/80">
                  Daily Check-in Logs
                </span>
              </div>
              <div className="text-[14px] font-semibold text-[#30232A]">Hydration &amp; Meal Rhythm</div>
              <div className="text-[18px] font-bold text-[#30232A] tabular-nums">
                {analysis.hydrationSummary.loggedDays > 0 && analysis.hydrationSummary.averageCups != null
                  ? `~${analysis.hydrationSummary.averageCups} cups/day avg`
                  : 'Hydration not yet tracked'}
              </div>
              <p className="text-[12px] leading-[18px] text-[#30232A]/75">
                {analysis.mealSummary.loggedDays > 0
                  ? `${analysis.mealSummary.breakfastCount + analysis.mealSummary.lunchCount + analysis.mealSummary.dinnerCount} meals logged across ${analysis.mealSummary.loggedDays} days.`
                  : 'Log meals and water intake to observe energy correlations across your cycle.'}
              </p>
            </div>

            <div className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/35 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-[#30232A]/80">Check-in frequency</span>
                <span className="text-[#890149] tabular-nums">{analysis.coverage.checkInCoveragePercent}% of days</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EADCE0] overflow-hidden">
                <div className="h-full bg-[#890149]" style={{ width: `${Math.min(analysis.coverage.checkInCoveragePercent, 100)}%` }} />
              </div>
            </div>

            <div className="rounded-[6px] bg-[#F3F3E7] px-3 py-2 flex items-start gap-2 text-[11px] leading-[16px] text-[#30232A]/75">
              <Clock className="w-3.5 h-3.5 text-[#890149] shrink-0 mt-0.5" />
              <span>
                Helps your clinical team explore potential postprandial glucose dynamics and lifestyle patterns.
              </span>
            </div>
          </div>

          {/* Card 4: Metrics Preference */}
          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                  METRICS PREFERENCE
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F3F3E7] text-[#30232A]/80">
                  User-Controlled
                </span>
              </div>

              <div className="flex items-center gap-2 text-[14px] font-semibold text-[#30232A]">
                <Scale className="w-4 h-4 text-[#890149]" />
                <span>Body Weight Monitoring</span>
              </div>

              <div className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/35 p-3.5 space-y-1.5">
                <div className="text-[11px] font-semibold text-[#890149]">Current setting:</div>
                <div className="text-[14px] font-semibold text-[#30232A]">
                  {weightMonitoringOptIn
                    ? 'Optional weight logging enabled'
                    : 'Not monitored (User opted out)'}
                </div>
                <p className="text-[12px] leading-[18px] text-[#30232A]/75">
                  Weight tracking is entirely optional. You control whether scale metrics are included in
                  your care journey, protecting mental peace and reducing scale-induced anxiety.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setWeightMonitoringOptIn(!weightMonitoringOptIn)}
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#890149] hover:underline"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{weightMonitoringOptIn ? 'Opt out of weight tracking' : 'Opt in to weight tracking'}</span>
            </button>
          </div>
        </div>

        {/* LONGITUDINAL PATTERN FINDINGS REVIEW */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif-elvi text-[19px] text-[#30232A]">
                Longitudinal Pattern Findings
              </h3>
              <p className="text-[13px] text-[#30232A]/75">
                Computed from your logged check-in entries and menstrual events. Kept as structured observations for collaborative clinical review.
              </p>
            </div>
            <span className="text-[12px] font-semibold text-[#890149] tabular-nums px-2.5 py-1 rounded bg-[#EADCE0]">
              {analysis.findings.filter((f) => !dismissedFindingIds.includes(f.id)).length} identified
            </span>
          </div>

          <div className="space-y-3">
            {analysis.findings
              .filter((f) => !dismissedFindingIds.includes(f.id))
              .map((finding) => {
                const isReviewed = reviewedFindingIds.includes(finding.id);
                return (
                  <div
                    key={finding.id}
                    className={`rounded-[12px] border p-5 transition-all ${
                      isReviewed
                        ? 'bg-[#FAF9F0]/60 border-[#D9A2B5]/30 opacity-80'
                        : 'bg-[#FAF9F0] border-[#D9A2B5]/60 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EADCE0] text-[#890149]">
                            {finding.category}
                          </span>
                          <h4 className="text-[15px] font-semibold text-[#30232A]">
                            {finding.title}
                          </h4>
                          {isReviewed && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" /> Reviewed
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] leading-[20px] text-[#30232A]/85">
                          {finding.summary}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleReview(finding.id)}
                          className={`px-3 py-1.5 rounded-[6px] text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5 ${
                            isReviewed
                              ? 'bg-[#F3F3E7] text-[#30232A]/70 hover:text-[#30232A]'
                              : 'bg-[#890149] text-[#F3F3E7] hover:bg-[#890149]/90'
                          }`}
                        >
                          {isReviewed ? 'Unmark review' : 'Mark as Reviewed'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissFinding(finding.id)}
                          title="Dismiss this finding"
                          className="p-1.5 rounded-[6px] text-[#30232A]/50 hover:text-[#890149] hover:bg-[#EADCE0]/40 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Supporting Evidence & Guidance */}
                    <div className="mt-3.5 pt-3 border-t border-[#D9A2B5]/30 grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
                      <div className="rounded-[8px] bg-[#F3F3E7] p-2.5">
                        <span className="font-semibold text-[#30232A] block mb-0.5">Supporting Evidence:</span>
                        <span className="text-[#30232A]/75">
                          {finding.recordsCount} record(s) across dates: {finding.supportingDates.slice(0, 3).join(', ')}{finding.supportingDates.length > 3 ? '...' : ''}
                        </span>
                      </div>
                      <div className="rounded-[8px] bg-[#F3F3E7] p-2.5">
                        <span className="font-semibold text-[#890149] block mb-0.5">Clinical Discussion Topic:</span>
                        <span className="text-[#30232A]/75">
                          {finding.clinicalSignificance}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-[#30232A]/60 italic">
                      A pattern worth discussing with a healthcare professional. Not a clinical diagnosis.
                    </div>
                  </div>
                );
              })}

            {analysis.findings.filter((f) => !dismissedFindingIds.includes(f.id)).length === 0 && (
              <div className="rounded-[10px] bg-[#FAF9F0] border border-[#D9A2B5]/40 p-6 text-center text-[#30232A]/70 text-[13px]">
                No elevated pattern clusters identified in this {timeWindowDays}-day window. Continue consistent daily check-ins to build observational history.
              </div>
            )}
          </div>
        </div>

        {/* LONGITUDINAL AI REFLECTION */}
        <div className="rounded-[12px] bg-gradient-to-br from-[#FAF9F0] to-[#F3F3E7] border border-[#D9A2B5]/60 p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#890149]" />
                <h3 className="text-[15px] font-semibold text-[#30232A]">
                  Longitudinal AI Reflection
                </h3>
              </div>
              <p className="text-[12px] text-[#30232A]/75 mt-0.5">
                Generate an observational, non-diagnostic reflection grounded in your recorded {timeWindowDays}-day patterns.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRequestAiExplanation}
              disabled={isExplaining}
              className="px-4 py-2 rounded-[8px] bg-[#890149] text-[#F3F3E7] text-[13px] font-semibold hover:bg-[#890149]/90 disabled:opacity-50 transition-colors inline-flex items-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isExplaining ? 'Reflecting on patterns...' : 'Request AI Explanation'}</span>
            </button>
          </div>

          {explainError && (
            <div className="rounded-[8px] bg-red-50 border border-red-200 p-3 text-[12px] text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{explainError}</span>
            </div>
          )}

          {aiExplanation && (
            <div className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/40 p-4 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#890149]">
                Grounded Observational Summary
              </div>
              <p className="text-[13px] leading-[22px] text-[#30232A]/90 whitespace-pre-line">
                {aiExplanation}
              </p>
              <div className="pt-2 text-[11px] text-[#30232A]/60 border-t border-[#D9A2B5]/30">
                Generated strictly from your recorded symptom frequencies and cycle intervals. This reflection is observational and never constitutes a diagnosis or medical treatment plan.
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[8px] bg-[#FAF9F0] border border-[#D9A2B5]/45 px-4 py-3 flex items-center gap-2.5 text-[12px] text-[#30232A]/80">
          <ShieldCheck className="w-4 h-4 text-[#890149] shrink-0" />
          <span>
            <strong className="font-semibold text-[#30232A]">Observation Guardrail:</strong> Pattern
            summaries are compiled solely from your logged check-ins and cycles. They do not constitute
            diagnostic criteria, endocrine lab values, or hormonal measurements.
          </span>
        </div>
      </section>

      {/* COLLABORATIVE HEALTH · Personal Care Notes & Consultation Prep */}
      <section aria-labelledby="collaborative-health-heading" className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149]/80 mb-1">
            COLLABORATIVE HEALTH
          </div>
          <h2 id="collaborative-health-heading" className="font-serif-elvi text-[22px] text-[#30232A]">
            Personal Care Notes &amp; Consultation Prep
          </h2>
          <p className="text-[14px] text-[#30232A]/80 mt-0.5">
            Organise questions, personal observations, and clinician guidance ready for your next
            appointment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Questions for my Next Consultation */}
          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[14px] font-semibold text-[#30232A]">
                  <HelpCircle className="w-4 h-4 text-[#890149]" />
                  <span>Questions for my Next Consultation</span>
                </div>
                <span className="text-[12px] text-[#890149] font-medium tabular-nums">
                  {consultationQuestions.length} queued
                </span>
              </div>

              <div className="space-y-2.5">
                {consultationQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/35 p-3.5 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 text-[13px] leading-[20px] text-[#30232A]">
                      <span className="font-semibold text-[#890149] tabular-nums">{q.numberLabel}</span>
                      <span>{q.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeConsultationQuestion(q.id)}
                      aria-label="Remove question"
                      className="text-[#30232A]/50 hover:text-[#890149] p-0.5 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {addingQuestion && (
                <form onSubmit={handleSaveQuestion} className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={questionDraft}
                    onChange={(e) => setQuestionDraft(e.target.value)}
                    placeholder="Enter question for your gynaecologist or endocrinologist..."
                    className="w-full px-3 py-2 rounded-[6px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[13px]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddingQuestion(false)}
                      className="px-3 py-1 text-[12px] text-[#30232A]/70"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-[#890149] text-[#F3F3E7] text-[12px] font-semibold"
                    >
                      Save Question
                    </button>
                  </div>
                </form>
              )}
            </div>

            <button
              type="button"
              onClick={() => setAddingQuestion(true)}
              className="w-full py-2.5 rounded-[8px] border border-[#D9A2B5]/65 bg-[#F3F3E7] text-[13px] font-semibold text-[#890149] hover:bg-[#EADCE0]/50 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add a question</span>
            </button>
          </div>

          {/* Right: Care Notes & Guidance */}
          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[14px] font-semibold text-[#30232A]">
                  <FileText className="w-4 h-4 text-[#890149]" />
                  <span>Care Notes &amp; Guidance</span>
                </div>
                <span className="text-[12px] text-[#890149] font-medium">Latest Entry</span>
              </div>

              <div className="space-y-2.5">
                {careNotes.map((cn) => (
                  <div
                    key={cn.id}
                    className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/35 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#890149] font-medium">
                      <span>
                        {cn.dateLabel} · {cn.sourceLabel}
                      </span>
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[13px] leading-[20px] italic text-[#30232A]">{cn.quote}</p>
                    <div className="text-[11px] text-[#30232A]/70">+ {cn.context}</div>
                  </div>
                ))}
              </div>

              {addingNote && (
                <form onSubmit={handleSaveNote} className="space-y-2 pt-1">
                  <textarea
                    rows={2}
                    value={noteQuoteDraft}
                    onChange={(e) => setNoteQuoteDraft(e.target.value)}
                    placeholder="Record clinician guidance or personal care observation..."
                    className="w-full px-3 py-2 rounded-[6px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[13px]"
                  />
                  <input
                    type="text"
                    value={noteContextDraft}
                    onChange={(e) => setNoteContextDraft(e.target.value)}
                    placeholder="Context (e.g., Consultation with Dr. Thorne)"
                    className="w-full px-3 py-1.5 rounded-[6px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[12px]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddingNote(false)}
                      className="px-3 py-1 text-[12px] text-[#30232A]/70"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-[#890149] text-[#F3F3E7] text-[12px] font-semibold"
                    >
                      Save Note
                    </button>
                  </div>
                </form>
              )}
            </div>

            <button
              type="button"
              onClick={() => setAddingNote(true)}
              className="w-full py-2.5 rounded-[8px] border border-[#D9A2B5]/65 bg-[#F3F3E7] text-[13px] font-semibold text-[#890149] hover:bg-[#EADCE0]/50 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add care note</span>
            </button>
          </div>
        </div>
      </section>

      {/* SUPPORTIVE ECOSYSTEM · Connected Care Tools */}
      <section aria-labelledby="connected-tools-heading" className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149]/80 mb-1">
            SUPPORTIVE ECOSYSTEM
          </div>
          <h2 id="connected-tools-heading" className="font-serif-elvi text-[20px] text-[#30232A]">
            Connected Care Tools
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 space-y-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#EADCE0] flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#890149]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#30232A]">Manage Care Reminders</h3>
            <p className="text-[13px] leading-[20px] text-[#30232A]/80">
              Configure discreet reminders for balanced nourishment, hydration checkpoints, evening
              wind-down, or clinical medication timing.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('reminders')}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#890149] hover:underline"
            >
              <span>Open Reminders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 space-y-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#EADCE0] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#890149]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#30232A]">Prepare a Health Report</h3>
            <p className="text-[13px] leading-[20px] text-[#30232A]/80">
              Compile a print-ready or exportable clinical summary of your confirmed cycle history and
              symptom trends to share directly with your doctor.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('reports')}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#890149] hover:underline"
            >
              <span>Open Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Clinical Dignity & Supportive Guidance */}
      <div className="rounded-[12px] bg-[#F7F7EC] border border-[#D9A2B5]/50 p-6 flex items-start gap-4">
        <div className="w-9 h-9 rounded-full bg-[#EADCE0] flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4 text-[#890149]" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-[14px] font-semibold text-[#30232A]">
            Clinical Dignity &amp; Supportive Guidance
          </h3>
          <p className="text-[13px] leading-[20px] text-[#30232A]/80">
            PCOS/PCOD is a multi-faceted endocrine condition with diverse presentations across individuals.
            ELVI does not diagnose conditions, prescribe medications or hormone therapies, or claim that
            specific foods cure symptoms. If you experience severe pelvic pain, heavy prolonged bleeding,
            or symptoms that disrupt your daily wellbeing, please consult a qualified gynaecologist or
            endocrinologist promptly.
          </p>
          <div className="text-[11px] text-[#890149]/80 pt-1">
            Evidence-informed review · Patient safety protocol v2.4
          </div>
        </div>
      </div>
    </div>
  );
};
