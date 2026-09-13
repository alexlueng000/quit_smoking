"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="zh-CN">
      <body>
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12 text-center">
          <h1 className="text-2xl font-bold">刚刚出了点问题</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">你的记录不会因为这个页面而被清零。可以先重试一次。</p>
          <button className="mt-6 rounded-2xl bg-emerald-800 px-5 py-4 font-bold text-white" onClick={reset} type="button">重试</button>
        </main>
      </body>
    </html>
  );
}
