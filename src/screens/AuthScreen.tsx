import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useElvi } from '../context/ElviContext';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  auth,
} from '../lib/firebase';

type AuthView = 'signin' | 'signup' | 'verify-otp' | 'forgot-password';

interface AuthScreenProps {
  initialView?: AuthView;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialView = 'signin' }) => {
  const { signInGoogle, toggleDemoMode, isDemoMode, currentUser, markEmailVerified, signOutApp } = useElvi();

  const [view, setView] = useState<AuthView>(initialView);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [pendingUserId, setPendingUserId] = useState<string | null>(() => currentUser?.uid || null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(() => currentUser?.email || null);
  const [devCodeNote, setDevCodeNote] = useState<string | null>(null);
  const [configNotice, setConfigNotice] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearState = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setConfigNotice(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    setIsLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      // Check if user has verified email
      const uid = userCred.user.uid;
      const verified =
        userCred.user.emailVerified ||
        localStorage.getItem(`elvi_verified_${uid}`) === 'true';

      if (!verified) {
        setPendingUserId(uid);
        setPendingEmail(userCred.user.email || email.trim());
        // Request code
        const resp = await fetch('/api/auth/send-verification-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, email: userCred.user.email || email.trim() }),
        });
        const data = await resp.json();
        if (data.devCode) setDevCodeNote(data.devCode);
        if (data.requiresConfiguration) setConfigNotice(data.configNotice || data.message);
        setView('verify-otp');
        setSuccessMessage('Please verify your email address with the 6-digit numeric code.');
      } else {
        setSuccessMessage('Successfully signed in to ELVI!');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setErrorMessage('Invalid email or password. Please check your credentials and try again.');
      } else if (msg.includes('too-many-requests')) {
        setErrorMessage('Too many failed attempts. Please reset your password or wait a few minutes.');
      } else {
        setErrorMessage(err?.message || 'Failed to sign in. Please check your network and credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setIsLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (userCred.user) {
        if (fullName.trim()) {
          await updateProfile(userCred.user, { displayName: fullName.trim() });
        }

        // Trigger server-side OTP generation
        const resp = await fetch('/api/auth/send-verification-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userCred.user.uid,
            email: userCred.user.email,
          }),
        });
        const data = await resp.json();

        setPendingUserId(userCred.user.uid);
        setPendingEmail(userCred.user.email || email.trim());
        if (data.devCode) setDevCodeNote(data.devCode);
        if (data.requiresConfiguration) {
          setConfigNotice(data.configNotice || data.message);
        }

        setView('verify-otp');
        setSuccessMessage(`Account created for ${userCred.user.email}. Please verify with the 6-digit code.`);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('email-already-in-use')) {
        setErrorMessage('An account with this email already exists. Please sign in instead.');
      } else {
        setErrorMessage(err?.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }
    const uid = pendingUserId || currentUser?.uid;
    if (!uid) {
      setErrorMessage('Missing user session for verification. Please sign in again.');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          code,
        }),
      });
      const data = await resp.json();

      if (!resp.ok || !data.verified) {
        throw new Error(data.error || 'Verification failed. Please check the code.');
      }

      // Mark email verified
      markEmailVerified();
      setSuccessMessage('Email verified successfully! Proceeding to ELVI...');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to verify code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    clearState();
    const uid = pendingUserId || currentUser?.uid;
    const targetEmail = pendingEmail || currentUser?.email;
    if (!uid || !targetEmail) return;

    setIsLoading(true);
    try {
      const resp = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          email: targetEmail,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Could not resend code.');
      }
      if (data.devCode) setDevCodeNote(data.devCode);
      if (data.requiresConfiguration) setConfigNotice(data.configNotice || data.message);

      setOtpDigits(['', '', '', '', '', '']);
      setSuccessMessage(`New 6-digit verification code generated for ${targetEmail}.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not resend code. Please try again in 60 seconds.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      // Safe, privacy-preserving feedback
      setSuccessMessage('If an account is registered with this email, password reset instructions have been sent. Please check your inbox.');
    } catch (err: any) {
      // Avoid disclosing existence of account while handling errors gracefully
      setSuccessMessage('If an account is registered with this email, password reset instructions have been sent. Please check your inbox.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearState();
    setIsLoading(true);
    try {
      await signInGoogle();
      setSuccessMessage('Successfully signed in with Google!');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F3E7] text-[#30232A] flex flex-col justify-between p-6 sm:p-10">
      {/* Top Brand Bar */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between pb-6">
        <div>
          <span className="font-serif-elvi text-[28px] leading-none text-[#890149]">ELVI</span>
          <span className="text-[12px] text-[#30232A]/70 ml-2">Health Companion</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EADCE0]/70 text-[12px] font-medium text-[#890149]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Encrypted Session</span>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full my-auto py-6">
        {/* Header Badge */}
        <div className="text-center mb-8">
          <h1 className="font-serif-elvi text-[32px] sm:text-[38px] text-[#30232A] leading-tight">
            {view === 'signin' && 'Sign in to ELVI'}
            {view === 'signup' && 'Create Your ELVI Account'}
            {view === 'verify-otp' && 'Verify Your Email'}
            {view === 'forgot-password' && 'Reset Your Password'}
          </h1>
          <p className="text-[14px] text-[#30232A]/75 mt-2">
            {view === 'signin' && 'Access your private menstrual, cycle, and clinical health journal.'}
            {view === 'signup' && 'Join ELVI for calm, clinical-grade hormonal and cycle care.'}
            {view === 'verify-otp' && `Enter the 6-digit numeric verification code for ${pendingEmail || currentUser?.email || 'your account'}.`}
            {view === 'forgot-password' && 'Enter your registered email address to receive reset instructions.'}
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-[#FAF9F0] border border-[#D9A2B5]/60 rounded-[16px] p-6 sm:p-8 shadow-xs">
          {/* Status Messages */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-[10px] bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-800 text-[13px]">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-[10px] bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-[13px]">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1">{successMessage}</div>
            </div>
          )}

          {configNotice && (
            <div className="mb-5 p-3.5 rounded-[10px] bg-[#EADCE0]/80 border border-[#D9A2B5] text-[12px] text-[#890149]">
              <div className="font-semibold flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Configuration Notice
              </div>
              <div>{configNotice}</div>
            </div>
          )}

          {/* 1. SIGN IN VIEW */}
          {view === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="signin-email" className="block text-[13px] font-semibold text-[#30232A] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#30232A]/50 absolute left-3.5 top-3" />
                  <input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[14px] text-[#30232A] placeholder:text-[#30232A]/40 focus:outline-none focus:border-[#890149]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="signin-password" className="block text-[13px] font-semibold text-[#30232A]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      clearState();
                      setView('forgot-password');
                    }}
                    className="text-[12px] text-[#890149] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#30232A]/50 absolute left-3.5 top-3" />
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[14px] text-[#30232A] placeholder:text-[#30232A]/40 focus:outline-none focus:border-[#890149]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-3 text-[#30232A]/60 hover:text-[#30232A]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-[8px] bg-[#890149] text-[#F3F3E7] font-semibold text-[14px] hover:bg-[#6e013a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#D9A2B5]/50" />
                </div>
                <span className="relative px-3 bg-[#FAF9F0] text-[11px] uppercase font-semibold text-[#30232A]/60">
                  Or Continue With
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[#30232A] font-medium text-[13px] hover:bg-[#EADCE0]/50 transition-colors flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <p className="text-center text-[13px] text-[#30232A]/80 mt-6">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    clearState();
                    setView('signup');
                  }}
                  className="text-[#890149] font-semibold hover:underline"
                >
                  Create Account
                </button>
              </p>
            </form>
          )}

          {/* 2. SIGN UP VIEW */}
          {view === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="signup-name" className="block text-[13px] font-semibold text-[#30232A] mb-1.5">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#30232A]/50 absolute left-3.5 top-3" />
                  <input
                    id="signup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full pl-10 pr-3 py-2.5 rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[14px] text-[#30232A] placeholder:text-[#30232A]/40 focus:outline-none focus:border-[#890149]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-[13px] font-semibold text-[#30232A] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#30232A]/50 absolute left-3.5 top-3" />
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[14px] text-[#30232A] placeholder:text-[#30232A]/40 focus:outline-none focus:border-[#890149]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-[13px] font-semibold text-[#30232A] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#30232A]/50 absolute left-3.5 top-3" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[14px] text-[#30232A] placeholder:text-[#30232A]/40 focus:outline-none focus:border-[#890149]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-3 text-[#30232A]/60 hover:text-[#30232A]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="signup-confirm-password" className="block text-[13px] font-semibold text-[#30232A] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#30232A]/50 absolute left-3.5 top-3" />
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[14px] text-[#30232A] placeholder:text-[#30232A]/40 focus:outline-none focus:border-[#890149]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-3 text-[#30232A]/60 hover:text-[#30232A]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-[8px] bg-[#890149] text-[#F3F3E7] font-semibold text-[14px] hover:bg-[#6e013a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account &amp; Verify Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#D9A2B5]/50" />
                </div>
                <span className="relative px-3 bg-[#FAF9F0] text-[11px] uppercase font-semibold text-[#30232A]/60">
                  Or Register With
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[#30232A] font-medium text-[13px] hover:bg-[#EADCE0]/50 transition-colors flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <p className="text-center text-[13px] text-[#30232A]/80 mt-6">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    clearState();
                    setView('signin');
                  }}
                  className="text-[#890149] font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* 3. VERIFY NUMERIC OTP CODE VIEW */}
          {view === 'verify-otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {devCodeNote && (
                <div className="p-3.5 rounded-[10px] bg-[#EADCE0]/80 border border-[#D9A2B5] text-[13px] text-[#890149]">
                  <div className="font-semibold flex items-center gap-1.5 mb-0.5">
                    <Sparkles className="w-4 h-4" /> Local Test Verification Code
                  </div>
                  Enter the 6-digit challenge code:{' '}
                  <span className="font-mono font-bold text-[15px] underline tracking-widest">{devCodeNote}</span>
                </div>
              )}

              <div>
                <label className="block text-[13px] font-semibold text-[#30232A] mb-3 text-center">
                  Enter 6-Digit Numeric Verification Code
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-12 text-center text-[20px] font-bold font-mono rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/70 text-[#30232A] focus:outline-none focus:border-[#890149] focus:ring-1 focus:ring-[#890149]"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-[8px] bg-[#890149] text-[#F3F3E7] font-semibold text-[14px] hover:bg-[#6e013a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code &amp; Continue</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[13px] pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-[#890149] hover:underline font-medium flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                </button>

                <button
                  type="button"
                  onClick={signOutApp}
                  className="text-[#30232A]/70 hover:text-[#890149] underline"
                >
                  Cancel / Sign Out
                </button>
              </div>
            </form>
          )}

          {/* 4. FORGOT PASSWORD VIEW */}
          {view === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-[13px] font-semibold text-[#30232A] mb-1.5">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#30232A]/50 absolute left-3.5 top-3" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-[8px] bg-[#F3F3E7] border border-[#D9A2B5]/60 text-[14px] text-[#30232A] placeholder:text-[#30232A]/40 focus:outline-none focus:border-[#890149]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-[8px] bg-[#890149] text-[#F3F3E7] font-semibold text-[14px] hover:bg-[#6e013a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Instructions...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Email</span>
                    <KeyRound className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-[13px] text-[#30232A]/80 mt-6">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    clearState();
                    setView('signin');
                  }}
                  className="text-[#890149] font-semibold hover:underline"
                >
                  Back to Sign In
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Demo Mode Toggle for Synthetic Local Testing */}
        <div className="mt-8 p-3.5 rounded-[12px] bg-[#EADCE0]/50 border border-[#D9A2B5]/60 flex items-center justify-between gap-3">
          <div>
            <div className="text-[13px] font-semibold text-[#30232A]">Local Evaluation Sandbox</div>
            <div className="text-[11px] text-[#30232A]/70">Explore with synthetic test fixture data</div>
          </div>
          <button
            type="button"
            onClick={toggleDemoMode}
            className="px-3 py-1.5 rounded-[6px] bg-[#F3F3E7] border border-[#D9A2B5] text-[12px] font-semibold text-[#890149] hover:bg-white transition-colors shrink-0"
          >
            {isDemoMode ? 'Exit Demo' : 'Enter Demo'}
          </button>
        </div>
      </div>

      <footer className="max-w-md mx-auto w-full text-center text-[12px] text-[#30232A]/60 pt-6 border-t border-[#D9A2B5]/40">
        ELVI Health Companion · Dedicated project elvi-osfic
      </footer>
    </div>
  );
};
