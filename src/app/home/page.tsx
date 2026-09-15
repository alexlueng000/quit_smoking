import Link from "next/link";
import { redirect } from "next/navigation";
import { calculateEstimatedSavings } from "@/lib/calculations/savings";
import { db } from "@/lib/db";
import { PrismaProfileRepository } from "@/server/repositories/profile-repository";
import { findCurrentUser } from "@/server/services/current-user";
import { ProfileService } from "@/server/services/profile-service";

export const dynamic = "force-dynamic";

function daysSince(date: string | null): number {
  if (!date) return 0;
  const start = new Date(`${date}T00:00:00.000Z`);
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / 86_400_000));
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19.2 13.1a7.6 7.6 0 0 0 0-2.2l2-1.55-2-3.45-2.5 1a8.4 8.4 0 0 0-1.9-1.1L14.45 3h-4.1L10 5.8a8.4 8.4 0 0 0-1.9 1.1l-2.5-1-2 3.45 2 1.55a7.6 7.6 0 0 0 0 2.2l-2 1.55 2 3.45 2.5-1a8.4 8.4 0 0 0 1.9 1.1l.35 2.8h4.1l.35-2.8a8.4 8.4 0 0 0 1.9-1.1l2.5 1 2-3.45-2-1.55Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

export default async function HomePage() {
  const user = await findCurrentUser();
  if (!user) redirect("/onboarding");

  const service = new ProfileService(new PrismaProfileRepository());
  const profile = await service.get(user.id);
  if (!profile) redirect("/onboarding");

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const trendStart = new Date(todayStart);
  trendStart.setDate(trendStart.getDate() - 6);
  const [todayCount, survivedCount, recentEvents] = await Promise.all([
    db.cravingEvent.count({ where: { userId: user.id, startedAt: { gte: todayStart } } }),
    db.cravingEvent.count({ where: { userId: user.id, status: "COMPLETED", smoked: false } }),
    db.cravingEvent.findMany({
      where: { userId: user.id, startedAt: { gte: trendStart } },
      select: { beforeScore: true, startedAt: true },
      orderBy: { startedAt: "asc" },
    }),
  ]);

  const quitDays = daysSince(profile.quitDate);
  const savings = calculateEstimatedSavings(
    profile.quitDate ? new Date(`${profile.quitDate}T00:00:00.000Z`) : null,
    now,
    profile.cigarettesPerDay,
    profile.cigarettePackPrice,
    profile.cigarettesPerPack,
  );
  const statusText = profile.quitStatus === "reducing" ? "正在慢慢减量" : profile.quitStatus === "quit" ? "已经离烟" : "准备好再出发";
  const heroNumber = profile.quitStatus === "quit" ? quitDays : profile.quitStatus === "reducing" ? survivedCount : 0;
  const heroUnit = profile.quitStatus === "quit" ? "天" : profile.quitStatus === "reducing" ? "次" : "天";
  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(trendStart);
    date.setDate(date.getDate() + index);
    const values = recentEvents.filter((event) => event.startedAt.toDateString() === date.toDateString()).map((event) => event.beforeScore);
    return {
      label: index === 6 ? "今天" : `${date.getMonth() + 1}/${date.getDate()}`,
      value: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
    };
  });
  const hasTrend = trend.some((day) => day.value > 0);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-7 sm:px-8 sm:pt-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#176b4d] text-white shadow-[0_8px_24px_rgba(23,107,77,0.18)]" aria-hidden="true">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M18.5 5.5C12.2 5.7 7.2 8.8 6 15.4m0 0c2.4-2.2 5.1-3.7 8.3-4.3M6 15.4c-.5 1.3-.6 2.4-.5 3.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[#176b4d]">戒烟伙伴</p>
            <p className="text-sm text-[#66736c]">今天也陪你稳稳地过</p>
          </div>
        </div>
        <Link aria-label="修改戒烟计划" className="grid h-11 w-11 place-items-center rounded-full text-[#66736c] hover:bg-white hover:text-[#176b4d]" href="/onboarding">
          <SettingsIcon />
        </Link>
      </header>

      <section className="home-support" aria-labelledby="support-title">
        <p className="home-eyebrow">现在想抽烟？</p>
        <h1 id="support-title">先给自己 2 分钟</h1>
        <p className="home-support-copy">不需要马上做决定，我们一起等这一阵过去。</p>
        <Link className="home-support-action" href="/craving/start">
          开始缓解烟瘾 <ArrowIcon />
        </Link>
      </section>

      <section className="home-plan" aria-label="当前计划">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">{statusText}</p>
          {profile.quitStatus !== "not_started" && <p className="mt-1 text-lg font-semibold">{profile.quitStatus === "quit" ? "已经离烟 " : "已累计撑过 "}<span className="tabular-nums">{heroNumber}</span> {heroUnit}</p>}
        </div>
        <Link className="home-plan-link" href="/onboarding">调整计划 <span aria-hidden="true">→</span></Link>
      </section>

      <section aria-label="进度概览" className="grid grid-cols-3 divide-x divide-[var(--line)] border-y border-[var(--line)] py-5">
        <div className="px-3 sm:px-5"><p className="tabular-nums text-xl font-semibold sm:text-2xl">{todayCount}</p><p className="mt-1 text-xs text-[#66736c]">今日烟瘾</p></div>
        <div className="px-3 sm:px-5"><p className="tabular-nums text-xl font-semibold sm:text-2xl">{survivedCount}</p><p className="mt-1 text-xs text-[#66736c]">累计撑过</p></div>
        <div className="px-3 sm:px-5"><p className="tabular-nums truncate text-lg font-semibold sm:text-2xl">¥{savings.toFixed(2)}</p><p className="mt-1 text-xs text-[#66736c]">预计省下</p></div>
      </section>

      <Link className="home-checkin" href="/daily-checkin">
        <span><span className="block font-semibold">记录今天</span><span className="mt-0.5 block text-sm text-[var(--muted)]">简单回顾吸烟情况</span></span>
        <span aria-hidden="true" className="text-xl text-[var(--brand)]">＋</span>
      </Link>

      <section className="mt-6 border-t border-[var(--line)] pt-6">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="text-lg font-semibold">最近 7 天</h2><p className="mt-0.5 text-xs text-[#66736c]">烟瘾平均强度 · 0–10</p></div>
          <span className="rounded-full bg-[#dfeee6] px-3 py-1 text-xs font-medium text-[#176b4d]">趋势</span>
        </div>
        {hasTrend ? (
          <div className="mt-7 flex h-32 items-end justify-between gap-2 border-b border-[#dfe6df]" aria-label="最近七天烟瘾趋势">
            {trend.map((day, index) => (
              <div className="flex h-full flex-1 flex-col items-center justify-end gap-2" key={day.label} title={`${day.label}: ${day.value.toFixed(1)}`}>
                <span className="tabular-nums text-[10px] text-[#66736c]">{day.value ? day.value.toFixed(1) : ""}</span>
                <div className={`w-full max-w-8 rounded-t-lg ${index === 6 ? "bg-[#176b4d]" : day.value ? "bg-[#9bc5ae]" : "bg-[#e8ede9]"}`} style={{ height: day.value ? `${Math.max(10, day.value * 8)}px` : "3px" }} />
                <span className={`whitespace-nowrap pb-2 text-[10px] ${index === 6 ? "font-semibold text-[#176b4d]" : "text-[#879189]"}`}>{day.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 flex min-h-28 items-center justify-center rounded-2xl bg-[#f4f7f3] px-5 text-center text-sm leading-6 text-[#66736c]">记录一次烟瘾后，变化会在这里慢慢出现。</div>
        )}
      </section>

      <Link className="mt-3 block min-h-11 px-5 py-3 text-center text-sm font-medium text-[#66736c] hover:text-[#176b4d]" href="/settings">数据与隐私</Link>
    </main>
  );
}
