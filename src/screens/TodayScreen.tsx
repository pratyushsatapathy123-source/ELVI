import React from 'react';
import { useElvi } from '../context/ElviContext';
import { AppHeader } from '../components/layout/AppHeader';
import { formatFullDate } from '../lib/dateUtils';
import { AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';

export const TodayScreen: React.FC = () => {
  const { openPeriodModal, navigateTo, periods, todayCheckedIn, todayIso, timeZone, isDemoMode } = useElvi();
  const latestPeriod = periods[0];

  return (
    <div>
      {isDemoMode && (
        <div className="max-w-[780px] mb-6 rounded-[8px] bg-[#EADCE0] border border-[#890149]/60 px-4 py-2.5 flex items-center justify-between text-[12px] font-semibold text-[#890149]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#890149]" />
            <span>SYNTHETIC DEMONSTRATION FIXTURE — NOT REAL PATIENT DATA</span>
          </div>
          <span className="text-[11px] uppercase tracking-wider text-[#30232A]/70">Isolated Sandbox</span>
        </div>
      )}

      {/* Master Header — Single Source of Truth from screen_b8de2e03.png */}
      <AppHeader
        kicker="DAILY BRIEFING"
        title="Welcome to ELVI."
        subtitle={`Your health overview for ${formatFullDate(todayIso, timeZone)}.`}
      />

      {/* Current Cycle Status Card — Exact match to screen_b8de2e03.png */}
      <section
        aria-labelledby="current-cycle-status-heading"
        className="max-w-[780px] rounded-[14px] border border-[#D9A2B5]/55 bg-[#F3F3E7] p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-5">
          <Calendar className="w-5 h-5 text-[#890149] stroke-[2]" />
          <h2
            id="current-cycle-status-heading"
            className="font-serif-elvi text-[20px] sm:text-[22px] leading-[28px] text-[#30232A] font-normal"
          >
            Current Cycle Status
          </h2>
        </div>

        <div className="rounded-[10px] border border-[#D9A2B5]/45 bg-[#F7F7EC]/70 px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {latestPeriod ? (
            <div className="space-y-1">
              <p className="text-[15px] leading-[24px] text-[#30232A] font-medium">
                Latest period logged: <span className="tabular-nums">{latestPeriod.startDate}</span> to{' '}
                <span className="tabular-nums">{latestPeriod.endDate}</span> · Flow: {latestPeriod.flowIntensity}
              </p>
              <p className="text-[14px] leading-[22px] text-[#30232A]/75">
                {latestPeriod.notes || 'Your cycle history is active and synchronized with your Health Timeline.'}
              </p>
            </div>
          ) : (
            <p className="text-[15px] leading-[24px] text-[#30232A]/85 max-w-[460px]">
              No cycle logged yet. Log your last period dates to begin tracking your cycle rhythm, phases,
              and personalized health patterns.
            </p>
          )}

          <button
            type="button"
            onClick={openPeriodModal}
            className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-[8px] border border-[#890149]/75 bg-[#F3F3E7] text-[#890149] text-[14px] font-semibold hover:bg-[#EADCE0]/55 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#890149]"
          >
            <Calendar className="w-4 h-4 text-[#890149]" />
            <span>Log period dates</span>
          </button>
        </div>
      </section>

      {/* Primary Daily Check-in Call to Action — Exact match to screen_b8de2e03.png */}
      <div className="max-w-[780px] mt-12 flex flex-col items-center text-center">
        <button
          type="button"
          onClick={() => navigateTo('daily-check-in')}
          className="min-w-[274px] px-8 py-3.5 rounded-[8px] bg-[#890149] text-[#F3F3E7] text-[15px] font-semibold hover:bg-[#600032] transition-colors inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#890149] focus-visible:ring-offset-2"
        >
          {todayCheckedIn && <CheckCircle2 className="w-4 h-4" />}
          <span>{todayCheckedIn ? "Review today's check-in" : "Complete today's check-in"}</span>
        </button>
        <p className="text-[13px] leading-[20px] text-[#30232A]/75 mt-3">
          {todayCheckedIn
            ? "Today's check-in has been saved to your Health Timeline."
            : 'Takes ~2 minutes to log symptoms, energy, and notes.'}
        </p>
      </div>
    </div>
  );
};
