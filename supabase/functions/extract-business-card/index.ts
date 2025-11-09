import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

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
    // Verify JWT and extract user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Extract JWT token from "Bearer <token>"
    const jwt = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || '';

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user returned from token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Received business card extraction request from user: ${user.id}`);
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      console.error('No image data provided');
      return new Response(
        JSON.stringify({ error: 'No image data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate image size (5MB = ~6.7MB base64)
    const maxSize = 7 * 1024 * 1024; // 7MB base64 ≈ 5MB image
    if (imageBase64.length > maxSize) {
      console.error('Image too large:', imageBase64.length);
      return new Response(
        JSON.stringify({ error: 'Image too large. Maximum size is 5MB' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate base64 format
    if (!imageBase64.match(/^data:image\/(jpeg|jpg|png);base64,/)) {
      console.error('Invalid image format');
      return new Response(
        JSON.stringify({ error: 'Invalid image format. Only JPEG and PNG are supported' }),
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
      const status = response.status;
      const errorText = await response.text();
      let clientErrorMsg = 'Failed to process image. Please try again.';

      try {
        const parsed = JSON.parse(errorText);
        const openaiMsg = parsed?.error?.message || parsed?.message;
        if (openaiMsg) {
          console.error('OpenAI API error:', status, openaiMsg);
        } else {
          console.error('OpenAI API error:', status, errorText);
        }
      } catch (_) {
        console.error('OpenAI API error:', status, errorText);
      }

      if (status === 429) {
        clientErrorMsg = 'OpenAI quota exceeded. Please update billing or use a key with credits.';
      } else if (status === 401 || status === 403) {
        clientErrorMsg = 'OpenAI API key invalid or unauthorized.';
      }

      return new Response(
        JSON.stringify({ 
          success: false,
          error: clientErrorMsg
        }),
        {
          status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('OpenAI response received successfully');

    const extractedText = data.choices[0].message.content.trim();
    console.log('Contact data extraction completed');

    // Parse the JSON response
    let contactInfo;
    try {
      // Remove markdown code blocks if present
      const jsonText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      contactInfo = JSON.parse(jsonText);
    } catch (parseError) {
      // Log detailed error for debugging but throw generic message
      console.error('JSON parsing failed for user', user.id, '- Error:', parseError);
      console.error('Extracted text sample:', extractedText.substring(0, 200));
      throw new Error('Unable to extract contact information from the business card');
    }

    console.log(`Successfully extracted contact info for user ${user.id}`);

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
    // Log detailed error for server-side debugging
    console.error('Error in extract-business-card function:', error);
    
    // Sanitize error message for client response
    let clientMessage = 'An error occurred while processing your request. Please try again.';
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Log the actual error message for debugging
      console.error('Detailed error:', error.message);
      
      // Only send specific user-friendly messages, never raw error details
      if (error.message.includes('Unauthorized')) {
        clientMessage = 'Authentication required. Please log in again.';
        statusCode = 401;
      } else if (error.message.includes('extract contact information')) {
        clientMessage = 'Unable to read the business card. Please ensure the image is clear and try again.';
        statusCode = 400;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: clientMessage 
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
