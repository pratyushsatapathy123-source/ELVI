import React, { useState } from 'react';
import {
  Calendar,
  Share,
  Droplet,
  Heart,
  Utensils,
  FileEdit,
  Apple,
  Activity,
  CheckCircle2,
  MinusCircle,
  Info,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Lightbulb,
  Clock,
  FileText,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { useElvi } from '../context/ElviContext';
import { TimelineEntry } from '../types/elvi';

type FilterTab = 'all' | 'menstrual' | 'symptoms' | 'nourishment' | 'clinical' | 'notes' | 'insights';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'insights', label: 'ELVI Health Insights' },
  { id: 'menstrual', label: 'Menstrual cycle' },
  { id: 'symptoms', label: 'Symptoms & wellbeing' },
  { id: 'nourishment', label: 'Food & hydration' },
  { id: 'clinical', label: 'Clinical records' },
  { id: 'notes', label: 'Personal notes' },
];

export const HealthTimelineScreen: React.FC = () => {
  const {
    timelineEntries,
    handleTimelineProposal,
    openPeriodModal,
    navigateTo,
    dismissTimelineInsight,
    toggleReviewTimelineInsight,
  } = useElvi();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [dateWindow, setDateWindow] = useState<'30d' | '60d' | '90d'>('30d');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const filteredEntries = timelineEntries.filter((entry) =>
    activeFilter === 'all' ? true : entry.category === activeFilter
  );

  // Group entries by dateLabel while preserving chronological order
  const groupedByDate: { dateLabel: string; cycleDayLabel?: string; items: TimelineEntry[] }[] = [];
  filteredEntries.forEach((entry) => {
    const existing = groupedByDate.find((g) => g.dateLabel === entry.dateLabel);
    if (existing) {
      if (!existing.cycleDayLabel && entry.cycleDayLabel) {
        existing.cycleDayLabel = entry.cycleDayLabel;
      }
      existing.items.push(entry);
    } else {
      groupedByDate.push({
        dateLabel: entry.dateLabel,
        cycleDayLabel: entry.cycleDayLabel,
        items: [entry],
      });
    }
  });

  const handleExportSummary = () => {
    setExportNotice(
      'Chronological consultation summary prepared. Opening Reports to review or download your PDF.'
    );
    setTimeout(() => {
      navigateTo('reports');
    }, 1000);
  };

  return (
    <div className="max-w-[940px]">
      <AppHeader
        kicker="CHRONOLOGICAL HEALTH JOURNAL · SYNCHRONIZED VIEW"
        title="Health Timeline"
        subtitle="Your health history, all in one place. A unified, chronological record of your logged cycles, daily wellbeing, meals, hydration, and clinical notes to help you notice patterns and prepare for care consultations."
        rightAction={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[8px] bg-[#FAF9F0] border border-[#D9A2B5]/55 text-[13px] font-semibold text-[#30232A]">
              <Calendar className="w-4 h-4 text-[#890149]" />
              <select
                aria-label="Timeline date range"
                value={dateWindow}
                onChange={(e) => setDateWindow(e.target.value as '30d' | '60d' | '90d')}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="30d">Past 30 days</option>
                <option value="60d">Past 60 days</option>
                <option value="90d">Past 90 days</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportSummary}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#FAF9F0] border border-[#D9A2B5]/55 text-[13px] font-semibold text-[#890149] hover:bg-[#EADCE0]/50 transition-colors whitespace-nowrap"
            >
              <Share className="w-4 h-4" />
              <span>Export summary for consultation</span>
            </button>
          </div>
        }
      />

      {exportNotice && (
        <div className="mb-6 rounded-[8px] bg-[#EADCE0]/75 border border-[#890149]/40 px-4 py-3 text-[13px] font-medium text-[#30232A]">
          {exportNotice}
        </div>
      )}

      {/* Filter Bar — Matches screen_dd993863.png */}
      <div className="flex flex-wrap items-center gap-2 mb-8" role="tablist" aria-label="Filter timeline entries">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-[6px] text-[13px] font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#890149] text-[#F3F3E7]'
                  : 'bg-[#FAF9F0] border border-[#D9A2B5]/40 text-[#30232A] hover:bg-[#EADCE0]/45'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {groupedByDate.length === 0 ? (
        <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-10 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#EADCE0]/70 flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-[#890149]" />
          </div>
          <h3 className="font-serif-elvi text-[20px] text-[#30232A] mb-2">No timeline entries on record</h3>
          <p className="text-[14px] text-[#30232A]/75 max-w-md mb-6 leading-[22px]">
            Your chronological health history will populate automatically as you record periods, submit daily wellbeing check-ins, or confirm observations with the AI Companion.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo('daily-check-in')}
              className="px-5 py-2.5 rounded-[8px] bg-[#890149] text-[#F3F3E7] text-[13px] font-semibold hover:bg-[#600032]"
            >
              Complete Today's Check-in
            </button>
            <button
              type="button"
              onClick={openPeriodModal}
              className="px-5 py-2.5 rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[13px] font-semibold text-[#890149] hover:bg-[#EADCE0]/50"
            >
              Log Period Dates
            </button>
          </div>
        </div>
      ) : (
        /* Chronological Timeline Stream */
        <div className="space-y-10 relative before:content-[''] before:absolute before:left-[13px] before:top-4 before:bottom-4 before:w-[1px] before:bg-[#D9A2B5]/55">
          {groupedByDate.map((group, groupIdx) => (
            <section key={group.dateLabel} className="relative pl-10 space-y-4">
            {/* Timeline Date Node */}
            <div
              className={`absolute left-0 top-0.5 w-7 h-7 rounded-full flex items-center justify-center border ${
                groupIdx === 0
                  ? 'bg-[#890149] border-[#890149] text-[#F3F3E7]'
                  : 'bg-[#F3F3E7] border-[#D9A2B5] text-[#30232A]/75'
              }`}
            >
              {groupIdx === 0 ? (
                <Calendar className="w-3.5 h-3.5" />
              ) : groupIdx === 1 ? (
                <Clock className="w-3.5 h-3.5" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
            </div>

            {/* Date Heading */}
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-serif-elvi text-[22px] leading-[30px] text-[#30232A]">
                {group.dateLabel}
              </h2>
              {group.cycleDayLabel && (
                <span className="text-[11px] font-semibold text-[#890149] bg-[#EADCE0] px-2.5 py-0.5 rounded-full">
                  {group.cycleDayLabel}
                </span>
              )}
            </div>

            {/* Cards for this date */}
            <div className="space-y-4">
              {group.items.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 sm:p-6"
                >
                  {/* Card Top Meta Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-[0.04em] ${
                          entry.category === 'clinical'
                            ? 'bg-[#574147] text-[#F3F3E7]'
                            : 'bg-[#EADCE0] text-[#890149]'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                        <span>{entry.sourceBadge}</span>
                      </span>
                      <span className="text-[12px] text-[#30232A]/65 tabular-nums">{entry.timeLabel}</span>
                    </div>

                    {entry.category === 'menstrual' && (
                      <button
                        type="button"
                        onClick={openPeriodModal}
                        className="text-[12px] font-semibold text-[#890149] hover:underline"
                      >
                        Edit entry ✎
                      </button>
                    )}
                    {entry.category === 'symptoms' && (
                      <button
                        type="button"
                        onClick={() => navigateTo('daily-check-in')}
                        className="text-[12px] font-semibold text-[#890149] hover:underline"
                      >
                        View check-in →
                      </button>
                    )}
                    {entry.category === 'nourishment' && entry.mealsSummary && (
                      <button
                        type="button"
                        onClick={() => navigateTo('daily-check-in')}
                        className="text-[12px] font-semibold text-[#890149] hover:underline"
                      >
                        Add snack or fluid +
                      </button>
                    )}
                    {entry.category === 'clinical' && (
                      <button
                        type="button"
                        onClick={() => navigateTo('reports')}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#890149] hover:underline"
                      >
                        <span>View original document</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="flex items-start gap-3.5">
                    <div className="mt-1 shrink-0 text-[#890149]">
                      {entry.category === 'menstrual' && <Droplet className="w-5 h-5" />}
                      {entry.category === 'symptoms' && <Heart className="w-5 h-5" />}
                      {entry.category === 'nourishment' && entry.mealsSummary && (
                        <Utensils className="w-5 h-5" />
                      )}
                      {entry.category === 'nourishment' && !entry.mealsSummary && (
                        <Apple className="w-5 h-5" />
                      )}
                      {entry.category === 'notes' && <FileEdit className="w-5 h-5" />}
                      {entry.category === 'clinical' && <Activity className="w-5 h-5" />}
                      {entry.category === 'insights' && <Sparkles className="w-5 h-5 text-[#890149]" />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <h3 className="text-[16px] font-semibold text-[#30232A]">{entry.title}</h3>
                        {entry.description && (
                          <p
                            className={`text-[14px] leading-[22px] text-[#30232A]/85 mt-1 ${
                              entry.category === 'notes'
                                ? 'italic bg-[#F3F3E7] p-3.5 rounded-[8px] border border-[#D9A2B5]/35'
                                : ''
                            }`}
                          >
                            {entry.description}
                          </p>
                        )}
                      </div>

                      {/* Tags */}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-1 rounded-[6px] bg-[#F3F3E7] border border-[#D9A2B5]/40 text-[12px] text-[#30232A]/80"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Symptom Cards */}
                      {entry.symptomCards && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                          {entry.symptomCards.map((sc) => (
                            <div
                              key={sc.title}
                              className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/40 p-3 flex items-start gap-2"
                            >
                              {sc.status === 'reported' ? (
                                <CheckCircle2 className="w-4 h-4 text-[#890149] shrink-0 mt-0.5" />
                              ) : (
                                <MinusCircle className="w-4 h-4 text-[#30232A]/45 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <div className="text-[12px] font-semibold text-[#30232A]">{sc.title}</div>
                                <div className="text-[12px] text-[#30232A]/70">{sc.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Meals & Hydration Summary */}
                      {entry.mealsSummary && (
                        <div className="space-y-2 pt-1">
                          <div className="grid grid-cols-1 gap-1.5 text-[13px]">
                            {entry.mealsSummary.breakfast && (
                              <div className="flex flex-col sm:flex-row sm:gap-3">
                                <span className="font-semibold text-[#890149] w-24 shrink-0">
                                  Breakfast:
                                </span>
                                <span className="text-[#30232A]/85">{entry.mealsSummary.breakfast}</span>
                              </div>
                            )}
                            {entry.mealsSummary.lunch && (
                              <div className="flex flex-col sm:flex-row sm:gap-3">
                                <span className="font-semibold text-[#890149] w-24 shrink-0">Lunch:</span>
                                <span className="text-[#30232A]/85">{entry.mealsSummary.lunch}</span>
                              </div>
                            )}
                            {entry.mealsSummary.dinner && (
                              <div className="flex flex-col sm:flex-row sm:gap-3">
                                <span className="font-semibold text-[#890149] w-24 shrink-0">Dinner:</span>
                                <span className="text-[#30232A]/85">{entry.mealsSummary.dinner}</span>
                              </div>
                            )}
                            <div className="flex flex-col sm:flex-row sm:gap-3">
                              <span className="font-semibold text-[#890149] w-24 shrink-0">
                                Hydration:
                              </span>
                              <span className="text-[#30232A]/85">{entry.mealsSummary.hydration}</span>
                            </div>
                          </div>

                          <div className="rounded-[6px] bg-[#F3F3E7] px-3 py-2 flex items-center gap-2 text-[12px] text-[#30232A]/75">
                            <Info className="w-3.5 h-3.5 text-[#890149] shrink-0" />
                            <span>
                              Logged as supportive nourishment observations — ELVI provides mindful tracking
                              with no calorie counting or judgment.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Reviewable AI Pattern Proposal */}
                      {entry.aiProposal && entry.aiProposal.status === 'pending' && (
                        <div className="rounded-[10px] bg-[#F3F3E7] border border-[#D9A2B5]/60 p-4 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>AI PATTERN PROPOSAL · REVIEWABLE</span>
                            </div>
                            <span className="text-[11px] text-[#30232A]/65">
                              Unconfirmed until approved
                            </span>
                          </div>
                          <p className="text-[13px] leading-[20px] text-[#30232A]/85">
                            {entry.aiProposal.text}
                          </p>
                          <div className="flex items-center gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleTimelineProposal(entry.id, 'confirmed')}
                              className="px-3.5 py-1.5 rounded-[6px] bg-[#890149] text-[#F3F3E7] text-[12px] font-semibold hover:bg-[#600032] transition-colors"
                            >
                              Confirm pattern
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTimelineProposal(entry.id, 'dismissed')}
                              className="px-3.5 py-1.5 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/60 text-[#30232A] text-[12px] font-medium hover:bg-[#EADCE0]/40 transition-colors"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}

                      {entry.aiProposal && entry.aiProposal.status === 'confirmed' && (
                        <div className="rounded-[8px] bg-[#EADCE0]/60 px-3.5 py-2 text-[12px] font-medium text-[#890149]">
                          ✓ Pattern association confirmed by user and saved to cycle context.
                        </div>
                      )}

                      {/* Clinical Lab Panel */}
                      {entry.clinicalLab && (
                        <div className="space-y-3 pt-1">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {entry.clinicalLab.metrics.map((m) => (
                              <div
                                key={m.label}
                                className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/45 p-3.5"
                              >
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#890149]">
                                    {m.label}
                                  </span>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#EADCE0]/70 text-[#30232A]">
                                    {m.specimen}
                                  </span>
                                </div>
                                <div className="text-[20px] font-bold text-[#30232A] tabular-nums">
                                  {m.value}{' '}
                                  <span className="text-[12px] font-normal text-[#30232A]/70">
                                    {m.unit}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#30232A]/65 mt-1 tabular-nums">
                                  {m.range}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-start gap-2 text-[12px] text-[#30232A]/75 pt-1">
                            <ShieldCheck className="w-4 h-4 text-[#890149] shrink-0 mt-0.5" />
                            <span>
                              <strong className="font-semibold text-[#30232A]">Clinical Integrity:</strong>{' '}
                              Preserved exactly as provided by clinical provider. ELVI presents clinical
                              records for consultation reference and does not infer medical diagnoses.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Health Insight Card */}
                      {entry.category === 'insights' && entry.insightData && (
                        <div className="space-y-3 pt-1">
                          <div className="rounded-[10px] bg-[#F7F6EE] border border-[#D9A2B5]/60 p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#890149]" />
                                <span className="text-[12px] font-semibold text-[#890149] uppercase tracking-wider">
                                  {entry.insightData.category} Pattern Observation
                                </span>
                              </div>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#EADCE0] text-[#890149] capitalize">
                                Confidence: {entry.insightData.confidence.replace('_', ' ')}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                              <div className="rounded-[6px] bg-[#FAF9F0] p-2.5 border border-[#D9A2B5]/35">
                                <strong className="block text-[#30232A] font-semibold mb-0.5">Supporting Records:</strong>
                                <span className="text-[#30232A]/80">
                                  {entry.insightData.recordsCount} record(s) on dates: {entry.insightData.supportingDates.slice(0, 4).join(', ')}
                                  {entry.insightData.supportingDates.length > 4 ? '...' : ''}
                                </span>
                              </div>
                              <div className="rounded-[6px] bg-[#FAF9F0] p-2.5 border border-[#D9A2B5]/35">
                                <strong className="block text-[#890149] font-semibold mb-0.5">Clinical Discussion Topic:</strong>
                                <span className="text-[#30232A]/80">{entry.insightData.clinicalSignificance}</span>
                              </div>
                            </div>

                            {entry.insightData.uncertaintyNotice && (
                              <div className="text-[11px] leading-[16px] text-[#30232A]/70 italic bg-[#FAF9F0] px-3 py-1.5 rounded border border-[#D9A2B5]/30">
                                <strong>Coverage &amp; Uncertainty: </strong>
                                {entry.insightData.uncertaintyNotice}
                              </div>
                            )}

                            <div className="text-[11px] text-[#30232A]/65 italic">
                              A pattern worth discussing with a healthcare professional. Not a clinical diagnosis.
                            </div>

                            {/* Review Actions */}
                            <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-[#D9A2B5]/30">
                              <button
                                type="button"
                                onClick={() => toggleReviewTimelineInsight(entry.insightData!.id)}
                                className={`px-3 py-1.5 rounded-[6px] text-[12px] font-semibold inline-flex items-center gap-1.5 transition-colors ${
                                  entry.insightData.isReviewed
                                    ? 'bg-[#EADCE0] text-[#890149]'
                                    : 'bg-[#890149] text-[#F3F3E7] hover:bg-[#600032]'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{entry.insightData.isReviewed ? 'Reviewed' : 'Mark as Reviewed'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => dismissTimelineInsight(entry.insightData!.id)}
                                className="px-3 py-1.5 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/50 text-[12px] text-[#30232A]/70 hover:text-[#890149] transition-colors"
                              >
                                Dismiss insight
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      )}

      {/* Bottom Dynamic Timeline & Data Dignity Callout */}
      <section className="mt-12 rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-full bg-[#EADCE0] flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-[#890149]" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#30232A]">
              Dynamic Timeline &amp; Data Dignity
            </h3>
            <p className="text-[13px] leading-[20px] text-[#30232A]/80 mt-1 max-w-xl">
              Your timeline compiles records dynamically. As you log daily check-ins or cycle events,
              entries appear automatically in chronological order. Missing days remain unrecorded—ELVI
              never fabricates filler data or assumes patterns without your direct consent.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={openPeriodModal}
            className="px-4 py-2 rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[13px] font-semibold text-[#30232A] hover:bg-[#EADCE0]/50 transition-colors whitespace-nowrap"
          >
            Log cycle event
          </button>
          <button
            type="button"
            onClick={() => navigateTo('daily-check-in')}
            className="px-4 py-2 rounded-[8px] bg-[#890149] text-[#F3F3E7] text-[13px] font-semibold hover:bg-[#600032] transition-colors whitespace-nowrap"
          >
            New check-in
          </button>
        </div>
      </section>
    </div>
  );
};
