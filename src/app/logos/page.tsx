'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { AppHeader } from '@/ui/components/AppHeader/AppHeader';
import { UserMenu } from '@/components/UserMenu';
import { CanvasToolNav } from '@/components/CanvasToolNav';
import { useAuth } from '@/contexts/AuthContext';
import useLogoWizard from './useLogoWizard';
import StepIndicator from './StepIndicator';
import IconStep from './steps/IconStep';
import LockupStep from './steps/LockupStep';
import ExportStep from './steps/ExportStep';
import '@/ui/styles/index.css';

// Google Fonts used by the lockup compositor.
// Loaded via <link> so they're available to the Canvas API.
const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?' +
  'family=Inter:wght@400;500;600;700;800' +
  '&family=Montserrat:wght@400;500;600;700;800' +
  '&family=Playfair+Display:wght@400;500;600;700;800' +
  '&family=Roboto:wght@400;500;700;900' +
  '&family=Poppins:wght@400;500;600;700;800' +
  '&family=Raleway:wght@400;500;600;700;800' +
  '&family=Open+Sans:wght@400;500;600;700;800' +
  '&family=Oswald:wght@400;500;600;700' +
  '&display=swap';

export default function LogosPage() {
  const { user, isFederated, isLoading: authLoading } = useAuth();
  const isLoggedIn = isFederated && user;
  const router = useRouter();
  const wizard = useLogoWizard();

  // Load Google Fonts for lockup Canvas rendering
  useEffect(() => {
    if (typeof document === 'undefined') return;
    // Don't add duplicate link elements
    const existing = document.querySelector(`link[href^="https://fonts.googleapis.com"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }, []);

  // Redirect to login when not authenticated
  if (!authLoading && !isLoggedIn) {
    router.push('/login');
    return null;
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className={styles.appLayout}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.appLayout}>
      <AppHeader
        toolSwitcher={<CanvasToolNav />}
        settingsButton={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserMenu />
          </div>
        }
      />

      {/* Step indicator */}
      <StepIndicator
        currentStep={wizard.currentStep}
        completedSteps={wizard.completedSteps}
        onStepClick={wizard.goToStep}
      />

      {/* Three-column layout: sidebar | center | preview */}
      <div className={styles.mainLayout}>
        {wizard.currentStep === 1 && <IconStep wizard={wizard} />}
        {wizard.currentStep === 2 && <LockupStep wizard={wizard} />}
        {wizard.currentStep === 3 && <ExportStep wizard={wizard} />}
      </div>
    </div>
  );
}
