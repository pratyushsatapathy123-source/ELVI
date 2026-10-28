import React, { useState } from 'react';
import { Menu, Calendar, ShieldCheck, Lock, X } from 'lucide-react';
import { Sidebar, SIDEBAR_NAVIGATION } from './Sidebar';
import { useElvi } from '../../context/ElviContext';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    activeScreen,
    isPeriodModalOpen,
    closePeriodModal,
    addPeriodRecord,
    updatePeriodRecord,
    editingPeriod,
    setEditingPeriod,
    infoModal,
    setInfoModal,
    comfortableReading,
    todayIso,
    isDemoMode,
  } = useElvi();

  // Period modal form state
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(todayIso);
  const [isBleedingOngoing, setIsBleedingOngoing] = useState(false);
  const [flowIntensity, setFlowIntensity] = useState<'Light' | 'Medium' | 'Heavy' | 'Spotting'>('Medium');
  const [periodNotes, setPeriodNotes] = useState('');
  const [isSavingPeriod, setIsSavingPeriod] = useState(false);
  const [savePeriodError, setSavePeriodError] = useState<string | null>(null);

  // Sync dates when modal opens or editingPeriod changes
  React.useEffect(() => {
    if (isPeriodModalOpen) {
      if (editingPeriod) {
        setStartDate(editingPeriod.startDate);
        setEndDate(editingPeriod.endDate || todayIso);
        setIsBleedingOngoing(!editingPeriod.endDate);
        setFlowIntensity(editingPeriod.flowIntensity);
        setPeriodNotes(editingPeriod.notes || '');
      } else {
        setStartDate(todayIso);
        setEndDate(todayIso);
        setIsBleedingOngoing(false);
        setFlowIntensity('Medium');
        setPeriodNotes('');
      }
      setSavePeriodError(null);
    }
  }, [isPeriodModalOpen, editingPeriod, todayIso]);

  const activeNavLabel =
    SIDEBAR_NAVIGATION.flatMap((g) => g.items).find((i) => i.id === activeScreen)?.label || 'Today';

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPeriod(true);
    setSavePeriodError(null);
    try {
      const payload = {
        startDate,
        endDate: isBleedingOngoing ? undefined : endDate,
        flowIntensity,
        notes: periodNotes.trim() || undefined,
      };

      if (editingPeriod) {
        await updatePeriodRecord(editingPeriod.id, payload);
      } else {
        await addPeriodRecord(payload);
      }
      setPeriodNotes('');
      setEditingPeriod(null);
      closePeriodModal();
    } catch (err: any) {
      setSavePeriodError(err?.message || 'Could not save period dates. Please try again.');
    } finally {
      setIsSavingPeriod(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#F3F3E7] text-[#30232A] flex flex-col ${
        comfortableReading ? 'text-[17px] leading-relaxed' : ''
      }`}
    >
      {/* Shared Master Sidebar */}
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      {/* Mobile Compact Header Bar (only shown below lg breakpoint to preserve full navigation access) */}
      <div className="lg:hidden sticky top-0 z-20 bg-[#F3F3E7] border-b border-[#D9A2B5]/45 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 rounded-[6px] text-[#30232A] hover:bg-[#EADCE0]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#890149]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <span className="font-serif-elvi text-[20px] leading-none text-[#890149]">ELVI</span>
            <span className="mx-2 text-[#D9A2B5]">·</span>
            <span className="text-[13px] font-semibold text-[#30232A]">{activeNavLabel}</span>
          </div>
        </div>
      </div>

      {/* Main Content Shell */}
      <div className="lg:pl-[248px] flex-1 flex flex-col min-h-screen">
        <main className="flex-1 px-6 sm:px-10 lg:px-14 pt-8 pb-16 max-w-[1140px] w-full">
          {children}
        </main>

        {/* Master Shared Footer — matches screen_b8de2e03.png */}
        <footer className="border-t border-[#D9A2B5]/45 px-6 sm:px-10 lg:px-14 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#30232A]/75">
          <div>ELVI Health Companion · Calm, grounded reproductive care.</div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setInfoModal('safeguards')}
              className="hover:text-[#890149] transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Clinical Safeguards
            </button>
            <button
              type="button"
              onClick={() => setInfoModal('dignity')}
              className="hover:text-[#890149] transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Data Dignity
            </button>
          </div>
        </footer>
      </div>

      {/* Shared Log Period Dates Modal */}
      {isPeriodModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#30232A]/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="log-period-modal-title"
        >
          <div className="bg-[#F3F3E7] border border-[#D9A2B5]/60 rounded-[12px] max-w-md w-full p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-[#890149]" />
                <h2 id="log-period-modal-title" className="font-serif-elvi text-[22px] text-[#30232A]">
                  {editingPeriod ? 'Edit Period Record' : 'Log Period Dates'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingPeriod(null);
                  closePeriodModal();
                }}
                aria-label="Close modal"
                className="p-1.5 rounded-md text-[#30232A]/70 hover:bg-[#EADCE0]/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[14px] text-[#30232A]/80 mb-5">
              Record your confirmed period dates. ELVI uses your actual history rather than arbitrary estimates.
            </p>

            <form onSubmit={handleSavePeriod} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="period-start" className="block text-[13px] font-semibold text-[#30232A] mb-1">
                    Start Date
                  </label>
                  <input
                    id="period-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/60 text-[14px] text-[#30232A] focus:outline-none focus:border-[#890149]"
                  />
                </div>
                <div>
                  <label htmlFor="period-end" className="block text-[13px] font-semibold text-[#30232A] mb-1">
                    End Date
                  </label>
                  <input
                    id="period-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isBleedingOngoing}
                    required={!isBleedingOngoing}
                    className={`w-full px-3 py-2 rounded-[6px] border text-[14px] focus:outline-none ${
                      isBleedingOngoing
                        ? 'bg-[#F3F3E7]/60 border-[#D9A2B5]/30 text-[#30232A]/40 cursor-not-allowed'
                        : 'bg-[#FAF9F0] border border-[#D9A2B5]/60 text-[#30232A] focus:border-[#890149]'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#30232A]">
                    <input
                      type="checkbox"
                      checked={isBleedingOngoing}
                      onChange={(e) => setIsBleedingOngoing(e.target.checked)}
                      className="rounded border-[#D9A2B5] text-[#890149] focus:ring-[#890149]"
                    />
                    <span>Bleeding is ongoing (period end date not yet known)</span>
                  </label>
                </div>
              </div>

              <div>
                <span className="block text-[13px] font-semibold text-[#30232A] mb-1.5">
                  Overall Flow Intensity
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {(['Spotting', 'Light', 'Medium', 'Heavy'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFlowIntensity(level)}
                      className={`py-2 px-2.5 rounded-[6px] text-[13px] font-medium border transition-colors ${
                        flowIntensity === level
                          ? 'bg-[#890149] text-[#F3F3E7] border-[#890149]'
                          : 'bg-[#FAF9F0] text-[#30232A] border-[#D9A2B5]/50 hover:border-[#890149]/50'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="period-notes" className="block text-[13px] font-semibold text-[#30232A] mb-1">
                  Contextual Notes <span className="font-normal text-[#30232A]/60">(Optional)</span>
                </label>
                <textarea
                  id="period-notes"
                  rows={2}
                  value={periodNotes}
                  onChange={(e) => setPeriodNotes(e.target.value)}
                  placeholder="e.g., Mild cramping on day 1, rested in the afternoon..."
                  className="w-full px-3 py-2 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/60 text-[14px] text-[#30232A] focus:outline-none focus:border-[#890149]"
                />
              </div>

              {savePeriodError && (
                <div className="rounded-[6px] bg-red-50 border border-red-200 p-2.5 text-[12px] text-red-800">
                  {savePeriodError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPeriod(null);
                    closePeriodModal();
                  }}
                  className="px-4 py-2 rounded-[6px] text-[14px] font-medium text-[#30232A] hover:bg-[#EADCE0]/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPeriod}
                  className="px-5 py-2 rounded-[6px] bg-[#890149] text-[#F3F3E7] text-[14px] font-semibold hover:bg-[#600032] transition-colors disabled:opacity-60"
                >
                  {isSavingPeriod
                    ? 'Saving to Firestore...'
                    : editingPeriod
                    ? 'Update period record'
                    : 'Save period dates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clinical Safeguards & Data Dignity Modal */}
      {infoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#30232A]/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#F3F3E7] border border-[#D9A2B5]/60 rounded-[12px] max-w-lg w-full p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5">
                {infoModal === 'safeguards' ? (
                  <ShieldCheck className="w-5 h-5 text-[#890149]" />
                ) : (
                  <Lock className="w-5 h-5 text-[#890149]" />
                )}
                <h2 className="font-serif-elvi text-[22px] text-[#30232A]">
                  {infoModal === 'safeguards' ? 'ELVI Clinical Safeguards' : 'ELVI Data Dignity Charter'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-md text-[#30232A]/70 hover:bg-[#EADCE0]/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {infoModal === 'safeguards' ? (
              <div className="space-y-3 text-[14px] leading-[22px] text-[#30232A]/85">
                <p>
                  ELVI is designed as an observational health companion. It distinguishes strictly between
                  user-reported logs, calculated cycle statistics, AI-synthesized reflections, and uploaded
                  laboratory records.
                </p>
                <p>
                  ELVI never diagnoses medical conditions such as PCOS/PCOD, never fabricates missing data to
                  fill charts, and never replaces qualified medical evaluation. If you experience severe pelvic
                  pain, heavy bleeding, or sudden physiological changes, please consult your clinician promptly.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-[14px] leading-[22px] text-[#30232A]/85">
                <p>
                  Your reproductive and hormonal records belong exclusively to you. Nothing discussed in the AI
                  Companion or inferred from personal reflections is committed to your Health Timeline without
                  your explicit review and confirmation.
                </p>
                <p>
                  ELVI operates with zero third-party advertising trackers, zero data brokerage, and full user
                  control to export, amend, or permanently purge records at any time.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="px-5 py-2 rounded-[6px] bg-[#890149] text-[#F3F3E7] text-[14px] font-semibold hover:bg-[#600032] transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
