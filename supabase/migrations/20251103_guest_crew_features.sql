-- Guest and Crew Features: QR Join, Cost Splitting, Guest-to-Crew
-- Created: November 3, 2025

-- ============================================
-- EXTEND GUESTS TABLE FOR COST SPLITTING
-- ============================================

-- Add cost-split columns to existing guests table
ALTER TABLE public.guests
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rsvp_status TEXT DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'confirmed', 'declined', 'maybe')),
ADD COLUMN IF NOT EXISTS plus_ones INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_share_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cost_share_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'partial')),
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_guests_user_id ON public.guests(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON public.guests(event_id, rsvp_status);
CREATE INDEX IF NOT EXISTS idx_guests_payment_status ON public.guests(event_id, payment_status) WHERE cost_share_enabled = true;

COMMENT ON COLUMN public.guests.user_id IS 'Linked user account (null for non-registered guests)';
COMMENT ON COLUMN public.guests.rsvp_status IS 'Guest response status';
COMMENT ON COLUMN public.guests.cost_share_enabled IS 'Whether this guest is part of cost splitting';
COMMENT ON COLUMN public.guests.cost_share_amount IS 'Amount guest needs to pay';
COMMENT ON COLUMN public.guests.payment_status IS 'Payment completion status';

-- ============================================
-- EVENT INVITE TOKENS (for QR codes and links)
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_invite_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Token data
  token TEXT NOT NULL UNIQUE,
  token_type TEXT NOT NULL CHECK (token_type IN ('guest_join', 'crew_invite', 'guest_and_crew')),
  
  -- Usage limits
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0 NOT NULL,
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Optional restrictions
  allowed_emails TEXT[], -- Whitelist of emails (null = anyone can use)
  require_approval BOOLEAN DEFAULT false,
  
  -- Tracking
  uses_log JSONB DEFAULT '[]'::jsonb, -- Array of { user_id, timestamp, ip }
  
  CHECK (max_uses IS NULL OR max_uses > 0),
  CHECK (current_uses <= COALESCE(max_uses, current_uses))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invite_tokens_event ON public.event_invite_tokens(event_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON public.event_invite_tokens(token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_invite_tokens_expires ON public.event_invite_tokens(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE public.event_invite_tokens IS 'QR code and shareable link tokens for event invitations';
COMMENT ON COLUMN public.event_invite_tokens.token_type IS 'guest_join: join as guest only, crew_invite: add to crew only, guest_and_crew: both';

-- ============================================
-- COST SPLIT REQUESTS (tracks individual payments)
-- ============================================

CREATE TABLE IF NOT EXISTS public.cost_split_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  
  -- Amount details
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD' NOT NULL,
  description TEXT,
  
  -- Payment tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
  payment_method TEXT, -- 'stripe', 'venmo', 'cash', etc.
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Reminders
  reminder_sent_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  due_date TIMESTAMPTZ,
  
  -- Notes
  admin_notes TEXT,
  guest_notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cost_split_event ON public.cost_split_requests(event_id, status);
CREATE INDEX IF NOT EXISTS idx_cost_split_guest ON public.cost_split_requests(guest_id);
CREATE INDEX IF NOT EXISTS idx_cost_split_status ON public.cost_split_requests(status, due_date);

-- Trigger to update updated_at
CREATE TRIGGER update_cost_split_requests_updated_at
BEFORE UPDATE ON public.cost_split_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.cost_split_requests IS 'Individual cost-split payment requests for event guests';

-- ============================================
-- GUEST TO CREW CONVERSIONS (audit trail)
-- ============================================

CREATE TABLE IF NOT EXISTS public.guest_crew_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conversion details
  converted_by UUID NOT NULL REFERENCES auth.users(id), -- Host who initiated
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('host_promoted', 'guest_accepted', 'auto_mutual')),
  
  -- Resulting connection
  connection_id UUID REFERENCES public.connections(id) ON DELETE SET NULL,
  connection_status TEXT CHECK (connection_status IN ('pending', 'accepted', 'declined')),
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(guest_id, user_id) -- Prevent duplicate conversions
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guest_crew_conversions_event ON public.guest_crew_conversions(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_crew_conversions_guest ON public.guest_crew_conversions(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_crew_conversions_user ON public.guest_crew_conversions(user_id);

COMMENT ON TABLE public.guest_crew_conversions IS 'Audit trail of guest-to-crew promotions';
COMMENT ON COLUMN public.guest_crew_conversions.conversion_type IS 'host_promoted: host added guest to crew, guest_accepted: guest requested crew, auto_mutual: automatic on both accepting';

-- ============================================
-- EVENT COST SPLIT SUMMARY (denormalized)
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_cost_summaries (
  event_id UUID PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Totals
  total_event_cost DECIMAL(10,2) DEFAULT 0,
  total_collected DECIMAL(10,2) DEFAULT 0,
  total_pending DECIMAL(10,2) DEFAULT 0,
  total_overdue DECIMAL(10,2) DEFAULT 0,
  
  -- Participant counts
  guests_with_splits INTEGER DEFAULT 0,
  guests_paid INTEGER DEFAULT 0,
  guests_pending INTEGER DEFAULT 0,
  
  -- Metadata
  split_enabled BOOLEAN DEFAULT false NOT NULL,
  split_method TEXT CHECK (split_method IN ('equal', 'custom', 'percentage')),
  currency TEXT DEFAULT 'USD',
  
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger to keep summary updated
CREATE OR REPLACE FUNCTION update_event_cost_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate summary for the event
  INSERT INTO public.event_cost_summaries (event_id, total_event_cost, total_collected, total_pending, total_overdue, guests_with_splits, guests_paid, guests_pending, updated_at)
  SELECT 
    NEW.event_id,
    COALESCE(SUM(amount), 0) as total_event_cost,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_collected,
    COALESCE(SUM(CASE WHEN status IN ('pending', 'sent') THEN amount ELSE 0 END), 0) as total_pending,
    COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) as total_overdue,
    COUNT(DISTINCT guest_id) as guests_with_splits,
    COUNT(DISTINCT CASE WHEN status = 'paid' THEN guest_id END) as guests_paid,
    COUNT(DISTINCT CASE WHEN status IN ('pending', 'sent', 'overdue') THEN guest_id END) as guests_pending,
    NOW()
  FROM public.cost_split_requests
  WHERE event_id = NEW.event_id
  GROUP BY event_id
  ON CONFLICT (event_id) DO UPDATE
  SET 
    total_event_cost = EXCLUDED.total_event_cost,
    total_collected = EXCLUDED.total_collected,
    total_pending = EXCLUDED.total_pending,
    total_overdue = EXCLUDED.total_overdue,
    guests_with_splits = EXCLUDED.guests_with_splits,
    guests_paid = EXCLUDED.guests_paid,
    guests_pending = EXCLUDED.guests_pending,
    updated_at = NOW();
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cost_summary
AFTER INSERT OR UPDATE OR DELETE ON public.cost_split_requests
FOR EACH ROW EXECUTE FUNCTION update_event_cost_summary();

COMMENT ON TABLE public.event_cost_summaries IS 'Cached cost-split summary per event for performance';

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Event Invite Tokens
ALTER TABLE public.event_invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event hosts can manage invite tokens" ON public.event_invite_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_invite_tokens.event_id
      AND events.host_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active invite tokens by token" ON public.event_invite_tokens
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Cost Split Requests
ALTER TABLE public.cost_split_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event hosts can manage cost splits" ON public.cost_split_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = cost_split_requests.event_id
      AND events.host_id = auth.uid()
    )
  );

CREATE POLICY "Guests can view their own cost splits" ON public.cost_split_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.guests
      WHERE guests.id = cost_split_requests.guest_id
      AND (guests.user_id = auth.uid() OR guests.email = auth.email())
    )
  );

CREATE POLICY "Guests can update their payment status" ON public.cost_split_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.guests
      WHERE guests.id = cost_split_requests.guest_id
      AND (guests.user_id = auth.uid() OR guests.email = auth.email())
    )
  )
  WITH CHECK (
    -- Guests can only update payment-related fields
    NEW.status = OLD.status OR NEW.status IN ('paid', 'pending')
  );

