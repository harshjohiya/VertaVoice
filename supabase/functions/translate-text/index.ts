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
    const { text, sourceLanguage, targetLanguage } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }
    
    if (!targetLanguage) {
      throw new Error('Target language is required');
    }

    const sarvamApiKey = Deno.env.get('SARVAM_API_KEY');
    if (!sarvamApiKey) {
      throw new Error('SARVAM_API_KEY not configured');
    }

    console.log(`Translating from ${sourceLanguage || 'unknown'} to ${targetLanguage}:`, text);

    // Call Sarvam AI Translation API
    const response = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'api-subscription-key': sarvamApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        source_language_code: sourceLanguage || 'unknown',
        target_language_code: targetLanguage,
        speaker_gender: 'Male',
        mode: 'formal',
        model: 'mayura:v1',
        enable_preprocessing: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sarvam AI Translation error:', errorText);
      throw new Error(`Sarvam AI error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Translation result:', result);

    return new Response(
      JSON.stringify({
        translatedText: result.translated_text || text,
        sourceLanguage: result.source_language_code || sourceLanguage,
        targetLanguage: result.target_language_code || targetLanguage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});