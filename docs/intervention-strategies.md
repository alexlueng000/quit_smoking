# v0.1 干预策略与降级规则

本文只描述 v0.1 已实现的即时干预策略，不构成医疗建议或诊疗方案。

## 策略选择

```text
before score >= 8        -> urge surfing + delay decision
stress / negative mood   -> breathing + grounding
after meal / habit       -> behavior replacement + delay decision
social                   -> refusal rehearsal
alcohol                  -> delay decision
boredom                  -> behavior replacement
other                    -> delay decision
```

规则先确定允许使用的策略集合，外部模型只能在该集合中选择。选择集合外策略、非法 JSON 或不符合输出 Schema 都视为 Provider 失败。

## 输出限制

- 一次只提供一个行动。
- 中文正文最多 80 个 Unicode 字符。
- 英文正文最多 60 个单词。
- 非 conversation 行动必须提供 10–300 秒持续时间。
- 声明需要追问时必须提供追问内容。
- 最近历史最多 5 条，对话最多 10 条。
- 发给模型前移除常见手机号和邮箱。

## 本地 fallback

外部 Provider 在 2.5 秒内未完成，或者发生网络、配置、解析、Schema、策略错误时，使用以下预制方案：

1. `strong_craving`：烟瘾冲浪、延迟决定。
2. `stress`：呼吸、感官定位。
3. `social`：拒烟演练、离开递烟位置。
4. `after_meal`：漱口或喝水、离开固定位置。
5. `boredom`：行为替代、两分钟小任务。

fallback 仍写入 `intervention_steps`，其中 `model_provider=local_fallback`，方便后续统计实际降级率。

## 安全拦截

当本次上下文或用户回复包含明显医疗急症或自伤风险表达时：

- 不调用外部模型；
- 停止普通戒烟 coaching；
- 提示立即联系当地急救、危机支持或可信任的人；
- 记录 `model_provider=safety_rules`。

安全规则只做最低限度风险分流，不进行诊断。
