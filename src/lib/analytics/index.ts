import type { Prisma, PrismaClient } from "@prisma/client";

export const analyticsEventNames = [
  "app_opened",
  "onboarding_started",
  "onboarding_completed",
  "home_craving_cta_clicked",
  "craving_created",
  "craving_score_before_submitted",
  "craving_trigger_submitted",
  "intervention_started",
  "intervention_step_completed",
  "intervention_abandoned",
  "intervention_completed",
  "craving_score_after_submitted",
  "craving_result_smoked",
  "craving_result_not_smoked",
  "daily_checkin_completed",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

type AnalyticsClient = Pick<PrismaClient, "analyticsEvent">;

export type TrackEventInput = {
  name: AnalyticsEventName;
  userId?: string;
  anonymousId?: string;
  properties?: Prisma.InputJsonObject;
};

export async function trackEvent(client: AnalyticsClient, input: TrackEventInput) {
  if (!input.userId && !input.anonymousId) {
    throw new Error("Analytics events require userId or anonymousId");
  }

  return client.analyticsEvent.create({
    data: {
      eventName: input.name,
      userId: input.userId,
      anonymousId: input.anonymousId,
      propertiesJson: input.properties ?? {},
    },
  });
}
