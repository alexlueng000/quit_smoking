import type { AIProvider } from "@/lib/ai/provider";
import type { InterventionInput, InterventionOutput } from "@/lib/ai/schema";
import { selectStrategies, type TriggerType } from "@/lib/ai/strategies";

const content: Record<InterventionOutput["strategy"], Omit<InterventionOutput, "strategy">> = {
  breathing: {
    phase: "intervention",
    message: "先不决定抽不抽。用鼻子慢慢吸气 4 秒，再缓缓呼气 6 秒。",
    action: { type: "breathing", duration_seconds: 90 },
    should_ask_followup: true,
    followup_question: "做完这一轮后，身体哪里稍微松了一点？",
  },
  delay_decision: {
    phase: "intervention",
    message: "把决定推迟 2 分钟。现在不用说永远不抽，只等这股烟瘾过去一点。",
    action: { type: "delay", duration_seconds: 120 },
    should_ask_followup: true,
    followup_question: "这两分钟里，你能先离开香烟或打火机吗？",
  },
  urge_surfing: {
    phase: "intervention",
    message: "把烟瘾当作一阵浪：不压住它，只观察它升起、停留，再慢慢回落。",
    action: { type: "urge_surfing", duration_seconds: 90 },
    should_ask_followup: true,
    followup_question: "现在最明显的感觉在嘴、手，还是胸口？",
  },
  behavior_replacement: {
    phase: "intervention",
    message: "现在起身喝几口水，或者嚼一颗无糖口香糖，让手和嘴先换个动作。",
    action: { type: "behavior_switch", duration_seconds: 60 },
    should_ask_followup: true,
    followup_question: "你现在能做哪一个替代动作？",
  },
  grounding: {
    phase: "intervention",
    message: "看一看周围，依次说出你看到的 3 样东西，让注意力回到此刻。",
    action: { type: "grounding", duration_seconds: 60 },
    should_ask_followup: true,
    followup_question: "你刚刚看到的第一样东西是什么？",
  },
  refusal_rehearsal: {
    phase: "intervention",
    message: "先练一句：谢谢，我最近不抽。说完就把话题转到别处。",
    action: { type: "refusal_rehearsal", duration_seconds: 30 },
    should_ask_followup: true,
    followup_question: "这句话符合你的语气吗？",
  },
  cognitive_reframe: {
    phase: "intervention",
    message: "烟瘾是一种短暂感觉，不是一条必须执行的命令。先观察它一分钟。",
    action: { type: "conversation" },
    should_ask_followup: true,
    followup_question: "如果暂时不行动，这股感觉会怎样变化？",
  },
  relapse_review: {
    phase: "intervention",
    message: "这次记录不是失败。先找出点烟前最后一个触发点，给下次留一个出口。",
    action: { type: "conversation" },
    should_ask_followup: true,
    followup_question: "点烟前最后发生了什么？",
  },
};

export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async generateIntervention(input: InterventionInput): Promise<InterventionOutput> {
    const strategies = selectStrategies(
      input.currentCraving.trigger as TriggerType,
      input.currentCraving.beforeScore,
    );
    const stepIndex = input.conversation.filter((message) => message.role === "assistant").length;
    const strategy = strategies[stepIndex % strategies.length];
    return { strategy, ...content[strategy] };
  }
}
