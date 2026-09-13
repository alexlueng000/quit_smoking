import { getAdminMetrics } from "@/server/services/metrics-service";

export const dynamic = "force-dynamic";

function number(value: number | null, digits = 2): string {
  return value === null ? "—" : value.toFixed(digits);
}

function percent(value: number | null): string {
  return value === null ? "—" : `${(value * 100).toFixed(2)}%`;
}

export default async function MetricsPage() {
  const metrics = await getAdminMetrics();
  const cards = [
    ["Users", metrics.users.toLocaleString("zh-CN")],
    ["Completed onboarding", metrics.completedOnboarding.toLocaleString("zh-CN")],
    ["Users with ≥1 craving", metrics.usersWithCravings.toLocaleString("zh-CN")],
    ["Total craving events", metrics.totalCravingEvents.toLocaleString("zh-CN")],
    ["Intervention completion", percent(metrics.interventionCompletionRate)],
    ["Average before", number(metrics.averageBeforeScore)],
    ["Average after", number(metrics.averageAfterScore)],
    ["Average reduction", number(metrics.averageReduction)],
    ["No-smoke self-report", percent(metrics.noSmokeRate)],
    ["D1 retention", percent(metrics.d1Retention)],
    ["D7 retention", percent(metrics.d7Retention)],
  ];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">v0.1 validation</p>
        <h1 className="mt-2 text-3xl font-bold">MVP Metrics</h1>
        <p className="mt-2 text-sm text-slate-500">更新于 {metrics.generatedAt.slice(0, 19).replace("T", " ")} UTC</p>
      </header>

      <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" key={label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="px-5 py-4"><h2 className="text-lg font-bold">Trigger performance</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                {['Trigger', 'Events', 'Avg Before', 'Avg After', 'Avg Reduction', 'No-Smoke %'].map((heading) => (
                  <th className="whitespace-nowrap px-5 py-3 font-bold" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.triggerRows.map((row) => (
                <tr className="border-t border-slate-200" key={row.trigger}>
                  <td className="px-5 py-3 font-semibold">{row.label}</td>
                  <td className="px-5 py-3 tabular-nums">{row.eventCount.toLocaleString("zh-CN")}</td>
                  <td className="px-5 py-3 tabular-nums">{number(row.averageBefore)}</td>
                  <td className="px-5 py-3 tabular-nums">{number(row.averageAfter)}</td>
                  <td className="px-5 py-3 tabular-nums">{number(row.averageReduction)}</td>
                  <td className="px-5 py-3 tabular-nums">{percent(row.noSmokeRate)}</td>
                </tr>
              ))}
              {metrics.triggerRows.length === 0 && (
                <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={6}>暂无烟瘾事件</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-6 rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        <h2 className="font-bold">指标说明</h2>
        <p className="mt-1">留存以用户创建后的第 1/7 个 24 小时窗口内是否产生任一埋点事件计算；没有完整观察窗口的用户不进入分母。这些数据仅用于 MVP 行为验证，不代表临床疗效。</p>
      </section>
    </main>
  );
}
