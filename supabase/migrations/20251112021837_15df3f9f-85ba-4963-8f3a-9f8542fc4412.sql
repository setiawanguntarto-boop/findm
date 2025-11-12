-- Phase 1: WhatsApp Integration Database Schema

-- 1. Extend profiles table with WhatsApp fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text UNIQUE,
ADD COLUMN IF NOT EXISTS whatsapp_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_linked_at timestamp with time zone;

-- 2. Create whatsapp_conversations table
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  message_text text NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('incoming', 'outgoing')),
  whatsapp_message_id text UNIQUE,
  media_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on whatsapp_conversations
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_conversations
CREATE POLICY "Users can view their own conversations"
ON public.whatsapp_conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
ON public.whatsapp_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Create guest_users table for WhatsApp-first onboarding
CREATE TABLE IF NOT EXISTS public.guest_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE NOT NULL,
  verification_code text,
  invited_email text,
  linked_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '30 days')
);

-- Enable RLS on guest_users
ALTER TABLE public.guest_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guest_users (service role only for webhook processing)
CREATE POLICY "Service role can manage guest users"
ON public.guest_users
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- 4. Create helper function to merge guest user into authenticated user
CREATE OR REPLACE FUNCTION public.merge_guest_user(
  _phone_number text,
  _user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _guest_id uuid;
BEGIN
  -- Find guest user by phone
  SELECT id INTO _guest_id
  FROM public.guest_users
  WHERE phone_number = _phone_number
  AND linked_user_id IS NULL;
  
  IF _guest_id IS NOT NULL THEN
    -- Update profile with phone and verification status
    UPDATE public.profiles
    SET 
      phone = _phone_number,
      whatsapp_verified = true,
      whatsapp_linked_at = now()
    WHERE id = _user_id;
    
    -- Link guest user to authenticated user
    UPDATE public.guest_users
    SET linked_user_id = _user_id
    WHERE id = _guest_id;
    
    -- Transfer any guest conversations to authenticated user
    UPDATE public.whatsapp_conversations
    SET user_id = _user_id
    WHERE phone_number = _phone_number
    AND user_id IS NULL;
  END IF;
END;
$$;

-- 5. Create function to clean up expired guest users
CREATE OR REPLACE FUNCTION public.cleanup_expired_guests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.guest_users
  WHERE expires_at < now()
  AND linked_user_id IS NULL;
END;
$$;

-- 6. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user_id ON public.whatsapp_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON public.whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_guest_users_phone ON public.guest_users(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_id ON public.whatsapp_conversations(whatsapp_message_id);