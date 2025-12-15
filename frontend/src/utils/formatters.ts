/**
 * Formatting utilities for dates, durations, and file sizes
 */

import i18n from '../lib/i18n';

/**
 * Get the current locale from i18n settings
 * Maps i18n language codes to BCP 47 locale strings
 */
function getCurrentLocale(): string {
  const lang = i18n.language || 'fr';
  // Map language codes to full locale strings
  const localeMap: Record<string, string> = {
    fr: 'fr-FR',
    en: 'en-US',
  };
  return localeMap[lang] || 'fr-FR';
}

/**
 * Format date string to full format based on current locale
 * @example "2025-01-15" → "15 janvier 2025" (fr) or "January 15, 2025" (en)
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return i18n.language === 'en' ? 'Unknown date' : 'Date inconnue';

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return i18n.language === 'en' ? 'Invalid date' : 'Date invalide';
    }
    return date.toLocaleDateString(getCurrentLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return i18n.language === 'en' ? 'Invalid date' : 'Date invalide';
  }
}

/**
 * Format date string to short format based on current locale
 * @example "2025-01-15" → "15 janv. 2025" (fr) or "Jan 15, 2025" (en)
 */
export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return i18n.language === 'en' ? 'Invalid date' : 'Date invalide';
    }
    return date.toLocaleDateString(getCurrentLocale(), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return i18n.language === 'en' ? 'Invalid date' : 'Date invalide';
  }
}

/**
 * Format date string to format with time based on current locale
 * @example "2025-01-15T14:30:00" → "15 janv. 14:30" (fr) or "Jan 15, 2:30 PM" (en)
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return i18n.language === 'en' ? 'Invalid date' : 'Date invalide';
    }
    return date.toLocaleDateString(getCurrentLocale(), {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return i18n.language === 'en' ? 'Invalid date' : 'Date invalide';
  }
}

/**
 * Format simple date based on current locale
 * @example "2025-01-15" → "15/01/2025" (fr) or "1/15/2025" (en)
 */
export function formatDateSimple(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return i18n.language === 'en' ? 'Invalid date' : 'Date invalide';
    }
    return date.toLocaleDateString(getCurrentLocale());
  } catch {
    return i18n.language === 'en' ? 'Invalid date' : 'Date invalide';
  }
}

/**
 * Format duration in seconds to MM:SS
 * @example 125 → "2:05"
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size in bytes to MB
 * @example 5242880 → "5.00 MB"
 */
export function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

