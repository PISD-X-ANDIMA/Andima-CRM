-- Compatibility migration for deployments that already have the original A1
-- schedule table. Fresh databases create the complete table in 202610070001.
DO $$
BEGIN
  IF to_regclass('public.a1_customer_meetings') IS NOT NULL THEN
    ALTER TABLE public.a1_customer_meetings
      ADD COLUMN IF NOT EXISTS agenda TEXT,
      ADD COLUMN IF NOT EXISTS pic_name TEXT,
      ADD COLUMN IF NOT EXISTS representative_name TEXT,
      ADD COLUMN IF NOT EXISTS meeting_type TEXT NOT NULL DEFAULT 'offline',
      ADD COLUMN IF NOT EXISTS location TEXT,
      ADD COLUMN IF NOT EXISTS meeting_link TEXT,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled';

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'a1_customer_meetings_meeting_type_check'
        AND conrelid = 'public.a1_customer_meetings'::regclass
    ) THEN
      ALTER TABLE public.a1_customer_meetings
        ADD CONSTRAINT a1_customer_meetings_meeting_type_check
        CHECK (meeting_type IN ('offline', 'online'));
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'a1_customer_meetings_status_check'
        AND conrelid = 'public.a1_customer_meetings'::regclass
    ) THEN
      ALTER TABLE public.a1_customer_meetings
        ADD CONSTRAINT a1_customer_meetings_status_check
        CHECK (status IN ('scheduled', 'completed', 'cancelled'));
    END IF;

    CREATE INDEX IF NOT EXISTS idx_a1_customer_meetings_status
      ON public.a1_customer_meetings (status);
  END IF;
END $$;
