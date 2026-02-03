'use client';

import React from 'react';
import { Check } from 'lucide-react';

type Step = 1 | 2 | 3;

interface StepIndicatorProps {
  currentStep: Step;
  completedSteps: Step[];
  onStepClick: (step: Step) => void;
}

const STEP_LABELS = ['Design', 'Variations', 'Export'] as const;

export default function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  const isCompleted = (step: Step) => completedSteps.includes(step);
  const isActive = (step: Step) => step === currentStep;
  const isClickable = (step: Step) => isActive(step) || isCompleted(step);

  const getCircleStyle = (step: Step): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: 28,
      height: 28,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1,
      transition: 'all 0.2s ease',
      flexShrink: 0,
    };

    if (isCompleted(step)) {
      return {
        ...base,
        backgroundColor: '#0ea5e9',
        border: '2px solid #0ea5e9',
        color: '#ffffff',
      };
    }

    if (isActive(step)) {
      return {
        ...base,
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        border: '2px solid #0ea5e9',
        color: '#0ea5e9',
      };
    }

    return {
      ...base,
      backgroundColor: 'transparent',
      border: '2px solid rgba(255, 255, 255, 0.15)',
      color: 'rgba(255, 255, 255, 0.4)',
    };
  };

  const getLabelStyle = (step: Step): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontSize: 11,
      fontWeight: 500,
      marginTop: 6,
      textAlign: 'center' as const,
      transition: 'color 0.2s ease',
    };

    if (isActive(step) || isCompleted(step)) {
      return { ...base, color: '#ffffff' };
    }

    return { ...base, color: 'rgba(255, 255, 255, 0.4)' };
  };

  const getConnectorStyle = (leftStep: Step): React.CSSProperties => {
    const filled = isCompleted(leftStep);
    return {
      width: 80,
      height: 2,
      backgroundColor: filled ? '#0ea5e9' : 'rgba(255, 255, 255, 0.1)',
      transition: 'background-color 0.2s ease',
      flexShrink: 0,
    };
  };

  const handleClick = (step: Step) => {
    if (isClickable(step)) {
      onStepClick(step);
    }
  };

  return (
    <div
      style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(255, 255, 255, 0.02)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        {([1, 2, 3] as Step[]).map((step, index) => (
          <React.Fragment key={step}>
            {/* Step */}
            <div
              onClick={() => handleClick(step)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: isClickable(step) ? 'pointer' : 'default',
                userSelect: 'none',
              }}
            >
              <div style={getCircleStyle(step)}>
                {isCompleted(step) ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  step
                )}
              </div>
              <span style={getLabelStyle(step)}>{STEP_LABELS[index]}</span>
            </div>

            {/* Connector line (between steps, not after the last) */}
            {index < 2 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 28,
                }}
              >
                <div style={getConnectorStyle(step)} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
