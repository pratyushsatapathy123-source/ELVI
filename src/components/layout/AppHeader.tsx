import React from 'react';

interface AppHeaderProps {
  kicker: string;
  title: string;
  subtitle: string;
  rightMeta?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  kicker,
  title,
  subtitle,
  rightMeta,
  rightAction,
}) => {
  return (
    <header className="mb-8">
      {/* Kicker Row — matches Master Today screen's "• DAILY BRIEFING" */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#890149] shrink-0"
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149]/85">
            {kicker}
          </span>
        </div>
        {rightMeta && <div className="text-[13px] text-[#30232A]/75">{rightMeta}</div>}
      </div>

      {/* Main Title & Optional Screen-Specific Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif-elvi text-[32px] sm:text-[36px] leading-[40px] sm:leading-[44px] font-normal text-[#30232A] tracking-tight">
            {title}
          </h1>
          <p className="text-[15px] sm:text-[16px] leading-[24px] text-[#30232A]/80 mt-1 max-w-2xl">
            {subtitle}
          </p>
        </div>
        {rightAction && <div className="shrink-0">{rightAction}</div>}
      </div>
    </header>
  );
};
