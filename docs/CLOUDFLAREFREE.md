# CloudflareFree 定制版

保留第三方软件所需版权与 MIT 许可。当前注册表为 145 个工具、12 个分类；上游 README 的历史统计可能与当前代码不一致。

## 访问与部署

- 正式站点：https://codecrate.137101.xyz
- 代码仓库：https://github.com/CloudflareFree/codecrate
- Pages 项目：`codecrate`（实际默认主机由 Pages 分配）
- 生产分支：`main`，由 GitHub push 自动构建；构建命令 `pnpm run build`，输出 `dist`。
- Node 24，pnpm 9.15.9；安装使用 `pnpm install --frozen-lockfile`。
- Pages Functions 使用 `nodejs_compat`；兼容日期 `2026-11-04`。
- 生产环境绑定 `CACHE`（专用 `it-toolbox-cache` KV）与 `AI`（Workers AI）。资源 ID 在 Cloudflare 管理，不写入仓库。
- DNS 的 CNAME 必须指向 Pages 实际分配的默认主机，不能由项目名猜测。

## 本次界面与 SEO 变更

深蓝侧栏、浅色工作区、工具卡片和分类目录统一为同一设计系统；支持深色模式、中文默认、英文切换、手机导航、键盘搜索与可访问焦点。收藏按钮与工具链接分离。网络及 AI 工具明确提示联网。

构建脚本 `scripts/generate-seo.mjs` 从真实注册表生成各工具和分类的静态 HTML、独立标题/描述、canonical、JSON-LD 和内部链接，供客户端 React 增强。首页加 145 个工具和 12 个分类合计 158 个 sitemap 网址，均使用正式域名。收藏与历史页 noindex，未知路径返回真实 HTTP 404。

`public/robots.txt` 允许公开页面与渲染资源，排除 `/api/`；`sitemap.xml` 在构建时生成。没有为部署时间伪造 `lastmod`。字体本地托管并附许可证。`_headers` 设置 CSP、MIME 与缓存策略；脚本不使用 inline 放行，样式因原有工具使用内联样式而保留 `style-src 'unsafe-inline'`。

GA4 数据流：`G-GC22652SES`。路由切换发送 page_view，路径不含查询字符串与片段；不把工具输入、输出作为事件参数。

## 可重复验证

```bash
pnpm run typecheck
pnpm run build
pnpm run pages:dev
# 另一终端：检查全部公开 URL、canonical、唯一标题、robots/sitemap 和 404
pnpm run verify:site -- http://127.0.0.1:8893
# 需要 Chromium，其他环境通过 CHROME_BIN 提供可执行文件
pnpm run verify:browser -- http://127.0.0.1:8893
# 正式发布后也可将参数改为 https://codecrate.137101.xyz
```

浏览器检查覆盖搜索/空结果、分类、收藏持久化、Ctrl+K、JSON 格式化及错误、Base64、UUID、主题持久化、375/768/1024/1440px 布局、手机导航、语言切换与 CSP/运行错误。它抽样验证工具功能，不代表逐项验证全部 145 个计算工具。

修改的 TypeScript 文件通过类型检查及定向 ESLint；上游全量 lint 仍有既有错误（39 errors、33 warnings），主要是未修改工具文件的 const、正则及 catch/case 规则。本次不扩大为全部工具的代码清理。生产构建保留上游较大 vendor chunk 的警告。

## Search Console

`seo:submit` 提交 sitemap；`seo:status` 查询处理状态；`seo:inspect` 查询已索引版本。所有目标与凭据通过显式环境变量提供，密钥应保存在仓库外：

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/secure/path/service-account.json
export GSC_SITE_URL=sc-domain:137101.xyz
export GSC_SITEMAP_URL=https://codecrate.137101.xyz/sitemap.xml
export GSC_INSPECTION_URL=https://codecrate.137101.xyz/
pnpm run seo:status
# 确认正式版本、公开 URL 和 sitemap 正常后，按授权提交一次
pnpm run seo:submit
pnpm run seo:inspect
```

需要代理时使用 Node 24 的 `NODE_USE_ENV_PROXY=1` 以及 `https_proxy`/`http_proxy`。服务账号还需独立具备 Search Console 属性权限，GA4 权限不能替代。

HTTP 204 只表示提交已接收；pending、零错误或模拟 Googlebot 200 不能证明 Google 已抓取或收录。普通工具页没有通用“请求编入索引”API；少量页面可在 Search Console 的网址检查界面手动请求。处理状态建议 1–3 天后观察，收录状态 7–14 天观察，这些不是时间保证。不要每次部署重复提交。

## 维护与回退

后续推送 main 会触发 Pages Git 构建；每次确认部署触发类型、提交 SHA 与 success，再检查正式域名。保留此前成功部署，出现回归可在 Pages 回退对应部署，并撤销有问题的 Git 提交。后续新增工具以注册表为准自动更新 sitemap，并验证可访问性、内部链接和 robots。网络查询依赖外部服务，AI 依赖 Workers AI 配额和模型可用性。

## AI 模型修复

2026-11-05 线上 Functions 日志确认原模型别名解析到已于 2026-05-30 停用的 `@cf/meta/infire-llama-3.1-8b-instruct`（AiError 5028）。Cloudflare REST API 对旧别名可能走不同映射，REST 成功不能代替实际 AI 绑定验证。已改用当前模型目录中的 `@cf/meta/llama-3.1-8b-instruct-fp8`，并去掉绕过模型类型校验的强制断言。发布后须通过站点 `/api/ai/explain` 实测。
