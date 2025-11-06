import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received business card extraction request');
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      console.error('No image data provided');
      return new Response(
        JSON.stringify({ error: 'No image data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling OpenAI Vision API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a business card OCR assistant. Extract contact information from business card images and return it as JSON.
            
            Return ONLY valid JSON in this exact format (no markdown, no code blocks):
            {
              "name": "Full Name",
              "email": "email@example.com",
              "phone": "+1234567890",
              "company": "Company Name",
              "title": "Job Title"
            }
            
            Rules:
            - Return null for fields that are not found
            - Ensure phone numbers include country code if visible
            - Extract full name, not just first or last
            - Be precise with email addresses`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all contact information from this business card image.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received:', JSON.stringify(data));

    const extractedText = data.choices[0].message.content.trim();
    console.log('Extracted text:', extractedText);

    // Parse the JSON response
    let contactInfo;
    try {
      // Remove markdown code blocks if present
      const jsonText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      contactInfo = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError, 'Raw text:', extractedText);
      throw new Error('Failed to parse contact information from AI response');
    }

    console.log('Successfully extracted contact info:', contactInfo);

    return new Response(
      JSON.stringify({ 
        success: true,
        contactInfo 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in extract-business-card function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
