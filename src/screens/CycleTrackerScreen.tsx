import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  TrendingUp,
  Droplet,
  Activity,
  Trash2,
  Edit3,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { useElvi } from '../context/ElviContext';
import { generateMonthCalendar, getZonedDateParts, formatFullDate } from '../lib/dateUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const CycleTrackerScreen: React.FC = () => {
  const {
    openPeriodModal,
    periods,
    deletePeriodRecord,
    todayIso,
    timeZone,
    cycleStats,
    setEditingPeriod,
  } = useElvi();

  // Dynamic initial month and year from target timezone
  const todayParts = useMemo(() => getZonedDateParts(new Date(), timeZone), [timeZone]);
  const [viewYear, setViewYear] = useState<number>(todayParts.year);
  const [viewMonth, setViewMonth] = useState<number>(todayParts.month);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>(todayIso);

  const monthLabel = `${MONTH_NAMES[viewMonth - 1]} ${viewYear}`;

  // Dynamically generate calendar grid for the viewing month
  const calendarDays = useMemo(
    () => generateMonthCalendar(viewYear, viewMonth, timeZone),
    [viewYear, viewMonth, timeZone]
  );

  const isDateInPeriod = (iso: string) => {
    return periods.some((p) => {
      const end = p.endDate || p.startDate;
      return iso >= p.startDate && iso <= end;
    });
  };

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const parts = getZonedDateParts(new Date(), timeZone);
    setViewYear(parts.year);
    setViewMonth(parts.month);
    setSelectedIsoDate(todayIso);
  };

  return (
    <div className="max-w-[860px]">
      <AppHeader
        kicker="TRACKING · MENSTRUAL RHYTHM"
        title="Cycle Tracker"
        subtitle="Track your periods and understand your cycle patterns with clinical honesty and calm clarity."
        rightAction={
          <button
            type="button"
            onClick={openPeriodModal}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-[8px] bg-[#890149] text-[#F3F3E7] text-[14px] font-semibold hover:bg-[#600032] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#890149]"
          >
            <Calendar className="w-4 h-4" />
            <span>Log period dates</span>
          </button>
        }
      />

      {/* Calendar Container — Matches screen_a75990f1.png */}
      <section
        aria-label="Cycle Calendar"
        className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-6 sm:p-8 mb-10"
      >
        {/* Calendar Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-baseline gap-3">
            <h2 className="text-[16px] font-semibold text-[#30232A]">{monthLabel}</h2>
            <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#890149]/80">
              {periods.length === 0 ? 'UNLOGGED CYCLE' : `${periods.length} LOGGED RECORD(S)`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-[6px] text-[#30232A]/75 hover:bg-[#EADCE0]/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleJumpToToday}
              className="text-[14px] font-semibold text-[#890149] hover:underline px-2 py-1"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-[6px] text-[#30232A]/75 hover:bg-[#EADCE0]/50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-[13px] font-semibold text-[#890149] py-1.5">
              {d}
            </div>
          ))}
        </div>

        {/* Dynamic Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((cell) => {
            const isPeriod = isDateInPeriod(cell.isoDate);
            const isSelected = selectedIsoDate === cell.isoDate;
            return (
              <button
                key={cell.isoDate}
                type="button"
                onClick={() => setSelectedIsoDate(cell.isoDate)}
                className={`h-[68px] sm:h-[76px] p-2.5 rounded-[6px] text-left flex flex-col justify-between transition-colors border ${
                  isPeriod
                    ? 'bg-[#EADCE0] border-[#890149] text-[#890149]'
                    : cell.isToday
                    ? 'bg-[#EBE9DF] border-[#890149] text-[#30232A] shadow-sm font-semibold'
                    : cell.isCurrentMonth
                    ? 'bg-[#F3F3E7]/85 border-transparent hover:border-[#D9A2B5]/60 text-[#30232A]'
                    : 'bg-[#F3F3E7]/40 border-transparent text-[#30232A]/30'
                } ${isSelected ? 'ring-2 ring-[#890149]' : ''}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[13px] tabular-nums ${
                      cell.isToday || isPeriod ? 'font-bold' : 'font-normal'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {(cell.isToday || isPeriod) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#890149]" aria-hidden="true" />
                  )}
                </div>

                {cell.isToday && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#890149]">
                    TODAY
                  </span>
                )}
                {!cell.isToday && isPeriod && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#890149]">
                    PERIOD
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Summary Banner */}
        <div className="mt-4 pt-3 border-t border-[#D9A2B5]/30 flex flex-wrap items-center justify-between text-[12px] text-[#30232A]/75">
          <span>Selected date: <strong className="text-[#30232A] font-semibold">{formatFullDate(selectedIsoDate, timeZone)}</strong></span>
          <span className="text-[#890149] font-medium">{isDateInPeriod(selectedIsoDate) ? 'Marked as Period Bleeding' : 'No flow recorded for this day'}</span>
        </div>

        {/* Honest Estimation Notice */}
        <div className="mt-6 rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/40 p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-[#890149] shrink-0 mt-0.5" />
          <div className="text-[13px] leading-[20px] text-[#30232A]/85">
            <div className="font-semibold text-[#30232A] mb-0.5">
              {periods.length === 0 ? 'No period records logged yet' : 'Confirmed cycle tracking active'}
            </div>
            <p>
              Use <strong className="font-semibold text-[#30232A]">&quot;Log period dates&quot;</strong> to
              record your cycle history. Cycle predictions are calculated strictly from confirmed logs without fabricated estimates.
            </p>
          </div>
        </div>
      </section>

      {/* Cycle Parameters Section — Programmatically Computed */}
      <section aria-labelledby="cycle-parameters-heading" className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 id="cycle-parameters-heading" className="text-[16px] font-semibold text-[#30232A]">
            Cycle Parameters
          </h2>
          <span className="text-[13px] text-[#890149]/85">
            {periods.length === 0 ? 'Awaiting initial entries' : `${periods.length} cycle(s) recorded`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-[10px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                CYCLE LENGTH
              </span>
              <TrendingUp className="w-4 h-4 text-[#30232A]/70" />
            </div>
            <div className="text-[22px] font-semibold text-[#30232A] tabular-nums mb-1">
              {cycleStats.cycleLengthAverage ? `${cycleStats.cycleLengthAverage} days` : '—'}
            </div>
            <p className="text-[13px] leading-[19px] text-[#30232A]/75">
              {cycleStats.cycleLengthRange
                ? `Interval range: ${cycleStats.cycleLengthRange.min}–${cycleStats.cycleLengthRange.max} days (${cycleStats.usableCyclesCount} completed interval${cycleStats.usableCyclesCount > 1 ? 's' : ''})`
                : cycleStats.dataSufficiencyMessage}
            </p>
          </div>

          <div className="rounded-[10px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                PERIOD DURATION
              </span>
              <Droplet className="w-4 h-4 text-[#30232A]/70" />
            </div>
            <div className="text-[22px] font-semibold text-[#30232A] tabular-nums mb-1">
              {cycleStats.periodDurationAverage ? `${cycleStats.periodDurationAverage} days` : '—'}
            </div>
            <p className="text-[13px] leading-[19px] text-[#30232A]/75">
              {cycleStats.periodDurationRange
                ? `Duration span: ${cycleStats.periodDurationRange.min}–${cycleStats.periodDurationRange.max} days · Latest flow: ${periods[0]?.flowIntensity || 'Noted'}`
                : periods.length >= 1 && !periods[0].endDate
                ? 'Bleeding is ongoing for your latest period'
                : 'Available as you add period records with confirmed end dates'}
            </p>
          </div>

          <div className="rounded-[10px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                CYCLE PATTERN
              </span>
              <Activity className="w-4 h-4 text-[#30232A]/70" />
            </div>
            <div className="text-[15px] font-semibold text-[#30232A] mb-1">
              {cycleStats.hasSufficientDataForPattern
                ? cycleStats.isRegular
                  ? 'Consistent Rhythm'
                  : 'Variable Intervals'
                : 'No pattern established'}
            </div>
            <p className="text-[13px] leading-[19px] text-[#30232A]/75">
              {cycleStats.hasSufficientDataForPattern
                ? cycleStats.irregularityNotice || `Cycle variation within ${cycleStats.variabilityDays || 0} days`
                : 'Requires 3+ logged cycles to evaluate rhythm pattern'}
            </p>
          </div>
        </div>
      </section>

      {/* Recorded Periods Section */}
      <section aria-labelledby="recorded-periods-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="recorded-periods-heading" className="text-[16px] font-semibold text-[#30232A]">
            Recorded Periods
          </h2>
          <span className="text-[13px] text-[#890149]/85 tabular-nums">{periods.length} logs</span>
        </div>

        {periods.length === 0 ? (
          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-10 text-center flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-[#EADCE0]/70 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5 text-[#890149]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#30232A] mb-1.5">
              No period dates recorded yet
            </h3>
            <p className="text-[13px] leading-[20px] text-[#30232A]/75 max-w-md mb-5">
              Once you log your period start and end dates, your chronological cycle history and flow notes
              will appear here with editing options.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingPeriod(null);
                openPeriodModal();
              }}
              className="px-5 py-2.5 rounded-[8px] bg-[#890149] text-[#F3F3E7] text-[13px] font-semibold hover:bg-[#600032] transition-colors"
            >
              Log your first period
            </button>
          </div>
        ) : (
          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 divide-y divide-[#D9A2B5]/35 overflow-hidden">
            {periods.map((p) => (
              <div key={p.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-semibold text-[#30232A] tabular-nums">
                      {p.startDate} → {p.endDate || '(bleeding ongoing)'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EADCE0] text-[#890149] text-[11px] font-semibold">
                      {p.flowIntensity} Flow
                    </span>
                    {!p.endDate && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FAF9F0] border border-[#D9A2B5] text-[#30232A]/80 text-[10px] font-medium">
                        Open Period
                      </span>
                    )}
                  </div>
                  {p.notes && <p className="text-[13px] text-[#30232A]/75">{p.notes}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPeriod(p);
                      openPeriodModal();
                    }}
                    aria-label={`Edit record for ${p.startDate}`}
                    className="p-2 rounded-[6px] text-[#30232A]/70 hover:text-[#890149] hover:bg-[#EADCE0]/50 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePeriodRecord(p.id)}
                    aria-label={`Delete record for ${p.startDate}`}
                    className="p-2 rounded-[6px] text-[#30232A]/60 hover:text-[#890149] hover:bg-[#EADCE0]/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
