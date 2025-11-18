import { BRUTAL_SHADOWS, BRUTAL_CARD_VARIANTS } from '../../../constants/styles';

interface TranscriptViewProps {
  text: string;
  className?: string;
}

/**
 * TranscriptView Component
 *
 * Stateless component for rendering transcript text with Neo-Brutalist styling.
 * Used in SourceModal for audio sources with processed content.
 *
 * Features:
 * - Thick borders and hard shadows
 * - Opaque white background
 * - Bold/medium typography for readability
 * - No rounded corners
 */
export function TranscriptView({ text, className = '' }: TranscriptViewProps) {
  return (
    <pre className={`${BRUTAL_CARD_VARIANTS.default} ${BRUTAL_SHADOWS.medium} p-6 text-slate-900 text-sm font-mono font-medium whitespace-pre-wrap leading-relaxed ${className}`}>
      {text}
    </pre>
  );
}
