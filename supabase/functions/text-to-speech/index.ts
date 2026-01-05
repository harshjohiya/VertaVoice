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
    const { text, language, voice } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    const sarvamApiKey = Deno.env.get('SARVAM_API_KEY');
    if (!sarvamApiKey) {
      throw new Error('SARVAM_API_KEY not configured');
    }

    console.log(`Generating TTS for language ${language}:`, text);

    // Call Sarvam AI Text-to-Speech API
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': sarvamApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: language || 'hi-IN',
        speaker: voice || 'meera',
        pitch: 0,
        pace: 1.0,
        loudness: 1.0,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: 'bulbul:v1'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sarvam AI TTS error:', errorText);
      throw new Error(`Sarvam AI error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('TTS result received');

    // Extract base64 audio from response
    const audioBase64 = result.audios && result.audios[0] ? result.audios[0] : '';

    if (!audioBase64) {
      throw new Error('No audio data received from Sarvam AI');
    }

    return new Response(
      JSON.stringify({
        audioContent: audioBase64,
        language: language || 'hi-IN',
        duration: result.duration || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('TTS function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});