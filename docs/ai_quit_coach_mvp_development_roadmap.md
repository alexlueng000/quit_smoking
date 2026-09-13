# AI 戒烟教练 MVP 开发与上线路线图 v0.1

**目标版本：** Weekend MVP / v0.1-beta
**产品定位：** 当用户烟瘾发作时，提供 2–5 分钟即时、个性化、结构化的戒烟支持。
**核心验证问题：** 用户烟瘾发作时会不会主动打开产品？完成干预后，主观烟瘾强度是否明显下降？
**目标上线形态：** Mobile Web（H5）优先；微信小程序与原生 App 后置。
**开发原则：** 两天完成核心闭环；上线即冻结功能；下一阶段转向真实用户验证。

---

## 0. 本文档的边界

本路线图基于现有《AI戒烟教练「戒烟伙伴」产品蓝图》中以下核心方向收敛而来：

- 保留“烟瘾发作的那几分钟才是戒烟成败的关键战场”的产品洞察；
- AI 教练是核心，但第一版不做通用聊天机器人，而做结构化干预；
- 数据价值不是聊天记录本身，而是“触发场景 → 干预策略 → 前后烟瘾变化 → 是否吸烟”的结果链；
- 健康恢复、省钱、课程、社区、搭子、家人监督、预测引擎等均属于后续层，不进入 v0.1 核心范围。

本文档是**开发执行规范**，不是完整商业计划书，也不是医疗诊疗方案。

---

# 1. 产品目标与非目标

## 1.1 v0.1 唯一目标

验证以下闭环是否成立：

```text
用户产生烟瘾
→ 主动打开产品
→ 记录当前烟瘾强度
→ 选择触发场景
→ 接受 2–5 分钟 AI 干预
→ 再次记录烟瘾强度
→ 记录最终是否吸烟
→ 系统沉淀干预结果
```

如果这个闭环不成立，不继续堆功能。

## 1.2 v0.1 成功标准

第一批 20–30 名真实戒烟用户，连续测试 7 天。优先观察：

- Onboarding 完成率 ≥ 70%
- 有真实烟瘾事件的用户中，主动打开产品比例 ≥ 30%
- Intervention 完成率 ≥ 60%
- 完成干预事件的平均 craving score 下降 ≥ 2 分
- Day 7 留存 ≥ 30%
- 至少出现若干自然语言反馈：“本来准备抽，使用后撑过去了”

这些都是**验证阈值，不是临床疗效结论**。

## 1.3 明确不做

v0.1 禁止加入：

- 完整 21 天 CBT 课程系统
- 戒烟搭子 / 社区
- 家人监督
- 押金对赌
- 排行榜 / 积分商城
- 高危时段预测模型
- 复杂 Agent / 多智能体
- 向量数据库
- RAG 知识库（除非基础 Prompt 明显不够）
- Fine-tuning
- 原生 App
- 微信支付
- 订阅会员
- B 端后台
- 医疗机构导流
- NRT 商品推荐
- 复杂健康恢复时间轴
- AI 语音
- 多语言自动切换
- 任何“保证戒烟成功率”的功能或文案

---

# 2. 用户与使用场景

## 2.1 第一批目标用户

优先招募：

- 当前仍在吸烟；
- 日均最好 ≥ 10 支；
- 明确有戒烟 / 减烟意愿；
- 曾经尝试戒烟但失败；
- 愿意连续使用 7 天；
- 愿意记录真实烟瘾事件和结果。

## 2.2 核心场景

第一版只覆盖以下 Trigger：

```text
stress          工作/情绪压力
after_meal      饭后
alcohol         饮酒
social          社交/别人递烟
boredom         无聊
habit           习惯性动作/固定时间
negative_mood   生气/低落/焦虑
other           其他
```

## 2.3 关键产品瞬间

用户不需要“逛”这个产品。

首页的绝对主按钮：

**「我现在想抽烟」 / “I want to smoke”**

产品价值必须在点击后的 2–5 分钟内兑现。

---

# 3. 信息架构与页面

v0.1 共 6 个核心页面。

## 3.1 `/onboarding`

### 目标
建立最小用户画像。

### 字段
1. 每天大约抽多少支？
2. 吸烟多少年？
3. 起床后多久会抽第一支烟？
4. 过去认真戒过几次？
5. 最常见的 1–3 个触发场景？
6. 最想戒烟的原因？
7. 当前状态：
   - 还没开始戒
   - 正在减量
   - 已经戒了 X 天
