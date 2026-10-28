/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ElviProvider, useElvi } from './context/ElviContext';
import { AppLayout } from './components/layout/AppLayout';
import { TodayScreen } from './screens/TodayScreen';
import { CycleTrackerScreen } from './screens/CycleTrackerScreen';
import { DailyCheckInScreen } from './screens/DailyCheckInScreen';
import { HealthTimelineScreen } from './screens/HealthTimelineScreen';
import { AICompanionScreen } from './screens/AICompanionScreen';
import { PcosCareScreen } from './screens/PcosCareScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { RemindersScreen } from './screens/RemindersScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AuthScreen } from './screens/AuthScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';

function ScreenRouter() {
  const { activeScreen } = useElvi();

  switch (activeScreen) {
    case 'today':
      return <TodayScreen />;
    case 'cycle-tracker':
      return <CycleTrackerScreen />;
    case 'daily-check-in':
      return <DailyCheckInScreen />;
    case 'health-timeline':
      return <HealthTimelineScreen />;
    case 'ai-companion':
      return <AICompanionScreen />;
    case 'pcos-care':
      return <PcosCareScreen />;
    case 'reports':
      return <ReportsScreen />;
    case 'reminders':
      return <RemindersScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'onboarding':
      return <OnboardingScreen />;
    case 'auth':
      return <AuthScreen initialView="signin" />;
    default:
      return <TodayScreen />;
  }
}

function AppRoot() {
  const {
    isAuthReady,
    currentUser,
    isEmailVerified,
    isOnboardingCompleted,
    isDemoMode,
  } = useElvi();

  // 1. Initial Authentication Loading State (peaceful branded splash, avoids dashboard flash)
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#F3F3E7] flex flex-col items-center justify-center text-[#30232A]">
        <div className="text-center space-y-3">
          <div className="font-serif-elvi text-[44px] leading-none text-[#890149]">ELVI</div>
          <div className="text-[12px] uppercase tracking-widest text-[#30232A]/70">Health Companion</div>
          <div className="flex justify-center pt-5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#890149] animate-ping" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Demo Sandbox Mode (if user explicitly enabled demo fixture data for evaluation)
  if (isDemoMode) {
    return (
      <AppLayout>
        <ScreenRouter />
      </AppLayout>
    );
  }

  // 3. Unauthenticated Visitor: Must see Sign In screen first. No sidebar, no health data.
  if (!currentUser) {
    return <AuthScreen initialView="signin" />;
  }

  // 4. Email Verification Guard: unverified email/password user cannot access health screens
  if (!isEmailVerified) {
    return <AuthScreen initialView="verify-otp" />;
  }

  // 5. First-Login Welcome Onboarding: un-onboarded user sees welcome & PCOS question
  if (!isOnboardingCompleted) {
    return <OnboardingScreen />;
  }

  // 6. Authenticated, verified user with completed onboarding: full access to protected health dashboard
  return (
    <AppLayout>
      <ScreenRouter />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ElviProvider>
      <AppRoot />
    </ElviProvider>
  );
}
