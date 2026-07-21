DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'SIGNAL_POLICY_APPLIED'
        AND enumtypid = '"AnalyticsEventType"'::regtype
    ) THEN
        ALTER TYPE "AnalyticsEventType"
        RENAME VALUE 'SIGNAL_POLICY_APPLIED'
        TO 'FLOW_POLICY_APPLIED';
    END IF;
END $$;