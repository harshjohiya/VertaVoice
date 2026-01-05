import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audioData, language } = await req.json();
    
    if (!audioData) {
      throw new Error('Audio data is required');
    }

    const sarvamApiKey = Deno.env.get('SARVAM_API_KEY');
    if (!sarvamApiKey) {
      throw new Error('SARVAM_API_KEY not configured');
    }

    console.log('Processing speech-to-text request for language:', language || 'unknown');

    // Convert base64 audio to binary
    const binaryString = atob(audioData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create form data for Sarvam AI
    const formData = new FormData();
    const audioBlob = new Blob([bytes], { type: 'audio/wav' });
    formData.append('file', audioBlob, 'audio.wav');
    
    if (language) {
      formData.append('language_code', language);
    }

    // Call Sarvam AI Speech-to-Text API
    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': sarvamApiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sarvam AI STT error:', errorText);
      throw new Error(`Sarvam AI error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('STT result:', result);

    return new Response(
      JSON.stringify({
        text: result.transcript || '',
        language: result.language_code || language || 'unknown',
        confidence: result.confidence || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('STT function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});