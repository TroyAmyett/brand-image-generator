'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { AppHeader } from '@/ui/components/AppHeader/AppHeader';
import { UserMenu } from '@/components/UserMenu';
import { CanvasToolNav } from '@/components/CanvasToolNav';
import { useAuth } from '@/contexts/AuthContext';
import useCharacterWizard from './useCharacterWizard';
import StepIndicator from './StepIndicator';
import DesignStep from './steps/DesignStep';
import VariationsStep from './steps/VariationsStep';
import ExportStep from './steps/ExportStep';
import '@/ui/styles/index.css';

export default function CharactersPage() {
  const { user, isFederated, isLoading: authLoading } = useAuth();
  const isLoggedIn = isFederated && user;
  const router = useRouter();
  const wizard = useCharacterWizard();

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

      <StepIndicator
        currentStep={wizard.currentStep}
        completedSteps={wizard.completedSteps}
        onStepClick={wizard.goToStep}
      />

      <div className={styles.mainLayout}>
        {wizard.currentStep === 1 && <DesignStep wizard={wizard} />}
        {wizard.currentStep === 2 && <VariationsStep wizard={wizard} />}
        {wizard.currentStep === 3 && <ExportStep wizard={wizard} />}
      </div>
    </div>
  );
}
