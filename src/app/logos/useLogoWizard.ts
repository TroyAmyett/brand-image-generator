'use client';

import { useState, useCallback, useEffect } from 'react';
import { LogoStyle } from '@/lib/logoPrompt';
import { ImageProvider } from '@/lib/providers/types';
import { getApiKey } from '@/lib/apiKeyStorage';
import { generateAllLockups, composeLockup } from '@/lib/logoLockupCompositor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WizardStep = 1 | 2 | 3;

export type LockupLayout = 'horizontal' | 'stacked' | 'inverted';

export interface IconVariation {
  imageUrl: string; // base64 data URI
  prompt: string;
}

export interface LockupVariation {
  dataUrl: string;
  layout: LockupLayout;
}

export interface ExportVariant {
  dataUrl: string;
  variant: 'icon-only' | 'dark-text' | 'light-text';
  label: string;
}

export interface StyleGuideOption {
  id: string;
  name: string;
  colors?: {
    primary?: { hex: string }[];
    secondary?: { hex: string }[];
    accent?: { hex: string }[];
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Small delay helper used to stagger sequential downloads so the browser
 * does not swallow any of them.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

function getInitialState() {
  return {
    // Step tracking
    currentStep: 1 as WizardStep,
    completedSteps: [] as WizardStep[],

    // Step 1 – icon generation form
    brandName: '',
    description: '',
    selectedGuideId: '',
    logoStyle: 'modern' as LogoStyle,
    colorPrimary: '',
    colorSecondary: '',
    colorAccent: '',
    provider: 'openai' as ImageProvider,
    styleGuides: [] as StyleGuideOption[],

    // Step 1 – icon results
    iconVariations: [] as IconVariation[],
    selectedIconIndex: 0,

    // Step 1 → 2 transition
    selectedIconTransparent: null as string | null,

    // Step 2 – lockup configuration
    lockupFontFamily: 'Inter',
    lockupFontWeight: 600,
    lockupTextColor: '#000000',
    lockupVariations: [] as LockupVariation[],
    selectedLockupIndex: 0,

    // Step 3 – export
    exportVariants: [] as ExportVariant[],

    // Shared UI flags
    loading: false,
    refining: false,
    removingBackground: false,
    error: null as string | null,
    refinement: '',
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export default function useLogoWizard() {
  // -- Step tracking --------------------------------------------------------
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);

  // -- Step 1: Icon generation form -----------------------------------------
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGuideId, setSelectedGuideId] = useState('');
  const [logoStyle, setLogoStyle] = useState<LogoStyle>('modern');
  const [colorPrimary, setColorPrimary] = useState('');
  const [colorSecondary, setColorSecondary] = useState('');
  const [colorAccent, setColorAccent] = useState('');
  const [provider, setProvider] = useState<ImageProvider>('openai');
  const [styleGuides, setStyleGuides] = useState<StyleGuideOption[]>([]);

  // -- Step 1: Icon results -------------------------------------------------
  const [iconVariations, setIconVariations] = useState<IconVariation[]>([]);
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);

  // -- Step 1 → 2 transition ------------------------------------------------
  const [selectedIconTransparent, setSelectedIconTransparent] = useState<string | null>(null);

  // -- Step 2: Lockup configuration -----------------------------------------
  const [lockupFontFamily, setLockupFontFamily] = useState('Inter');
  const [lockupFontWeight, setLockupFontWeight] = useState(600);
  const [lockupTextColor, setLockupTextColor] = useState('#000000');
  const [lockupVariations, setLockupVariations] = useState<LockupVariation[]>([]);
  const [selectedLockupIndex, setSelectedLockupIndex] = useState(0);

  // -- Step 3: Export -------------------------------------------------------
  const [exportVariants, setExportVariants] = useState<ExportVariant[]>([]);

  // -- Shared UI flags ------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [removingBackground, setRemovingBackground] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refinement, setRefinement] = useState('');

  // =========================================================================
  // Side-effects
  // =========================================================================

  // Fetch style guides + active guide on mount
  useEffect(() => {
    async function fetchGuides() {
      try {
        const [guidesRes, activeRes] = await Promise.all([
          fetch('/api/style-guides'),
          fetch('/api/style-guides/active'),
        ]);

        let activeGuideId = '';
        if (activeRes.ok) {
          const activeData = await activeRes.json();
          if (activeData.success && activeData.activeGuideId) {
            activeGuideId = activeData.activeGuideId;
          }
        }

        if (guidesRes.ok) {
          const data = await guidesRes.json();
          if (data.success && data.guides) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mapped: StyleGuideOption[] = data.guides.map((g: any) => ({
              id: g.id,
              name: g.name,
              colors: g.colors
                ? {
                    primary: g.colors.primary,
                    secondary: g.colors.secondary,
                    accent: g.colors.accent,
                  }
                : undefined,
            }));
            setStyleGuides(mapped);

            // Auto-select the active guide
            if (activeGuideId && mapped.some((g) => g.id === activeGuideId)) {
              setSelectedGuideId(activeGuideId);
            }
          }
        }
      } catch {
        // Non-critical – guides simply won't be available
      }
    }
    fetchGuides();
  }, []);

