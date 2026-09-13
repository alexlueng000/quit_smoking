import { CravingResultForm } from "@/components/craving/craving-result-form";

export default async function CravingResultPage({ params }: { params: Promise<{ eventId: string }> }) {
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <header className="mb-7">
        <p className="text-sm font-semibold text-emerald-700">看看刚才发生了什么变化</p>
        <h1 className="mt-2 text-3xl font-bold">完成这次记录</h1>
      </header>
      <CravingResultForm eventId={(await params).eventId} />
    </main>
  );
}
