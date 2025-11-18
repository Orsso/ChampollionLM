import { Waveform } from './Waveform';
import { BRUTAL_BORDERS, BRUTAL_RADIUS, BRUTAL_SHADOWS } from '../../../constants/styles';

interface AudioVisualizerProps {
  audioData: Uint8Array | null;
  isRecording: boolean;
  micGain: number;
}

export function AudioVisualizer({ audioData, isRecording, micGain }: AudioVisualizerProps) {
  return (
    <div className={`
      relative h-32 max-w-2xl mx-auto
      ${BRUTAL_BORDERS.thick}
      border-black
      ${BRUTAL_RADIUS.normal}
      bg-white
      overflow-hidden
      ${BRUTAL_SHADOWS.medium}
    `}>
      <Waveform
        audioData={audioData || undefined}
        isActive={isRecording}
        gain={micGain}
        className="relative z-10"
      />
    </div>
  );
}

