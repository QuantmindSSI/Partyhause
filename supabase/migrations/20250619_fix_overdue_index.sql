-- Fix overdue payments index - remove NOW() which is not IMMUTABLE
-- Drop the old index if it exists
DROP INDEX IF EXISTS idx_cost_splits_overdue;

-- Create new index without time-based filter (use query filters instead)
CREATE INDEX IF NOT EXISTS idx_cost_splits_overdue ON public.cost_split_requests(due_date, status)
WHERE status IN ('pending', 'sent') AND due_date IS NOT NULL;
