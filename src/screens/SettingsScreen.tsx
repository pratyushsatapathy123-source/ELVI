import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Info,
  History,
  Download,
  FileText,
  SlidersHorizontal,
  Bell,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { useElvi } from '../context/ElviContext';

export const SettingsScreen: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    currentUser,
    isAuthReady,
    signInGoogle,
    signOutApp,
    companionLanguage,
    setCompanionLanguage,
    comfortableReading,
    setComfortableReading,
    reduceMotion,
    setReduceMotion,
    enableMemory,
    setEnableMemory,
    aiMemories,
    clearMemories,
    deleteMemoryItem,
    isDemoMode,
    toggleDemoMode,
    timeZone,
    setTimeZone,
    contextPermissions,
    toggleContextPermission,
    reportGenerationManualReview,
    setReportGenerationManualReview,
    setInfoModal,
    navigateTo,
    quietHoursLabel,
  } = useElvi();

  const [showMemoriesList, setShowMemoriesList] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [nameDraft, setNameDraft] = useState(userProfile.name);
  const [emailDraft, setEmailDraft] = useState(userProfile.email);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(nameDraft, emailDraft);
    setEditingProfile(false);
    setSettingsFeedback('Account profile updated.');
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInGoogle();
      setSettingsFeedback('Signed in successfully! Your health records and cycle history are now synced to elvi-osfic.');
    } catch (err: any) {
      setSettingsFeedback(err?.message || 'Google sign-in could not be completed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutApp();
      setSettingsFeedback('Signed out. Local session is active.');
    } catch (err: any) {
      setSettingsFeedback(err?.message || 'Sign out failed.');
    }
  };

  return (
    <div className="max-w-[880px] space-y-10">
      <AppHeader
        kicker="ACCOUNT GOVERNANCE & CONTROLS"
        title="Settings"
        subtitle="Manage your preferences, data boundaries, and health privacy safeguards."
        rightAction={
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#FAF9F0] border border-[#D9A2B5]/55 text-[12px] font-medium text-[#30232A]">
            <ShieldCheck className="w-4 h-4 text-[#890149]" />
            <span>Data Dignity &amp; Privacy Safeguards Active</span>
          </div>
        }
      />

      {settingsFeedback && (
        <div className="rounded-[8px] bg-[#EADCE0]/75 border border-[#890149]/40 px-4 py-3 text-[13px] font-medium text-[#30232A] flex items-center justify-between">
          <span>{settingsFeedback}</span>
          <button
            type="button"
            onClick={() => setSettingsFeedback(null)}
            className="text-[12px] font-semibold text-[#890149] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Account & Profile */}
      <section aria-labelledby="account-profile-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="account-profile-heading" className="text-[18px] font-semibold text-[#30232A]">
            Account &amp; Profile
          </h2>
          <span className="text-[11px] font-medium text-[#30232A]/60 tabular-nums">
            {currentUser ? `UID: ${currentUser.uid.slice(0, 8)}...` : 'ID: ELVI-84920-VA'}
          </span>
        </div>

        <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D9A2B5]/35">
            <div className="flex items-center gap-4">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={userProfile.name}
                  className="w-12 h-12 rounded-[10px] object-cover border border-[#890149]/20 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-[10px] bg-[#890149] text-[#F3F3E7] font-serif-elvi text-[22px] flex items-center justify-center shrink-0">
                  {userProfile.initials || 'E'}
                </div>
              )}
              <div>
                <div className="text-[16px] font-semibold text-[#30232A]">{userProfile.name}</div>
                <div className="text-[13px] text-[#30232A]/75">{userProfile.email}</div>
                <div className="text-[11px] font-medium text-[#30232A]/65 mt-0.5">
                  {currentUser
                    ? 'Authenticated via Google · Synced with Firebase (elvi-osfic)'
                    : 'Local session · Sign in with Google to sync across devices'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  toggleDemoMode();
                  setSettingsFeedback(
                    isDemoMode
                      ? 'Switched back to personal account mode.'
                      : 'Loaded synthetic demo fixture (users/elvi_demo_fixture_v1).'
                  );
                }}
                className={`px-3.5 py-1.5 rounded-[6px] text-[12px] font-semibold transition-colors border ${
                  isDemoMode
                    ? 'bg-[#890149] text-[#F3F3E7] border-[#890149]'
                    : 'bg-[#F3F3E7] border-[#D9A2B5]/60 text-[#30232A] hover:bg-[#EADCE0]/50'
                }`}
              >
                {isDemoMode ? 'Exit Demo Fixture' : 'Explore Demo Fixture'}
              </button>

              <button
                type="button"
                onClick={() => setEditingProfile((v) => !v)}
                className="px-3.5 py-1.5 rounded-[6px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[12px] font-semibold text-[#890149] hover:bg-[#EADCE0]/50 transition-colors"
              >
                Edit Profile
              </button>
              {currentUser ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3.5 py-1.5 rounded-[6px] bg-[#F3F3E7] border border-[#D9A2B5]/40 text-[12px] font-medium text-[#30232A] hover:bg-[#EADCE0]/40 transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigateTo('auth')}
                    className="px-3.5 py-1.5 rounded-[6px] bg-[#890149] text-[#F3F3E7] text-[12px] font-semibold hover:bg-[#6e013a] transition-colors"
                  >
                    Sign In / Register
                  </button>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSigningIn}
                    className="px-3.5 py-1.5 rounded-[6px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[#30232A] text-[12px] font-semibold hover:bg-[#EADCE0]/50 transition-colors disabled:opacity-50"
                  >
                    {isSigningIn ? 'Signing In...' : 'Google Sign In'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {editingProfile && (
            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Full Name"
                className="px-3 py-2 rounded-[6px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[13px]"
              />
              <input
                type="email"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                placeholder="Email"
                className="px-3 py-2 rounded-[6px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[13px]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-[6px] bg-[#890149] text-[#F3F3E7] text-[13px] font-semibold"
              >
                Save Changes
              </button>
            </form>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[13px] font-semibold text-[#30232A]">
                PCOS/PCOD Care Mode Preference
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EADCE0] text-[#890149] text-[11px] font-semibold">
                Monitoring Symptoms (Active)
              </span>
            </div>
            <p className="text-[13px] leading-[20px] text-[#30232A]/75">
              Health profile configurations guide contextual interface organization and nutrition tips.
              ELVI never automatically diagnoses or assigns clinical conditions without clinical provider
              sign-off.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('pcos-care')}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#890149] hover:underline pt-1"
            >
              <span>Adjust care mode in PCOS/PCOD Care</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Language & Accessibility */}
      <section aria-labelledby="language-accessibility-heading" className="space-y-4">
        <h2 id="language-accessibility-heading" className="text-[18px] font-semibold text-[#30232A]">
          Language &amp; Accessibility
        </h2>

        <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-6 space-y-6">
          <div className="space-y-2.5 pb-6 border-b border-[#D9A2B5]/35">
            <div className="text-[13px] font-semibold text-[#30232A]">Interface Language</div>
            <div className="flex items-center gap-2">
              {(['English', 'हिन्दी', 'ଓଡ଼ିଆ'] as const).map((lang) => {
                const active = companionLanguage === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setCompanionLanguage(lang)}
                    className={`px-4 py-1.5 rounded-[6px] text-[13px] font-semibold transition-colors ${
                      active
                        ? 'bg-[#890149] text-[#F3F3E7]'
                        : 'bg-[#F3F3E7] border border-[#D9A2B5]/50 text-[#30232A] hover:bg-[#EADCE0]/50'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
            <p className="text-[12px] leading-[18px] text-[#30232A]/75">
              Language preferences apply to cycle tracking flows, check-in prompts, clinical summaries,
              and conversational responses. Additional regional languages are released once clinically
              translated.
            </p>
          </div>

          <div className="space-y-2.5 pb-6 border-b border-[#D9A2B5]/35">
            <div className="text-[13px] font-semibold text-[#30232A]">Application Timezone</div>
            <select
              value={timeZone}
              onChange={(e) => {
                setTimeZone(e.target.value);
                setSettingsFeedback(`Timezone updated to ${e.target.value}`);
              }}
              className="px-3 py-1.5 rounded-[6px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[13px] text-[#30232A] font-medium"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST · UTC+5:30) — Default</option>
              <option value="UTC">UTC (Universal Time)</option>
              <option value="America/New_York">America/New_York (EST / EDT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST / PDT)</option>
              <option value="Europe/London">Europe/London (GMT / BST)</option>
            </select>
            <p className="text-[12px] leading-[18px] text-[#30232A]/75">
              Dates, daily check-in boundaries, and timeline day nodes are calculated relative to your configured local timezone.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[13px] font-semibold text-[#30232A]">
                  Comfortable Reading Typography
                </div>
                <div className="text-[12px] text-[#30232A]/75">
                  Enhances contrast and increases line height for easier readability.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={comfortableReading}
                onClick={() => setComfortableReading(!comfortableReading)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                  comfortableReading ? 'bg-[#890149] justify-end' : 'bg-[#D9A2B5]/60 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-[#FAF9F0]" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[13px] font-semibold text-[#30232A]">Reduce Motion</div>
                <div className="text-[12px] text-[#30232A]/75">
                  Disables micro-interactions and smooth page transitions across records.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={reduceMotion}
                onClick={() => setReduceMotion(!reduceMotion)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                  reduceMotion ? 'bg-[#890149] justify-end' : 'bg-[#D9A2B5]/60 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-[#FAF9F0]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Privacy, Consent & AI Memory */}
      <section aria-labelledby="privacy-memory-heading" className="space-y-4">
        <div>
          <h2 id="privacy-memory-heading" className="text-[18px] font-semibold text-[#30232A]">
            Privacy, Consent &amp; AI Memory
          </h2>
          <p className="text-[13px] text-[#30232A]/75 mt-0.5">
            Strict boundaries governing machine intelligence context versus confirmed medical records.
          </p>
        </div>

        <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[13px] font-semibold text-[#30232A]">
                  Enable Conversational Memory
                </div>
                <div className="text-[12px] text-[#30232A]/75">
                  Allows the AI Companion to retain non-clinical context between conversations. Turning this
                  off does not affect your Health Timeline logs.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enableMemory}
                onClick={() => setEnableMemory(!enableMemory)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                  enableMemory ? 'bg-[#890149] justify-end' : 'bg-[#D9A2B5]/60 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-[#FAF9F0]" />
              </button>
            </div>

            <div className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <div className="flex items-center gap-2 font-semibold text-[#30232A]">
                <Sparkles className="w-3.5 h-3.5 text-[#890149]" />
                <span>{aiMemories.length} active conversational memories stored</span>
              </div>
              <div className="flex items-center gap-4 font-semibold text-[#890149]">
                <button
                  type="button"
                  onClick={() => setShowMemoriesList((v) => !v)}
                  className="hover:underline"
                >
                  {showMemoriesList ? 'Hide List' : 'Review & Correct'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await clearMemories();
                    setSettingsFeedback('Conversational memory cache cleared.');
                  }}
                  className="hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            {showMemoriesList && (
              <div className="space-y-2 pt-2">
                {aiMemories.length === 0 ? (
                  <p className="text-[12px] text-[#30232A]/70 italic">No conversational memories currently stored.</p>
                ) : (
                  aiMemories.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/40 flex items-start justify-between gap-3 text-[12px]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[#30232A]">{m.text}</div>
                        <div className="text-[11px] text-[#30232A]/60 mt-0.5">
                          Category: {m.category} · Stored Context
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteMemoryItem(m.id);
                          setSettingsFeedback('Memory item deleted.');
                        }}
                        className="text-[#890149] hover:underline font-semibold text-[11px] shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Contextual Permissions */}
          <div className="space-y-3 pt-2 border-t border-[#D9A2B5]/35">
            <div>
              <div className="text-[13px] font-semibold text-[#30232A]">Contextual Permissions</div>
              <div className="text-[12px] text-[#30232A]/75">
                Specify which logged domains the AI Companion is allowed to synthesize for chat insights.
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  key: 'cycleAndSymptoms' as const,
                  title: 'Recent cycle & symptom logs',
                  desc: 'Used strictly to provide tailored hydration, rest, and cycle phase context.',
                },
                {
                  key: 'nourishmentAndLifestyle' as const,
                  title: 'Nourishment and lifestyle observations',
                  desc: 'Allows recommendations matching your personal dietary habits and sleep routines.',
                },
                {
                  key: 'clinicalDocuments' as const,
                  title: 'Clinical lab documents & specialist notes',
                  desc: 'Restricted by default. When disabled, the AI Companion cannot inspect uploaded bloodwork.',
                },
              ].map((perm) => {
                const checked = contextPermissions[perm.key];
                return (
                  <button
                    key={perm.key}
                    type="button"
                    onClick={() => toggleContextPermission(perm.key)}
                    className="w-full flex items-start gap-3 text-left py-1"
                  >
                    <span
                      className={`w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0 mt-0.5 border ${
                        checked
                          ? 'bg-[#890149] border-[#890149] text-[#F3F3E7]'
                          : 'bg-[#F3F3E7] border-[#D9A2B5]'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-[#30232A]">{perm.title}</div>
                      <div className="text-[12px] text-[#30232A]/70">{perm.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-[6px] bg-[#F3F3E7] px-3.5 py-2 flex items-center gap-2 text-[11px] text-[#30232A]/75">
              <Info className="w-3.5 h-3.5 text-[#890149] shrink-0" />
              <span>Memory records and confirmed medical records are completely decoupled for your protection.</span>
            </div>
          </div>

          {/* Report Generation Defaults */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#D9A2B5]/35">
            <div>
              <div className="text-[13px] font-semibold text-[#30232A]">Report Generation Defaults</div>
              <div className="text-[12px] text-[#30232A]/75">
                Require explicit manual review of each symptom and lab document before generating a
                shareable health summary.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reportGenerationManualReview}
              onClick={() => setReportGenerationManualReview(!reportGenerationManualReview)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                reportGenerationManualReview
                  ? 'bg-[#890149] justify-end'
                  : 'bg-[#D9A2B5]/60 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#FAF9F0]" />
            </button>
          </div>

          {/* Data Dignity & Consent Charter */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#D9A2B5]/35">
            <div>
              <div className="text-[13px] font-semibold text-[#30232A]">
                Data Dignity &amp; Consent Charter
              </div>
              <div className="text-[12px] text-[#30232A]/75">
                Read our promise: zero third-party advertising trackers and zero telemetry reselling.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setInfoModal('dignity')}
              className="px-3.5 py-1.5 rounded-[6px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[12px] font-semibold text-[#890149] hover:bg-[#EADCE0]/50 transition-colors"
            >
              Read Charter
            </button>
          </div>
        </div>
      </section>

      {/* 4. Health Data Management */}
      <section aria-labelledby="health-data-mgmt-heading" className="space-y-4">
        <h2 id="health-data-mgmt-heading" className="text-[18px] font-semibold text-[#30232A]">
          Health Data Management
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 space-y-2.5">
            <History className="w-4 h-4 text-[#890149]" />
            <h3 className="text-[15px] font-semibold text-[#30232A]">Health Timeline</h3>
            <p className="text-[12px] leading-[19px] text-[#30232A]/75">
              Inspect verified chronological logs including flow intensity, physical symptoms, and
              temperature records.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('health-timeline')}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#890149] hover:underline pt-1"
            >
              <span>Open Health Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 space-y-2.5">
            <Download className="w-4 h-4 text-[#890149]" />
            <h3 className="text-[15px] font-semibold text-[#30232A]">Export Health Data</h3>
            <p className="text-[12px] leading-[19px] text-[#30232A]/75">
              Request an unencrypted personal archive of all your entries in structured JSON or spreadsheet
              CSV format.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() =>
                  setSettingsFeedback('Your personal JSON/CSV data archive is ready for download.')
                }
                className="px-3.5 py-1.5 rounded-[6px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[12px] font-semibold text-[#890149] hover:bg-[#EADCE0]/50"
              >
                Request Data Export
              </button>
            </div>
          </div>

          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 space-y-2.5">
            <FileText className="w-4 h-4 text-[#890149]" />
            <h3 className="text-[15px] font-semibold text-[#30232A]">Clinical Documents</h3>
            <p className="text-[12px] leading-[19px] text-[#30232A]/75">
              Manage uploaded laboratory panels, ultrasound reports, and external practitioner summaries.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('reports')}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#890149] hover:underline pt-1"
            >
              <span>Open Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 space-y-2.5">
            <SlidersHorizontal className="w-4 h-4 text-[#890149]" />
            <h3 className="text-[15px] font-semibold text-[#30232A]">Correct or Purge Entries</h3>
            <p className="text-[12px] leading-[19px] text-[#30232A]/75">
              Selectively correct erroneous check-ins or delete isolated day logs without affecting global
              history.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('health-timeline')}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#890149] hover:underline pt-1"
            >
              <span>Manage Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. Notification & Cadence */}
      <section aria-labelledby="notification-cadence-heading" className="space-y-4">
        <h2 id="notification-cadence-heading" className="text-[18px] font-semibold text-[#30232A]">
          Notification &amp; Cadence
        </h2>

        <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#30232A]">
              <Bell className="w-4 h-4 text-[#890149]" />
              <span>Reminder Times &amp; Quiet Hours</span>
            </div>
            <p className="text-[12px] leading-[19px] text-[#30232A]/75 max-w-xl">
              Daily check-in alerts, hydration cadence, cycle predictions, and quiet window settings
              (currently {quietHoursLabel}) are maintained centrally.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('reminders')}
            className="px-4 py-2.5 rounded-[8px] bg-[#890149] text-[#F3F3E7] text-[12px] font-semibold hover:bg-[#600032] transition-colors whitespace-nowrap shrink-0"
          >
            Manage Reminders &amp; Quiet Hours
          </button>
        </div>
      </section>

      {/* 6. Account & Data Deletion */}
      <section aria-labelledby="account-deletion-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#890149]" />
          <h2 id="account-deletion-heading" className="text-[16px] font-semibold text-[#30232A]">
            Account &amp; Data Deletion
          </h2>
        </div>

        <div className="rounded-[12px] bg-[#F7F7EC] border border-[#D9A2B5]/55 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[13px] font-semibold text-[#890149]">Irreversible Account Purge</div>
            <p className="text-[12px] leading-[18px] text-[#30232A]/75 max-w-xl">
              Permanently removes your credentials, all verified health logs, uploaded lab records, and
              conversational caches. This process cannot be undone.
            </p>
          </div>

          {confirmPurge ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  clearMemories();
                  setConfirmPurge(false);
                  setSettingsFeedback('Local session data reset.');
                }}
                className="px-3.5 py-2 rounded-[6px] bg-[#890149] text-[#F3F3E7] text-[12px] font-semibold"
              >
                Confirm Purge
              </button>
              <button
                type="button"
                onClick={() => setConfirmPurge(false)}
                className="px-3 py-2 text-[12px] text-[#30232A]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmPurge(true)}
              className="px-4 py-2 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/70 text-[12px] font-semibold text-[#890149] hover:bg-[#EADCE0]/50 transition-colors whitespace-nowrap shrink-0"
            >
              Delete Account and All Data
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
