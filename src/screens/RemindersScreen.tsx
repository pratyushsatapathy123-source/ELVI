import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Clock,
  Droplet,
  CalendarCheck,
  GlassWater,
  Sprout,
  BriefcaseMedical,
  Trash2,
  Monitor,
  EyeOff,
  Moon,
  ExternalLink,
  X,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { useElvi } from '../context/ElviContext';
import { ReminderItem } from '../types/elvi';

export const RemindersScreen: React.FC = () => {
  const {
    reminders,
    toggleReminder,
    addReminder,
    deleteReminder,
    discreetMode,
    setDiscreetMode,
    quietHoursLabel,
    setQuietHoursLabel,
  } = useElvi();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ReminderItem['category']>('checkin');
  const [newTime, setNewTime] = useState('8:00 PM');
  const [newCadence, setNewCadence] = useState('Every day');
  const [newDesc, setNewDesc] = useState('');

  const [editingSleepWindow, setEditingSleepWindow] = useState(false);

  const activeCount = reminders.filter((r) => r.active).length;
  const pausedCount = reminders.length - activeCount;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addReminder({
      category: newCategory,
      title: newTitle.trim(),
      badgeText: 'User Configured',
      description:
        newDesc.trim() || 'Discreet supportive reminder configured according to your care cadence.',
      cadenceLabel: newCadence,
      timeLabel: newTime,
      active: true,
    });
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  const renderCategorySection = (
    category: ReminderItem['category'],
    title: string,
    IconComponent: React.ComponentType<{ className?: string }>
  ) => {
    const items = reminders.filter((r) => r.category === category);
    const configuredText =
      category === 'hydration' && items.every((i) => !i.active)
        ? `${items.length} PAUSED`
        : `${items.length} CONFIGURED`;

    return (
      <section key={category} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#EADCE0] flex items-center justify-center">
              <IconComponent className="w-3.5 h-3.5 text-[#890149]" />
            </div>
            <h2 className="font-serif-elvi text-[20px] text-[#30232A]">{title}</h2>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]/80 tabular-nums">
            {configuredText}
          </span>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-[#30232A]">{item.title}</h3>
                  <span className="px-2 py-0.5 rounded bg-[#F3F3E7] border border-[#D9A2B5]/45 text-[11px] font-medium text-[#30232A]/80">
                    {item.badgeText}
                  </span>
                  {item.secondaryBadge && (
                    <span className="px-2 py-0.5 rounded bg-[#EADCE0] text-[11px] font-semibold text-[#890149] tabular-nums">
                      {item.secondaryBadge}
                    </span>
                  )}
                </div>

                <p className="text-[13px] leading-[20px] text-[#30232A]/80">{item.description}</p>

                {item.clinicalNote && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F3F3E7] text-[11px] text-[#30232A]/75">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#890149]" />
                    <span>{item.clinicalNote}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#30232A]/75 pt-0.5">
                  <span>↻ {item.cadenceLabel}</span>
                  <span>◷ {item.timeLabel}</span>
                  {item.extraMeta && (
                    <span className="font-semibold text-[#30232A]">🔒 {item.extraMeta}</span>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleReminder(item.id)}
                  className="text-[12px] font-semibold text-[#30232A] hover:text-[#890149]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteReminder(item.id)}
                  aria-label={`Delete ${item.title}`}
                  className="p-1.5 text-[#30232A]/60 hover:text-[#890149]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  role="switch"
                  aria-checked={item.active}
                  onClick={() => toggleReminder(item.id)}
                  className="inline-flex items-center gap-2 focus-visible:outline-none"
                >
                  <span
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                      item.active ? 'bg-[#890149] justify-end' : 'bg-[#D9A2B5]/60 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-[#FAF9F0]" />
                  </span>
                  <span
                    className={`text-[12px] font-semibold min-w-[44px] text-left ${
                      item.active ? 'text-[#890149]' : 'text-[#30232A]/60'
                    }`}
                  >
                    {item.active ? 'Active' : 'Paused'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-[920px] space-y-10">
      <AppHeader
        kicker="NOTIFICATION & CARE CADENCE"
        title="Reminders"
        subtitle="Choose what you want to be reminded about, and when."
        rightAction={
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#FAF9F0] border border-[#D9A2B5]/55 text-[12px]">
              <ShieldCheck className="w-4 h-4 text-[#890149]" />
              <div>
                <div className="font-semibold text-[#30232A] leading-tight">Discreet Delivery Active</div>
                <div className="text-[10px] text-[#30232A]/65 leading-tight">
                  OS Permission Allowed · E2E Stored
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#890149] text-[#F3F3E7] text-[13px] font-semibold hover:bg-[#600032] transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Reminder</span>
            </button>
          </div>
        }
      />

      {/* Paced & Calm Schedule Summary Banner — Matches screen_edc14084.png */}
      <section className="rounded-[12px] bg-[#F7F7EC] border border-[#D9A2B5]/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149]">
            <Clock className="w-3.5 h-3.5" />
            <span>PACED &amp; CALM SCHEDULE</span>
          </div>
          <p className="text-[14px] leading-[22px] text-[#30232A]">
            You currently have{' '}
            <strong className="font-semibold text-[#890149] tabular-nums">
              {activeCount} active reminders
            </strong>{' '}
            and{' '}
            <span className="font-medium text-[#890149] tabular-nums">{pausedCount} paused</span>. Quiet
            hours are respected automatically from{' '}
            <strong className="font-semibold text-[#30232A] tabular-nums">{quietHoursLabel}</strong> to
            protect uninterrupted sleep and hormonal rest.
          </p>
        </div>

        {/* Weekly Distribution Mini Chart */}
        <div className="rounded-[10px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-4 min-w-[230px]">
          <div className="flex items-center justify-between gap-4 text-[12px] mb-3">
            <span className="text-[#890149] font-medium">Weekly Distribution</span>
            <span className="font-semibold text-[#30232A] tabular-nums">23 prompts / wk</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 items-end h-8">
            {[
              { day: 'M', h: 'h-3', active: false },
              { day: 'T', h: 'h-5', active: false },
              { day: 'W', h: 'h-3', active: false },
              { day: 'T', h: 'h-5', active: false },
              { day: 'F', h: 'h-2.5', active: false },
              { day: 'S', h: 'h-2', active: false },
              { day: 'S', h: 'h-7', active: true },
            ].map((bar, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-xs ${bar.h} ${
                    bar.active ? 'bg-[#890149]' : 'bg-[#EADCE0]'
                  }`}
                />
                <span className="text-[10px] text-[#30232A]/70">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reminder Sections */}
      <div className="space-y-8">
        {renderCategorySection('period', 'Period Reminders', Droplet)}
        {renderCategorySection('checkin', 'Daily Health Check-in', CalendarCheck)}
        {renderCategorySection('hydration', 'Hydration Reminders', GlassWater)}
        {renderCategorySection('wellbeing', 'Personal Wellbeing & Comfort', Sprout)}
        {renderCategorySection(
          'clinical',
          'Appointments & Clinician-Advised Medication',
          BriefcaseMedical
        )}
      </div>

      {/* Delivery & Privacy Safeguards */}
      <section aria-labelledby="delivery-safeguards-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#890149]" />
          <h2 id="delivery-safeguards-heading" className="font-serif-elvi text-[22px] text-[#30232A]">
            Delivery &amp; Privacy Safeguards
          </h2>
        </div>

        <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: OS Notifications */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                <Monitor className="w-3.5 h-3.5" />
                <span>SYSTEM PERMISSION</span>
              </div>
              <h3 className="text-[15px] font-semibold text-[#30232A]">OS Notifications</h3>
              <p className="text-[13px] leading-[20px] text-[#30232A]/80">
                Browser / OS Notifications: <strong className="font-semibold text-[#30232A]">Enabled</strong>
                . System level channel is authenticated.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => toggleReminder(reminders[0]?.id || '')}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#890149] hover:underline"
                >
                  <span>Manage in system settings</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Column 2: Discreet Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>LOCK SCREEN PRIVACY</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={discreetMode}
                  onClick={() => setDiscreetMode(!discreetMode)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                    discreetMode ? 'bg-[#890149] justify-end' : 'bg-[#D9A2B5]/60 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-[#FAF9F0]" />
                </button>
              </div>
              <h3 className="text-[15px] font-semibold text-[#30232A]">
                Discreet Mode (Recommended)
              </h3>
              <p className="text-[12px] leading-[19px] text-[#30232A]/80">
                Replaces sensitive terms like &quot;Period&quot;, &quot;Metformin&quot;, or logged symptoms
                on your lock screen with neutral copy: <em>&quot;ELVI: Daily health reminder&quot;</em>.
              </p>
              <div className="text-[12px] font-medium text-[#890149] pt-1">
                ✓ Guards public device glance privacy
              </div>
            </div>

            {/* Column 3: Quiet Hours Protection */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                <Moon className="w-3.5 h-3.5" />
                <span>REST WINDOW</span>
              </div>
              <h3 className="text-[15px] font-semibold text-[#30232A]">Quiet Hours Protection</h3>
              <p className="text-[12px] leading-[19px] text-[#30232A]/80">
                <strong className="font-semibold text-[#30232A] tabular-nums">{quietHoursLabel}</strong>.
                Non-urgent reminders are queued until morning. Critical clinician visits remain exempt with
                your consent.
              </p>
              {editingSleepWindow ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={quietHoursLabel}
                    onChange={(e) => setQuietHoursLabel(e.target.value)}
                    className="px-2.5 py-1 rounded bg-[#F3F3E7] border border-[#D9A2B5] text-[12px]"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingSleepWindow(false)}
                    className="px-2.5 py-1 rounded bg-[#890149] text-[#F3F3E7] text-[11px] font-semibold"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSleepWindow(true)}
                    className="px-3 py-1.5 rounded-[6px] bg-[#F3F3E7] border border-[#D9A2B5]/55 text-[12px] font-semibold text-[#30232A] hover:bg-[#EADCE0]/50"
                  >
                    Adjust Sleep Window
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/40 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#30232A]/80">
            <div>
              <strong className="font-semibold text-[#30232A]">Delivery Guarantee:</strong> ELVI never
              schedules unconfirmed alerts without your explicit consent and never sells notification
              telemetry.
            </div>
            <span className="underline text-[#890149] font-medium">Consent Terms</span>
          </div>
        </div>
      </section>

      {/* Create Reminder Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#30232A]/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#F3F3E7] border border-[#D9A2B5]/60 rounded-[12px] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif-elvi text-[22px] text-[#30232A]">Create Reminder</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded text-[#30232A]/70 hover:bg-[#EADCE0]/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#30232A] mb-1">
                  Reminder Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Spearmint Tea & Afternoon Rest"
                  className="w-full px-3 py-2 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/60 text-[14px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-[#30232A] mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ReminderItem['category'])}
                    className="w-full px-3 py-2 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/60 text-[13px]"
                  >
                    <option value="period">Period Reminders</option>
                    <option value="checkin">Daily Health Check-in</option>
                    <option value="hydration">Hydration Reminders</option>
                    <option value="wellbeing">Personal Wellbeing</option>
                    <option value="clinical">Clinician / Medication</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#30232A] mb-1">Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/60 text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#30232A] mb-1">Cadence</label>
                <input
                  type="text"
                  value={newCadence}
                  onChange={(e) => setNewCadence(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/60 text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#30232A] mb-1">
                  Supportive Note
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 rounded-[6px] bg-[#FAF9F0] border border-[#D9A2B5]/60 text-[13px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-[13px] font-medium text-[#30232A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-[6px] bg-[#890149] text-[#F3F3E7] text-[13px] font-semibold hover:bg-[#600032]"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
