# 戒烟伙伴（Quit Smoking Coach）

面向移动端的 AI 戒烟教练 MVP。当用户烟瘾发作时，产品通过 2–5 分钟的结构化干预，帮助用户应对当下的烟瘾，并记录干预前后变化与是否吸烟的结果。

当前状态：**Phase F 本地上线准备完成**。真实生产部署、HTTPS、实机测试和发布标签仍需部署目标与发布授权。

## 技术栈

- Next.js 15 / App Router
- React 19、TypeScript、Tailwind CSS 4
- PostgreSQL、Prisma 6
- Zod 结构化数据校验
- Vitest 单元测试
- ESLint 9

建议使用 Node.js 20 LTS、22 LTS 或 24+。不建议使用奇数版本的非 LTS Node.js。

## 本地启动

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate -- --name init
npm run dev
```

访问 `http://localhost:3000`。健康检查位于 `GET /api/health`。

执行数据库迁移前，需要先创建 PostgreSQL 数据库并更新 `.env` 中的 `DATABASE_URL`。`SESSION_SECRET` 必须至少包含 32 个字符，可使用密码生成器生成随机值，禁止提交真实密钥。

## 常用命令

```bash
npm run dev          # 本地开发
npm run build        # 生产构建
npm run lint         # ESLint
npm run typecheck    # TypeScript 类型检查
npm test             # 单元测试
npm run db:generate  # 生成 Prisma Client
npm run db:migrate   # 创建并执行开发迁移
npm run db:studio    # Prisma Studio
```

## 已实现

- Next.js App Router 基础页面、移动端 viewport 和健康检查
- 完整 v0.1 Prisma 数据模型
- HMAC 签名的匿名会话基础函数及安全 Cookie 配置
- AI Provider 接口、输出 Schema、Prompt Builder 和规则策略选择器
- 类型安全的 analytics event helper
- `zh-CN` 与 `en-US` 文案入口
- ESLint、TypeScript、Vitest 和生产构建配置
- Edge Middleware 匿名 Cookie 签发、验签与过期轮换
- 匿名用户惰性创建和 Profile repository/service
- `GET / POST / PATCH /api/profile`
- 可中途退出并恢复的移动端 Onboarding
- Profile 驱动的 Home 骨架和省钱公式
- 可直接部署的 PostgreSQL 初始 migration
- 烟瘾前置评分、8 类触发场景和可选上下文
- Craving Event 状态机与归属校验
- 最多 5 步、最长 5 分钟的结构化干预界面
- Mock AI Provider 和 OpenAI-compatible HTTP Provider
- 干预后评分、吸烟结果及轻量反馈
- Home 今日事件、累计撑过次数和 7 天趋势
- PostgreSQL 核心闭环集成测试
- 外部 AI 2.5 秒超时和自动本地降级
- strong craving、stress、social、after meal、boredom 五套 fallback
- 中文 80 字 / 英文 60 词的程序级输出限制
- Prompt 手机号、邮箱脱敏和上下文裁剪
- 医疗急症与自伤风险规则拦截
- 每日吸烟记录，同一用户每天唯一且可更新
- Basic Auth 保护的 `/admin/metrics`
- Trigger 聚合、干预完成率、平均降幅、未吸烟率和 D1/D7 留存
- 390×844 移动端浏览器核心流程 QA
- 安全响应头、基础 API 限流和数据库深度健康检查
- 隐私说明、用户数据删除和全局错误页
- Docker standalone 构建、备份脚本及发布清单

默认 `AI_PROVIDER=mock`，无需外部模型即可验证完整产品闭环。配置其他 Provider 时必须同时设置 `AI_API_KEY`、`AI_BASE_URL` 和 `AI_MODEL`。
外部 Provider 超时、返回非法 JSON、违反 Schema、选择越界策略或配置不完整时，系统会自动写入并展示本地预制干预，不让用户停在错误页。

## 核心 API

```text
POST /api/cravings
GET  /api/cravings/:id
POST /api/cravings/:id/intervention
POST /api/cravings/:id/result
```

执行真实 PostgreSQL 集成测试：

```bash
RUN_DB_TESTS=1 npm run test:integration
```

在已安装 Chrome 的 macOS 上执行移动端 E2E：

```bash
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

## 数据模型

- `users`：匿名身份与可选账户资料
- `profiles`：最小吸烟与戒烟画像
- `profile_triggers`：用户常见触发场景
- `craving_events`：干预前后评分、策略及最终结果
- `intervention_steps`：结构化干预步骤与模型运行指标
- `daily_logs`：每日吸烟记录，按用户和日期唯一
- `analytics_events`：关键产品行为埋点

所有用户关联数据均配置级联删除；分析事件在用户删除后保留匿名记录并解除用户关联。

## 环境变量

参见 `.env.example`：

- `DATABASE_URL`
- `APP_BASE_URL`
- `SESSION_SECRET`
- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_BASE_URL`
- `AI_MODEL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`（至少 16 个字符）

## 项目约束

产品和开发范围以 [MVP 路线图](docs/ai_quit_coach_mvp_development_roadmap.md) 为准。v0.1 不实现社区、课程、支付、预测模型、RAG、复杂 Agent、原生 App 或医疗诊断功能。
