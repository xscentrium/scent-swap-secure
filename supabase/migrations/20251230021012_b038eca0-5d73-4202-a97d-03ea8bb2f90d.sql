-- Create admin_alert_settings table for configurable alert thresholds
CREATE TABLE public.admin_alert_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.admin_alert_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view settings
CREATE POLICY "Admins can view alert settings"
  ON public.admin_alert_settings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert settings
CREATE POLICY "Admins can insert alert settings"
  ON public.admin_alert_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update settings
CREATE POLICY "Admins can update alert settings"
  ON public.admin_alert_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete settings
CREATE POLICY "Admins can delete alert settings"
  ON public.admin_alert_settings
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can read for edge functions
CREATE POLICY "Service role can read settings"
  ON public.admin_alert_settings
  FOR SELECT
  USING (true);

-- Insert default settings
INSERT INTO public.admin_alert_settings (setting_key, setting_value)
VALUES 
  ('search_volume_thresholds', '{"daily_threshold": 100, "hourly_spike_threshold": 50, "increase_percentage": 50}'::jsonb),
  ('admin_emails', '["admin@xscentrium.com"]'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;