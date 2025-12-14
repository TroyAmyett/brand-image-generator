'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { APP_VERSION } from '@/lib/version';

const USAGE_OPTIONS = [
  'Hero Background',
  'Product/Service Card Image',
  'Icon',
  'Blog Main Image',
  'Social Media Post',
  'Other'
];

const DIMENSION_OPTIONS = [
  'Full screen (16:9)',
  'Square (1:1)',
  'Rectangle (4:3)',
  'Vertical (9:16)'
];

export default function Home() {
  const [usage, setUsage] = useState(USAGE_OPTIONS[0]);
  const [dimension, setDimension] = useState(DIMENSION_OPTIONS[0]);
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Initializing...');
  const [result, setResult] = useState<{ imageUrl: string; prompt: string } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Loading Cycle Logic
  useEffect(() => {
    if (!loading) return;
    const texts = [
      'Reading Style Guide...',
      'Analyzing Brand Colors...',
      'Constructing Prompt...',
      'Optimizing for DALL-E 3...',
      'Painting Pixels...',
      'Finalizing Assets...'
    ];
    let i = 0;
    setLoadingText(texts[0]);
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setLoadingText(texts[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleDownload = async () => {
    if (!result?.imageUrl) return;

    try {
      // Create SEO-friendly filename
      const seoFilename = subject
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
        .replace(/(^-|-$)/g, '')     // Remove leading/trailing hyphens
        + '.png';

      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: result.imageUrl })
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = seoFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: just open in new tab if fetch fails
      window.open(result.imageUrl, '_blank');
    }
  };

  const handleCopyPrompt = () => {
    if (!result?.prompt) return;
    navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setImageLoaded(false);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usage,
          dimension,
          subject,
          additionalDetails: details,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult({ imageUrl: data.imageUrl, prompt: data.prompt });
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to generate image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            Brand Image Generator
          </h1>
          <p className={styles.subtitle}>
            Generate on-brand website assets aligned with our Style Guide.
          </p>
        </header>

        <div className={styles.grid}>
          {/* Card 1: Configuration */}
          <section className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.stepNumber}>1</span>
              Configuration
            </h2>

            <form onSubmit={handleGenerate}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Usage Context
                </label>
                <select
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  className={styles.select}
                >
                  {USAGE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Dimensions
                </label>
                <select
                  value={dimension}
                  onChange={(e) => setDimension(e.target.value)}
                  className={styles.select}
                >
                  {DIMENSION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Subject / Topic
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., 'Modern optimization dashboard'"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Additional Details (Optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Lighting, specific elements..."
                  rows={3}
                  className={styles.textarea}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={styles.button}
              >
                {loading ? 'Generating...' : 'Generate Asset'}
              </button>
            </form>
          </section>

          {/* Card 2: Image Result */}
          <section className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.stepNumber}>2</span>
              Visual Output
            </h2>

            <div className={styles.resultContainer} style={{ marginBottom: result?.imageUrl ? '1rem' : 0 }}>
              {result?.imageUrl ? (
                <>
                  <div
                    className={`${styles.imageWrapper} ${imageLoaded ? styles.loaded : ''}`}
                    onClick={() => setShowPreview(true)}
                    style={{ cursor: 'pointer' }}
                    title="Click to preview full size"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={result.imageUrl}
                      alt={subject}
                      className={styles.imageResult}
                      onLoad={() => setImageLoaded(true)}
                    />
                  </div>
                  {!imageLoaded && (
                    <div className={styles.loadingOverlay}>
                      <div className={styles.spinner}></div>
                      <p>Loading Image...</p>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.placeholder}>
                  {!loading && (
                    <>
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2, marginBottom: '1rem' }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <p>Generated image will appear here.</p>
                    </>
                  )}
                  {loading && (
                    <>
                      <div className={styles.spinner}></div>
                      <p className={styles.loadingText}>{loadingText}</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {result?.imageUrl && (
              <button onClick={handleDownload} className={styles.secondaryButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download .PNG
              </button>
            )}
          </section>

          {/* Card 3: Exact Prompt */}
          <section className={styles.card}>
            <div className={styles.cardHeader} style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className={styles.stepNumber}>3</span>
                Prompt Data
              </div>
              {result?.prompt && (
                <button onClick={handleCopyPrompt} className={styles.copyButton} title="Copy to Clipboard">
                  {copied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  )}
                </button>
              )}
            </div>

            <div className={styles.promptContainer}>
              {result?.prompt ? (
                <pre className={styles.promptText}>
                  {result.prompt}
                </pre>
              ) : (
                <div className={styles.emptyPrompt}>
                  <p>Detailed prompt will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <p>API Endpoint for Automations (Make.com): <code className={styles.code}>POST /api/generate</code></p>
          <p className={styles.versionTag}>{APP_VERSION}</p>
        </footer>
      </div>

      {/* Image Preview Modal */}
      {showPreview && result?.imageUrl && (
        <div className={styles.modal} onClick={() => setShowPreview(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowPreview(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.imageUrl} alt={subject} className={styles.modalImage} />
            <div className={styles.modalActions}>
              <button onClick={handleDownload} className={styles.button}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download .PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