-- Guest Crew Conversions
ALTER TABLE public.guest_crew_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversions" ON public.guest_crew_conversions
  FOR SELECT USING (user_id = auth.uid() OR converted_by = auth.uid());

CREATE POLICY "Event hosts can create conversions" ON public.guest_crew_conversions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = guest_crew_conversions.event_id
      AND events.host_id = auth.uid()
    )
  );

-- Event Cost Summaries
ALTER TABLE public.event_cost_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event hosts can view cost summaries" ON public.event_cost_summaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_cost_summaries.event_id
      AND events.host_id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate unique invite token
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
  SELECT 'inv_' || encode(gen_random_bytes(16), 'base64')::TEXT;
$$ LANGUAGE SQL VOLATILE;

-- Check if invite token is valid
CREATE OR REPLACE FUNCTION is_invite_token_valid(token_input TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_invite_tokens
    WHERE token = token_input
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses)
  );
$$ LANGUAGE SQL STABLE;

-- Increment token usage
CREATE OR REPLACE FUNCTION increment_token_usage(token_input TEXT, user_id_input UUID)
RETURNS BOOLEAN AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Get and lock the token
  SELECT * INTO token_record
  FROM public.event_invite_tokens
  WHERE token = token_input
  FOR UPDATE;
  
  -- Check validity
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF NOT token_record.is_active OR
     (token_record.expires_at IS NOT NULL AND token_record.expires_at <= NOW()) OR
     (token_record.max_uses IS NOT NULL AND token_record.current_uses >= token_record.max_uses) THEN
    RETURN false;
  END IF;
  
  -- Increment usage
  UPDATE public.event_invite_tokens
  SET 
    current_uses = current_uses + 1,
    last_used_at = NOW(),
    uses_log = uses_log || jsonb_build_object(
      'user_id', user_id_input,
      'timestamp', NOW(),
      'ip', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
    )
  WHERE token = token_input;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Convert guest to crew connection
