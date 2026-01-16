'use client';

import { useState, useRef, useCallback, MouseEvent, TouchEvent } from 'react';
import { Download, RefreshCw, MoveHorizontal, Maximize2, X } from 'lucide-react';
import styles from './ComparisonView.module.css';

interface ComparisonViewProps {
  originalImage: string;
  styledImage: string;
  onDownload: () => void;
  onRegenerate: () => void;
  loading?: boolean;
}

export default function ComparisonView({
  originalImage,
  styledImage,
  onDownload,
  onRegenerate,
  loading
}: ComparisonViewProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSliderPosition, setFullscreenSliderPosition] = useState(50);
  const [isFullscreenDragging, setIsFullscreenDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  const updateSliderPosition = useCallback((clientX: number, ref: React.RefObject<HTMLDivElement | null>, setPosition: (val: number) => void) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
  }, []);

  // Main container handlers
  const handleMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderPosition(e.clientX, containerRef, setSliderPosition);
  }, [updateSliderPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      updateSliderPosition(e.clientX, containerRef, setSliderPosition);
    }
  }, [isDragging, updateSliderPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      updateSliderPosition(e.touches[0].clientX, containerRef, setSliderPosition);
    }
  }, [updateSliderPosition]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      updateSliderPosition(e.touches[0].clientX, containerRef, setSliderPosition);
    }
  }, [isDragging, updateSliderPosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Fullscreen handlers
  const handleFullscreenMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFullscreenDragging(true);
    updateSliderPosition(e.clientX, fullscreenContainerRef, setFullscreenSliderPosition);
  }, [updateSliderPosition]);

  const handleFullscreenMouseMove = useCallback((e: MouseEvent) => {
    if (isFullscreenDragging) {
      updateSliderPosition(e.clientX, fullscreenContainerRef, setFullscreenSliderPosition);
    }
  }, [isFullscreenDragging, updateSliderPosition]);

  const handleFullscreenMouseUp = useCallback(() => {
    setIsFullscreenDragging(false);
  }, []);

  const handleFullscreenTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      setIsFullscreenDragging(true);
      updateSliderPosition(e.touches[0].clientX, fullscreenContainerRef, setFullscreenSliderPosition);
    }
  }, [updateSliderPosition]);

  const handleFullscreenTouchMove = useCallback((e: TouchEvent) => {
    if (isFullscreenDragging && e.touches.length === 1) {
      updateSliderPosition(e.touches[0].clientX, fullscreenContainerRef, setFullscreenSliderPosition);
    }
  }, [isFullscreenDragging, updateSliderPosition]);

  const handleFullscreenTouchEnd = useCallback(() => {
    setIsFullscreenDragging(false);
  }, []);

  const openFullscreen = () => {
    setFullscreenSliderPosition(sliderPosition);
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.labels}>
        <span className={styles.label}>Original</span>
        <span className={styles.label}>Styled</span>
      </div>

      <div className={styles.comparisonWrapper}>
        <div
          ref={containerRef}
          className={styles.comparisonContainer}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Styled image (bottom layer) */}
          <div className={styles.imageLayer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={styledImage}
              alt="Styled"
              className={styles.image}
              draggable={false}
            />
          </div>

          {/* Original image (top layer, clipped) */}
          <div
            className={styles.imageLayer}
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={originalImage}
              alt="Original"
              className={styles.image}
              draggable={false}
            />
          </div>

          {/* Slider handle */}
          <div
            className={`${styles.sliderLine} ${isDragging ? styles.dragging : ''}`}
            style={{ left: `${sliderPosition}%` }}
          >
            <div className={styles.sliderHandle}>
              <MoveHorizontal className="w-4 h-4" />
            </div>
          </div>

          {/* Drag hint */}
          <div className={styles.dragHint}>
            <MoveHorizontal className="w-4 h-4" />
            <span>Drag to compare</span>
          </div>
        </div>

        {/* Expand button */}
        <button
          className={styles.expandButton}
          onClick={openFullscreen}
          title="View fullscreen"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.downloadButton}
          onClick={onDownload}
          disabled={loading}
        >
          <Download className="w-5 h-5" />
          Download Styled
        </button>
        <button
          className={styles.regenerateButton}
          onClick={onRegenerate}
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? styles.spinning : ''}`} />
          Regenerate
        </button>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className={styles.fullscreenOverlay} onClick={closeFullscreen}>
          <div className={styles.fullscreenContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={closeFullscreen}>
              <X className="w-6 h-6" />
            </button>

            <div className={styles.fullscreenLabels}>
              <span className={styles.fullscreenLabel}>Original</span>
              <span className={styles.fullscreenLabel}>Styled</span>
            </div>

            <div
              ref={fullscreenContainerRef}
              className={styles.fullscreenComparison}
              onMouseDown={handleFullscreenMouseDown}
              onMouseMove={handleFullscreenMouseMove}
              onMouseUp={handleFullscreenMouseUp}
              onMouseLeave={handleFullscreenMouseUp}
              onTouchStart={handleFullscreenTouchStart}
              onTouchMove={handleFullscreenTouchMove}
              onTouchEnd={handleFullscreenTouchEnd}
            >
              {/* Styled image (bottom layer) */}
              <div className={styles.fullscreenImageLayer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={styledImage}
                  alt="Styled"
                  className={styles.fullscreenImage}
                  draggable={false}
                />
              </div>

              {/* Original image (top layer, clipped) */}
              <div
                className={styles.fullscreenImageLayer}
                style={{ clipPath: `inset(0 ${100 - fullscreenSliderPosition}% 0 0)` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalImage}
                  alt="Original"
                  className={styles.fullscreenImage}
                  draggable={false}
                />
              </div>

              {/* Slider handle */}
              <div
                className={`${styles.sliderLine} ${isFullscreenDragging ? styles.dragging : ''}`}
                style={{ left: `${fullscreenSliderPosition}%` }}
              >
                <div className={styles.sliderHandle}>
                  <MoveHorizontal className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className={styles.fullscreenHint}>
              <MoveHorizontal className="w-4 h-4" />
              <span>Drag slider to compare &bull; Click outside or press X to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
