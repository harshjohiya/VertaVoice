import { useState } from 'react';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, RefreshCw, Languages } from 'lucide-react';
import VoiceRecorder from '@/components/VoiceRecorder';
import ChatMessage from '@/components/ChatMessage';

const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', name: 'English' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'kn-IN', name: 'Kannada' },
  { code: 'ml-IN', name: 'Malayalam' },
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'gu-IN', name: 'Gujarati' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'pa-IN', name: 'Punjabi' },
];

const Index = () => {
  const [targetLanguage, setTargetLanguage] = useState('en-IN');
  
  const {
    messages,
    loading: messagesLoading,
    sendingMessage,
    currentlyPlaying,
    sendVoiceMessage,
    playAudio,
    refreshMessages,
  } = useVoiceChat();

  const handleSendRecording = async (audioBlob: Blob) => {
    await sendVoiceMessage(audioBlob, targetLanguage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Voice Chat
            </h1>
            <p className="text-muted-foreground text-sm">
              Multilingual voice conversations powered by AI
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refreshMessages}
              disabled={messagesLoading}
            >
              <RefreshCw className={`h-4 w-4 ${messagesLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <Card className="h-[60vh] mb-6 shadow-lg border-0 bg-card/50 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full p-0">
            <ScrollArea className="h-full px-6 pb-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <Languages className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Start a conversation</p>
                      <p className="text-sm text-muted-foreground">
                        Record a voice message to begin
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isOwn={true}
                      onPlayAudio={playAudio}
                      currentlyPlaying={currentlyPlaying}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Voice Recorder */}
        <div className="relative">
          {sendingMessage && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
              <div className="text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-sm font-medium">Processing your message...</p>
              </div>
            </div>
          )}
          <VoiceRecorder
            onSendRecording={handleSendRecording}
            disabled={sendingMessage}
          />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by Sarvam AI • Real-time translation and voice synthesis
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
