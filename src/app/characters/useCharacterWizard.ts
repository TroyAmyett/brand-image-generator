'use client';

import { useState, useCallback, useEffect } from 'react';
import { ImageProvider } from '@/lib/providers/types';
import { getApiKey } from '@/lib/apiKeyStorage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WizardStep = 1 | 2 | 3;

export interface CharacterVariation {
  imageUrl: string; // base64 data URI
  prompt: string;
}

export interface SavedCharacter {
  id: string;
  name: string;
  role: string;
  product?: string;
  description?: string;
  setting?: string;
  expression?: string;
  outfitDescription?: string;
  brandAccentColor?: string;
  heroImage?: string;
  referenceImage?: string;
  provider?: string;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

function getInitialState() {
  return {
    // Step tracking
    currentStep: 1 as WizardStep,
    completedSteps: [] as WizardStep[],

    // Step 1 – character design form
    characterName: '',
    role: '',
    product: '',
    description: '', // physical description
    setting: 'studio',
    expression: 'neutral',
    outfitDescription: '',
    brandAccentColor: '#0ea5e9',
    customSettingDescription: '',
    provider: 'openai' as ImageProvider,
    aspectRatio: '16:9' as const,

    // Step 1 – generation results
    characterVariations: [] as CharacterVariation[],
    selectedCharacterIndex: 0,

    // Step 2 – pose variations
    variationPrompt: '',
    numberOfVariations: 4,
    poseVariations: [] as string[], // base64 data URIs
    selectedPoseIndex: 0,

    // Step 3 – export & save
    savedCharacters: [] as SavedCharacter[],

    // Shared UI flags
    loading: false,
    generatingVariations: false,
    saving: false,
    error: null as string | null,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export default function useCharacterWizard() {
  // -- Step tracking --------------------------------------------------------
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);

  // -- Step 1: Character design form ----------------------------------------
  const [characterName, setCharacterName] = useState('');
  const [role, setRole] = useState('');
  const [product, setProduct] = useState('');
  const [description, setDescription] = useState('');
  const [setting, setSetting] = useState('studio');
  const [expression, setExpression] = useState('neutral');
  const [outfitDescription, setOutfitDescription] = useState('');
  const [brandAccentColor, setBrandAccentColor] = useState('#0ea5e9');
  const [customSettingDescription, setCustomSettingDescription] = useState('');
  const [provider, setProvider] = useState<ImageProvider>('openai');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  // -- Step 1: Generation results -------------------------------------------
  const [characterVariations, setCharacterVariations] = useState<CharacterVariation[]>([]);
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(0);

  // -- Step 2: Pose variations ----------------------------------------------
  const [variationPrompt, setVariationPrompt] = useState('');
  const [numberOfVariations, setNumberOfVariations] = useState(4);
  const [poseVariations, setPoseVariations] = useState<string[]>([]);
  const [selectedPoseIndex, setSelectedPoseIndex] = useState(0);

  // -- Step 3: Export & save ------------------------------------------------
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);

  // -- Shared UI flags ------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [generatingVariations, setGeneratingVariations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =========================================================================
  // Side-effects
  // =========================================================================

  // Fetch saved characters on mount
  useEffect(() => {
    async function fetchSavedCharacters() {
      try {
        const res = await fetch('/api/characters');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.characters) {
            setSavedCharacters(data.characters);
          }
        }
      } catch {
        // Non-critical – saved characters simply won't be available
      }
    }
    fetchSavedCharacters();
  }, []);

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
      value: string | number | boolean | ImageProvider,
    ) => {
      switch (field) {
        case 'characterName':
          setCharacterName(value as string);
          break;
        case 'role':
          setRole(value as string);
          break;
        case 'product':
          setProduct(value as string);
          break;
        case 'description':
          setDescription(value as string);
          break;
        case 'setting':
          setSetting(value as string);
          break;
        case 'expression':
          setExpression(value as string);
          break;
        case 'outfitDescription':
          setOutfitDescription(value as string);
          break;
        case 'brandAccentColor':
          setBrandAccentColor(value as string);
          break;
        case 'customSettingDescription':
          setCustomSettingDescription(value as string);
          break;
        case 'provider':
          setProvider(value as ImageProvider);
          break;
        case 'aspectRatio':
          setAspectRatio(value as '16:9' | '9:16' | '1:1');
          break;
        case 'selectedCharacterIndex':
          setSelectedCharacterIndex(value as number);
          break;
        case 'variationPrompt':
          setVariationPrompt(value as string);
          break;
        case 'numberOfVariations':
          setNumberOfVariations(value as number);
          break;
        case 'selectedPoseIndex':
          setSelectedPoseIndex(value as number);
          break;
        default:
          console.warn(`useCharacterWizard: unknown field "${field}"`);
      }
    },
    [],
  );

  // ---- Step 1: Generate character -----------------------------------------

  const handleGenerateCharacter = useCallback(async () => {
    if (!description.trim()) {
      setError('Please enter a character description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userKey = await getApiKey(provider);

      const response = await fetch('/api/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          setting,
          expression,
          outfitDescription: outfitDescription.trim() || undefined,
          brandAccentColor,
          customSettingDescription:
            setting === 'custom' ? customSettingDescription.trim() : undefined,
          provider,
          aspectRatio,
          count: 4,
          user_api_key: userKey || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.variations) {
        setCharacterVariations(data.variations);
        setSelectedCharacterIndex(0);
      } else {
        setError(data.error?.message || 'Failed to generate character');
      }
    } catch (err) {
      console.error('Character generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    description,
    setting,
    expression,
    outfitDescription,
    brandAccentColor,
    customSettingDescription,
    provider,
    aspectRatio,
  ]);

  // ---- Step 1 -> 2: Proceed to variations ---------------------------------

  const handleProceedToVariations = useCallback(() => {
    if (characterVariations.length === 0) return;

    // Mark step 1 as completed
    setCompletedSteps((prev) =>
      prev.includes(1) ? prev : ([...prev, 1] as WizardStep[]),
    );
    setCurrentStep(2);
  }, [characterVariations]);

  // ---- Step 2: Generate pose variations -----------------------------------

  const handleGenerateVariations = useCallback(async () => {
    const baseImage = characterVariations[selectedCharacterIndex]?.imageUrl;
    if (!baseImage) return;

    setGeneratingVariations(true);
    setError(null);

    try {
      const userKey = await getApiKey('replicate');

      const prompt =
        variationPrompt.trim() ||
        `Character based on: ${description.trim()}`;

      const response = await fetch('/api/character-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: baseImage,
          prompt,
          number_of_outputs: numberOfVariations,
          output_format: 'png',
          output_quality: 95,
          user_api_key: userKey || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.variations) {
        setPoseVariations(data.variations);
        setSelectedPoseIndex(0);
      } else {
        setError(data.error?.message || 'Failed to generate variations');
      }
    } catch (err) {
      console.error('Variation generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGeneratingVariations(false);
    }
  }, [
    characterVariations,
    selectedCharacterIndex,
    variationPrompt,
    description,
    numberOfVariations,
  ]);

  // ---- Step 2 -> 3: Proceed to export -------------------------------------

  const handleProceedToExport = useCallback(() => {
    // Mark step 2 as completed
    setCompletedSteps((prev) => {
      const next = [...prev];
      if (!next.includes(2)) next.push(2 as WizardStep);
      return next as WizardStep[];
    });
    setCurrentStep(3);
  }, []);

  // ---- Step 3: Download helper --------------------------------------------

  const handleDownload = useCallback(
    (dataUrl: string, filename: string) => {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [],
  );

  // ---- Step 3: Save character to library ----------------------------------

  const handleSaveCharacter = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      // Determine hero image: prefer pose variation if available
      const heroImage =
        poseVariations.length > 0
          ? poseVariations[selectedPoseIndex]
          : characterVariations[selectedCharacterIndex]?.imageUrl;

      // Reference image is always the original selected character
      const referenceImage = characterVariations[selectedCharacterIndex]?.imageUrl;

      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: characterName.trim(),
          role: role.trim(),
          product: product.trim() || undefined,
          description: description.trim(),
          setting,
          expression,
          outfitDescription: outfitDescription.trim() || undefined,
          brandAccentColor,
          heroImage,
          referenceImage,
          provider,
        }),
      });

      const data = await response.json();

      if (data.success && data.character) {
        setSavedCharacters((prev) => [...prev, data.character]);
        // Clear error to signal success
        setError(null);
      } else {
        setError(data.error?.message || 'Failed to save character');
      }
    } catch (err) {
      console.error('Save character error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }, [
    characterName,
    role,
    product,
    description,
    setting,
    expression,
    outfitDescription,
    brandAccentColor,
    poseVariations,
    selectedPoseIndex,
    characterVariations,
    selectedCharacterIndex,
    provider,
  ]);

  // ---- Upload existing character image ------------------------------------

  const handleUploadCharacter = useCallback(
    (dataUrl: string) => {
      // Create a synthetic variation from the uploaded image
      setCharacterVariations([{ imageUrl: dataUrl, prompt: 'Uploaded image' }]);
      setSelectedCharacterIndex(0);
      // Clear any previous pose variations
      setPoseVariations([]);
      setSelectedPoseIndex(0);
      setError(null);
      // Mark step 1 complete and advance to variations
      setCompletedSteps((prev) =>
        prev.includes(1) ? prev : ([...prev, 1] as WizardStep[]),
      );
      setCurrentStep(2);
    },
    [],
  );

  // ---- Load character from library ----------------------------------------

  const handleLoadCharacter = useCallback(
    (character: SavedCharacter) => {
      // Populate form fields from saved character
      setCharacterName(character.name || '');
      setRole(character.role || '');
      setProduct(character.product || '');
      setDescription(character.description || '');
      setSetting(character.setting || 'studio');
      setExpression(character.expression || 'neutral');
      setOutfitDescription(character.outfitDescription || '');
      setBrandAccentColor(character.brandAccentColor || '#0ea5e9');
      setCustomSettingDescription('');
      if (character.provider) {
        setProvider(character.provider as ImageProvider);
      }

      // Load the reference or hero image as a character variation
      const imageUrl = character.referenceImage || character.heroImage;
      if (imageUrl) {
        setCharacterVariations([{ imageUrl, prompt: 'Loaded from library' }]);
        setSelectedCharacterIndex(0);
      } else {
        setCharacterVariations([]);
        setSelectedCharacterIndex(0);
      }

      // Reset downstream state
      setPoseVariations([]);
      setSelectedPoseIndex(0);
      setVariationPrompt('');
      setCompletedSteps([]);
      setCurrentStep(1);
      setError(null);
    },
    [],
  );

  // ---- Reset wizard -------------------------------------------------------

  const resetWizard = useCallback(() => {
    const initial = getInitialState();

    setCurrentStep(initial.currentStep);
    setCompletedSteps(initial.completedSteps);

    setCharacterName(initial.characterName);
    setRole(initial.role);
    setProduct(initial.product);
    setDescription(initial.description);
    setSetting(initial.setting);
    setExpression(initial.expression);
    setOutfitDescription(initial.outfitDescription);
    setBrandAccentColor(initial.brandAccentColor);
    setCustomSettingDescription(initial.customSettingDescription);
    setProvider(initial.provider);
    setAspectRatio(initial.aspectRatio);

    setCharacterVariations(initial.characterVariations);
    setSelectedCharacterIndex(initial.selectedCharacterIndex);

    setVariationPrompt(initial.variationPrompt);
    setNumberOfVariations(initial.numberOfVariations);
    setPoseVariations(initial.poseVariations);
    setSelectedPoseIndex(initial.selectedPoseIndex);

    // Note: savedCharacters are fetched on mount and preserved across resets

    setLoading(initial.loading);
    setGeneratingVariations(initial.generatingVariations);
    setSaving(initial.saving);
    setError(initial.error);
  }, []);

  // =========================================================================
  // Return value
  // =========================================================================

  return {
    // Step tracking
    currentStep,
    completedSteps,

    // Step 1: form fields
    characterName,
    role,
    product,
    description,
    setting,
    expression,
    outfitDescription,
    brandAccentColor,
    customSettingDescription,
    provider,
    aspectRatio,

    // Step 1: generation results
    characterVariations,
    selectedCharacterIndex,

    // Step 2: pose variations
    variationPrompt,
    numberOfVariations,
    poseVariations,
    selectedPoseIndex,

    // Step 3: export & save
    savedCharacters,

    // Shared UI flags
    loading,
    generatingVariations,
    saving,
    error,

    // Actions
    goToStep,
    setFormField,
    handleGenerateCharacter,
    handleUploadCharacter,
    handleLoadCharacter,
    handleProceedToVariations,
    handleGenerateVariations,
    handleProceedToExport,
    handleDownload,
    handleSaveCharacter,
    resetWizard,
  };
}

/** Helper type representing the full wizard state and actions. */
export type CharacterWizardState = ReturnType<typeof useCharacterWizard>;