8. 计划戒烟日期（可空）

### 验收
- ≤ 3 分钟完成
- 手机单手可操作
- 可中途退出后恢复
- 提交后生成 profile

---

## 3.2 `/home`

### 目标
让用户 3 秒内知道“下一步能做什么”。

### 首屏信息
```text
戒烟第 X 天 / 当前正在减量
今天已记录 X 次烟瘾
累计撑过 X 次
预计省下 ¥ / $
```

### 主 CTA
```text
[ 我现在想抽烟 ]
```

### 次级入口
- 今日记录
- 最近 7 天烟瘾趋势（极简）
- 修改戒烟计划

### 验收
主 CTA 在常见移动端无需滚动即可看到。

---

## 3.3 `/craving/start`

### Step A：烟瘾评分

```text
现在有多想抽烟？
0 ───────── 10
```

建议 slider + 数字实时显示。

### Step B：触发场景

单选：

- 压力
- 饭后
- 喝酒
- 社交
- 无聊
- 习惯性想抽
- 情绪不好
- 其他

### Step C：可选自由文本

```text
刚才发生了什么？
```

最多建议 300 字，不强制填写。

### 提交动作

创建 `craving_event`，状态：

```text
started
```

然后进入 intervention。

---

## 3.4 `/craving/:eventId/intervention`

### 目标
2–5 分钟内完成一次结构化即时干预。

### 不是普通 ChatGPT

AI 必须知道：

```json
{
  "profile": {},
  "current_event": {
    "before_score": 8,
    "trigger_type": "stress",
    "context_text": "刚开完会，被领导批评了"
  },
  "recent_events": []
}
```

### AI 输出必须结构化

建议统一返回：

```json
{
  "strategy": "urge_surfing",
  "phase": "intervention",
  "message": "先不决定抽不抽。我们只处理接下来的90秒。",
  "action": {
    "type": "breathing",
    "duration_seconds": 90
  },
  "should_ask_followup": true,
  "followup_question": "这股烟瘾现在最明显是在嘴巴、手，还是胸口？"
}
```

### 干预交互类型

第一版只允许：

```text
conversation       一问一答
breathing          呼吸倒计时
delay              延迟决策倒计时
grounding          感官定位
behavior_switch    行为替代
refusal_rehearsal  拒烟话术
urge_surfing       烟瘾冲浪
```

### 限制

- 默认最多 5 个 AI 回合
- 默认最长 5 分钟
- 用户随时可点「结束干预」
- 不鼓励无限闲聊
- 不做“诊断”
- 不给处方药剂量建议
- 遇到明显严重不适/急症表达时停止普通戒烟 coaching，提示寻求专业医疗帮助

---

## 3.5 `/craving/:eventId/result`

### Step A：重新评分

```text
现在烟瘾几分？
0 ───────── 10
```

### Step B：结果

```text
[ 我没有抽 ]
[ 我还是抽了 ]
[ 还不知道 ]
```

### Step C：轻量反馈

如果没抽：

```text
刚才什么最有帮助？
```

如果抽了：

```text
没关系，这次记录很有价值。
刚才最后促使你点烟的是什么？
```

注意：产品语言不羞辱、不道德评判、不“清零惩罚”。

### 数据更新

```text
after_score
smoked
completed_at
intervention_status = completed
```

---

## 3.6 `/daily-checkin`

每天最多一次：

```text
今天一共抽了多少支？
今天最难的一次烟瘾是什么时候？
```

第一版第二题可以不做。

目标只是补充 24h outcome。

---

# 4. 推荐技术架构

原则：选择开发者最熟悉的栈；不要为了“架构正确”增加周末复杂度。

推荐方案：

```text
Frontend
Next.js 15+ / App Router
TypeScript
Tailwind CSS
Mobile-first

Backend
Next.js Route Handlers
或独立 FastAPI / Node API
二选一，不做重复后端

Database
PostgreSQL（推荐）
或现有 MySQL

ORM
Prisma（Next.js）
或 SQLAlchemy（FastAPI）

AI
Provider Adapter
→ DeepSeek / 通义 / GLM / OpenAI 等任一可配置供应商

Deployment
Vercel + Managed DB
或
现有 Ubuntu + Nginx + Node

Analytics
自建 event_logs 表优先
后续再接 PostHog / Mixpanel
```

