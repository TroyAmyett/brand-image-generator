/**
 * Types for brand extraction from URLs, images, and PDFs.
 *
 * The extractors use dependency injection for AI analysis,
 * allowing consumers to provide their own AI client (e.g., Anthropic SDK).
 */

import type { BrandStyleGuide } from '../types';

/**
 * AI analysis functions injected by the consumer.
 * This keeps the brand package free of AI SDK dependencies.
 */
export interface AIAnalysisFunction {
  /** Analyze text content and return a response string */
  analyzeText(prompt: string, content: string): Promise<string>;
  /** Analyze an image (base64) and return a response string */
  analyzeImage(prompt: string, imageBase64: string, mimeType: string): Promise<string>;
}

/** Options for URL-based brand extraction */
export interface UrlExtractorOptions {
  /** The URL to scrape and analyze */
  url: string;
  /** AI analysis function (injected by consumer) */
  ai: AIAnalysisFunction;
  /** Optional custom fetch function */
  fetchFn?: typeof fetch;
}

/** Options for image-based brand extraction */
export interface ImageExtractorOptions {
  /** Base64-encoded image data (without data URI prefix) */
  imageData: string;
  /** MIME type of the image (e.g., 'image/png', 'image/jpeg', 'application/pdf') */
  mimeType: string;
  /** AI analysis function (injected by consumer) */
  ai: AIAnalysisFunction;
  /** Optional company/brand name for context */
  brandName?: string;
}

/** Raw data extracted before AI processing */
export interface RawExtractionData {
  /** Colors found in CSS */
  cssColors?: string[];
  /** Font families found in CSS */
  fonts?: string[];
  /** Favicon or logo URL */
  logoUrl?: string;
  /** Page title */
  pageTitle?: string;
  /** Meta description */
  metaDescription?: string;
  /** Open Graph image URL */
  ogImage?: string;
  /** Open Graph title */
  ogTitle?: string;
}

/** Result of a brand extraction operation */
export interface ExtractionResult {
  success: boolean;
  /** Extracted style guide (may be partial) */
  guide?: Partial<BrandStyleGuide>;
  /** Error message if extraction failed */
  error?: string;
  /** Raw data extracted before AI processing */
  rawData?: RawExtractionData;
}
