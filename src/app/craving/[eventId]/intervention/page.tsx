import { InterventionSession } from "@/components/craving/intervention-session";

export default async function InterventionPage({ params }: { params: Promise<{ eventId: string }> }) {
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <header className="mb-7">
        <p className="text-sm font-semibold text-emerald-700">只处理眼前这一阵</p>
        <h1 className="mt-2 text-3xl font-bold">跟我做一个短步骤</h1>
      </header>
      <InterventionSession eventId={(await params).eventId} />
    </main>
  );
}
