import Link from "next/link";
import { DailyCheckinForm } from "@/components/daily-checkin-form";

export default function DailyCheckinPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <Link className="text-sm font-medium text-slate-500" href="/home">← 返回</Link>
      <header className="mb-7 mt-5">
        <p className="text-sm font-semibold text-emerald-700">每天最多一条，可随时更新</p>
        <h1 className="mt-2 text-3xl font-bold">今日打卡</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">记录真实情况，帮助我们看到 24 小时层面的变化。</p>
      </header>
      <DailyCheckinForm />
    </main>
  );
}
