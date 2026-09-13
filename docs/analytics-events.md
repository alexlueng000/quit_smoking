# v0.1 埋点与指标定义

## 核心事件

```text
onboarding_completed
craving_created
craving_score_before_submitted
craving_trigger_submitted
intervention_started
intervention_step_completed
intervention_completed
craving_score_after_submitted
craving_result_smoked
craving_result_not_smoked
daily_checkin_completed
```

干预事件的 `properties_json` 包含适用的：

```text
craving_event_id
trigger
before_score
after_score
strategy
step_index
duration_seconds
delivery
```

`delivery` 取值为 `ai`、`fallback` 或 `safety`。

## 管理指标

- **Users**：`users` 总数。
- **Completed onboarding**：存在 `profiles` 的用户数。
- **Users with ≥1 craving**：至少有一条 `craving_events` 的去重用户数。
- **Intervention completion rate**：包含后置评分的 completed craving events / 全部 craving events。
- **Average before**：全部 craving events 的平均前置评分。
- **Average after**：有后置评分的 completed craving events 平均后置评分。
- **Average reduction**：逐事件计算 `before_score - after_score` 后取平均。
- **No-smoke self-report rate**：`smoked=false` / 所有已明确报告 smoked true 或 false 的完成事件。
- **D1 / D7 retention**：用户创建后第 1/7 个 24 小时窗口内产生至少一个埋点事件的用户比例；观察窗口尚未完整的用户不进入分母。

这些指标用于 MVP 行为验证，不代表临床疗效。

## 数据质量规则

- 同一用户同一天只有一条 `daily_logs`；更新打卡不重复写入 completed 埋点。
- `unknown` 结果不计入 smoked/no-smoke 分母。
- Trigger 表按事件数降序排列。
- 无有效分母时页面显示 `—`，不显示误导性的 `0.00%`。
