"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Intervention = {
  strategy: string;
  message: string;
  action: { type: string; duration_seconds?: number };
  should_ask_followup: boolean;
  followup_question: string | null;
};

export function InterventionSession({ eventId }: { eventId: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestStep = useCallback(async (index: number, message: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cravings/${eventId}/intervention`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepIndex: index, userMessage: message }),
      });
      const data = (await response.json()) as { intervention?: Intervention; error?: string };
      if (!response.ok || !data.intervention) throw new Error(data.error ?? "暂时无法继续，请稍后重试");
      setIntervention(data.intervention);
      setRemaining(data.intervention.action.duration_seconds ?? null);
      setStepIndex(index + 1);
      setUserMessage("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "暂时无法继续，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void requestStep(0, null);
  }, [requestStep]);

  useEffect(() => {
    if (remaining === null || remaining <= 0) return;
    const timer = window.setInterval(() => setRemaining((value) => value === null ? null : Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [remaining]);

  if (loading && !intervention) {
    return <div className="py-24 text-center"><div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-emerald-200" /><p className="mt-5 text-sm text-slate-500">正在为你准备一个短步骤…</p></div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-emerald-900 p-6 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">步骤 {Math.max(1, stepIndex)} / 5</p>
        <p className="mt-5 text-xl font-semibold leading-8">{intervention?.message}</p>
        {remaining !== null && (
          <div className="mt-7 rounded-2xl bg-white/10 p-5 text-center">
            <p className="text-5xl font-bold tabular-nums">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</p>
            <p className="mt-2 text-xs text-emerald-100">跟着步骤慢慢来</p>
          </div>
        )}
      </section>

      {intervention?.followup_question && stepIndex < 5 && (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <label className="font-semibold" htmlFor="reply">{intervention.followup_question}</label>
          <textarea id="reply" className="mt-3 min-h-20 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-[var(--ink)] outline-none focus:border-emerald-600" maxLength={300} value={userMessage} onChange={(event) => setUserMessage(event.target.value)} />
          <button className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50" type="button" disabled={loading} onClick={() => void requestStep(stepIndex, userMessage || null)}>{loading ? "正在回应…" : "继续"}</button>
        </section>
      )}

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert"><p>{error}</p><button className="mt-2 font-bold underline" type="button" onClick={() => void requestStep(stepIndex, userMessage || null)}>重试</button></div>}

      <button className="w-full rounded-2xl border border-emerald-800 px-5 py-4 font-bold text-emerald-900" type="button" onClick={() => router.push(`/craving/${eventId}/result`)}>结束干预并评分</button>
      <p className="text-center text-xs leading-5 text-slate-500">你随时可以结束。不需要一次解决所有问题。</p>
    </div>
  );
}