  // Auto-populate colour overrides when a style guide is selected
  useEffect(() => {
    if (!selectedGuideId) return;
    const guide = styleGuides.find((g) => g.id === selectedGuideId);
    if (!guide?.colors) return;

    if (guide.colors.primary?.[0]?.hex) setColorPrimary(guide.colors.primary[0].hex);
    if (guide.colors.secondary?.[0]?.hex) setColorSecondary(guide.colors.secondary[0].hex);
    if (guide.colors.accent?.[0]?.hex) setColorAccent(guide.colors.accent[0].hex);
  }, [selectedGuideId, styleGuides]);

  // Auto-populate lockupTextColor from colorPrimary when it becomes available
  useEffect(() => {
    if (colorPrimary) {
      setLockupTextColor(colorPrimary);
    }
  }, [colorPrimary]);

  // =========================================================================
  // Actions
  // =========================================================================

  /** Navigate between wizard steps. Only allows moving to completed+1 or back. */
  const goToStep = useCallback(
    (step: WizardStep) => {
      const maxAllowed = (Math.max(0, ...completedSteps) + 1) as WizardStep;
      if (step <= maxAllowed) {
        setCurrentStep(step);
      }
    },
    [completedSteps],
  );

  /** Generic setter for any form field exposed by the hook. */
  const setFormField = useCallback(
    (
      field: string,
      value: string | number | boolean | ImageProvider | LogoStyle,
    ) => {
      switch (field) {
        case 'brandName':
          setBrandName(value as string);
          break;
        case 'description':
          setDescription(value as string);
          break;
        case 'selectedGuideId':
          setSelectedGuideId(value as string);
          break;
        case 'logoStyle':
          setLogoStyle(value as LogoStyle);
          break;
        case 'colorPrimary':
          setColorPrimary(value as string);
          break;
        case 'colorSecondary':
          setColorSecondary(value as string);
          break;
        case 'colorAccent':
          setColorAccent(value as string);
          break;
        case 'provider':
          setProvider(value as ImageProvider);
          break;
        case 'selectedIconIndex':
          setSelectedIconIndex(value as number);
          break;
        case 'lockupFontFamily':
          setLockupFontFamily(value as string);
          break;
        case 'lockupFontWeight':
          setLockupFontWeight(value as number);
          break;
        case 'lockupTextColor':
          setLockupTextColor(value as string);
          break;
        case 'selectedLockupIndex':
          setSelectedLockupIndex(value as number);
          break;
        case 'refinement':
          setRefinement(value as string);
          break;
        default:
          console.warn(`useLogoWizard: unknown field "${field}"`);
      }
    },
    [],
  );

  // ---- Step 1: Generate icons ---------------------------------------------

