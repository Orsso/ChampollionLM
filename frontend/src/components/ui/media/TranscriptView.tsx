import { SHADOWS, CARD_VARIANTS } from '../../../constants/styles';

interface TranscriptViewProps {
  text: string;
  className?: string;
}

/**
 * TranscriptView Component
 *
 * Stateless component for rendering transcript text with styled formatting.
 * Used in SourceModal for audio sources with processed content.
 *
 * Features:
 * - Thick borders and hard shadows
 * - Opaque white background
 * - Bold/medium typography for readability
 */
export function TranscriptView({ text, className = '' }: TranscriptViewProps) {
  return (
    <pre className={`${CARD_VARIANTS.default} ${SHADOWS.medium} p-6 text-slate-900 text-sm font-mono font-medium whitespace-pre-wrap leading-relaxed ${className}`}>
      {text}
    </pre>
  );
}
