import Link from "next/link";
import { CravingStartForm } from "@/components/craving/craving-start-form";

export default function CravingStartPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <Link className="text-sm font-medium text-slate-500" href="/home">← 返回</Link>
      <header className="mb-7 mt-5">
        <p className="text-sm font-semibold text-emerald-700">先停一下，我们一起处理</p>
        <h1 className="mt-2 text-3xl font-bold">记录这次烟瘾</h1>
      </header>
      <CravingStartForm />
    </main>
  );
}
