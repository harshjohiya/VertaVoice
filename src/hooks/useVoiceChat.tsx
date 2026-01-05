import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  user_id: string;
  original_text: string;
  translated_text?: string;
  original_language: string;
  target_language?: string;
  audio_url?: string;
  translated_audio_url?: string;
  audio_duration?: number;
  created_at: string;
  updated_at: string;
}

interface UseVoiceChatReturn {
  messages: Message[];
  loading: boolean;
  sendingMessage: boolean;
  currentlyPlaying: string | null;
  sendVoiceMessage: (audioBlob: Blob, targetLanguage?: string) => Promise<void>;
  playAudio: (audioUrl: string) => void;
  stopAudio: () => void;
  refreshMessages: () => Promise<void>;
}

export const useVoiceChat = (): UseVoiceChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 content
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Fetch messages from database
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Send voice message with transcription and translation
  const sendVoiceMessage = async (audioBlob: Blob, targetLanguage = 'en-IN') => {
    setSendingMessage(true);
    
    try {
      // Convert audio to base64
      const audioBase64 = await blobToBase64(audioBlob);
      
      // Step 1: Speech-to-text
      toast({
        title: "Processing",
        description: "Converting speech to text...",
      });

      const sttResponse = await supabase.functions.invoke('speech-to-text', {
        body: { audioData: audioBase64, language: 'unknown' }
      });

      if (sttResponse.error) throw sttResponse.error;
      
      const { text: originalText, language: detectedLanguage } = sttResponse.data;
      
      if (!originalText) {
        throw new Error('No speech detected in audio');
      }

      // Step 2: Translation (if needed)
      let translatedText = '';
      if (detectedLanguage !== targetLanguage) {
        toast({
          title: "Processing",
          description: "Translating text...",
        });

        const translateResponse = await supabase.functions.invoke('translate-text', {
          body: {
            text: originalText,
            sourceLanguage: detectedLanguage,
            targetLanguage: targetLanguage
          }
        });

        if (translateResponse.error) throw translateResponse.error;
        translatedText = translateResponse.data.translatedText;
      }

      // Step 3: Generate TTS for translated text
      let translatedAudioBase64 = '';
      if (translatedText) {
        toast({
          title: "Processing",
          description: "Generating translated speech...",
        });

        const ttsResponse = await supabase.functions.invoke('text-to-speech', {
          body: {
            text: translatedText,
            language: targetLanguage,
            voice: 'meera'
          }
        });

        if (ttsResponse.error) throw ttsResponse.error;
        translatedAudioBase64 = ttsResponse.data.audioContent;
      }

      // Step 4: Save message to database
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          original_text: originalText,
          translated_text: translatedText || null,
          original_language: detectedLanguage,
          target_language: translatedText ? targetLanguage : null,
          audio_url: `data:audio/webm;base64,${audioBase64}`,
          translated_audio_url: translatedAudioBase64 ? `data:audio/wav;base64,${translatedAudioBase64}` : null,
          audio_duration: audioBlob.size / 1000 // Rough estimate
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Voice message sent successfully!",
      });

      // Refresh messages
      await fetchMessages();

    } catch (error: any) {
      console.error('Error sending voice message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send voice message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Play audio
  const playAudio = (audioUrl: string) => {
    if (currentlyPlaying === audioUrl) {
      stopAudio();
      return;
    }

    stopAudio(); // Stop any currently playing audio

    audioRef.current = new Audio(audioUrl);
    audioRef.current.onended = () => setCurrentlyPlaying(null);
    audioRef.current.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to play audio",
        variant: "destructive",
      });
      setCurrentlyPlaying(null);
    };

    audioRef.current.play();
    setCurrentlyPlaying(audioUrl);
  };

  // Stop audio
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentlyPlaying(null);
  };

  // Refresh messages
  const refreshMessages = async () => {
    setLoading(true);
    await fetchMessages();
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopAudio();
    };
  }, []);

  return {
    messages,
    loading,
    sendingMessage,
    currentlyPlaying,
    sendVoiceMessage,
    playAudio,
    stopAudio,
    refreshMessages,
  };
};