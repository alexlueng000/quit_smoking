"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

function localDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function DailyCheckinForm() {
  const router = useRouter();
  const [date] = useState(localDate);
  const [cigarettesSmoked, setCigarettesSmoked] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/daily-log/${date}`);
        const data = (await response.json()) as {
          log?: { cigarettesSmoked: number; notes: string | null } | null;
          error?: string;
        };
        if (!response.ok) throw new Error(data.error ?? "无法读取今日记录");
        if (data.log) {
          setCigarettesSmoked(data.log.cigarettesSmoked);
          setNotes(data.log.notes ?? "");
          setSaved(true);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "无法读取今日记录");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [date]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/daily-log/${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cigarettesSmoked, notes: notes || null }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "保存失败，请稍后重试");
      setSaved(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">正在读取今日记录…</p>;

  return (
    <form className="space-y-6" onSubmit={submit}>
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <label className="font-bold" htmlFor="cigarettes">今天一共抽了多少支？</label>
            <p className="mt-1 text-xs text-slate-500">如实记录即可，不评判，也不会清零。</p>
          </div>
          <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">必填</span>
        </div>
        <input id="cigarettes" className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-4 text-3xl font-bold text-[var(--ink)] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" type="number" min="0" max="200" required value={cigarettesSmoked} onChange={(event) => setCigarettesSmoked(Number(event.target.value))} />
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <label className="font-bold" htmlFor="notes">今天最难的一次是什么时候？</label>
        <span className="ml-2 text-xs text-slate-400">可不填</span>
        <textarea id="notes" className="mt-4 min-h-28 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-[var(--ink)] outline-none focus:border-emerald-600" maxLength={500} placeholder="例如：晚饭后和朋友聊天时" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <p className="mt-1 text-right text-xs text-slate-400">{notes.length}/500</p>
      </section>

      {saved && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">今天的记录已保存，再次提交会更新同一条记录。</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      <button className="w-full rounded-2xl bg-emerald-800 px-5 py-4 text-lg font-bold text-white disabled:opacity-60" disabled={submitting} type="submit">{submitting ? "正在保存…" : saved ? "更新今日记录" : "完成今日打卡"}</button>
      {saved && <button className="w-full px-5 py-2 text-sm font-semibold text-emerald-800" type="button" onClick={() => router.push("/home")}>返回首页</button>}
    </form>
  );
}
