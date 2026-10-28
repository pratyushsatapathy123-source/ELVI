import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  UploadCloud,
  ArrowRight,
  Sparkles,
  HelpCircle,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react';
import { useElvi } from '../context/ElviContext';

export const OnboardingScreen: React.FC = () => {
  const { completeOnboarding, userProfile, signOutApp } = useElvi();

  // Step 1: PCOS question
  const [pcosAnswer, setPcosAnswer] = useState<'yes' | 'no' | null>(null);

  // Step 2: Clinical report attachment (if yes)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>('application/pdf');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10 MB limit. Please select a smaller file.');
      return;
    }

    // Validate format
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      setUploadError('Unsupported format. Please upload a PDF, PNG, or JPG document.');
      return;
    }

    setSelectedFile(file);
    setFileMimeType(file.type || 'application/pdf');

    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      setFileBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleProceedNo = async () => {
    setIsUploading(true);
    try {
      await completeOnboarding('no');
    } catch (err: any) {
      setUploadError(err?.message || 'Could not complete onboarding. Please try again.');
      setIsUploading(false);
    }
  };

  const handleProceedYesWithoutReport = async () => {
    setIsUploading(true);
    try {
      await completeOnboarding('yes');
    } catch (err: any) {
      setUploadError(err?.message || 'Could not complete onboarding. Please try again.');
      setIsUploading(false);
    }
  };

  const handleProceedYesWithReport = async () => {
    if (!selectedFile || !fileBase64) {
      await handleProceedYesWithoutReport();
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      await completeOnboarding('yes', {
        fileName: selectedFile.name,
        base64Data: fileBase64,
        mimeType: fileMimeType,
      });
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload clinical report. You can skip and upload later in Reports.');
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F3E7] text-[#30232A] flex flex-col justify-between p-6 sm:p-10">
      {/* Top Header / Branding */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[#D9A2B5]/40">
        <div>
          <div className="font-serif-elvi text-[28px] leading-none text-[#890149]">ELVI</div>
          <div className="text-[12px] text-[#30232A]/70 mt-1">Health Companion</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EADCE0]/70 text-[12px] font-medium text-[#890149]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Private &amp; Sovereign</span>
          </div>
          <button
            type="button"
            onClick={signOutApp}
            className="text-[12px] text-[#30232A]/70 hover:text-[#890149] underline"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto w-full py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {/* Welcome Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EADCE0]/60 text-[12px] font-semibold text-[#890149] uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>First-Login Personalization</span>
          </div>
          <h1 className="font-serif-elvi text-[34px] sm:text-[42px] leading-tight text-[#30232A]">
            Thank you for choosing ELVI
          </h1>
          <p className="text-[15px] sm:text-[16px] text-[#30232A]/80 mt-2 max-w-lg mx-auto leading-relaxed">
            Welcome, {userProfile.name}. We are here to support your menstrual rhythm and hormonal health with calm, clinical clarity.
          </p>
        </div>

        {uploadError && (
          <div className="mb-6 p-4 rounded-[10px] bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-[14px]">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">{uploadError}</div>
          </div>
        )}

        {/* Question 1: PCOS / PCOD */}
        <div className="bg-[#FAF9F0] border border-[#D9A2B5]/60 rounded-[16px] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#890149] mb-1.5">
              CARE CUSTOMIZATION
            </div>
            <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#30232A] leading-snug">
              Are you experiencing PCOS/PCOD symptoms, or have you been diagnosed with PCOS/PCOD?
            </h2>
            <p className="text-[13px] text-[#30232A]/75 mt-2 leading-[20px]">
              This response customizes your cycle insights and nutritional suggestions. It does not constitute or replace a clinical diagnosis. You can change this at any time in Settings.
            </p>
          </div>

          {/* Yes / No Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setPcosAnswer('yes');
                setUploadError(null);
              }}
              className={`p-4 rounded-[10px] border text-center transition-all ${
                pcosAnswer === 'yes'
                  ? 'bg-[#EADCE0] border-[#890149] text-[#890149] font-semibold shadow-xs ring-2 ring-[#890149]/20'
                  : 'bg-[#F3F3E7] border-[#D9A2B5]/60 text-[#30232A] hover:bg-[#EADCE0]/40'
              }`}
            >
              <div className="text-[16px] font-semibold">Yes</div>
              <div className="text-[12px] text-[#30232A]/70 mt-1">Diagnosed or monitoring symptoms</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setPcosAnswer('no');
                setSelectedFile(null);
                setFileBase64(null);
                setUploadError(null);
              }}
              className={`p-4 rounded-[10px] border text-center transition-all ${
                pcosAnswer === 'no'
                  ? 'bg-[#EADCE0] border-[#890149] text-[#890149] font-semibold shadow-xs ring-2 ring-[#890149]/20'
                  : 'bg-[#F3F3E7] border-[#D9A2B5]/60 text-[#30232A] hover:bg-[#EADCE0]/40'
              }`}
            >
              <div className="text-[16px] font-semibold">No</div>
              <div className="text-[12px] text-[#30232A]/70 mt-1">General cycle &amp; wellness tracking</div>
            </button>
          </div>

          {/* If YES: Follow-up question for clinical report */}
          {pcosAnswer === 'yes' && (
            <div className="pt-4 border-t border-[#D9A2B5]/40 space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-[16px] font-semibold text-[#30232A]">
                  Would you like to attach an existing clinical report?
                </h3>
                <p className="text-[13px] text-[#30232A]/75 mt-1 leading-[20px]">
                  If you have a recent hormone panel, ultrasound report, or blood work, you may attach it privately to your health records now. This is completely optional.
                </p>
              </div>

              {/* Private File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-[10px] bg-[#F3F3E7] border border-dashed border-[#D9A2B5] p-6 text-center cursor-pointer hover:border-[#890149] transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-10 h-10 rounded-full bg-[#EADCE0]/70 flex items-center justify-center mx-auto mb-2 text-[#890149]">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-[14px] font-semibold text-[#30232A]">
                  {selectedFile ? selectedFile.name : 'Upload Clinical Report (PDF, PNG, JPG)'}
                </div>
                <div className="text-[12px] text-[#30232A]/70 mt-1">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for private upload`
                    : 'Click or drop file here · Up to 10 MB'}
                </div>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#EADCE0]/60 text-[13px] text-[#890149]">
                  <span className="truncate">Selected: {selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setFileBase64(null);
                    }}
                    className="p-1 hover:text-[#30232A]"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Actions for YES */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                {selectedFile ? (
                  <button
                    type="button"
                    onClick={handleProceedYesWithReport}
                    disabled={isUploading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-[8px] bg-[#890149] text-[#F3F3E7] font-semibold text-[14px] hover:bg-[#6e013a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Uploading &amp; Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Upload Clinical Report &amp; Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleProceedYesWithoutReport}
                    disabled={isUploading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-[8px] bg-[#890149] text-[#F3F3E7] font-semibold text-[14px] hover:bg-[#6e013a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <span>Continue to ELVI</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleProceedYesWithoutReport}
                  disabled={isUploading}
                  className="text-[13px] text-[#30232A]/70 hover:text-[#890149] font-medium underline"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* If NO: Simple continue */}
          {pcosAnswer === 'no' && (
            <div className="pt-4 border-t border-[#D9A2B5]/40 flex items-center justify-between animate-fadeIn">
              <div className="text-[13px] text-[#30232A]/80">
                You're ready to explore ELVI's cycle tracking and daily reflections.
              </div>
              <button
                type="button"
                onClick={handleProceedNo}
                disabled={isUploading}
                className="px-6 py-2.5 rounded-[8px] bg-[#890149] text-[#F3F3E7] font-semibold text-[14px] hover:bg-[#6e013a] transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                {isUploading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <span>Continue to ELVI</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto w-full text-center text-[12px] text-[#30232A]/60 pt-6 border-t border-[#D9A2B5]/40">
        ELVI Health Companion · All data is stored in sovereign private collections and never shared without consent.
      </footer>
    </div>
  );
};
