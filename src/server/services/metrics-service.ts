import type { CravingEvent, User } from "@prisma/client";
import { db } from "@/lib/db";

const DAY_MS = 86_400_000;

type RetentionEvent = { userId: string | null; createdAt: Date };

export function calculateRetentionRate(
  users: Array<Pick<User, "id" | "createdAt">>,
  events: RetentionEvent[],
  day: number,
  now: Date,
): number | null {
  const eligible = users.filter(
    (user) => user.createdAt.getTime() <= now.getTime() - day * DAY_MS,
  );
  if (eligible.length === 0) return null;
  const retained = eligible.filter((user) => {
    const start = user.createdAt.getTime() + day * DAY_MS;
    const end = start + DAY_MS;
    return events.some(
      (event) =>
        event.userId === user.id &&
        event.createdAt.getTime() >= start &&
        event.createdAt.getTime() < end,
    );
  });
  return retained.length / eligible.length;
}

function average(values: number[]): number | null {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

function percentage(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

function triggerLabel(trigger: CravingEvent["triggerType"]): string {
  return {
    STRESS: "压力",
    AFTER_MEAL: "饭后",
    ALCOHOL: "饮酒",
    SOCIAL: "社交",
    BOREDOM: "无聊",
    HABIT: "习惯",
    NEGATIVE_MOOD: "负面情绪",
    OTHER: "其他",
  }[trigger];
}

export async function getAdminMetrics(now: Date = new Date()) {
  const [users, onboardingCount, cravingEvents, analyticsEvents] = await Promise.all([
    db.user.findMany({ select: { id: true, createdAt: true } }),
    db.profile.count(),
    db.cravingEvent.findMany(),
    db.analyticsEvent.findMany({
      where: { userId: { not: null } },
      select: { userId: true, createdAt: true },
    }),
  ]);

  const completed = cravingEvents.filter(
    (event) => event.status === "COMPLETED" && event.afterScore !== null,
  );
  const knownOutcomes = completed.filter((event) => event.smoked !== null);
  const usersWithCravings = new Set(cravingEvents.map((event) => event.userId)).size;
  const reductions = completed.map(
    (event) => event.beforeScore - (event.afterScore as number),
  );

  const triggerRows = Object.values(
    cravingEvents.reduce<Record<string, CravingEvent[]>>((groups, event) => {
      (groups[event.triggerType] ??= []).push(event);
      return groups;
    }, {}),
  )
    .map((events) => {
      const triggerCompleted = events.filter(
        (event) => event.status === "COMPLETED" && event.afterScore !== null,
      );
      const triggerKnown = triggerCompleted.filter((event) => event.smoked !== null);
      return {
        trigger: events[0].triggerType.toLowerCase(),
        label: triggerLabel(events[0].triggerType),
        eventCount: events.length,
        averageBefore: average(events.map((event) => event.beforeScore)),
        averageAfter: average(
          triggerCompleted.map((event) => event.afterScore as number),
        ),
        averageReduction: average(
          triggerCompleted.map(
            (event) => event.beforeScore - (event.afterScore as number),
          ),
        ),
        noSmokeRate: percentage(
          triggerKnown.filter((event) => event.smoked === false).length,
          triggerKnown.length,
        ),
      };
    })
    .sort((left, right) => right.eventCount - left.eventCount);

  return {
    generatedAt: now.toISOString(),
    users: users.length,
    completedOnboarding: onboardingCount,
    usersWithCravings,
    totalCravingEvents: cravingEvents.length,
    interventionCompletionRate: percentage(completed.length, cravingEvents.length),
    averageBeforeScore: average(cravingEvents.map((event) => event.beforeScore)),
    averageAfterScore: average(completed.map((event) => event.afterScore as number)),
    averageReduction: average(reductions),
    noSmokeRate: percentage(
      knownOutcomes.filter((event) => event.smoked === false).length,
      knownOutcomes.length,
    ),
    d1Retention: calculateRetentionRate(users, analyticsEvents, 1, now),
    d7Retention: calculateRetentionRate(users, analyticsEvents, 7, now),
    triggerRows,
  };
}
