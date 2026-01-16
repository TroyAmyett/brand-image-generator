'use client';

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, Link, X, Image as ImageIcon, Maximize2 } from 'lucide-react';
import styles from './ImageUpload.module.css';
import { resizeImageForStability, StabilityDimension } from '@/lib/imageResize';

export interface ImageUploadResult {
  resizedDataUrl: string;
  originalDataUrl: string;
  dimension: StabilityDimension;
  originalWidth: number;
  originalHeight: number;
}

interface ImageUploadProps {
  onImageSelect: (result: ImageUploadResult | null) => void;
  selectedImage: ImageUploadResult | null;
  disabled?: boolean;
}

const ACCEPTED_FORMATS = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ImageUpload({ onImageSelect, selectedImage, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return 'Invalid file format. Please use PNG, JPG, or WEBP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 10MB.';
    }
    return null;
  };

  const processAndResizeImage = useCallback(async (dataUrl: string) => {
    setProcessing(true);
    setError(null);

    try {
      const result = await resizeImageForStability(dataUrl);
      onImageSelect({
        resizedDataUrl: result.dataUrl,
        originalDataUrl: dataUrl,
        dimension: result.dimension,
        originalWidth: result.originalWidth,
        originalHeight: result.originalHeight,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setProcessing(false);
    }
  }, [onImageSelect]);

  const processFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      await processAndResizeImage(result);
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  }, [processAndResizeImage]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !processing) {
      setIsDragging(true);
    }
  }, [disabled, processing]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || processing) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled, processing, processFile]);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFile]);

  const handleBrowseClick = () => {
    if (!disabled && !processing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlValue.trim() || disabled || processing) return;

    setUrlLoading(true);
    setError(null);

    try {
      // Validate URL format
      let url: URL;
      try {
        url = new URL(urlValue.trim());
      } catch {
        setError('Invalid URL format');
        setUrlLoading(false);
        return;
      }

      // Fetch the image
      const response = await fetch('/api/fetch-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.toString() })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to fetch image');
      }

      const data = await response.json();

      if (data.success && data.imageBase64) {
        setShowUrlInput(false);
        setUrlValue('');
        await processAndResizeImage(data.imageBase64);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image from URL');
    } finally {
      setUrlLoading(false);
    }
  };

  const handleClear = () => {
    onImageSelect(null);
    setError(null);
  };

  const isLoading = processing || urlLoading;

  return (
    <div className={styles.container}>
      {selectedImage ? (
        <div className={styles.previewContainer}>
          <div className={styles.previewWrapper}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage.resizedDataUrl}
              alt="Selected"
              className={styles.previewImage}
            />
            <button
              className={styles.clearButton}
              onClick={handleClear}
              disabled={disabled}
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className={styles.dimensionInfo}>
            <Maximize2 className="w-4 h-4" />
            <span className={styles.dimensionText}>
              {selectedImage.dimension.label} ({selectedImage.dimension.width}x{selectedImage.dimension.height})
            </span>
          </div>
          <p className={styles.previewSubtext}>
            Original: {selectedImage.originalWidth}x{selectedImage.originalHeight} → Resized for Stability AI
          </p>
        </div>
      ) : (
        <>
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${disabled || isLoading ? styles.disabled : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={handleFileSelect}
              className={styles.fileInput}
              disabled={disabled || isLoading}
            />
            {isLoading ? (
              <>
                <div className={styles.spinner} />
                <p className={styles.dropText}>Processing image...</p>
                <p className={styles.dropSubtext}>Resizing for Stability AI</p>
              </>
            ) : (
              <>
                <Upload className={`w-8 h-8 ${styles.uploadIcon}`} />
                <p className={styles.dropText}>
                  Drag & drop an image here
                </p>
                <p className={styles.dropSubtext}>
                  or click to browse
                </p>
                <p className={styles.formatText}>
                  PNG, JPG, WEBP up to 10MB
                </p>
              </>
            )}
          </div>

          {!isLoading && (
            <>
              <div className={styles.divider}>
                <span>or</span>
              </div>

              {showUrlInput ? (
                <div className={styles.urlInputContainer}>
                  <input
                    type="url"
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className={styles.urlInput}
                    disabled={disabled || urlLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  />
                  <button
                    onClick={handleUrlSubmit}
                    disabled={!urlValue.trim() || disabled || urlLoading}
                    className={styles.urlSubmitButton}
                  >
                    {urlLoading ? (
                      <div className={styles.spinner} />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowUrlInput(false);
                      setUrlValue('');
                      setError(null);
                    }}
                    className={styles.urlCancelButton}
                    disabled={urlLoading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  className={styles.urlButton}
                  onClick={() => setShowUrlInput(true)}
                  disabled={disabled}
                >
                  <Link className="w-4 h-4" />
                  Load from URL
                </button>
              )}
            </>
          )}
        </>
      )}

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
}
