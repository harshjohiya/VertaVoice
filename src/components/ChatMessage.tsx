import React, { useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: {
    id: string;
    original_text: string;
    translated_text?: string;
    original_language: string;
    target_language?: string;
    audio_url?: string;
    translated_audio_url?: string;
    created_at: string;
    user_id: string;
  };
  isOwn: boolean;
  onPlayAudio: (audioUrl: string) => void;
  currentlyPlaying?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isOwn,
  onPlayAudio,
  currentlyPlaying
}) => {
  const [showTranslation, setShowTranslation] = useState(false);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isPlayingOriginal = currentlyPlaying === message.audio_url;
  const isPlayingTranslated = currentlyPlaying === message.translated_audio_url;

  return (
    <div className={cn(
      "flex w-full mb-4",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <Card className={cn(
        "max-w-xs sm:max-w-md transition-all duration-200 hover:shadow-md",
        isOwn 
          ? "bg-primary text-primary-foreground ml-12" 
          : "bg-card mr-12"
      )}>
        <CardContent className="p-4 space-y-3">
          {/* Original Text */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm leading-relaxed">{message.original_text}</p>
              {message.audio_url && (
                <Button
                  variant={isOwn ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => onPlayAudio(message.audio_url!)}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  {isPlayingOriginal ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs opacity-70">
              <span>{message.original_language.toUpperCase()}</span>
              <span>•</span>
              <span>{formatTime(message.created_at)}</span>
            </div>
          </div>

          {/* Translation */}
          {message.translated_text && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={cn(
                    "h-6 px-2 text-xs",
                    isOwn ? "text-primary-foreground/70 hover:text-primary-foreground" : ""
                  )}
                >
                  <Volume2 className="h-3 w-3 mr-1" />
                  {showTranslation ? 'Hide' : 'Show'} Translation
                </Button>
              </div>
              
              {showTranslation && (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-relaxed italic opacity-90">
                      {message.translated_text}
                    </p>
                    {message.translated_audio_url && (
                      <Button
                        variant={isOwn ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => onPlayAudio(message.translated_audio_url!)}
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        {isPlayingTranslated ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="text-xs opacity-70">
                    {message.target_language?.toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatMessage;