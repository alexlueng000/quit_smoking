"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Outcome = "not_smoked" | "smoked" | "unknown";

export function CravingResultForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [beforeScore, setBeforeScore] = useState<number | null>(null);
  const [afterScore, setAfterScore] = useState(5);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/cravings/${eventId}`);
        const data = (await response.json()) as { event?: { beforeScore: number; status: string; afterScore: number | null }; error?: string };
        if (!response.ok || !data.event) throw new Error(data.error ?? "无法读取记录");
        setBeforeScore(data.event.beforeScore);
        setAfterScore(data.event.afterScore ?? Math.max(0, data.event.beforeScore - 2));
        if (data.event.status === "completed") setCompleted(true);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "无法读取记录");
      }
    }
    void load();
  }, [eventId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!outcome) {
      setError("请选择这次最终是否吸烟");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/cravings/${eventId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ afterScore, outcome, feedback: feedback || null }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "保存失败，请稍后重试");
      setCompleted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <section className="rounded-3xl bg-white p-7 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-800">✓</div>
        <h2 className="mt-5 text-2xl font-bold">这次记录完成了</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">无论结果怎样，这条真实记录都会帮助下一次支持更贴合你。</p>
        <button className="mt-7 w-full rounded-2xl bg-emerald-800 px-5 py-4 font-bold text-white" type="button" onClick={() => router.push("/home")}>返回首页</button>
      </section>
    );
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-end justify-between">
          <div><p className="font-semibold">现在烟瘾几分？</p><p className="mt-1 text-xs text-slate-500">开始时：{beforeScore ?? "—"} 分</p></div>
          <output className="text-5xl font-bold text-emerald-800">{afterScore}</output>
        </div>
        <input className="mt-7 w-full accent-emerald-800" type="range" min="0" max="10" step="1" value={afterScore} onChange={(event) => setAfterScore(Number(event.target.value))} aria-label="干预后烟瘾评分" />
        <div className="mt-1 flex justify-between text-xs text-slate-400"><span>0</span><span>10</span></div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-bold">这次最终怎么样？</h2>
        <div className="mt-4 space-y-3">
          {([
            ["not_smoked", "我没有抽"],
            ["smoked", "我还是抽了"],
            ["unknown", "还不知道"],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={outcome === value} onClick={() => setOutcome(value)} className={`w-full rounded-xl border px-4 py-3 text-left font-medium ${outcome === value ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-slate-300"}`}>{label}</button>
          ))}
        </div>
      </section>

      {outcome && (
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <label className="font-semibold" htmlFor="feedback">{outcome === "not_smoked" ? "刚才什么最有帮助？" : outcome === "smoked" ? "没关系。最后促使你点烟的是什么？" : "你现在还需要什么？"}</label>
          <textarea id="feedback" className="mt-3 min-h-20 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-[var(--ink)] outline-none focus:border-emerald-600" maxLength={300} value={feedback} onChange={(event) => setFeedback(event.target.value)} />
        </section>
      )}

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      <button className="w-full rounded-2xl bg-emerald-800 px-5 py-4 text-lg font-bold text-white disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? "正在保存…" : "完成记录"}</button>
    </form>
  );
}
