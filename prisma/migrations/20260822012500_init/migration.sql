CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "QuitStatus" AS ENUM ('NOT_STARTED', 'REDUCING', 'QUIT');
CREATE TYPE "TriggerType" AS ENUM ('STRESS', 'AFTER_MEAL', 'ALCOHOL', 'SOCIAL', 'BOREDOM', 'HABIT', 'NEGATIVE_MOOD', 'OTHER');
CREATE TYPE "CravingStatus" AS ENUM ('STARTED', 'INTERVENING', 'COMPLETED', 'ABANDONED');
CREATE TYPE "InterventionStrategy" AS ENUM ('BREATHING', 'DELAY_DECISION', 'URGE_SURFING', 'BEHAVIOR_REPLACEMENT', 'GROUNDING', 'REFUSAL_REHEARSAL', 'COGNITIVE_REFRAME', 'RELAPSE_REVIEW');

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "anonymous_id" TEXT NOT NULL,
    "email" TEXT,
    "display_name" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'zh-CN',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cigarettes_per_day" INTEGER NOT NULL,
    "smoking_years" INTEGER NOT NULL,
    "minutes_to_first_cigarette" INTEGER NOT NULL,
    "quit_attempts" INTEGER NOT NULL,
    "motivation" TEXT NOT NULL,
    "quit_status" "QuitStatus" NOT NULL,
    "quit_date" DATE,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "cigarette_pack_price" DECIMAL(10,2),
    "cigarettes_per_pack" INTEGER NOT NULL DEFAULT 20,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "profile_triggers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trigger_type" "TriggerType" NOT NULL,
    "priority" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profile_triggers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "craving_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trigger_type" "TriggerType" NOT NULL,
    "context_text" VARCHAR(300),
    "before_score" INTEGER NOT NULL,
    "after_score" INTEGER,
    "primary_strategy" "InterventionStrategy",
    "smoked" BOOLEAN,
    "status" "CravingStatus" NOT NULL DEFAULT 'STARTED',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "craving_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "intervention_steps" (
    "id" TEXT NOT NULL,
    "craving_event_id" TEXT NOT NULL,
    "step_index" INTEGER NOT NULL,
    "strategy" "InterventionStrategy" NOT NULL,
    "action_type" TEXT NOT NULL,
    "ai_message" TEXT NOT NULL,
    "user_response" VARCHAR(300),
    "model_provider" TEXT,
    "model_name" TEXT,
    "latency_ms" INTEGER,
    "token_input" INTEGER,
    "token_output" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "intervention_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "log_date" DATE NOT NULL,
    "cigarettes_smoked" INTEGER NOT NULL,
    "notes" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "anonymous_id" TEXT,
    "event_name" TEXT NOT NULL,
    "properties_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_anonymous_id_key" ON "users"("anonymous_id");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");
CREATE INDEX "profile_triggers_user_id_priority_idx" ON "profile_triggers"("user_id", "priority");
CREATE UNIQUE INDEX "profile_triggers_user_id_trigger_type_key" ON "profile_triggers"("user_id", "trigger_type");
CREATE INDEX "craving_events_user_id_started_at_idx" ON "craving_events"("user_id", "started_at");
CREATE INDEX "craving_events_status_idx" ON "craving_events"("status");
CREATE UNIQUE INDEX "intervention_steps_craving_event_id_step_index_key" ON "intervention_steps"("craving_event_id", "step_index");
CREATE UNIQUE INDEX "daily_logs_user_id_log_date_key" ON "daily_logs"("user_id", "log_date");
CREATE INDEX "analytics_events_event_name_created_at_idx" ON "analytics_events"("event_name", "created_at");
CREATE INDEX "analytics_events_anonymous_id_created_at_idx" ON "analytics_events"("anonymous_id", "created_at");

ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "profile_triggers" ADD CONSTRAINT "profile_triggers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "craving_events" ADD CONSTRAINT "craving_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "intervention_steps" ADD CONSTRAINT "intervention_steps_craving_event_id_fkey" FOREIGN KEY ("craving_event_id") REFERENCES "craving_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