## 4.1 架构原则

必须实现 provider abstraction：

```ts
interface AIProvider {
  generateIntervention(input: InterventionInput): Promise<InterventionOutput>
}
```

业务代码不得直接散落调用特定厂商 SDK。

环境变量：

```env
AI_PROVIDER=
AI_API_KEY=
AI_BASE_URL=
AI_MODEL=
DATABASE_URL=
APP_BASE_URL=
SESSION_SECRET=
```

---

# 5. 项目目录建议

```text
/
├─ src/
│  ├─ app/
│  │  ├─ onboarding/
│  │  ├─ home/
│  │  ├─ craving/
│  │  ├─ daily-checkin/
│  │  └─ api/
│  │
│  ├─ components/
│  │  ├─ ui/
│  │  ├─ craving/
│  │  └─ onboarding/
│  │
│  ├─ lib/
│  │  ├─ ai/
│  │  │  ├─ provider.ts
│  │  │  ├─ prompts.ts
│  │  │  ├─ strategies.ts
│  │  │  └─ schema.ts
│  │  ├─ db/
│  │  ├─ analytics/
│  │  ├─ auth/
│  │  └─ validation/
│  │
│  ├─ server/
│  │  ├─ services/
│  │  └─ repositories/
│  │
│  └─ types/
│
├─ prisma/
│  └─ schema.prisma
│
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
│
├─ docs/
│  ├─ product.md
│  ├─ intervention-strategies.md
│  └─ analytics-events.md
│
├─ .env.example
├─ README.md
└─ AGENTS.md
```

---

# 6. 数据库设计

## 6.1 `users`

```sql
id
anonymous_id
email nullable
display_name nullable
locale
timezone
created_at
updated_at
```

v0.1 可优先 anonymous session，降低登录摩擦。

---

## 6.2 `profiles`

```sql
id
user_id unique
cigarettes_per_day
smoking_years
minutes_to_first_cigarette
quit_attempts
motivation
quit_status
quit_date nullable
currency
cigarette_pack_price nullable
cigarettes_per_pack default 20
created_at
updated_at
```

---

## 6.3 `profile_triggers`

```sql
id
user_id
trigger_type
priority
created_at
```

---

## 6.4 `craving_events`

核心表：

```sql
id
user_id

trigger_type
context_text nullable

before_score
after_score nullable

primary_strategy nullable

smoked nullable
status

started_at
completed_at nullable
duration_seconds nullable

created_at
updated_at
```

状态枚举：

```text
started
intervening
completed
abandoned
```

---

## 6.5 `intervention_steps`

```sql
id
craving_event_id

step_index
strategy
action_type
ai_message
user_response nullable

model_provider nullable
model_name nullable
latency_ms nullable
token_input nullable
token_output nullable

created_at
```

注意：v0.1 不需要把所有 AI 内部 reasoning 存储下来。

---

## 6.6 `daily_logs`

```sql
id
user_id
log_date
cigarettes_smoked
notes nullable
created_at
updated_at

unique(user_id, log_date)
```

---

## 6.7 `analytics_events`

```sql
id
user_id nullable
anonymous_id nullable

event_name
properties_json

created_at
```

---

# 7. API 设计

## 7.1 Profile

```text
POST /api/profile
GET  /api/profile
PATCH /api/profile
```

---

## 7.2 Craving Event

```text
POST /api/cravings
GET  /api/cravings/:id
POST /api/cravings/:id/intervention
POST /api/cravings/:id/result
```

### 创建

```json
POST /api/cravings

{
  "before_score": 8,
  "trigger_type": "stress",
  "context_text": "加班结束后特别烦"
}
```

### 返回

```json
{
  "id": "evt_xxx",
  "status": "started"
}
```

---

## 7.3 Intervention

```json
POST /api/cravings/:id/intervention

{
  "user_message": "胸口很烦躁",
  "step_index": 1
}
```

返回必须通过 schema validation。

---

## 7.4 Result

```json
POST /api/cravings/:id/result

{
  "after_score": 4,
  "smoked": false,
  "helpful_strategy": "breathing"
}
```

---

## 7.5 Daily Check-in

```text
PUT /api/daily-log/:date
GET /api/daily-log/:date
```

---

# 8. AI 策略层设计

这是 v0.1 最关键的工程部分。

## 8.1 不允许纯 Prompt 自由发挥

流程：

