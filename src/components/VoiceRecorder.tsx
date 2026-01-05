import React from 'react';
import { Mic, Square, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onSendRecording: (audioBlob: Blob) => void;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendRecording, disabled }) => {
  const {
    isRecording,
    audioLevel,
    recordedBlob,
    startRecording,
    stopRecording,
    clearRecording,
  } = useVoiceRecording();

  const handleSend = () => {
    if (recordedBlob) {
      onSendRecording(recordedBlob);
      clearRecording();
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
      {/* Waveform Visualization */}
      <div className="flex items-center gap-1 flex-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1 bg-muted-foreground rounded-full transition-all duration-150",
              isRecording 
                ? "animate-pulse" 
                : recordedBlob 
                ? "bg-primary" 
                : "bg-muted"
            )}
            style={{
              height: isRecording 
                ? `${Math.max(4, audioLevel * 40 + Math.random() * 10)}px`
                : recordedBlob 
                ? `${Math.random() * 20 + 10}px`
                : '4px'
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!recordedBlob ? (
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={cn(
              "h-12 w-12 rounded-full transition-all",
              isRecording && "scale-110 bg-destructive hover:bg-destructive/90"
            )}
          >
            {isRecording ? (
              <Square className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={clearRecording}
              className="h-10 w-10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handleSend}
              disabled={disabled}
              className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90"
            >
              <Send className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;