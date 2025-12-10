/**
 * Tests for formatting utilities.
 */
import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatDateSimple,
  formatDuration,
  formatSize,
} from './formatters';

describe('formatDate', () => {
  it('formats ISO date string to French format', () => {
    const result = formatDate('2025-01-15');
    expect(result).toMatch(/15.+janvier.+2025/i);
  });

  it('returns "Date inconnue" for undefined', () => {
    expect(formatDate(undefined)).toBe('Date inconnue');
  });

  it('returns "Date invalide" for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('Date invalide');
  });

  it('handles ISO datetime strings', () => {
    const result = formatDate('2025-01-15T14:30:00Z');
    expect(result).toMatch(/15.+janvier.+2025/i);
  });
});

describe('formatDateShort', () => {
  it('formats date to short French format', () => {
    const result = formatDateShort('2025-01-15');
    expect(result).toMatch(/15.+janv\.?.+2025/i);
  });

  it('returns "Date invalide" for invalid date', () => {
    expect(formatDateShort('invalid')).toBe('Date invalide');
  });
});

describe('formatDateTime', () => {
  it('formats datetime with time', () => {
    const result = formatDateTime('2025-01-15T14:30:00');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/janv\.?/i);
  });

  it('returns "Date invalide" for invalid date', () => {
    expect(formatDateTime('invalid')).toBe('Date invalide');
  });
});

describe('formatDateSimple', () => {
  it('formats date to simple French format', () => {
    const result = formatDateSimple('2025-01-15');
    expect(result).toMatch(/15\/01\/2025/);
  });

  it('returns "Date invalide" for invalid date', () => {
    expect(formatDateSimple('invalid')).toBe('Date invalide');
  });
});

describe('formatDuration', () => {
  it('formats seconds to MM:SS', () => {
    expect(formatDuration(125)).toBe('2:05');
  });

  it('handles zero seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('handles less than a minute', () => {
    expect(formatDuration(45)).toBe('0:45');
  });

  it('handles exact minutes', () => {
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(120)).toBe('2:00');
  });

  it('handles large durations', () => {
    expect(formatDuration(3661)).toBe('61:01');
  });

  it('pads seconds with zero', () => {
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(601)).toBe('10:01');
  });
});

describe('formatSize', () => {
  it('formats bytes to MB', () => {
    expect(formatSize(5242880)).toBe('5.00 MB');
  });

  it('handles zero bytes', () => {
    expect(formatSize(0)).toBe('0.00 MB');
  });

  it('handles small files', () => {
    expect(formatSize(1024)).toBe('0.00 MB');
  });

  it('handles 1 MB exactly', () => {
    expect(formatSize(1048576)).toBe('1.00 MB');
  });

  it('formats with two decimal places', () => {
    expect(formatSize(1572864)).toBe('1.50 MB');
  });

  it('handles large files', () => {
    expect(formatSize(104857600)).toBe('100.00 MB');
  });
});
