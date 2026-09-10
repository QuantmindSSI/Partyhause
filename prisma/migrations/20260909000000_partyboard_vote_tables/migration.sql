-- PartyBoard: move votes and task conversion out of columns and into rows.
--
-- The baseline creates `partyboard_stickies` with `vote_count`, `voter_ids`
-- (a JSONB array of user ids), `reaction_count` and `converted_to_task`. That
-- is the shape currently deployed. It cannot express what the canvas actually
-- renders:
--
--   * `user_has_voted` is per viewer. A counter answers "how many", never
--     "did you", so the client had no way to show the viewer's own state.
--   * A repeated click has to toggle. With a JSONB array there is no
--     constraint that makes a second insert of the same voter a no-op, so
--     double-tapping counted twice.
--   * A converted task needs an owner, a title, a cost and a status. A
--     boolean records only that conversion happened, discarding all of it.
--
-- The order below matters. Rows are copied out of `voter_ids` BEFORE the
-- column is dropped, so this migration is not lossy. Running the generated
-- diff instead would drop the column first and silently discard every vote
-- ever cast.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. New tables, created before the backfill that populates them.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.partyboard_sticky_votes (
    "id"         TEXT NOT NULL DEFAULT gen_random_uuid(),
    "sticky_id"  TEXT NOT NULL,
    "user_id"    TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partyboard_sticky_votes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.partyboard_tasks (
    "id"             TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id"       TEXT NOT NULL,
    "sticky_id"      TEXT NOT NULL,
    "title"          TEXT NOT NULL,
    "estimated_cost" DECIMAL(10,2),
    "status"         TEXT NOT NULL DEFAULT 'open',
    "created_by"     TEXT NOT NULL,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at"   TIMESTAMP(3),

    CONSTRAINT "partyboard_tasks_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- 2. Backfill, while the source columns still exist.
-- ---------------------------------------------------------------------------

-- Every id in voter_ids becomes a row. The join against users discards ids
-- that no longer resolve, which the JSONB array could hold indefinitely
-- because nothing enforced referential integrity inside it; keeping them
-- would make the foreign key below fail on data the old shape allowed.
-- DISTINCT collapses an id recorded twice, which the array also permitted.
INSERT INTO public.partyboard_sticky_votes ("sticky_id", "user_id", "created_at")
SELECT DISTINCT s."id", v."user_id", s."created_at"
FROM public.partyboard_stickies s
CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE
        WHEN jsonb_typeof(s."voter_ids") = 'array' THEN s."voter_ids"
        ELSE '[]'::jsonb
    END
) AS v("user_id")
JOIN public.users u ON u."id" = v."user_id"
ON CONFLICT DO NOTHING;

-- A sticky already marked converted becomes a task row. The old shape stored
-- no title, cost or owner, so the title falls back to the sticky's own text
-- and the owner to its creator. `status` stays at the 'open' default: the
-- boolean recorded that conversion happened, never that the task was done.
INSERT INTO public.partyboard_tasks ("event_id", "sticky_id", "title", "created_by", "created_at")
SELECT
    s."event_id",
    s."id",
    COALESCE(NULLIF(btrim(s."data" ->> 'text'), ''), 'Untitled task'),
    s."created_by",
    s."created_at"
FROM public.partyboard_stickies s
WHERE s."converted_to_task" IS TRUE
  AND EXISTS (SELECT 1 FROM public.users u WHERE u."id" = s."created_by")
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Drop the superseded columns, now that nothing in them is unrecorded.
-- ---------------------------------------------------------------------------

ALTER TABLE public.partyboard_stickies
    DROP COLUMN IF EXISTS "converted_to_task",
    DROP COLUMN IF EXISTS "created_by_name",
    DROP COLUMN IF EXISTS "reaction_count",
    DROP COLUMN IF EXISTS "vote_count",
    DROP COLUMN IF EXISTS "voter_ids";

-- Geometry is whole pixels. DOUBLE PRECISION allowed a sticky to land on a
-- fractional coordinate that no client ever produced and that round-trips
-- differently through JSON.
ALTER TABLE public.partyboard_stickies
    ALTER COLUMN "position_x" SET DEFAULT 0,
    ALTER COLUMN "position_x" SET DATA TYPE INTEGER USING round("position_x")::INTEGER,
    ALTER COLUMN "position_y" SET DEFAULT 0,
    ALTER COLUMN "position_y" SET DATA TYPE INTEGER USING round("position_y")::INTEGER,
    ALTER COLUMN "width"      SET DEFAULT 200,
    ALTER COLUMN "width"      SET DATA TYPE INTEGER USING round("width")::INTEGER,
    ALTER COLUMN "height"     SET DEFAULT 200,
    ALTER COLUMN "height"     SET DATA TYPE INTEGER USING round("height")::INTEGER,
    ALTER COLUMN "rotation"   DROP DEFAULT,
    ALTER COLUMN "rotation"   DROP NOT NULL,
    ALTER COLUMN "rotation"   SET DATA TYPE INTEGER USING round("rotation")::INTEGER,
    ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- 4. Indexes and referential integrity.
-- ---------------------------------------------------------------------------

DROP INDEX IF EXISTS "partyboard_stickies_session_id_idx";

CREATE INDEX IF NOT EXISTS "partyboard_stickies_event_id_session_id_idx"
    ON public.partyboard_stickies("event_id", "session_id");
CREATE INDEX IF NOT EXISTS "partyboard_stickies_created_by_idx"
    ON public.partyboard_stickies("created_by");

CREATE INDEX IF NOT EXISTS "partyboard_sticky_votes_sticky_id_idx"
    ON public.partyboard_sticky_votes("sticky_id");
CREATE INDEX IF NOT EXISTS "partyboard_sticky_votes_user_id_idx"
    ON public.partyboard_sticky_votes("user_id");

-- The constraint that makes a repeated click a toggle rather than a second
-- vote. This is the whole reason votes are rows.
CREATE UNIQUE INDEX IF NOT EXISTS "partyboard_sticky_votes_sticky_id_user_id_key"
    ON public.partyboard_sticky_votes("sticky_id", "user_id");

CREATE INDEX IF NOT EXISTS "partyboard_tasks_event_id_idx"
    ON public.partyboard_tasks("event_id");
-- Indexed on status, not created_by: the board reads open tasks for an event,
-- and never reads a person's tasks across events.
CREATE INDEX IF NOT EXISTS "partyboard_tasks_status_idx"
    ON public.partyboard_tasks("status");

-- One task per sticky: converting twice must update, not duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS "partyboard_tasks_sticky_id_key"
    ON public.partyboard_tasks("sticky_id");

ALTER TABLE public.partyboard_stickies
    DROP CONSTRAINT IF EXISTS "partyboard_stickies_created_by_fkey";
ALTER TABLE public.partyboard_stickies
    ADD CONSTRAINT "partyboard_stickies_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES public.users("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.partyboard_sticky_votes
    DROP CONSTRAINT IF EXISTS "partyboard_sticky_votes_sticky_id_fkey";
ALTER TABLE public.partyboard_sticky_votes
    ADD CONSTRAINT "partyboard_sticky_votes_sticky_id_fkey"
    FOREIGN KEY ("sticky_id") REFERENCES public.partyboard_stickies("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.partyboard_sticky_votes
    DROP CONSTRAINT IF EXISTS "partyboard_sticky_votes_user_id_fkey";
ALTER TABLE public.partyboard_sticky_votes
    ADD CONSTRAINT "partyboard_sticky_votes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES public.users("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.partyboard_tasks
    DROP CONSTRAINT IF EXISTS "partyboard_tasks_event_id_fkey";
ALTER TABLE public.partyboard_tasks
    ADD CONSTRAINT "partyboard_tasks_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES public.events("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.partyboard_tasks
    DROP CONSTRAINT IF EXISTS "partyboard_tasks_sticky_id_fkey";
ALTER TABLE public.partyboard_tasks
    ADD CONSTRAINT "partyboard_tasks_sticky_id_fkey"
    FOREIGN KEY ("sticky_id") REFERENCES public.partyboard_stickies("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.partyboard_tasks
    DROP CONSTRAINT IF EXISTS "partyboard_tasks_created_by_fkey";
ALTER TABLE public.partyboard_tasks
    ADD CONSTRAINT "partyboard_tasks_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES public.users("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