  const handleGenerateIcons = useCallback(async () => {
    if (!brandName.trim()) {
      setError('Please enter a brand name');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a brand description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userKey = await getApiKey(provider);

      const colorOverrides: Record<string, string> = {};
      if (colorPrimary) colorOverrides.primary = colorPrimary;
      if (colorSecondary) colorOverrides.secondary = colorSecondary;
      if (colorAccent) colorOverrides.accent = colorAccent;

      const response = await fetch('/api/generate-logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName.trim(),
          description: description.trim(),
          logoType: 'icon_only',
          style: logoStyle,
          guideId: selectedGuideId || undefined,
          colorOverrides:
            Object.keys(colorOverrides).length > 0 ? colorOverrides : undefined,
          provider,
          count: 4,
          user_api_key: userKey || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.variations) {
        setIconVariations(data.variations);
        setSelectedIconIndex(0);
      } else {
        setError(data.error?.message || 'Failed to generate icons');
      }
    } catch (err) {
      console.error('Icon generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    brandName,
    description,
    logoStyle,
    selectedGuideId,
    colorPrimary,
    colorSecondary,
    colorAccent,
    provider,
  ]);

  // ---- Step 1: Refine selected icon ---------------------------------------

  const handleRefine = useCallback(async () => {
    if (!refinement.trim() || iconVariations.length === 0) return;

    setRefining(true);
    setError(null);

    try {
      const userKey = await getApiKey(provider);

      const colorOverrides: Record<string, string> = {};
      if (colorPrimary) colorOverrides.primary = colorPrimary;
      if (colorSecondary) colorOverrides.secondary = colorSecondary;
      if (colorAccent) colorOverrides.accent = colorAccent;

      const selectedImage = iconVariations[selectedIconIndex]?.imageUrl;

      const response = await fetch('/api/generate-logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName.trim(),
          description: description.trim(),
          logoType: 'icon_only',
          style: logoStyle,
          guideId: selectedGuideId || undefined,
          colorOverrides:
            Object.keys(colorOverrides).length > 0 ? colorOverrides : undefined,
          provider,
          count: 1,
          refinement: refinement.trim(),
          sourceImage: selectedImage || undefined,
          user_api_key: userKey || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.variations?.[0]) {
        setIconVariations((prev) => {
          const next = [...prev];
          next[selectedIconIndex] = data.variations[0];
          return next;
        });
        setRefinement('');
      } else {
        setError(data.error?.message || 'Refinement failed');
      }
    } catch (err) {
      console.error('Icon refinement error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRefining(false);
    }
  }, [
    refinement,
    iconVariations,
    selectedIconIndex,
    brandName,
    description,
    logoStyle,
    selectedGuideId,
    colorPrimary,
    colorSecondary,
    colorAccent,
    provider,
  ]);

  // ---- Step 1 → 2: Remove background & generate lockups -------------------

  const handleProceedToLockups = useCallback(async () => {
    if (iconVariations.length === 0) return;

    setRemovingBackground(true);
    setError(null);

    try {
      // Get the Stability API key for background removal
      const stabilityKey = await getApiKey('stability');

      const res = await fetch('/api/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: iconVariations[selectedIconIndex].imageUrl,
          user_api_key: stabilityKey || undefined,
        }),
      });

      const data = await res.json();

      let transparentIcon: string;

      if (data.success && data.imageBase64) {
        transparentIcon = data.imageBase64;
        setSelectedIconTransparent(data.imageBase64);
      } else {
        // Fallback: use original icon (white bg) if bg removal fails
        transparentIcon = iconVariations[selectedIconIndex].imageUrl;
        setSelectedIconTransparent(transparentIcon);
      }

      // Generate all lockup variations
      const lockups = await generateAllLockups(
        transparentIcon,
        brandName,
        lockupTextColor,
        lockupFontFamily,
      );
      setLockupVariations(lockups);
      setSelectedLockupIndex(0);

      // Mark step 1 as completed and navigate to step 2
      setCompletedSteps((prev) =>
        prev.includes(1) ? prev : ([...prev, 1] as WizardStep[]),
      );
      setCurrentStep(2);
    } catch (err) {
      console.error('Proceed to lockups error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process icon');
    } finally {
      setRemovingBackground(false);
    }
  }, [
    iconVariations,
    selectedIconIndex,
    brandName,
    lockupTextColor,
    lockupFontFamily,
  ]);

  // ---- Step 2: Regenerate lockups (e.g. after changing font/color) --------

  const handleGenerateLockups = useCallback(async () => {
    const iconSrc = selectedIconTransparent;
    if (!iconSrc) return;

    setLoading(true);
    setError(null);

    try {
      const lockups = await generateAllLockups(
        iconSrc,
        brandName,
        lockupTextColor,
        lockupFontFamily,
      );
      setLockupVariations(lockups);
      setSelectedLockupIndex(0);
    } catch (err) {
      console.error('Lockup generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate lockups');
    } finally {
      setLoading(false);
    }
  }, [selectedIconTransparent, brandName, lockupTextColor, lockupFontFamily]);

  // ---- Step 2 → 3: Generate export variants & advance ---------------------
  //
  // Export variants are TEXT COLOR variants, not background variants.
  // All exports have transparent backgrounds. The three variants are:
  //  1. Icon only – just the transparent icon, no text
  //  2. Dark text – lockup with dark/brand text (for placing on light bgs)
  //  3. Light text – lockup with white text (for placing on dark bgs)

  const handleProceedToExport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const variants: ExportVariant[] = [];

      // 1. Icon only (transparent)
      const iconSrc = selectedIconTransparent || iconVariations[selectedIconIndex]?.imageUrl;
      if (iconSrc) {
        variants.push({
          dataUrl: iconSrc,
          variant: 'icon-only',
          label: 'Icon Only',
        });
      }