```text
用户输入
→ 规则预判
→ AI 意图/状态补充识别
→ Strategy Selector
→ Prompt Builder
→ LLM
→ JSON Schema Validation
→ UI Action
```

## 8.2 Strategy Enum

```ts
type InterventionStrategy =
  | "breathing"
  | "delay_decision"
  | "urge_surfing"
  | "behavior_replacement"
  | "grounding"
  | "refusal_rehearsal"
  | "cognitive_reframe"
  | "relapse_review";
```

## 8.3 第一版简单映射

```text
stress / negative_mood
→ breathing + grounding

after_meal / habit
→ behavior_replacement + delay_decision

social
→ refusal_rehearsal

alcohol
→ delay_decision + exit_plan

boredom
→ behavior_replacement

before_score >= 8
→ urge_surfing + delay_decision
```

复杂冲突时才让模型协助选择。

## 8.4 System Prompt 原则

AI 人设：

- calm
- concise
- non-judgmental
- action-oriented
- never preachy
- one step at a time

必须强调：

```text
The goal is not to convince the user about smoking in general.
The goal is to help the user get through the current craving safely,
one short step at a time.
```

## 8.5 输出约束

每条回复建议 ≤ 80 中文字 / ≤ 60 English words。

一次只给一个行动。

禁止：

- 长篇健康科普
- 恐吓
- 道德评判
- “你必须”
- 虚构临床数据
- 保证成功
- 医疗诊断
- 处方剂量指导

---

# 9. Prompt 输入结构

```json
{
  "user_profile": {
    "cigarettes_per_day": 15,
    "smoking_years": 8,
    "quit_attempts": 2,
    "motivation": "family",
    "top_triggers": ["stress", "after_meal"]
  },
  "current_craving": {
    "before_score": 8,
    "trigger": "stress",
    "context": "刚被领导批评"
  },
  "recent_history": [
    {
      "trigger": "stress",
      "before": 7,
      "after": 4,
      "strategy": "breathing",
      "smoked": false
    }
  ],
  "conversation": []
}
```

`recent_history` 最多带最近 3–5 条高相关记录，避免 token 浪费。

---

# 10. 分析埋点

必须优先实现。

事件名：

```text
app_opened
onboarding_started
onboarding_completed

home_craving_cta_clicked

craving_created
craving_score_before_submitted
craving_trigger_submitted

intervention_started
intervention_step_completed
intervention_abandoned
intervention_completed

craving_score_after_submitted
craving_result_smoked
craving_result_not_smoked

daily_checkin_completed
```

关键 properties：

```json
{
  "craving_event_id": "",
  "trigger": "",
  "before_score": 8,
  "after_score": 4,
  "strategy": "",
  "duration_seconds": 150
}
```

---

# 11. v0.1 数据看板

第一版管理页甚至可以只做 `/admin/metrics`，需要环境变量保护。

显示：

```text
Users
Completed onboarding
Users with ≥1 craving event
Total craving events

Intervention completion rate

Average before score
Average after score
Average reduction

No-smoke self-report rate

D1 retention
D7 retention
```

再加一个表：

```text
Trigger
Event Count
Avg Before
Avg After
Avg Reduction
No-Smoke %
```

这比漂亮 dashboard 更重要。

---

# 12. 身份与登录策略

## v0.1 推荐

优先：

```text
anonymous UUID
+
HttpOnly session cookie
```

用户无需注册即可开始。

第 2 次访问可提示：

```text
“绑定邮箱/微信，避免进度丢失”
```

不要让登录成为 onboarding 前置条件。

---

# 13. 国际化设计

即使第一版只做一种语言，也从代码层预留：

```text
zh-CN
en-US
```

所有 UI 文案禁止散落 hard-code。

目录：

```text
src/locales/zh-CN.json
src/locales/en-US.json
```

Profile 中存：

```text
locale
currency
timezone
```

海外版核心 CTA 推荐：

```text
I want to smoke
```

而不是抽象的：

```text
Craving Rescue
```

---

# 14. 隐私与安全最低要求

这是健康行为类产品，第一版也不能省略。

必须：

1. HTTPS
2. 密码/API Key 仅环境变量
3. 数据库禁止公网裸露
4. 用户可删除自己的记录
5. 隐私政策明确说明：
   - 收集什么
   - 为什么收集
   - AI 供应商是否参与处理
   - 保存多久
