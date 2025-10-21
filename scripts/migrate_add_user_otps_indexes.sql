-- Indexes to speed up OTP verification and maintenance
CREATE INDEX IF NOT EXISTS idx_user_otps_user_id ON public.user_otps (user_id);
CREATE INDEX IF NOT EXISTS idx_user_otps_user_id_code ON public.user_otps (user_id, otp_code);
CREATE INDEX IF NOT EXISTS idx_user_otps_created_at ON public.user_otps (created_at);
CREATE INDEX IF NOT EXISTS idx_user_otps_expires_at ON public.user_otps (expires_at);

-- Optional: clean up expired/used OTPs periodically (example cron job outside DB)
-- DELETE FROM public.user_otps WHERE is_used = TRUE OR expires_at < NOW() - INTERVAL '1 day';