      // For lockup variants, use the selected lockup's layout
      if (selectedIconTransparent && lockupVariations.length > 0) {
        const selectedLayout = lockupVariations[selectedLockupIndex].layout;

        // 2. Dark text lockup (for light backgrounds)
        const darkTextColor = colorPrimary || '#1a1a2e';
        const darkLockup = await composeLockup({
          iconDataUrl: selectedIconTransparent,
          brandName,
          layout: selectedLayout,
          fontFamily: lockupFontFamily,
          fontWeight: lockupFontWeight,
          textColor: darkTextColor,
        });
        variants.push({
          dataUrl: darkLockup.dataUrl,
          variant: 'dark-text',
          label: 'Dark Text',
        });

        // 3. Light text lockup (for dark backgrounds)
        const lightLockup = await composeLockup({
          iconDataUrl: selectedIconTransparent,
          brandName,
          layout: selectedLayout,
          fontFamily: lockupFontFamily,
          fontWeight: lockupFontWeight,
          textColor: '#ffffff',
        });
        variants.push({
          dataUrl: lightLockup.dataUrl,
          variant: 'light-text',
          label: 'Light Text',
        });
      }

      setExportVariants(variants);

      // Mark step 2 as completed and navigate to step 3
      setCompletedSteps((prev) => {
        const next = [...prev];
        if (!next.includes(2)) next.push(2 as WizardStep);
        return next as WizardStep[];
      });
      setCurrentStep(3);
    } catch (err) {
      console.error('Export generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate exports');
    } finally {
      setLoading(false);
    }
  }, [
    selectedIconTransparent,
    iconVariations,
    selectedIconIndex,
    lockupVariations,
    selectedLockupIndex,
    brandName,
    lockupFontFamily,
    lockupFontWeight,
    colorPrimary,
  ]);

  // ---- Step 3: Download helpers -------------------------------------------

  const handleDownload = useCallback(
    (variant: ExportVariant, filename: string) => {
      const link = document.createElement('a');
      link.href = variant.dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [],
  );

  const handleDownloadAll = useCallback(async () => {
    const safeName = brandName.trim().replace(/\s+/g, '-').toLowerCase() || 'logo';

    for (let i = 0; i < exportVariants.length; i++) {
      const variant = exportVariants[i];
      const filename = `${safeName}-${variant.variant}.png`;
      handleDownload(variant, filename);
      // Small stagger so the browser doesn't skip downloads
      if (i < exportVariants.length - 1) {
        await delay(300);
      }
    }
  }, [exportVariants, brandName, handleDownload]);

  // ---- Reset wizard -------------------------------------------------------

  const resetWizard = useCallback(() => {
    const initial = getInitialState();

    setCurrentStep(initial.currentStep);
    setCompletedSteps(initial.completedSteps);

    setBrandName(initial.brandName);
    setDescription(initial.description);
    setSelectedGuideId(initial.selectedGuideId);
    setLogoStyle(initial.logoStyle);
    setColorPrimary(initial.colorPrimary);
    setColorSecondary(initial.colorSecondary);
    setColorAccent(initial.colorAccent);
    setProvider(initial.provider);
    // Note: styleGuides are fetched on mount and preserved across resets

    setIconVariations(initial.iconVariations);
    setSelectedIconIndex(initial.selectedIconIndex);

    setSelectedIconTransparent(initial.selectedIconTransparent);

    setLockupFontFamily(initial.lockupFontFamily);
    setLockupFontWeight(initial.lockupFontWeight);
    setLockupTextColor(initial.lockupTextColor);
    setLockupVariations(initial.lockupVariations);
    setSelectedLockupIndex(initial.selectedLockupIndex);

    setExportVariants(initial.exportVariants);

    setLoading(initial.loading);
    setRefining(initial.refining);
    setRemovingBackground(initial.removingBackground);
    setError(initial.error);
    setRefinement(initial.refinement);
  }, []);

  // =========================================================================
  // Return value
  // =========================================================================

  return {
    // Step tracking
    currentStep,
    completedSteps,

    // Step 1: form fields
    brandName,
    description,
    selectedGuideId,
    logoStyle,
    colorPrimary,
    colorSecondary,
    colorAccent,
    provider,
    styleGuides,

    // Step 1: icon results
    iconVariations,
    selectedIconIndex,

    // Step 1 → 2 transition
    selectedIconTransparent,

    // Step 2: lockup configuration
    lockupFontFamily,
    lockupFontWeight,
    lockupTextColor,
    lockupVariations,
    selectedLockupIndex,

    // Step 3: export
    exportVariants,

    // Shared UI flags
    loading,
    refining,
    removingBackground,
    error,
    refinement,

    // Actions
    goToStep,
    setFormField,
    handleGenerateIcons,
    handleRefine,
    handleProceedToLockups,
    handleGenerateLockups,
    handleProceedToExport,
    handleDownload,
    handleDownloadAll,
    resetWizard,
  };
}

/** Helper type representing the full wizard state and actions. */
export type WizardState = ReturnType<typeof useLogoWizard>;
