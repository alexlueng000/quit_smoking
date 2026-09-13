import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default function OnboardingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-8 sm:px-6">
      <header className="mb-7">
        <p className="text-sm font-semibold text-emerald-700">大约 3 分钟</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">先了解一下你</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">这些信息会帮助我们在烟瘾发作时给出更贴合的短时支持。</p>
      </header>
      <OnboardingForm />
    </main>
  );
}