CREATE OR REPLACE FUNCTION convert_guest_to_crew(
  p_guest_id UUID,
  p_converted_by UUID,
  p_conversion_type TEXT DEFAULT 'host_promoted'
)
RETURNS UUID AS $$
DECLARE
  v_guest_record RECORD;
  v_event_host UUID;
  v_connection_id UUID;
BEGIN
  -- Get guest details
  SELECT g.*, e.host_id INTO v_guest_record
  FROM public.guests g
  JOIN public.events e ON e.id = g.event_id
  WHERE g.id = p_guest_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Guest not found';
  END IF;
  
  IF v_guest_record.user_id IS NULL THEN
    RAISE EXCEPTION 'Guest must have a user account to be added to crew';
  END IF;
  
  -- Check if connection already exists
  IF EXISTS (
    SELECT 1 FROM public.connections
    WHERE follower_id = v_guest_record.user_id
    AND following_id = v_event_host
  ) THEN
    RAISE EXCEPTION 'User is already in crew';
  END IF;
  
  -- Create connection
  INSERT INTO public.connections (follower_id, following_id)
  VALUES (v_guest_record.user_id, v_event_host)
  RETURNING id INTO v_connection_id;
  
  -- Log conversion
  INSERT INTO public.guest_crew_conversions (
    event_id,
    guest_id,
    user_id,
    converted_by,
    conversion_type,
    connection_id,
    connection_status
  ) VALUES (
    v_guest_record.event_id,
    p_guest_id,
    v_guest_record.user_id,
    p_converted_by,
    p_conversion_type,
    v_connection_id,
    'accepted'
  );
  
  RETURN v_connection_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION convert_guest_to_crew IS 'Promotes an event guest to host crew member, creates connection and logs conversion';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Composite index for guest lookups by user
CREATE INDEX IF NOT EXISTS idx_guests_user_event ON public.guests(user_id, event_id) WHERE user_id IS NOT NULL;

-- Index for unpaid cost splits
CREATE INDEX IF NOT EXISTS idx_cost_splits_unpaid ON public.cost_split_requests(event_id, guest_id)
WHERE status IN ('pending', 'sent', 'overdue');

-- Index for overdue payments
CREATE INDEX IF NOT EXISTS idx_cost_splits_overdue ON public.cost_split_requests(due_date, status)
WHERE status IN ('pending', 'sent') AND due_date < NOW();

-- ============================================
-- INITIAL DATA / EXAMPLES
-- ============================================

-- (Optional) Create sample invite token for testing
-- INSERT INTO public.event_invite_tokens (event_id, token, token_type, created_by)
-- SELECT id, generate_invite_token(), 'guest_and_crew', host_id
-- FROM public.events LIMIT 1;

COMMENT ON SCHEMA public IS 'Extended with guest/crew features: QR invites, cost splitting, and guest-to-crew conversions';
