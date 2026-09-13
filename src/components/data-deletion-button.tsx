"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DataDeletionButton() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteData() {
    const confirmed = window.confirm(
      "确定删除全部数据吗？档案、烟瘾记录、干预步骤和每日记录都将永久删除。",
    );
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch("/api/profile", { method: "DELETE" });
      if (!response.ok) throw new Error("删除失败，请稍后重试");
      router.push("/onboarding");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败，请稍后重试");
      setDeleting(false);
    }
  }

  return (
    <div>
      <button className="w-full rounded-xl border border-red-300 px-4 py-3 font-semibold text-red-700 disabled:opacity-60" disabled={deleting} onClick={deleteData} type="button">
        {deleting ? "正在删除…" : "删除我的全部数据"}
      </button>
      {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );
}
