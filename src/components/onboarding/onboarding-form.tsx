"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/form-field";
import type { TriggerType } from "@/lib/ai/strategies";
import type { ProfileInput } from "@/lib/validation/profile";

const DRAFT_KEY = "quit-smoking:onboarding-draft:v1";

const triggerOptions: Array<{ value: TriggerType; label: string }> = [
  { value: "stress", label: "工作或情绪压力" },
  { value: "after_meal", label: "饭后" },
  { value: "alcohol", label: "饮酒" },
  { value: "social", label: "社交或别人递烟" },
  { value: "boredom", label: "无聊" },
  { value: "habit", label: "习惯性动作或固定时间" },
  { value: "negative_mood", label: "生气、低落或焦虑" },
  { value: "other", label: "其他" },
];

const initialForm: ProfileInput = {
  cigarettesPerDay: 10,
  smokingYears: 1,
  minutesToFirstCigarette: 60,
  quitAttempts: 0,
  motivation: "",
  quitStatus: "not_started",
  quitDate: null,
  currency: "CNY",
  cigarettePackPrice: null,
  cigarettesPerPack: 20,
  triggers: [],
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-blue-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function OnboardingForm() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileInput>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          if (active) setForm({ ...initialForm, ...JSON.parse(draft) });
        } catch {
          localStorage.removeItem(DRAFT_KEY);
        }
      }

      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = (await response.json()) as { profile: ProfileInput | null };
          if (active && data.profile) setForm({ ...initialForm, ...data.profile });
        }
      } catch {
        // The local draft remains available when the network is temporarily unavailable.
      } finally {
        if (active) setLoading(false);
      }
    }
    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loading) localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form, loading]);

  function setNumber(field: keyof ProfileInput, rawValue: string) {
    setForm((current) => ({ ...current, [field]: Number(rawValue) }));
  }

  function toggleTrigger(trigger: TriggerType) {
    setError(null);
    setForm((current) => {
      if (current.triggers.includes(trigger)) {
        return { ...current, triggers: current.triggers.filter((item) => item !== trigger) };
      }
      if (current.triggers.length >= 3) {
        setError("最多选择 3 个常见触发场景");
        return current;
      }
      return { ...current, triggers: [...current.triggers, trigger] };
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (form.triggers.length === 0) {
      setError("请至少选择一个常见触发场景");
      return;
    }

    setSubmitting(true);
    try {
      const existing = await fetch("/api/profile");
      const existingData = existing.ok
        ? ((await existing.json()) as { profile: ProfileInput | null })
        : { profile: null };
      const response = await fetch("/api/profile", {
        method: existingData.profile ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "保存失败，请稍后重试");
      localStorage.removeItem(DRAFT_KEY);
      router.push("/home");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-slate-500">正在恢复你的填写进度…</p>;
  }

  return (
    <form className="space-y-7" onSubmit={submit}>
      <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold">你的吸烟情况</h2>
        <FormField label="每天大约抽多少支？" required>
          <input className={inputClass} type="number" min="0" max="200" required value={form.cigarettesPerDay} onChange={(event) => setNumber("cigarettesPerDay", event.target.value)} />
        </FormField>
        <FormField label="吸烟多少年？" required>
          <input className={inputClass} type="number" min="0" max="100" required value={form.smokingYears} onChange={(event) => setNumber("smokingYears", event.target.value)} />
        </FormField>
        <FormField label="起床后多久会抽第一支烟？" hint="填写分钟数，例如 30" required>
          <input className={inputClass} type="number" min="0" max="1440" required value={form.minutesToFirstCigarette} onChange={(event) => setNumber("minutesToFirstCigarette", event.target.value)} />
        </FormField>
        <FormField label="过去认真戒过几次？" required>
          <input className={inputClass} type="number" min="0" max="100" required value={form.quitAttempts} onChange={(event) => setNumber("quitAttempts", event.target.value)} />
        </FormField>
      </section>

      <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div>
          <h2 className="text-lg font-bold">什么时候最想抽？</h2>
          <p className="mt-1 text-sm text-slate-500">请选择 1–3 个最常见的场景。</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {triggerOptions.map((option) => {
            const selected = form.triggers.includes(option.value);
            return (
              <button
                className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${selected ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-slate-300 bg-white text-slate-700"}`}
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleTrigger(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <FormField label="你最想戒烟的原因是什么？" required>
          <textarea className={`${inputClass} min-h-24 resize-y`} maxLength={300} required value={form.motivation} onChange={(event) => setForm((current) => ({ ...current, motivation: event.target.value }))} />
        </FormField>
      </section>

      <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold">你的戒烟计划</h2>
        <FormField label="当前状态" required>
          <select className={inputClass} value={form.quitStatus} onChange={(event) => setForm((current) => ({ ...current, quitStatus: event.target.value as ProfileInput["quitStatus"] }))}>
            <option value="not_started">还没开始戒</option>
            <option value="reducing">正在减量</option>
            <option value="quit">已经戒了</option>
          </select>
        </FormField>
        <FormField label="计划戒烟日期" hint="可以稍后再决定">
          <input className={inputClass} type="date" value={form.quitDate ?? ""} onChange={(event) => setForm((current) => ({ ...current, quitDate: event.target.value || null }))} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="每包价格">
            <input className={inputClass} type="number" min="0" step="0.01" value={form.cigarettePackPrice ?? ""} onChange={(event) => setForm((current) => ({ ...current, cigarettePackPrice: event.target.value ? Number(event.target.value) : null }))} />
          </FormField>
          <FormField label="每包支数">
            <input className={inputClass} type="number" min="1" max="200" value={form.cigarettesPerPack} onChange={(event) => setNumber("cigarettesPerPack", event.target.value)} />
          </FormField>
        </div>
      </section>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

      <button className="w-full rounded-2xl bg-emerald-800 px-5 py-4 text-base font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={submitting}>
        {submitting ? "正在保存…" : "保存并开始"}
      </button>
      <p className="text-center text-xs leading-5 text-slate-500">填写内容会保存在当前设备，退出后可以继续。</p>
    </form>
  );
}
