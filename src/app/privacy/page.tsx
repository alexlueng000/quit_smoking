import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10">
      <Link className="text-sm font-medium text-emerald-800" href="/home">← 返回产品</Link>
      <h1 className="mt-6 text-3xl font-bold">隐私说明</h1>
      <p className="mt-2 text-sm text-slate-500">更新日期：2026-08-22</p>
      <div className="mt-8 space-y-7 text-sm leading-7 text-slate-700">
        <section><h2 className="text-lg font-bold text-slate-900">我们收集什么</h2><p className="mt-2">匿名设备标识、吸烟与戒烟画像、烟瘾触发场景、前后评分、干预回复、是否吸烟、每日吸烟数量及基础产品使用事件。邮箱不是 v0.1 的必填项。</p></section>
        <section><h2 className="text-lg font-bold text-slate-900">为什么收集</h2><p className="mt-2">用于提供当下的结构化戒烟支持、恢复使用进度，并评估用户是否愿意在烟瘾发作时使用产品及烟瘾评分是否变化。</p></section>
        <section><h2 className="text-lg font-bold text-slate-900">AI 数据处理</h2><p className="mt-2">配置外部 AI Provider 时，当前烟瘾上下文和有限的近期历史可能由该供应商处理。发送前会尝试移除手机号和邮箱，不保存模型隐藏推理。使用本地 mock 或 fallback 时不会向外部模型发送内容。</p></section>
        <section><h2 className="text-lg font-bold text-slate-900">保存与删除</h2><p className="mt-2">测试期数据仅保存到完成 MVP 验证所需的期限。用户可通过产品的数据删除功能删除档案、烟瘾事件、干预步骤和每日记录。</p></section>
        <section><h2 className="text-lg font-bold text-slate-900">健康声明</h2><p className="mt-2">本产品提供行为改变支持，不用于诊断或治疗，不能替代医生。出现胸痛、呼吸困难或其他严重不适时，请立即联系当地急救或专业医疗机构。</p></section>
      </div>
    </main>
  );
}