6. AI 请求尽量不发送：
   - 手机号
   - 邮箱
   - 精确身份信息
7. 保存模型输出，但不保存模型隐藏推理
8. 管理后台必须鉴权
9. 对 API 做基本 rate limit
10. Context / chat 输入限制长度

### 健康声明

产品文案统一使用：

- support
- coach
- help manage cravings
- behavior-change support

禁止：

- cure
- treatment guarantee
- clinically proven success rate（除非未来确有适用证据）
- 100% quit
- replace a doctor

---

# 15. 错误处理

AI API 失败不能导致用户在最需要帮助时看到白屏。

Fallback：

```text
AI失败
→ 本地规则策略
→ 直接显示预制 90 秒干预
```

至少预制：

- strong_craving
- stress
- social
- after_meal
- boredom

错误提示不要写：

```text
500 Internal Server Error
```

而写：

```text
“连接刚刚出了点问题。先跟我做这个 90 秒步骤。”
```

---

# 16. 测试要求

## 16.1 Unit

至少覆盖：

- strategy selector
- score validation 0–10
- craving status transition
- prompt input builder
- AI output schema parser
- cost calculation
- daily log unique constraint

## 16.2 Integration

覆盖：

```text
create craving
→ intervention
→ result
```

完整 API 链。

## 16.3 E2E

至少 3 条：

### Case 1
新用户 → onboarding → home

### Case 2
home → craving 8 → stress → intervention → after 4 → no smoke

### Case 3
AI provider 故障 → fallback intervention → result

---

# 17. 性能目标

v0.1：

- 首屏移动端可交互 < 2.5s（普通网络目标）
- 普通 API P95 < 500ms（不含 LLM）
- LLM 首次完整响应目标 < 5s
- 必须提供 loading / streaming / typing state
- AI 失败 2–3s 内切 fallback，不无限重试

---

# 18. 周末开发顺序

## Phase A - 周五晚：Scaffold（约 10%）

Codex 完成：

- 初始化项目
- DB schema
- migrations
- base layout
- env example
- AI Provider interface
- analytics helper
- 基础 README

**验收后再进入下一阶段。**

---

## Phase B - 周六上午：Core Data + Onboarding（约 20%）

完成：

- session / anonymous user
- onboarding
- profile API
- home skeleton
- CRUD tests

---

## Phase C - 周六下午：Craving Core Loop（约 35%）

完成：

```text
before score
→ trigger
→ create event
→ strategy selector
→ AI intervention
→ after score
→ smoked result
```

这是项目最重要阶段。

---

## Phase D - 周六晚上：Fallback + Prompt Quality（约 10%）

完成：

- 5 个预制 fallback
- output schema validation
- AI error handling
- Prompt 测试样例
- 防止超长回复

---

## Phase E - 周日上午：Dashboard + Daily Log（约 10%）

完成：

- daily check-in
- admin metrics
- trigger aggregation
- before/after reduction

---

## Phase F - 周日下午：QA + Deploy（约 15%）

完成：

- mobile QA
- E2E
- production env
- HTTPS
- logs
- DB backup
- deploy
- analytics validation
- v0.1-beta tag

上线后停止新增功能。

---

# 19. 上线 Checklist

## Product

- [ ] Onboarding ≤ 3 分钟
- [ ] 首页 CTA 首屏可见
- [ ] Craving score 0–10 正常
- [ ] 8 类 trigger 正常
- [ ] AI 干预可完成
- [ ] AI 失败 fallback 可用
- [ ] after score 正常
- [ ] smoked/no-smoke 正常
- [ ] daily check-in 正常

## Data

- [ ] craving_event 每个阶段有数据
- [ ] before / after 可关联
- [ ] strategy 可追踪
- [ ] duration 可统计
- [ ] abandoned 可识别
- [ ] analytics 无重复严重污染

## Security

- [ ] API Key 未提交 Git
- [ ] `.env` ignored
- [ ] DB 非公网裸奔
- [ ] admin 受保护
- [ ] rate limit
- [ ] 输入长度限制
- [ ] 隐私政策
- [ ] 删除数据能力

## Deployment

- [ ] production build 成功
- [ ] migration 成功
- [ ] HTTPS
- [ ] health check
- [ ] error logs
- [ ] AI provider production key
- [ ] mobile Safari
- [ ] Android Chrome
- [ ] 微信内置浏览器

---

# 20. 上线后的冻结规则

