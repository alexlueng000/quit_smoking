# v0.1-beta 部署与上线手册

## 1. 生产依赖

- Node.js 22 LTS 或容器运行环境
- PostgreSQL 14+
- HTTPS 终止层（托管平台或 Nginx/Caddy）
- 可选的 OpenAI-compatible AI Provider
- `pg_dump`，用于数据库备份

## 2. 必需环境变量

```text
DATABASE_URL
APP_BASE_URL
APP_VERSION
SESSION_SECRET
ADMIN_USERNAME
ADMIN_PASSWORD
AI_PROVIDER
AI_API_KEY
AI_BASE_URL
AI_MODEL
```

`SESSION_SECRET` 至少 32 个随机字符；`ADMIN_PASSWORD` 至少 16 个随机字符。不要把 `.env` 或真实密钥提交到版本库。

## 3. 发布顺序

```bash
npm ci
npm run db:generate
npx prisma migrate deploy
npm run build
npm start
```

容器部署：

```bash
docker build -t quit-smoking-coach:v0.1-beta .
docker run --env-file .env.production -p 3000:3000 quit-smoking-coach:v0.1-beta
```

数据库迁移必须在切换生产流量前执行。不要在生产环境使用 `prisma migrate dev`。

## 4. 健康检查

```text
GET /api/health
```

HTTP 200 表示应用和数据库正常；数据库不可用时返回 HTTP 503。响应不会返回连接串或内部错误详情。

## 5. 备份

在加载生产环境变量后执行：

```bash
./scripts/backup-db.sh /path/to/backup-directory
```

脚本生成 PostgreSQL custom-format dump。上线前必须至少完成一次备份和一次独立环境恢复演练。恢复示例：
如果主机没有 `pg_dump`，脚本会自动使用 `${POSTGRES_CONTAINER:-quit-smoking-postgres}` 容器中的工具。

```bash
pg_restore --clean --if-exists --no-owner --dbname="$RESTORE_DATABASE_URL" backup.dump
```

恢复会覆盖目标数据库对象，只能对明确的恢复环境执行。

## 6. HTTPS 与代理

- 生产环境必须只通过 HTTPS 暴露。
- 将 HTTP 永久重定向至 HTTPS。
- 保留 `X-Forwarded-For` 和 `X-Forwarded-Proto`。
- 数据库不得开放到公网。
- `/admin/metrics` 需保留 Basic Auth，并建议再加 IP allowlist。

## 7. 发布后验证

1. `/api/health` 返回 200。
2. 新匿名用户完成 onboarding。
3. 完成一次 before → intervention → after → outcome。
4. 强制外部 AI 失败时 fallback 正常。
5. 每日打卡同一天重复保存仍只有一条记录。
6. `/admin/metrics` 未认证返回 401。
7. 手机 Safari、Android Chrome 和微信内置浏览器各验证一次。
8. 确认 analytics 中没有重复严重污染。

本机 Playwright 无对应 Chromium 包时，可使用已经安装的 Chrome：

```bash
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

## 8. 上线冻结

上线后 7 天只允许修复 P0 crash、数据错误、AI 不可用、严重 UI 阻塞和安全问题。其他需求写入 backlog，不在验证期加入。
