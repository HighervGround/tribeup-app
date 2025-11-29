-- Create push_subscriptions table for web push notifications
-- This table stores push notification subscriptions for each user

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  -- Store endpoint separately for faster lookups and uniqueness constraint
  endpoint TEXT NOT NULL,
  -- Browser/device info for debugging
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A user can have multiple subscriptions (different browsers/devices)
  -- but each endpoint should be unique per user
  UNIQUE(user_id, endpoint)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Enable Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can access all subscriptions (for sending notifications)
-- Note: Service role bypasses RLS by default, so no explicit policy needed

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_push_subscription_updated_at ON push_subscriptions;
CREATE TRIGGER trigger_update_push_subscription_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscription_updated_at();

-- Add comment to table
COMMENT ON TABLE push_subscriptions IS 'Stores web push notification subscriptions for users. Used by the send-push-notification Edge Function.';
COMMENT ON COLUMN push_subscriptions.subscription IS 'Full push subscription object from PushManager.subscribe() - contains endpoint and keys';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push service endpoint URL - stored separately for uniqueness constraint';
