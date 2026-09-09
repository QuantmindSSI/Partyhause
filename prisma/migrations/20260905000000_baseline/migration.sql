-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('birthday', 'wedding', 'corporate', 'holiday', 'social', 'sports', 'cultural', 'fundraiser', 'other');

-- CreateEnum
CREATE TYPE "PriceTier" AS ENUM ('free', 'basic', 'premium');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT,
    "reset_token" TEXT,
    "reset_token_expires" TIMESTAMP(3),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "verification_token_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "content" JSONB NOT NULL DEFAULT '{}',
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "game_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "current_round" INTEGER NOT NULL DEFAULT 0,
    "scores" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "host_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event_date" TIMESTAMP(3),
    "location" TEXT NOT NULL,
    "spotify_playlist_url" TEXT,
    "active_game_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "event_type" TEXT NOT NULL DEFAULT 'single_day',
    "invite_image_url" TEXT,
    "max_guests" INTEGER,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "template_type" TEXT,
    "title" TEXT,
    "timezone" TEXT DEFAULT 'UTC',
    "location_name" TEXT,
    "location_address" TEXT,
    "location_coordinates" point,
    "privacy" TEXT NOT NULL DEFAULT 'private',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "template_data" JSONB NOT NULL DEFAULT '{}',
    "timeline_blocks" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_co_hosts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'co-host',
    "permissions" JSONB NOT NULL DEFAULT '{"can_edit": true, "can_invite": true, "can_moderate": true}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_co_hosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "is_checked_in" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email_status" TEXT DEFAULT 'not_sent',
    "last_email_sent_at" TIMESTAMP(3),
    "email_log_id" TEXT,
    "phone" TEXT,
    "rsvp_status" TEXT NOT NULL DEFAULT 'pending',
    "ticket_type" TEXT,
    "ticket_id" TEXT,
    "qr_code" TEXT,
    "plus_ones" INTEGER NOT NULL DEFAULT 0,
    "dietary_restrictions" TEXT[],
    "custom_fields" JSONB NOT NULL DEFAULT '{}',
    "checked_in" BOOLEAN NOT NULL DEFAULT false,
    "checked_in_at" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'guest',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "user_id" TEXT,
    "cost_share_enabled" BOOLEAN NOT NULL DEFAULT false,
    "cost_share_amount" DECIMAL(10,2),
    "payment_status" TEXT NOT NULL DEFAULT 'unpaid',
    "payment_intent_id" TEXT,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "quantity" INTEGER NOT NULL,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_blocks" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "host_notes" TEXT,
    "guest_visible" BOOLEAN NOT NULL DEFAULT true,
    "notify_before" INTEGER,
    "location" TEXT,
    "assigned_to" TEXT[],
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "uploader_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "file_size" BIGINT,
    "mime_type" TEXT,
    "tags" TEXT[],
    "location_coordinates" point,
    "captured_at" TIMESTAMP(3),
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "moderation_notes" TEXT,
    "credits" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "duration" INTEGER,
    "config" JSONB NOT NULL DEFAULT '{}',
    "results" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_participants" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "activity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "responses" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "contact_website" TEXT,
    "contract_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_tasks" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "vendor_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT,
    "guest_id" TEXT,
    "resend_email_id" TEXT,
    "email_type" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "bounced_at" TIMESTAMP(3),
    "error_message" TEXT,
    "webhook_data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "template_id" TEXT,
    "template_body" TEXT,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_events" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email_log_id" TEXT NOT NULL,
    "resend_email_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "webhook_data" JSONB NOT NULL DEFAULT '{}',
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_templates" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "host_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "subject" TEXT NOT NULL,
    "body_html" TEXT,
    "body_markdown" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" "TemplateCategory" NOT NULL,
    "hero_image_url" TEXT,
    "price_tier" "PriceTier" NOT NULL DEFAULT 'free',
    "default_payload" JSONB NOT NULL DEFAULT '{}',
    "required_fields_schema" JSONB,
    "author_id" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_usage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "template_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "cover_photo_url" TEXT,
    "location" TEXT,
    "website_url" TEXT,
    "partycrew_count" INTEGER NOT NULL DEFAULT 0,
    "crewing_count" INTEGER NOT NULL DEFAULT 0,
    "events_hosted" INTEGER NOT NULL DEFAULT 0,
    "events_attended" INTEGER NOT NULL DEFAULT 0,
    "haus_score" INTEGER NOT NULL DEFAULT 0,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "show_attending_events" BOOLEAN NOT NULL DEFAULT true,
    "show_partycrew_list" BOOLEAN NOT NULL DEFAULT true,
    "show_activity_status" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "account_type" TEXT NOT NULL DEFAULT 'personal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connections" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,
    "notify_on_events" BOOLEAN NOT NULL DEFAULT true,
    "notify_on_posts" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connection_type" TEXT NOT NULL DEFAULT 'follow',

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partyboard_stickies" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "session_id" TEXT,
    "type" TEXT NOT NULL,
    "position_x" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "position_y" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 220,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 220,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "z_index" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "reaction_count" INTEGER NOT NULL DEFAULT 0,
    "vote_count" INTEGER NOT NULL DEFAULT 0,
    "voter_ids" JSONB NOT NULL DEFAULT '[]',
    "converted_to_task" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_by_name" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partyboard_stickies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_events" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_requests" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "requester_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connection_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_blocks" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partycrew_posts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "creator_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "media_urls" TEXT[],
    "event_id" TEXT,
    "poll_options" JSONB,
    "poll_ends_at" TIMESTAMP(3),
    "poll_allow_multiple" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'crew',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "shares_count" INTEGER NOT NULL DEFAULT 0,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partycrew_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "parent_comment_id" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_shares" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shared_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actor_id" TEXT,
    "event_id" TEXT,
    "post_id" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "action_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_read_status" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_read_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_interactions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "interaction_type" TEXT NOT NULL,
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "node_id" TEXT,
    "created_by" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "poll_type" TEXT NOT NULL,
    "ends_at" TIMESTAMP(3),
    "auto_close_on_consensus" BOOLEAN NOT NULL DEFAULT false,
    "consensus_threshold" INTEGER NOT NULL DEFAULT 70,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_options" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "poll_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_votes" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "poll_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "voted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_invite_tokens" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "token_type" TEXT NOT NULL,
    "max_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "allowed_emails" TEXT[],
    "require_approval" BOOLEAN NOT NULL DEFAULT false,
    "uses_log" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "event_invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_split_requests" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "payment_reference" TEXT,
    "paid_at" TIMESTAMP(3),
    "reminder_sent_count" INTEGER NOT NULL DEFAULT 0,
    "last_reminder_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "admin_notes" TEXT,
    "guest_notes" TEXT,

    CONSTRAINT "cost_split_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_crew_conversions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "converted_by" TEXT NOT NULL,
    "conversion_type" TEXT NOT NULL,
    "connection_id" TEXT,
    "connection_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_crew_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_cost_summaries" (
    "event_id" TEXT NOT NULL,
    "total_event_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_collected" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_pending" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_overdue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "guests_with_splits" INTEGER NOT NULL DEFAULT 0,
    "guests_paid" INTEGER NOT NULL DEFAULT 0,
    "guests_pending" INTEGER NOT NULL DEFAULT 0,
    "split_enabled" BOOLEAN NOT NULL DEFAULT false,
    "split_method" TEXT,
    "currency" TEXT DEFAULT 'USD',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_cost_summaries_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_reset_token_key" ON "users"("reset_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_verification_token_key" ON "users"("verification_token");

-- CreateIndex
CREATE INDEX "games_event_id_idx" ON "games"("event_id");

-- CreateIndex
CREATE INDEX "game_sessions_game_id_idx" ON "game_sessions"("game_id");

-- CreateIndex
CREATE INDEX "events_host_id_idx" ON "events"("host_id");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_start_date_end_date_idx" ON "events"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "events_template_type_idx" ON "events"("template_type");

-- CreateIndex
CREATE INDEX "events_privacy_idx" ON "events"("privacy");

-- CreateIndex
CREATE INDEX "event_co_hosts_event_id_idx" ON "event_co_hosts"("event_id");

-- CreateIndex
CREATE INDEX "event_co_hosts_user_id_idx" ON "event_co_hosts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_co_hosts_event_id_user_id_key" ON "event_co_hosts"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "guests_event_id_idx" ON "guests"("event_id");

-- CreateIndex
CREATE INDEX "guests_rsvp_status_idx" ON "guests"("rsvp_status");

-- CreateIndex
CREATE INDEX "guests_email_idx" ON "guests"("email");

-- CreateIndex
CREATE INDEX "guests_checked_in_idx" ON "guests"("checked_in");

-- CreateIndex
CREATE INDEX "guests_user_id_idx" ON "guests"("user_id");

-- CreateIndex
CREATE INDEX "guests_event_id_rsvp_status_idx" ON "guests"("event_id", "rsvp_status");

-- CreateIndex
CREATE INDEX "guests_event_id_payment_status_idx" ON "guests"("event_id", "payment_status");

-- CreateIndex
CREATE INDEX "guests_user_id_event_id_idx" ON "guests"("user_id", "event_id");

-- CreateIndex
CREATE INDEX "tickets_event_id_idx" ON "tickets"("event_id");

-- CreateIndex
CREATE INDEX "tickets_type_idx" ON "tickets"("type");

-- CreateIndex
CREATE INDEX "timeline_blocks_event_id_idx" ON "timeline_blocks"("event_id");

-- CreateIndex
CREATE INDEX "timeline_blocks_start_time_idx" ON "timeline_blocks"("start_time");

-- CreateIndex
CREATE INDEX "timeline_blocks_event_id_order_index_idx" ON "timeline_blocks"("event_id", "order_index");

-- CreateIndex
CREATE INDEX "media_event_id_idx" ON "media"("event_id");

-- CreateIndex
CREATE INDEX "media_uploader_id_idx" ON "media"("uploader_id");

-- CreateIndex
CREATE INDEX "media_status_idx" ON "media"("status");

-- CreateIndex
CREATE INDEX "media_captured_at_idx" ON "media"("captured_at");

-- CreateIndex
CREATE INDEX "media_type_idx" ON "media"("type");

-- CreateIndex
CREATE INDEX "activities_event_id_idx" ON "activities"("event_id");

-- CreateIndex
CREATE INDEX "activities_status_idx" ON "activities"("status");

-- CreateIndex
CREATE INDEX "activities_type_idx" ON "activities"("type");

-- CreateIndex
CREATE INDEX "activity_participants_activity_id_idx" ON "activity_participants"("activity_id");

-- CreateIndex
CREATE INDEX "activity_participants_user_id_idx" ON "activity_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_participants_activity_id_user_id_key" ON "activity_participants"("activity_id", "user_id");

-- CreateIndex
CREATE INDEX "vendors_event_id_idx" ON "vendors"("event_id");

-- CreateIndex
CREATE INDEX "vendor_tasks_vendor_id_idx" ON "vendor_tasks"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_tasks_due_date_idx" ON "vendor_tasks"("due_date");

-- CreateIndex
CREATE INDEX "vendor_tasks_completed_idx" ON "vendor_tasks"("completed");

-- CreateIndex
CREATE INDEX "email_logs_event_id_idx" ON "email_logs"("event_id");

-- CreateIndex
CREATE INDEX "email_logs_guest_id_idx" ON "email_logs"("guest_id");

-- CreateIndex
CREATE INDEX "email_logs_resend_email_id_idx" ON "email_logs"("resend_email_id");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_sent_at_idx" ON "email_logs"("sent_at");

-- CreateIndex
CREATE INDEX "email_logs_template_id_idx" ON "email_logs"("template_id");

-- CreateIndex
CREATE INDEX "email_events_email_log_id_idx" ON "email_events"("email_log_id");

-- CreateIndex
CREATE INDEX "email_events_resend_email_id_idx" ON "email_events"("resend_email_id");

-- CreateIndex
CREATE INDEX "email_events_event_type_idx" ON "email_events"("event_type");

-- CreateIndex
CREATE INDEX "invite_templates_host_id_idx" ON "invite_templates"("host_id");

-- CreateIndex
CREATE INDEX "invite_templates_slug_idx" ON "invite_templates"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "templates_slug_key" ON "templates"("slug");

-- CreateIndex
CREATE INDEX "templates_category_idx" ON "templates"("category");

-- CreateIndex
CREATE INDEX "templates_price_tier_idx" ON "templates"("price_tier");

-- CreateIndex
CREATE INDEX "templates_slug_idx" ON "templates"("slug");

-- CreateIndex
CREATE INDEX "template_usage_template_id_idx" ON "template_usage"("template_id");

-- CreateIndex
CREATE INDEX "template_usage_user_id_idx" ON "template_usage"("user_id");

-- CreateIndex
CREATE INDEX "template_usage_event_id_idx" ON "template_usage"("event_id");

-- CreateIndex
CREATE INDEX "template_usage_created_at_idx" ON "template_usage"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_username_key" ON "user_profiles"("username");

-- CreateIndex
CREATE INDEX "user_profiles_username_idx" ON "user_profiles"("username");

-- CreateIndex
CREATE INDEX "user_profiles_display_name_idx" ON "user_profiles"("display_name");

-- CreateIndex
CREATE INDEX "user_profiles_location_idx" ON "user_profiles"("location");

-- CreateIndex
CREATE INDEX "user_profiles_haus_score_idx" ON "user_profiles"("haus_score");

-- CreateIndex
CREATE INDEX "user_profiles_partycrew_count_idx" ON "user_profiles"("partycrew_count");

-- CreateIndex
CREATE INDEX "user_profiles_last_active_at_idx" ON "user_profiles"("last_active_at");

-- CreateIndex
CREATE INDEX "connections_follower_id_idx" ON "connections"("follower_id");

-- CreateIndex
CREATE INDEX "connections_following_id_idx" ON "connections"("following_id");

-- CreateIndex
CREATE UNIQUE INDEX "connections_follower_id_following_id_key" ON "connections"("follower_id", "following_id");

-- CreateIndex
CREATE INDEX "partyboard_stickies_event_id_idx" ON "partyboard_stickies"("event_id");

-- CreateIndex
CREATE INDEX "partyboard_stickies_session_id_idx" ON "partyboard_stickies"("session_id");

-- CreateIndex
CREATE INDEX "saved_events_user_id_idx" ON "saved_events"("user_id");

-- CreateIndex
CREATE INDEX "saved_events_event_id_idx" ON "saved_events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_events_user_id_event_id_key" ON "saved_events"("user_id", "event_id");

-- CreateIndex
CREATE INDEX "connection_requests_target_id_idx" ON "connection_requests"("target_id");

-- CreateIndex
CREATE INDEX "connection_requests_requester_id_idx" ON "connection_requests"("requester_id");

-- CreateIndex
CREATE UNIQUE INDEX "connection_requests_requester_id_target_id_key" ON "connection_requests"("requester_id", "target_id");

-- CreateIndex
CREATE INDEX "user_blocks_blocker_id_idx" ON "user_blocks"("blocker_id");

-- CreateIndex
CREATE INDEX "user_blocks_blocked_id_idx" ON "user_blocks"("blocked_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_blocks_blocker_id_blocked_id_key" ON "user_blocks"("blocker_id", "blocked_id");

-- CreateIndex
CREATE INDEX "partycrew_posts_creator_id_idx" ON "partycrew_posts"("creator_id");

-- CreateIndex
CREATE INDEX "partycrew_posts_content_type_idx" ON "partycrew_posts"("content_type");

-- CreateIndex
CREATE INDEX "partycrew_posts_event_id_idx" ON "partycrew_posts"("event_id");

-- CreateIndex
CREATE INDEX "partycrew_posts_published_at_idx" ON "partycrew_posts"("published_at");

-- CreateIndex
CREATE INDEX "partycrew_posts_visibility_idx" ON "partycrew_posts"("visibility");

-- CreateIndex
CREATE INDEX "post_likes_post_id_idx" ON "post_likes"("post_id");

-- CreateIndex
CREATE INDEX "post_likes_user_id_idx" ON "post_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_post_id_user_id_key" ON "post_likes"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "post_comments_post_id_idx" ON "post_comments"("post_id");

-- CreateIndex
CREATE INDEX "post_comments_user_id_idx" ON "post_comments"("user_id");

-- CreateIndex
CREATE INDEX "post_comments_parent_comment_id_idx" ON "post_comments"("parent_comment_id");

-- CreateIndex
CREATE INDEX "post_shares_post_id_idx" ON "post_shares"("post_id");

-- CreateIndex
CREATE INDEX "post_shares_user_id_idx" ON "post_shares"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_expires_at_idx" ON "notifications"("expires_at");

-- CreateIndex
CREATE INDEX "feed_read_status_user_id_idx" ON "feed_read_status"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "feed_read_status_user_id_post_id_key" ON "feed_read_status"("user_id", "post_id");

-- CreateIndex
CREATE INDEX "content_interactions_user_id_idx" ON "content_interactions"("user_id");

-- CreateIndex
CREATE INDEX "content_interactions_post_id_idx" ON "content_interactions"("post_id");

-- CreateIndex
CREATE INDEX "content_interactions_interaction_type_idx" ON "content_interactions"("interaction_type");

-- CreateIndex
CREATE INDEX "polls_event_id_idx" ON "polls"("event_id");

-- CreateIndex
CREATE INDEX "polls_created_by_idx" ON "polls"("created_by");

-- CreateIndex
CREATE INDEX "polls_status_idx" ON "polls"("status");

-- CreateIndex
CREATE INDEX "poll_options_poll_id_idx" ON "poll_options"("poll_id");

-- CreateIndex
CREATE INDEX "poll_votes_poll_id_idx" ON "poll_votes"("poll_id");

-- CreateIndex
CREATE INDEX "poll_votes_user_id_idx" ON "poll_votes"("user_id");

-- CreateIndex
CREATE INDEX "poll_votes_option_id_idx" ON "poll_votes"("option_id");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_poll_id_user_id_option_id_key" ON "poll_votes"("poll_id", "user_id", "option_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_invite_tokens_token_key" ON "event_invite_tokens"("token");

-- CreateIndex
CREATE INDEX "event_invite_tokens_event_id_idx" ON "event_invite_tokens"("event_id");

-- CreateIndex
CREATE INDEX "cost_split_requests_event_id_idx" ON "cost_split_requests"("event_id");

-- CreateIndex
CREATE INDEX "cost_split_requests_guest_id_idx" ON "cost_split_requests"("guest_id");

-- CreateIndex
CREATE INDEX "cost_split_requests_status_idx" ON "cost_split_requests"("status");

-- CreateIndex
CREATE INDEX "guest_crew_conversions_event_id_idx" ON "guest_crew_conversions"("event_id");

-- CreateIndex
CREATE INDEX "guest_crew_conversions_guest_id_idx" ON "guest_crew_conversions"("guest_id");

-- CreateIndex
CREATE INDEX "guest_crew_conversions_user_id_idx" ON "guest_crew_conversions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "guest_crew_conversions_guest_id_user_id_key" ON "guest_crew_conversions"("guest_id", "user_id");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_active_game_id_fkey" FOREIGN KEY ("active_game_id") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_co_hosts" ADD CONSTRAINT "event_co_hosts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_co_hosts" ADD CONSTRAINT "event_co_hosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_email_log_id_fkey" FOREIGN KEY ("email_log_id") REFERENCES "email_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_blocks" ADD CONSTRAINT "timeline_blocks_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_participants" ADD CONSTRAINT "activity_participants_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_participants" ADD CONSTRAINT "activity_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_tasks" ADD CONSTRAINT "vendor_tasks_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_tasks" ADD CONSTRAINT "vendor_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "invite_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_email_log_id_fkey" FOREIGN KEY ("email_log_id") REFERENCES "email_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_templates" ADD CONSTRAINT "invite_templates_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_usage" ADD CONSTRAINT "template_usage_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_usage" ADD CONSTRAINT "template_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_usage" ADD CONSTRAINT "template_usage_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partyboard_stickies" ADD CONSTRAINT "partyboard_stickies_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_events" ADD CONSTRAINT "saved_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_events" ADD CONSTRAINT "saved_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partycrew_posts" ADD CONSTRAINT "partycrew_posts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partycrew_posts" ADD CONSTRAINT "partycrew_posts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "partycrew_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "partycrew_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "post_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_shares" ADD CONSTRAINT "post_shares_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "partycrew_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_shares" ADD CONSTRAINT "post_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "partycrew_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_read_status" ADD CONSTRAINT "feed_read_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_read_status" ADD CONSTRAINT "feed_read_status_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "partycrew_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_interactions" ADD CONSTRAINT "content_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_interactions" ADD CONSTRAINT "content_interactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "partycrew_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "poll_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_invite_tokens" ADD CONSTRAINT "event_invite_tokens_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_invite_tokens" ADD CONSTRAINT "event_invite_tokens_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_split_requests" ADD CONSTRAINT "cost_split_requests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_split_requests" ADD CONSTRAINT "cost_split_requests_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_split_requests" ADD CONSTRAINT "cost_split_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_crew_conversions" ADD CONSTRAINT "guest_crew_conversions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_crew_conversions" ADD CONSTRAINT "guest_crew_conversions_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_crew_conversions" ADD CONSTRAINT "guest_crew_conversions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_crew_conversions" ADD CONSTRAINT "guest_crew_conversions_converted_by_fkey" FOREIGN KEY ("converted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_crew_conversions" ADD CONSTRAINT "guest_crew_conversions_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_cost_summaries" ADD CONSTRAINT "event_cost_summaries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
