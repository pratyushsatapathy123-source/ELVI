import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Plus,
  CheckCircle2,
  Edit3,
  Mic,
  Paperclip,
  Droplet,
  ArrowUp,
  Languages,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { useElvi } from '../context/ElviContext';

const EXPLORE_PROMPTS = [
  'Help me understand my recent cycle history',
  "I've been feeling unusually tired",
  "Help me make sense of the symptoms I've recorded",
];

export const AICompanionScreen: React.FC = () => {
  const {
    chatMessages,
    sendMessage,
    isChatLoading,
    streamingAssistantText,
    lastLatencyMetrics,
    startNewConversation,
    handleChatProposal,
    companionLanguage,
    setCompanionLanguage,
    aiMemories,
    newMemoryNotice,
    clearMemoryNotice,
    navigateTo,
  } = useElvi();

  const [inputText, setInputText] = useState('');
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streamingAssistantText, isChatLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isChatLoading) return;
    sendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="max-w-[880px]">
      <AppHeader
        kicker="CARE & INSIGHTS"
        title="AI Companion"
        subtitle="A quiet, thoughtful space to talk through your cycle, symptoms, and daily wellbeing."
        rightAction={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo('settings')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#FAF9F0] border border-[#D9A2B5]/55 text-[12px] font-semibold text-[#30232A] hover:bg-[#EADCE0]/50 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#890149]" aria-hidden="true" />
              <span>{aiMemories.length} active context points</span>
            </button>

            <button
              type="button"
              onClick={startNewConversation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#FAF9F0] border border-[#D9A2B5]/55 text-[12px] font-semibold text-[#30232A] hover:bg-[#EADCE0]/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#890149]" />
              <span>New conversation</span>
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#EADCE0]/60 text-[12px] font-medium text-[#890149]">
              <Lock className="w-3.5 h-3.5" />
              <span>Private &amp; Consent-driven</span>
            </div>
          </div>
        }
      />

      {newMemoryNotice && (
        <div className="mb-6 rounded-[8px] bg-[#FAF9F0] border border-[#890149]/40 p-3.5 flex items-center justify-between gap-4 text-[13px] text-[#30232A]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#890149] animate-pulse" />
            <span>{newMemoryNotice}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo('settings')}
              className="text-[12px] font-semibold text-[#890149] hover:underline"
            >
              Manage in Settings →
            </button>
            <button
              type="button"
              onClick={clearMemoryNotice}
              className="text-[12px] text-[#30232A]/60 hover:text-[#30232A]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Conversation Stream */}
      <div className="space-y-6 mb-8">
        {chatMessages.map((msg, idx) => {
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex items-start justify-end gap-3">
                <div className="max-w-[640px] rounded-[12px] bg-[#EBE9DF] border border-[#D9A2B5]/45 px-5 py-4 text-[15px] leading-[24px] text-[#30232A]">
                  {msg.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#E3E3D7] text-[#30232A] text-[12px] font-semibold flex items-center justify-center shrink-0 mt-1">
                  You
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-serif-elvi text-[15px] shrink-0 mt-1 ${
                    idx === 0
                      ? 'bg-[#EADCE0] text-[#890149]'
                      : 'bg-[#890149] text-[#F3F3E7]'
                  }`}
                >
                  E
                </div>

                <div className="flex-1 max-w-[720px] space-y-4">
                  <div
                    className={`rounded-[12px] p-5 sm:p-6 space-y-3 ${
                      msg.isError
                        ? 'bg-[#FAF3F3] border border-[#890149]/50'
                        : 'bg-[#FAF9F0] border border-[#D9A2B5]/45'
                    }`}
                  >
                    {msg.title && (
                      <div className="text-[15px] font-semibold text-[#890149]">{msg.title}</div>
                    )}
                    {msg.paragraphs.map((p, i) => (
                      <p
                        key={i}
                        className={`text-[#30232A] ${
                          idx === 0 && i === 1
                            ? 'text-[13px] leading-[20px] text-[#30232A]/75 pt-1'
                            : 'text-[15px] leading-[24px]'
                        }`}
                      >
                        {p}
                      </p>
                    ))}
                    {msg.latencyMetrics?.timeToFirstTokenMs && (
                      <div className="text-[11px] text-[#30232A]/50 pt-1 flex items-center gap-2">
                        <span>
                          Response started in{' '}
                          {(msg.latencyMetrics.timeToFirstTokenMs / 1000).toFixed(1)}s
                        </span>
                        {msg.latencyMetrics.totalTurnMs && (
                          <span>
                            · Total turn {(msg.latencyMetrics.totalTurnMs / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Explore Prompts after first welcome message */}
                  {idx === 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149] mr-1">
                        EXPLORE:
                      </span>
                      {EXPLORE_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => sendMessage(prompt)}
                          className="px-3.5 py-1.5 rounded-[8px] bg-[#EBE9DF]/80 hover:bg-[#EADCE0] border border-[#D9A2B5]/40 text-[13px] text-[#30232A] transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Proposed Health Record Card */}
                  {msg.proposal && msg.proposal.status === 'draft' && (
                    <div className="rounded-[12px] bg-[#F7F7EC] border border-[#D9A2B5]/65 p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#890149]">
                          <span className="w-2 h-2 rounded-full bg-[#D9A2B5]" aria-hidden="true" />
                          <span>PROPOSED HEALTH RECORD · PENDING CONFIRMATION</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded bg-[#EADCE0] text-[#890149] text-[11px] font-semibold">
                          Draft
                        </span>
                      </div>

                      <div className="rounded-[10px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-[11px] font-semibold text-[#890149] mb-0.5">
                            Logged Symptom
                          </div>
                          <div className="text-[15px] font-semibold text-[#30232A]">
                            {msg.proposal.symptomTitle}
                          </div>
                          <div className="text-[13px] text-[#30232A]/75 mt-0.5">
                            {msg.proposal.symptomMeta}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-semibold text-[#890149] mb-0.5">
                            Nourishment Note
                          </div>
                          <div className="text-[15px] font-semibold text-[#30232A]">
                            {msg.proposal.nourishmentTitle}
                          </div>
                          <div className="text-[13px] text-[#30232A]/75 mt-0.5">
                            {msg.proposal.nourishmentMeta}
                          </div>
                        </div>
                      </div>

                      {editingProposalId === msg.id && (
                        <div className="text-[12px] text-[#890149] bg-[#EADCE0]/50 px-3 py-2 rounded-[6px]">
                          You can refine full symptom intensity and meal timing in Daily Check-in or save
                          this observation directly.
                        </div>
                      )}

                      <p className="text-[13px] leading-[20px] text-[#30232A]/80">
                        This observation remains uncommitted. It will{' '}
                        <strong className="font-semibold text-[#30232A]">not</strong> alter your cycle
                        averages or be added to your verified medical timeline until you click confirm.
                      </p>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleChatProposal(msg.id, 'confirmed')}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#890149] text-[#F3F3E7] text-[13px] font-semibold hover:bg-[#600032] transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm &amp; Save to Timeline</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setEditingProposalId((cur) => (cur === msg.id ? null : msg.id))
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[8px] bg-[#FAF9F0] border border-[#D9A2B5]/60 text-[13px] font-semibold text-[#30232A] hover:bg-[#EADCE0]/50 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleChatProposal(msg.id, 'discarded')}
                          className="px-3 py-2 text-[13px] font-semibold text-[#890149] hover:underline"
                        >
                          Discard draft
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.proposal && msg.proposal.status === 'confirmed' && (
                    <div className="rounded-[8px] bg-[#EADCE0]/75 border border-[#890149]/35 px-4 py-3 text-[13px] font-medium text-[#890149] flex items-center justify-between">
                      <span>✓ Confirmed and saved to your Health Timeline.</span>
                      <button
                        type="button"
                        onClick={() => navigateTo('health-timeline')}
                        className="underline font-semibold"
                      >
                        Open Timeline →
                      </button>
                    </div>
                  )}

                  {msg.proposal && msg.proposal.status === 'discarded' && (
                    <div className="rounded-[8px] bg-[#F7F7EC] border border-[#D9A2B5]/40 px-4 py-2.5 text-[12px] text-[#30232A]/65">
                      Draft observation discarded. Nothing was added to your timeline.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Minimal Typing Indicator — Active while model is preparing and before first token */}
        {isChatLoading && !streamingAssistantText && (
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-[#890149] text-[#F3F3E7] font-serif-elvi text-[15px] flex items-center justify-center shrink-0 mt-1">
              E
            </div>
            <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 px-5 py-3 text-[14px] text-[#30232A]/80 flex items-center gap-2.5">
              <span className="flex gap-1 items-center" aria-hidden="true">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#890149] animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#890149] animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#890149] animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </span>
              <span className="font-medium text-[13px] text-[#890149]">ELVI is typing…</span>
            </div>
          </div>
        )}

        {/* Live Progressive Streaming Assistant Message */}
        {streamingAssistantText && (
          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-[#890149] text-[#F3F3E7] font-serif-elvi text-[15px] flex items-center justify-center shrink-0 mt-1">
                E
              </div>
              <div className="flex-1 max-w-[720px] space-y-4">
                <div className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/45 p-5 sm:p-6 space-y-3">
                  <div className="text-[15px] leading-[24px] text-[#30232A] whitespace-pre-wrap">
                    {streamingAssistantText}
                    <span
                      className="inline-block w-1.5 h-4 ml-1 bg-[#890149] animate-pulse align-middle"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Clinical Continuity Note */}
      <div className="rounded-[10px] bg-[#F7F7EC] border border-[#D9A2B5]/45 p-4 mb-6 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-[#890149] shrink-0 mt-0.5" />
        <p className="text-[13px] leading-[20px] text-[#30232A]/85">
          <strong className="font-semibold text-[#30232A]">Clinical Continuity Note:</strong> ELVI provides
          supportive guidance, lifestyle patterns, and structured journaling assistance. ELVI does not offer
          diagnostic evaluations or emergency care. In the event of acute pain, heavy bleeding, or sudden
          physiological shifts, please consult your physician or emergency services promptly.
        </p>
      </div>

      {/* Composer Box — Matches screen_567e07ad.png */}
      <form
        onSubmit={handleSend}
        className="rounded-[12px] bg-[#FAF9F0] border border-[#D9A2B5]/60 overflow-hidden shadow-xs"
      >
        {/* Top bar of composer */}
        <div className="px-4 py-2.5 bg-[#F3F3E7]/80 border-b border-[#D9A2B5]/40 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-[#890149] mr-1" />
            {(['English', 'हिन्दी', 'ଓଡ଼ିଆ'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setCompanionLanguage(lang)}
                className={`px-2.5 py-0.5 rounded text-[12px] font-semibold transition-colors ${
                  companionLanguage === lang
                    ? 'bg-[#FAF9F0] text-[#890149] border border-[#D9A2B5]/50'
                    : 'text-[#30232A]/70 hover:text-[#30232A]'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#30232A]/75">
            <span className="w-1.5 h-1.5 rounded-full bg-[#890149]" aria-hidden="true" />
            <span>Menstrual &amp; wellbeing continuity active</span>
          </div>
        </div>

        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (inputText.trim()) {
                sendMessage(inputText);
                setInputText('');
              }
            }
          }}
          placeholder="Ask about your cycle, describe how you're feeling, or discuss nourishment..."
          aria-label="Message ELVI AI Companion"
          className="w-full px-4 py-3 bg-transparent text-[14px] text-[#30232A] focus:outline-none resize-none"
        />

        <div className="px-4 py-2.5 flex items-center justify-between gap-4 border-t border-[#D9A2B5]/30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInputText((prev) => `${prev} [Voice note attached] `.trimStart())}
              aria-label="Voice reflection"
              className="p-1.5 rounded text-[#890149]/80 hover:bg-[#EADCE0]/50"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigateTo('reports')}
              aria-label="Attach clinical report"
              className="p-1.5 rounded text-[#890149]/80 hover:bg-[#EADCE0]/50"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigateTo('daily-check-in')}
              aria-label="Log cycle or flow observation"
              className="p-1.5 rounded text-[#890149]/80 hover:bg-[#EADCE0]/50"
            >
              <Droplet className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[11px] text-[#30232A]/60">
              Shift + Enter for new line
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] bg-[#890149] text-[#F3F3E7] text-[13px] font-semibold hover:bg-[#600032] transition-colors"
            >
              <span>Send</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
