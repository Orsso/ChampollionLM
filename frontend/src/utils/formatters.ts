/**
 * Formatting utilities for dates, durations, and file sizes
 */

/**
 * Format date string to full French format
 * @example "2025-01-15" → "15 janvier 2025"
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Date inconnue';

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Date invalide';
    }
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Date invalide';
  }
}

/**
 * Format date string to short French format
 * @example "2025-01-15" → "15 janv. 2025"
 */
export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Date invalide';
    }
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Date invalide';
  }
}

/**
 * Format date string to French format with time
 * @example "2025-01-15T14:30:00" → "15 janv. 14:30"
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Date invalide';
    }
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Date invalide';
  }
}

/**
 * Format simple date (no options)
 * @example "2025-01-15" → "15/01/2025"
 */
export function formatDateSimple(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Date invalide';
    }
    return date.toLocaleDateString('fr-FR');
  } catch {
    return 'Date invalide';
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