`v0.1-beta` 上线以后，7 天内只允许：

```text
P0 crash
数据写错
AI 无法使用
严重 UI 阻塞
安全问题
```

不允许：

```text
“顺手优化”
“加一个积分”
“做得更漂亮”
“增加 AI 人格”
“增加社区”
```

产品团队下一阶段唯一任务：

**找 20–30 个真实戒烟用户。**

---

# 21. Go / Pivot / No-Go

## GO

满足多数：

- 用户真实烟瘾发作时主动打开；
- 平均 craving 下降 ≥ 2；
- 出现较高 intervention completion；
- 有用户重复使用；
- 有用户明确反馈某次干预帮助其没有点烟；
- Day 7 有可接受留存。

下一阶段进入：

- 复吸复盘
- 提醒
- 微信/Apple/Google 登录
- 正式付费测试
- 英文版并行测试

## PIVOT

用户会打开，但：

- AI 太烦；
- 干预无效；
- 退出率高；
- 某种工具明显强于聊天。

则重点改 intervention，不扩产品。

## NO-GO

如果用户在真实烟瘾时根本不会打开：

停止继续开发大功能。

先解决行为入口问题；解决不了就结束方向。

---

# 22. v0.2 才允许做的功能

按优先级：

## P1
- relapse review
- notification/reminder
- better history
- quit streak/report
- health recovery mini timeline

## P2
- payment
- 7-day / 30-day program
- richer personalization
- English production version

## P3
- family support
- quit buddy
- predictive high-risk window
- structured CBT content

## P4
- clinic partnerships
- enterprise wellness
- NRT referral
- advanced research / outcomes system

---

# 23. Codex 工作规则

将本文件放入项目：

```text
/docs/MVP_ROADMAP.md
```

并在根目录 `AGENTS.md` 中加入以下要求。

## 23.1 Codex 不得擅自扩 Scope

如果某功能不在 v0.1 范围内：

**不要实现。**

即使实现很简单，也先记录到：

```text
/docs/BACKLOG.md
```

## 23.2 每个阶段执行流程

```text
1. 阅读 MVP_ROADMAP.md
2. 检查当前代码状态
3. 给出本阶段变更计划
4. 实现
5. lint
6. typecheck
7. unit test
8. integration/e2e（适用时）
9. 更新 README / docs
10. 输出：
   - changed files
   - migrations
   - tests
   - known issues
```

## 23.3 禁止行为

Codex 不得：

- 大范围重构非当前任务代码
- 擅自更换技术栈
- 添加不需要的框架
- 添加微服务
- 添加 Redis（没有明确性能需求时）
- 添加 Kubernetes
- 添加消息队列
- 添加向量数据库
- 添加复杂 DDD 层
- 将一个周末 MVP 设计成企业平台

## 23.4 工程判断原则

优先级：

```text
可验证
>
可靠
>
简单
>
漂亮
>
可无限扩展
```

---

# 24. 给 Codex 的启动指令

把下面内容作为 Codex 第一条任务：

```text
请先完整阅读 docs/MVP_ROADMAP.md。

你的任务不是重新设计产品，而是严格按照路线图交付 v0.1-beta。

第一步只执行 Phase A：
1. 审查当前仓库；
2. 如果仓库为空，建立 Next.js + TypeScript 项目；
3. 配置数据库与 schema；
4. 建立 anonymous session 基础；
5. 建立 AI Provider abstraction，但不要做完整 AI 对话；
6. 建立 analytics helper；
7. 建立目录结构；
8. 配置 lint/typecheck/test；
9. 创建 .env.example；
10. 更新 README。

不要进入 Phase B，除非 Phase A 的 build、lint、typecheck、tests 均通过。

完成后报告：
- 修改了哪些文件；
- 数据库 schema；
- 使用了哪些依赖；
- 测试结果；
- 当前已知问题；
- 下一阶段建议执行内容。

严格禁止实现路线图中“明确不做”的功能。
```

---

# 25. 最终产品判断

这个 MVP 的目的不是证明：

**“我们能做一个 AI 戒烟 App。”**

而是证明：

**“当真实烟瘾发生时，用户愿意打开这个产品，而且一次短时干预能够改变当下行为。”**

如果这个假设成立，再投入产品化、付费、增长和国际化。

如果不成立，周末代码应该可以被毫不犹豫地丢弃。

这才是 v0.1 的正确成功标准。
