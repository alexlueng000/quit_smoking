import Link from "next/link";
import { DataDeletionButton } from "@/components/data-deletion-button";

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <Link className="text-sm font-medium text-slate-500" href="/home">← 返回</Link>
      <header className="mb-7 mt-5"><h1 className="text-3xl font-bold">数据与隐私</h1></header>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-bold">隐私说明</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">了解产品收集哪些数据、AI 如何处理内容以及数据保存原则。</p>
        <Link className="mt-4 inline-block font-semibold text-emerald-800" href="/privacy">查看隐私说明 →</Link>
      </section>
      <section className="mt-6 rounded-2xl bg-red-50 p-5 ring-1 ring-red-200">
        <h2 className="font-bold text-red-900">删除数据</h2>
        <p className="my-3 text-sm leading-6 text-red-800">此操作不可撤销，会删除当前匿名身份关联的全部记录。</p>
        <DataDeletionButton />
      </section>
    </main>
  );
}
