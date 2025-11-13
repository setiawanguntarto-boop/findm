-- Add follow-up reminder fields to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;

-- Add index for efficient querying of upcoming follow-ups
CREATE INDEX IF NOT EXISTS idx_contacts_follow_up_date 
ON public.contacts(follow_up_date) 
WHERE follow_up_date IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.contacts.follow_up_date IS 'Date when user should follow up with this contact';
COMMENT ON COLUMN public.contacts.follow_up_notes IS 'Notes about what to discuss during follow-up';

