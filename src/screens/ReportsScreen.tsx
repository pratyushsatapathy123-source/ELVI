import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  FileSpreadsheet,
  Info,
  FilePlus,
  UploadCloud,
  FileText,
  Plus,
  Stethoscope,
  Download,
  Scale,
  Check,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { useElvi } from '../context/ElviContext';
import { GeneratedReportItem } from '../types/elvi';
import { formatFullDate } from '../lib/dateUtils';
import { downloadReportAsPdf } from '../services/reportPdfGenerator';

export const ReportsScreen: React.FC = () => {
  const {
    reportList,
    generateNewReport,
    uploadClinicalDocument,
    isSynthesizingReport,
    todayIso,
    timeZone,
    isDemoMode,
    navigateTo,
    userProfile,
    periods,
    checkIns,
    timelineEntries,
  } = useElvi();

  const dynamicDataSources = React.useMemo(() => [
    {
      id: 'cycles',
      title: 'Menstrual Cycle History & Flow',
      subtitle: 'Bleeding duration, spotting logs, luteal estimates',
      availability: `${periods.length} cycle(s) recorded`,
      defaultChecked: true,
    },
    {
      id: 'symptoms',
      title: 'Daily Symptoms & Discomfort',
      subtitle: 'Pelvic cramping, bloating, acne severity, headaches',
      availability: `${checkIns.filter((c) => c.symptoms && c.symptoms.length > 0 && !c.symptoms.includes('None today')).length} symptom logs`,
      defaultChecked: true,
    },
    {
      id: 'mood',
      title: 'Mood & Energy Observations',
      subtitle: 'Sleep quality, fatigue ratings, stress index',
      availability: `${checkIns.filter((c) => c.moods && c.moods.length > 0).length} mood entries`,
      defaultChecked: true,
    },
    {
      id: 'food',
      title: 'Food & Nourishment Records',
      subtitle: 'Blood sugar-aware meal timing and cravings',
      availability: `${checkIns.filter((c) => c.meals && (c.meals.breakfast || c.meals.lunch || c.meals.dinner)).length} meal logs`,
      defaultChecked: true,
    },
    {
      id: 'hydration',
      title: 'Hydration Records',
      subtitle: 'Daily fluid intake and electrolyte balance',
      availability: `${checkIns.filter((c) => (c.hydrationCups || 0) > 0).length} hydration logs`,
      defaultChecked: true,
    },
    {
      id: 'notes',
      title: 'Personal Health Notes & Journaling',
      subtitle: 'Subjective contextual reflections and triggers',
      availability: `${checkIns.filter((c) => c.notes && c.notes.trim()).length} reflection notes`,
      defaultChecked: true,
    },
    {
      id: 'labs',
      title: 'Uploaded Clinical & Laboratory Records',
      subtitle: 'Linked laboratory and external clinical panels',
      availability: `${timelineEntries.filter((t) => t.category === 'clinical').length} document(s) linked`,
      defaultChecked: true,
    },
  ], [periods, checkIns, timelineEntries]);

  const [selectedPeriod, setSelectedPeriod] = useState<
    'Last 30 Days' | 'Last 60 Days' | 'Last 90 Days' | 'Custom Range'
  >('Last 60 Days');

  const [selectedSources, setSelectedSources] = useState<Record<string, boolean>>(() =>
    dynamicDataSources.reduce((acc, s) => ({ ...acc, [s.id]: s.defaultChecked }), {})
  );

  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [activeFileSizeLabel, setActiveFileSizeLabel] = useState<string>('');
  const [activeFileData, setActiveFileData] = useState<{ base64?: string; mimeType?: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [activeReportDetail, setActiveReportDetail] = useState<GeneratedReportItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleSource = (id: string) => {
    setSelectedSources((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGenerate = async () => {
    const count = Object.values(selectedSources).filter(Boolean).length;
    setFeedbackBanner(null);
    try {
      const generated = await generateNewReport(selectedPeriod, count, selectedSources);
      setActiveReportDetail(generated);
      setFeedbackBanner(
        `Synthesized new ELVI Health Summary (${selectedPeriod}) across ${count} selected health domains.`
      );
    } catch (err: any) {
      setFeedbackBanner(`Report generation encountered an error: ${err?.message || String(err)}`);
    }
  };

  const handleAddUploadedDoc = async () => {
    if (!activeFileName) return;
    setIsUploading(true);
    try {
      await uploadClinicalDocument(activeFileName, activeFileData?.base64, activeFileData?.mimeType);
      setFeedbackBanner(`Added "${activeFileName}" to your records. Any extracted lab values have been queued for your timeline review.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadPdf = (rep: GeneratedReportItem) => {
    downloadReportAsPdf(rep, userProfile?.name || 'User');
  };

  return (
    <div className="max-w-[960px] space-y-10">
      {isDemoMode && (
        <div className="rounded-[8px] bg-[#EADCE0] border border-[#890149]/60 px-4 py-2.5 flex items-center justify-between text-[12px] font-semibold text-[#890149]">
          <span>SYNTHETIC DEMONSTRATION — NOT A REAL PATIENT REPORT</span>
          <span className="text-[11px] uppercase tracking-wider text-[#30232A]/70">Synthetic Fixture Data</span>
        </div>
      )}

      <AppHeader
        kicker="CLINICAL DOCUMENTATION · SYNTHESIS"
        title="Reports"
        subtitle="Understand your health history and prepare for informed care."
        rightAction={
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#FAF9F0] border border-[#D9A2B5]/55 text-[12px] font-medium text-[#30232A]">
            <ShieldCheck className="w-4 h-4 text-[#890149]" />
            <span>Consent-Governed Records · Private &amp; Encrypted</span>
          </div>
        }
      />

      {feedbackBanner && (
        <div className="rounded-[8px] bg-[#EADCE0]/75 border border-[#890149]/40 px-4 py-3 text-[13px] font-medium text-[#30232A] flex items-center justify-between gap-4">
          <span>{feedbackBanner}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-[12px] font-semibold text-[#890149] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two-Column Synthesis & External Upload Grid — Matches screen_90ed21df.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Generate My ELVI Health Report */}
        <section
          aria-labelledby="generate-report-heading"
          className="lg:col-span-7 rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-6 space-y-6"
        >
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149] mb-1">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>SYNTHESIS ENGINE</span>
            </div>
            <h2 id="generate-report-heading" className="font-serif-elvi text-[24px] text-[#30232A]">
              Generate My ELVI Health Report
            </h2>
            <p className="text-[14px] leading-[22px] text-[#30232A]/80 mt-1">
              Bring together your menstrual history and daily health records into a personalised summary
              ready for medical review.
            </p>
          </div>

          {/* Reporting Period Selector */}
          <div className="rounded-[10px] bg-[#F3F3E7] border border-[#D9A2B5]/40 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-[#30232A]">Reporting Period</span>
              <span className="text-[11px] font-medium text-[#890149] bg-[#EADCE0]/70 px-2 py-0.5 rounded tabular-nums">
                Active: Aug 25, 2026 – Oct 24, 2026 (60 days)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Last 30 Days', 'Last 60 Days', 'Last 90 Days', 'Custom Range'] as const).map((period) => {
                const active = selectedPeriod === period;
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSelectedPeriod(period)}
                    className={`py-2 px-2.5 rounded-[6px] text-[12px] font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#890149] text-[#F3F3E7]'
                        : 'bg-[#FAF9F0] border border-[#D9A2B5]/40 text-[#30232A] hover:bg-[#EADCE0]/45'
                    }`}
                  >
                    {period}
                  </button>
                );
              })}
            </div>

            <p className="text-[12px] leading-[18px] text-[#30232A]/75">
              The selected reporting period determines which recorded observations, check-ins, and cycle
              dates are synthesized.
            </p>
          </div>

          {/* Health Data Sources to Include */}
          <div className="space-y-3">
            <div>
              <h3 className="text-[13px] font-semibold text-[#30232A]">Health Data Sources to Include</h3>
              <p className="text-[12px] text-[#30232A]/75">
                Choose which confirmed records will be analyzed. Availability reflects your actual logged
                history.
              </p>
            </div>

            <div className="space-y-2">
              {dynamicDataSources.map((source) => {
                const checked = !!selectedSources[source.id];
                return (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => toggleSource(source.id)}
                    className="w-full rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/40 p-3.5 flex items-center justify-between gap-4 text-left hover:border-[#890149]/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0 mt-0.5 border ${
                          checked
                            ? 'bg-[#890149] border-[#890149] text-[#F3F3E7]'
                            : 'bg-[#FAF9F0] border-[#D9A2B5]'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-[#30232A]">{source.title}</div>
                        <div className="text-[12px] text-[#30232A]/70">{source.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#890149] shrink-0 tabular-nums">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#890149]" aria-hidden="true" />
                      <span>{source.availability}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/40 p-3.5 flex items-start gap-2.5 text-[12px] text-[#30232A]/80">
            <Info className="w-4 h-4 text-[#890149] shrink-0 mt-0.5" />
            <span>
              ELVI never synthesizes missing data or invents placeholder records. Any unrecorded dates will
              be honestly noted in the final report limitations.
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isSynthesizingReport}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#890149] text-[#F3F3E7] text-[14px] font-semibold hover:bg-[#600032] transition-colors disabled:opacity-60"
              >
                {isSynthesizingReport ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#F3F3E7] border-t-transparent rounded-full animate-spin" />
                    <span>Synthesizing Health Summary...</span>
                  </>
                ) : (
                  <>
                    <FilePlus className="w-4 h-4" />
                    <span>Generate Health Report</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigateTo('health-timeline')}
                className="text-[13px] font-semibold text-[#890149] hover:underline"
              >
                Preview Included Records
              </button>
            </div>

            <p className="text-[12px] leading-[18px] text-[#30232A]/75">
              Generates an AI-assisted longitudinal clinical summary ready for doctor consultation or
              personal review. You will be able to review and confirm all findings before saving or
              exporting.
            </p>
          </div>
        </section>

        {/* Right Column (5 cols): Upload Clinical Report */}
        <div className="lg:col-span-5 space-y-5">
          <section
            aria-labelledby="upload-clinical-heading"
            className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-6 space-y-5"
          >
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149] mb-1">
                <FilePlus className="w-3.5 h-3.5" />
                <span>EXTERNAL RECORDS</span>
              </div>
              <h2 id="upload-clinical-heading" className="font-serif-elvi text-[22px] text-[#30232A]">
                Upload Clinical Report
              </h2>
              <p className="text-[13px] leading-[20px] text-[#30232A]/80 mt-1">
                Add an existing clinical or laboratory report to your personal health record.
              </p>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="rounded-[10px] bg-[#F3F3E7] border border-dashed border-[#D9A2B5] p-6 text-center cursor-pointer hover:border-[#890149] transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setActiveFileName(file.name);
                    setActiveFileSizeLabel(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
                    const reader = new FileReader();
                    reader.onload = () => {
                      const res = reader.result as string;
                      const base64 = res.includes(',') ? res.split(',')[1] : res;
                      setActiveFileData({ base64, mimeType: file.type || 'application/pdf' });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <div className="w-9 h-9 rounded-full bg-[#EADCE0]/70 flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-4 h-4 text-[#890149]" />
              </div>
              <div className="text-[13px] font-semibold text-[#30232A]">
                Drag and drop document here
              </div>
              <div className="text-[12px] text-[#30232A]/75 mt-0.5">
                or <span className="text-[#890149] underline font-medium">Browse files</span>
              </div>
              <div className="text-[11px] font-semibold text-[#30232A]/60 mt-2">
                PDF, JPG, PNG up to 25MB
              </div>
            </div>

            <p className="text-[12px] leading-[18px] text-[#30232A]/75">
              Uploaded documents remain private to you. Any extracted lab metrics (such as hormones, HbA1c,
              or ultrasound notes) require your explicit review and confirmation before joining your health
              timeline.
            </p>

            {activeFileName && (
              <div className="space-y-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#30232A]/70">
                  ACTIVE SELECTION
                </div>
                <div className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/45 p-3.5 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-[#890149] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[#30232A] truncate">
                        {activeFileName}
                      </div>
                      <div className="text-[11px] text-[#30232A]/65 tabular-nums">
                        {activeFileSizeLabel || 'Document selected'} · Uploaded {formatFullDate(todayIso, timeZone)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[12px]">
                    <button
                      type="button"
                      onClick={() => navigateTo('health-timeline')}
                      className="font-semibold text-[#890149] hover:underline"
                    >
                      Review extracted data →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFileName(null);
                        setActiveFileData(null);
                      }}
                      className="text-[#30232A]/65 hover:text-[#890149]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleAddUploadedDoc}
              disabled={!activeFileName || isUploading}
              className="w-full py-2.5 rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/65 text-[13px] font-semibold text-[#890149] hover:bg-[#EADCE0]/50 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#890149] border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing &amp; Extracting Metrics...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Document to ELVI</span>
                </>
              )}
            </button>
          </section>

          <div className="rounded-[10px] bg-[#F7F7EC] border border-[#D9A2B5]/45 p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#EADCE0] flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4 text-[#890149]" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#30232A]">Physician-Ready Summary</div>
              <p className="text-[12px] leading-[18px] text-[#30232A]/75 mt-0.5">
                ELVI arranges records chronologically for standard 15-minute consultations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Previous Reports & Documents Table */}
      <section aria-labelledby="previous-reports-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="previous-reports-heading" className="font-serif-elvi text-[22px] text-[#30232A]">
              Previous Reports &amp; Documents
            </h2>
            <p className="text-[13px] text-[#30232A]/75 mt-0.5">
              Access your past generated health summaries and uploaded medical records.
            </p>
          </div>
          <span className="text-[12px] font-semibold text-[#890149] tabular-nums">
            {reportList.length} items on record
          </span>
        </div>

        <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 bg-[#F3F3E7] border-b border-[#D9A2B5]/40 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
            <div className="col-span-5">DOCUMENT NAME &amp; DESCRIPTION</div>
            <div className="col-span-3">TYPE &amp; ORIGIN</div>
            <div className="col-span-2">DATE / WINDOW</div>
            <div className="col-span-2 text-right">ACTIONS</div>
          </div>

          <div className="divide-y divide-[#D9A2B5]/35">
            {reportList.map((rep) => (
              <div
                key={rep.id}
                className="p-5 sm:grid sm:grid-cols-12 gap-4 items-center space-y-3 sm:space-y-0"
              >
                <div className="col-span-5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-[#EADCE0] flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-[#890149]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#30232A]">{rep.title}</div>
                    <div className="text-[12px] text-[#30232A]/70 mt-0.5">{rep.subtitle}</div>
                  </div>
                </div>

                <div className="col-span-3">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                      rep.typeBadge === 'ELVI Generated Report'
                        ? 'bg-[#EADCE0] text-[#890149]'
                        : 'bg-[#E9E9DD] text-[#30232A]'
                    }`}
                  >
                    {rep.typeBadge}
                  </span>
                </div>

                <div className="col-span-2 text-[12px] tabular-nums">
                  <div className="font-semibold text-[#30232A]">{rep.dateRange}</div>
                  <div className="text-[#890149] text-[11px]">{rep.subDate}</div>
                </div>

                <div className="col-span-2 flex items-center sm:justify-end gap-3 text-[12px] font-semibold text-[#890149]">
                  <button
                    type="button"
                    onClick={() => setActiveReportDetail(rep)}
                    className="hover:underline"
                  >
                    {rep.typeBadge === 'ELVI Generated Report' ? 'View Summary' : 'View Original'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReportDetail(rep);
                      handleDownloadPdf(rep);
                    }}
                    className="inline-flex items-center gap-1 text-[#30232A]/75 hover:text-[#890149]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {activeReportDetail && (
          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#890149] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#D9A2B5]/50 pb-5">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149]">
                  PHYSICIAN-READY HEALTH SUMMARY · {activeReportDetail.dateRange}
                </div>
                <h3 className="font-serif-elvi text-[24px] text-[#30232A] mt-1">
                  {activeReportDetail.fullReport?.title || activeReportDetail.title}
                </h3>
                <p className="text-[13px] text-[#30232A]/75 mt-0.5">
                  {activeReportDetail.fullReport?.subtitle || activeReportDetail.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(activeReportDetail)}
                  className="px-3.5 py-1.5 rounded-[8px] bg-[#890149] text-[#F3F3E7] text-[12px] font-semibold hover:bg-[#600032] transition-colors inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReportDetail(null)}
                  className="px-3 py-1.5 text-[12px] font-semibold text-[#30232A]/70 hover:text-[#30232A]"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Coverage Disclosure */}
            {activeReportDetail.fullReport?.dataCoverageNotice && (
              <div className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/40 p-3.5 text-[12px] leading-[18px] text-[#30232A]/85">
                <strong className="font-semibold text-[#890149]">Data Coverage &amp; Gaps Disclosure: </strong>
                {activeReportDetail.fullReport.dataCoverageNotice}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Menstrual Cycle Summary */}
              {activeReportDetail.fullReport?.cycleSummary && (
                <div className="rounded-[10px] bg-[#F3F3E7] border border-[#D9A2B5]/40 p-4 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                    MENSTRUAL CYCLE OVERVIEW
                  </div>
                  <div className="text-[14px] font-semibold text-[#30232A]">
                    {activeReportDetail.fullReport.cycleSummary.recordedCyclesCount} Cycles Tracked · Avg {activeReportDetail.fullReport.cycleSummary.averageLengthDays}
                  </div>
                  <p className="text-[12px] leading-[18px] text-[#30232A]/80">
                    {activeReportDetail.fullReport.cycleSummary.patternNotes}
                  </p>
                </div>
              )}

              {/* Nourishment & Hydration Overview */}
              {activeReportDetail.fullReport?.nourishmentAndHydrationOverview && (
                <div className="rounded-[10px] bg-[#F3F3E7] border border-[#D9A2B5]/40 p-4 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                    NOURISHMENT &amp; HYDRATION SUMMARY
                  </div>
                  <p className="text-[12px] leading-[18px] text-[#30232A]/80">
                    {activeReportDetail.fullReport.nourishmentAndHydrationOverview}
                  </p>
                </div>
              )}
            </div>

            {/* Symptom & Metabolic Trends */}
            {activeReportDetail.fullReport?.symptomAndMetabolicTrends && activeReportDetail.fullReport.symptomAndMetabolicTrends.length > 0 && (
              <div className="rounded-[10px] bg-[#F3F3E7] border border-[#D9A2B5]/40 p-4 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                  SYMPTOM &amp; WELLBEING TRENDS
                </div>
                <ul className="list-disc list-inside text-[12px] leading-[20px] text-[#30232A]/85 space-y-1">
                  {activeReportDetail.fullReport.symptomAndMetabolicTrends.map((trend: string, i: number) => (
                    <li key={i}>{trend}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lab Highlights */}
            {activeReportDetail.fullReport?.labHighlights && activeReportDetail.fullReport.labHighlights.length > 0 && (
              <div className="rounded-[10px] bg-[#F3F3E7] border border-[#D9A2B5]/40 p-4 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                  CLINICAL &amp; LABORATORY HIGHLIGHTS
                </div>
                <ul className="list-disc list-inside text-[12px] leading-[20px] text-[#30232A]/85 space-y-1">
                  {activeReportDetail.fullReport.labHighlights.map((lab: string, i: number) => (
                    <li key={i}>{lab}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Questions for Clinician */}
            {activeReportDetail.fullReport?.questionsForClinician && activeReportDetail.fullReport.questionsForClinician.length > 0 && (
              <div className="rounded-[10px] bg-[#EADCE0]/60 border border-[#890149]/30 p-4 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                  RECOMMENDED QUESTIONS FOR YOUR DOCTOR CONSULTATION
                </div>
                <ul className="list-decimal list-inside text-[13px] leading-[20px] text-[#30232A] space-y-1 font-medium">
                  {activeReportDetail.fullReport.questionsForClinician.map((q: string, i: number) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clinical Disclaimer */}
            <div className="text-[11px] leading-[16px] text-[#30232A]/70 pt-2 border-t border-[#D9A2B5]/40">
              <strong className="font-semibold text-[#890149]">Clinical Disclaimer: </strong>
              {activeReportDetail.fullReport?.clinicalDisclaimer ||
                'ELVI Health Reports provide longitudinal structured summaries of user-reported data, calculated cycle statistics, and uploaded clinical panels. ELVI does not diagnose PCOS/PCOD, prescribe medication, or replace professional healthcare assessment.'}
            </div>
          </div>
        )}
      </section>

      {/* Clinical Dignity & Report Limitations */}
      <div className="rounded-[10px] bg-[#F7F7EC] border border-[#D9A2B5]/45 p-5 flex items-start gap-3.5">
        <Scale className="w-4 h-4 text-[#890149] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#30232A]">
            CLINICAL DIGNITY &amp; REPORT LIMITATIONS
          </div>
          <p className="text-[12px] leading-[19px] text-[#30232A]/80">
            ELVI Health Reports provide longitudinal structured summaries of user-reported data, calculated
            cycle statistics, and uploaded clinical panels. ELVI does not diagnose PCOS/PCOD, prescribe
            medication, or replace professional healthcare assessment. Always share these reports directly
            with your gynaecologist, endocrinologist, or general practitioner for diagnosis and treatment
            planning.
          </p>
        </div>
      </div>
    </div>
  );
};
