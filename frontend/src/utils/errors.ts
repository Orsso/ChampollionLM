/**
 * Extract error message from unknown error type
 * @param error - Unknown error object
 * @param fallback - Fallback message if extraction fails
 * @returns Error message string
 */
export function extractErrorMessage(
  error: unknown,
  fallback: string = 'An unexpected error occurred'
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'detail' in error) {
    return String((error as { detail: unknown }).detail);
  }

  return fallback;
}
