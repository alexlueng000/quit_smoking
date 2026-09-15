"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { TriggerType } from "@/lib/ai/strategies";

const triggerOptions: Array<{ value: TriggerType; label: string }> = [
  { value: "stress", label: "压力" },
  { value: "after_meal", label: "饭后" },
  { value: "alcohol", label: "喝酒" },
  { value: "social", label: "社交" },
  { value: "boredom", label: "无聊" },
  { value: "habit", label: "习惯性想抽" },
  { value: "negative_mood", label: "情绪不好" },
  { value: "other", label: "其他" },
];

export function CravingStartForm() {
  const router = useRouter();
  const [score, setScore] = useState(7);
  const [trigger, setTrigger] = useState<TriggerType | null>(null);
  const [context, setContext] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!trigger) {
      setError("请选择最接近的触发场景");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/cravings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beforeScore: score, triggerType: trigger, contextText: context || null }),
      });
      const data = (await response.json()) as { event?: { id: string }; error?: string };
      if (!response.ok || !data.event) throw new Error(data.error ?? "记录失败，请稍后重试");
      router.push(`/craving/${data.event.id}/intervention`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "记录失败，请稍后重试");
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-7" onSubmit={submit}>
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">现在有多想抽烟？</p>
            <p className="mt-1 text-xs text-slate-500">0 是完全不想，10 是非常强烈</p>
          </div>
          <output className="text-5xl font-bold text-emerald-800">{score}</output>
        </div>
        <input className="mt-7 w-full accent-emerald-800" type="range" min="0" max="10" step="1" value={score} onChange={(event) => setScore(Number(event.target.value))} aria-label="烟瘾评分" />
        <div className="mt-1 flex justify-between text-xs text-slate-400"><span>0</span><span>10</span></div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-bold">刚才是什么触发了烟瘾？</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {triggerOptions.map((option) => (
            <button key={option.value} type="button" aria-pressed={trigger === option.value} onClick={() => setTrigger(option.value)} className={`rounded-xl border px-4 py-3 text-sm font-medium ${trigger === option.value ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-slate-300 bg-white text-slate-700"}`}>
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <label className="text-sm font-semibold" htmlFor="context">刚才发生了什么？<span className="ml-2 font-normal text-slate-400">可不填</span></label>
        <textarea id="context" className="mt-3 min-h-24 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-[var(--ink)] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" maxLength={300} value={context} onChange={(event) => setContext(event.target.value)} placeholder="例如：刚开完一个很不顺利的会议" />
        <p className="mt-1 text-right text-xs text-slate-400">{context.length}/300</p>
      </section>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      <button className="w-full rounded-2xl bg-emerald-800 px-5 py-4 text-lg font-bold text-white disabled:opacity-60" disabled={submitting} type="submit">{submitting ? "正在开始…" : "开始 2 分钟支持"}</button>
    </form>
  );
}
