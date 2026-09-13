# v0.1-beta Release Checklist

## 自动化检查

- [x] Prisma Schema validation
- [x] ESLint
- [x] TypeScript typecheck
- [x] Unit tests
- [x] PostgreSQL integration test
- [x] Production build
- [x] npm production dependency audit（0 vulnerabilities）
- [x] Docker image build + standalone health check
- [x] 应用内浏览器 390×844 核心流程 QA
- [ ] Playwright CLI mobile E2E（当前 macOS 13 ARM64 无可下载 Chromium）

## 产品

- [x] Onboarding 可恢复
- [x] 首页 CTA 首屏可见
- [x] 0–10 分前后评分
- [x] 8 类 trigger
- [x] 最多 5 步结构化干预
- [x] AI 失败 fallback
- [x] smoked / no-smoke / unknown
- [x] Daily check-in

## 数据与安全

- [x] 匿名 HttpOnly Cookie
- [x] 管理后台鉴权
- [x] 基础 API rate limit
- [x] 输入长度限制
- [x] 隐私说明
- [x] 用户数据删除 API 与 UI
- [x] AI 输入手机号和邮箱脱敏
- [x] 深度健康检查
- [ ] 生产数据库不暴露公网
- [ ] 生产密钥已配置并轮换
- [ ] 生产备份与恢复演练

## 部署与设备

- [x] Dockerfile
- [x] 本地 PostgreSQL backup dump 验证
- [x] 安全响应头
- [ ] HTTPS
- [ ] 域名与 DNS
- [ ] 错误日志采集平台
- [ ] mobile Safari 实机
- [ ] Android Chrome 实机
- [ ] 微信内置浏览器实机
- [ ] `v0.1-beta` Git tag

未完成项目需要真实生产基础设施、设备或发布授权，不能只凭本地构建标记完成。
