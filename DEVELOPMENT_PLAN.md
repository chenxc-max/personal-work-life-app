# 开发计划：个人工作生活专属 App

> 依据文档：PRD.md（v1.0，已确认）
> 计划版本：v1.0
> 制定日期：2026-10-11
> 执行方式：按阶段推进，每个阶段通过验收门槛后才进入下一阶段

## 0. 环境现状与关键决策

### 0.1 环境现状（已在本机检查）

| 项目 | 现状 | 影响 |
| --- | --- | --- |
| Node.js | 存在 v24.19.0，但来自 Codex 自带运行时（`C:\Users\HP\.cache\codex-runtimes`） | 不能作为长期运行环境依赖 |
| npm | 系统中未安装 | 第 0 阶段必须准备可用的 npm |
| pnpm | Codex 备用入口可用，v11.25.0 | 可用于初始化脚手架 |
| git | 已安装，v2.53.0 | 用于分阶段提交 |
| 浏览器 | Edge 和 Chrome 均已安装 | 开发和验收直接用本机浏览器 |
| 工作目录 | 目前只有 PRD.md | 从零搭建，无历史代码需要兼容 |

### 0.2 技术选型（本计划已确定）

| 领域 | 选择 | 理由 |
| --- | --- | --- |
| 运行形态 | 本地静态应用 + 微型本地静态服务器（`127.0.0.1:4173`），由启动脚本打开浏览器 | 满足"只在电脑浏览器中本地运行"，不部署、不联网 |
| 前端框架 | React 18 + TypeScript 5 + Vite | 成熟的桌面端单页应用方案，开发快、类型安全 |
| UI 组件 | Ant Design 5（中文语言包）+ lucide-react 图标 | 表单、表格、日期、抽屉、看板等桌面场景组件齐全，中文友好 |
| 路由 | React Router（HashRouter） | 静态服务器下无需额外路由配置，刷新不 404 |
| 数据存储 | Dexie 4（浏览器 IndexedDB） | 容量可靠、支持事务，满足刷新、关闭、重启后不丢失 |
| 跨模块数据流 | dexie-react-hooks 的实时查询 + Zustand 管理界面状态 | 模块数据变化后，首页和今日计划自动更新，不需要手写同步 |
| 拖拽排序 | dnd-kit（core + sortable） | 支持看板拖动和列表排序，维护活跃 |
| 日期处理 | dayjs | 轻量，满足日期切换和格式化 |
| 数据校验 | zod | 备份文件导入前做严格校验，防止坏文件破坏数据 |
| 图表 | recharts | 只用于健身身体数据的简单趋势线，不引入重型图表库 |
| 测试 | Vitest + Testing Library + fake-indexeddb；Playwright 做端到端 | 单元测试覆盖数据层，E2E 覆盖 PRD 验收标准 |
| 版本管理 | git，按阶段提交 | 每阶段可回退、可审查 |

### 0.3 为什么不做其他方案

- 不用 Electron 或 Tauri：本项目只需要浏览器界面，打包桌面程序属于多余复杂度。
- 不直接双击 HTML 以 `file://` 运行：ES 模块加载和 IndexedDB 来源在不同浏览器下不稳定，容易出现"换台电脑数据看起来丢了"的问题。
- 不做后端加数据库服务：单用户本地应用不需要；数据落在这台电脑的浏览器本地数据库中，配合整包导出备份即可。
- 不接任何网络请求：所有功能断网可用，避免隐私和依赖问题。

### 0.4 数据安全设计要点

1. 数据保存在固定来源 `http://127.0.0.1:4173` 的 IndexedDB 中；开发服务器固定端口 `5173`。
2. `vite.config.ts` 必须设置 `strictPort: true`。端口变化等于换了数据来源，会让旧数据"看不见"。
3. 备份文件为单个 JSON 文件，带 `schemaVersion`，可保存到电脑任意位置。
4. 导入前自动把当前数据存成一份回滚点（保存在本地 `backups` 表，最多保留 3 份）。
5. 清空数据必须二次确认；清空前如果从未导出过备份，给出额外警告。
6. 页面右下角持续显示"最近备份时间"，超过 30 天未备份时显示提醒。

### 0.5 命令与运行方式约定

| 用途 | 命令 |
| --- | --- |
| 日常开发 | `npm run dev`（固定 `http://127.0.0.1:5173`） |
| 构建产物 | `npm run build` |
| 代码检查 | `npm run lint` |
| 类型检查 | `npm run typecheck` |
| 单元测试 | `npm run test` |
| 端到端测试 | `npm run test:e2e` |
| 日常使用 | 双击 `启动应用.bat`（启动 `127.0.0.1:4173` 并打开浏览器） |

## 1. 总里程碑

| 阶段 | 目标 | 主要产出 | 验收门槛 | 预计工作量 |
| --- | --- | --- | --- | --- |
| P0 | 环境与脚手架 | 可运行工程、便携 Node、启动脚本 | 开发、构建、启动脚本全部可用 | 0.5–1 天 |
| P1 | 数据层与备份服务 | 全部数据表、仓储层、跨模块引用、备份服务 | 单元测试全部通过 | 1–1.5 天 |
| P2 | 全局框架与设置基础版 | 导航框架、九个路由、导出导入清空 | 导航可走通，备份可往返 | 1–1.5 天 |
| P3 | 首页与今日计划 | 首页、今日计划、跨模块同步机制 | PRD 10.2、10.5 中相关项通过 | 2–2.5 天 |
| P4 | 自媒体 | 四状态看板、内容详情、发布数据 | PRD 10.6 自媒体流程通过 | 1–1.5 天 |
| P5 | 开发工作 | 项目、待办、Bug、日志、里程碑 | PRD 10.6 开发流程通过 | 1–1.5 天 |
| P6 | 咨询工作 | 客户、咨询记录、跟进、结算 | PRD 10.6 咨询流程通过 | 1–1.5 天 |
| P7 | 健身计划 | 周计划、逐组打卡、历史、身体数据 | PRD 10.6 健身流程通过 | 1.5–2 天 |
| P8 | 饮食计划 | 三餐加餐、饮水、常用食物、历史 | PRD 10.6 饮食流程通过 | 1–1.5 天 |
| P9 | 游戏娱乐 | 游戏库、游玩时长、评分、娱乐清单 | PRD 10.6 游戏流程通过 | 1–1.5 天 |
| P10 | 设置完整版与全局功能 | 偏好、概览、搜索、快速记录、回滚点 | PRD 10.3、10.4 相关项通过 | 1.5–2 天 |
| P11 | 全量验收与交付 | 验收记录、README、v1.0 版本 | PRD 第 10 章全部验收项通过 | 1.5–2.5 天 |

总工作量估算：约 14–22 个专注开发日，不含你验收和反馈的时间。实际执行以阶段验收为准，不按时间压缩质量。

## 2. 目录结构与代码组织约定

```text
张的app/
  PRD.md
  DEVELOPMENT_PLAN.md
  README.md
  ACCEPTANCE.md
  启动应用.bat
  package.json
  vite.config.ts
  playwright.config.ts
  tools/
    node-lts/            # 便携 Node，加入 .gitignore
    serve.mjs            # 只用 Node 内置模块的静态服务器
  src/
    app/
      App.tsx
      router.tsx
      providers.tsx
      AppShell.tsx
    components/
      PageHeader.tsx
      EmptyState.tsx
      ConfirmAction.tsx
      UndoToast.tsx
      DateSwitcher.tsx
      QuickCaptureModal.tsx
      GlobalSearchDrawer.tsx
    data/
      db.ts
      schema.ts
      planLink.ts
      backup.ts
      search.ts
      repositories/
        memos.ts
        plan.ts
        media.ts
        dev.ts
        consult.ts
        fitness.ts
        diet.ts
        games.ts
        settings.ts
    domain/
      types.ts
      constants.ts
    features/
      home/
      plan/
      media/
      dev/
      consult/
      fitness/
      diet/
      games/
      settings/
    stores/
      uiStore.ts
    styles/
      tokens.css
      global.css
    utils/
      date.ts
      id.ts
  tests/
    e2e/
      shell-navigation.spec.ts
      persistence.spec.ts
      home-plan.spec.ts
      media.spec.ts
      dev.spec.ts
      consult.spec.ts
      fitness.spec.ts
      diet.spec.ts
      games.spec.ts
      settings-backup.spec.ts
      search-quickcapture.spec.ts
```

执行硬性规则：

1. 界面组件只能调用 `src/data/repositories/` 和 `src/data/` 下的服务函数，不能直接操作 Dexie 表。
2. 所有跨模块同步逻辑集中放在 `planLink.ts` 和 `backup.ts`，不允许在页面里各写一套。
3. 所有日期统一走 `src/utils/date.ts`，禁止在页面里手写 `new Date()` 拼日期字符串。
4. TypeScript 开启 `strict`，不滥用 `any`。
5. 所有界面文案使用简体中文，不做多语言框架。

## 3. 数据模型（第一版）

### 3.1 通用约定

- 主键：`id`，使用 `crypto.randomUUID()`。
- 日期：`YYYY-MM-DD` 字符串，按本机时区计算。
- 时间戳：ISO 字符串，字段名 `createdAt`、`updatedAt`。
- 排序：整数 `sortOrder`，越小越靠前。
- 所有实体统一带 `createdAt`、`updatedAt`。

### 3.2 数据表

| 表 | 用途 | 关键字段 | 主要索引 |
| --- | --- | --- | --- |
| settings | 全局设置（单条记录，id 固定为 app） | defaultRoute、homeSections、waterGoalMl、lastBackupAt、lastBackupFile | id |
| memos | 快速备忘 | content、status（inbox/converted）、convertedToType、convertedToId、createdAt | createdAt、status |
| planItems | 今日计划与日程 | date、kind（schedule/todo）、title、note、priority、startTime、done、doneAt、sortOrder、sourceType、sourceId、rolledFromDate | date、[date+sortOrder]、[sourceType+sourceId]、done |
| mediaAccounts | 自媒体账号或栏目 | name、note、sortOrder | name |
| mediaContents | 自媒体内容 | title、idea、draft、accountId、platform、status、plannedPublishDate、plannedPublishTime、publishedAt、metrics、note、sortOrder | status、accountId、[status+sortOrder]、plannedPublishDate |
| devProjects | 开发项目 | name、description、status、archived、sortOrder | status、archived |
| devTasks | 项目待办 | projectId、title、status、priority、dueDate、note | projectId、status、dueDate |
| devBugs | 项目 Bug | projectId、title、severity、status、repro | projectId、status、severity |
| devLogs | 开发日志 | projectId、date、content | projectId、[projectId+date] |
| devMilestones | 项目里程碑 | projectId、name、targetDate、status、note | projectId、targetDate |
| clients | 咨询客户 | name、contact、note、nextFollowUpDate | name、nextFollowUpDate |
| consultSessions | 咨询记录 | clientId、date、topic、keyPoints、nextStep | clientId、[clientId+date] |
| consultFollowUps | 跟进待办 | clientId、sessionId、content、dueDate、status | clientId、dueDate、status |
| consultSettlements | 结算记录 | clientId、date、quantity、amount、status、note | clientId、date、status |
| workoutPlans | 训练计划 | name、weekdays、exercises（动作、组数、次数、目标重量）、note、archived | name、archived |
| workoutSessions | 训练记录 | date、planId、planName、entries（逐组实际数据）、durationMin、note | date、planId |
| bodyMetrics | 身体数据 | date、weightKg、measurements、note | date |
| mealDays | 每日饮食概况 | date（主键）、waterGoalMl、waterActualMl、note | id |
| mealItems | 每日食物项 | date、meal（breakfast/lunch/dinner/snack）、name、amount、done、sortOrder、favoriteId | date、[date+meal]、favoriteId |
| mealFavorites | 常用食物或菜谱 | name、category、defaultAmount、note、sortOrder、useCount | name、category |
| games | 游戏库 | name、platform、status、totalMinutes、rating、review、sortOrder | status、name |
| playLogs | 游玩记录 | gameId、date、minutes、note | gameId、date |
| entertainmentItems | 娱乐清单 | name、type、status、note、sortOrder | status、type |
| backups | 导入前回滚点和备份元信息 | kind、createdAt、payload、fileMeta | createdAt、kind |

### 3.3 跨模块引用契约（核心规则）

定义统一的来源类型：

```text
SourceType = manual | media | dev | consult | fitness | diet | game
```

所有"加入今日"的行为统一调用以下函数，不允许各模块自己写：

- `addToToday(ref, payload)`：在今日计划创建一条带来源标签的事项。同一来源同一天重复调用时，返回已有事项，不重复创建。
- `setPlanItemDone(planItemId, done)`：更新今日计划，并按 `sourceType` 调用对应模块的同步处理器，反向更新来源记录状态。
- `removeTodayRef(planItemId)`：只移除今日引用，不删除来源记录。
- `cascadeDeleteSource(sourceType, sourceId)`：删除来源记录时，同步清理今日计划和首页里的引用。
- `toggleFromSource(sourceType, sourceId, done)`：来源模块内部完成或取消完成时，同步今日计划。

每个模块在 P4–P9 实现时，必须注册自己的同步处理器，否则该模块的"加入今日"不允许上线。

## 4. 路由与页面框架

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/` | 重定向 | 跳转到设置里的默认页（默认 `/home`） |
| `/home` | 首页总览 | 今日概览、今日计划、快速备忘、模块摘要 |
| `/plan` | 今日计划 | 日期切换、日程、待办、未完成处理 |
| `/media` | 自媒体 | 账号筛选、四状态看板、内容详情 |
| `/dev` | 开发工作 | 项目列表、待办、Bug、日志、里程碑 |
| `/consult` | 咨询工作 | 客户列表、咨询时间线、跟进、结算 |
| `/fitness` | 健身计划 | 周安排、训练打卡、历史、身体数据 |
| `/diet` | 饮食计划 | 三餐加餐、饮水、常用食物、历史 |
| `/games` | 游戏娱乐 | 游戏库、游玩记录、娱乐清单 |
| `/settings` | 数据与设置 | 备份、恢复、清理、偏好、概览 |

全局框架要求：

1. 左侧导航按"总览、计划、工作、生活、系统"分组，共九个入口，带图标。
2. 顶部工具条固定显示日期、快速记录按钮、全局搜索框。
3. 每个页面顶部显示页面标题和该页最主要的一个操作按钮。
4. 所有页面在 1280px 宽度下不得出现横向滚动、文字重叠或内容溢出。
5. 浅色主题，每个模块一个克制的强调色，卡片圆角不超过 8px。

## 5. 分阶段执行计划

### P0 环境与脚手架

**目标**：建立可运行、可测试、可启动的工程骨架。

**任务**

1. 下载 Node.js LTS 的 Windows 压缩包，解压到 `tools/node-lts/`，校验 `node -v` 和 `npm -v` 可用；把该目录加入 `.gitignore`。
2. 用 Vite 官方 React + TypeScript 模板在临时目录生成脚手架，再把内容移入当前目录，保留 PRD.md 和 DEVELOPMENT_PLAN.md。
3. 安装依赖：react、react-dom、react-router-dom、antd、lucide-react、dexie、dexie-react-hooks、zustand、dayjs、zod、dnd-kit、recharts。
4. 安装开发依赖：typescript、vite、eslint、prettier、vitest、@testing-library/react、fake-indexeddb、playwright。
5. 配置 `vite.config.ts`：固定端口 5173、`strictPort: true`、相对 base、输出 `dist`、路径别名 `@`。
6. 配置 `package.json` 脚本：dev、build、preview、lint、typecheck、test、test:e2e。
7. 编写 `tools/serve.mjs`：只用 Node 内置模块，固定监听 `127.0.0.1:4173`，服务 `dist/`，支持单页路由回退。
8. 编写 `启动应用.bat`：若服务未启动则启动，然后打开 Edge，失败时打开 Chrome，并访问 `http://127.0.0.1:4173`。
9. 初始化 git 和 `.gitignore`，完成第一次提交。

**验收门槛**

- [ ] `npm run dev` 能打开占位页面。
- [ ] `npm run build` 构建成功。
- [ ] `npm run lint`、`npm run typecheck` 无错误。
- [ ] 双击 `启动应用.bat` 能打开构建后的页面。
- [ ] `git status` 干净，已产生首次提交。

### P1 数据层、领域模型与备份服务

**目标**：把全部数据结构和跨模块规则一次性定下来，并用测试锁住。

**任务**

1. 在 `src/domain/types.ts` 定义全部实体、状态枚举和来源类型。
2. 在 `src/data/db.ts` 建立 Dexie 版本 1，创建第 3 章全部数据表和索引。
3. 在 `src/utils/date.ts` 实现 `todayKey()`、`toDateKey()`、`addDays()`、`isSameDay()`，统一本机时区。
4. 为每个模块建立仓储文件，先实现基础增删改查、排序、归档、时间戳维护。
5. 实现 `planLink.ts` 的五个核心函数和模块同步注册表。
6. 实现 `backup.ts`：导出对象、zod 校验、导入事务、导入前回滚点、按模块清空、全部清空。
7. 用 fake-indexeddb 编写单元测试：增删改查、排序、级联删除、完成状态双向同步、备份往返、损坏文件拒绝、跨天日期边界。

**验收门槛**

- [ ] 所有数据层单元测试通过。
- [ ] 备份导出后再导入，数据逐表一致。
- [ ] 删除来源记录后，今日计划引用同步消失。
- [ ] 导入损坏文件时抛错，原数据不变。
- [ ] 日期函数在 23:59 到 00:01 之间不跳错日期。

### P2 全局框架与设置基础版

**目标**：九个页面能走通，数据安全功能提早可用。

**任务**

1. 实现 AppShell、左侧分组导航、顶部工具条、页面标题组件。
2. 配置 Ant Design 中文语言包和主题 token，建立浅色视觉基线和模块强调色。
3. 建立 HashRouter 路由和九个占位页，支持从设置读取默认打开页。
4. 建立统一的提示、确认、撤销机制。
5. 实现快速记录弹窗的基础版：先支持快速备忘和今日任务。
6. 实现设置页基础版：导出备份、导入预览与恢复、按模块清空、全部清空、默认打开页。
7. 用 Playwright 在 1280x800 和 1440x900 下截图检查布局。

**验收门槛**

- [ ] 九个入口点击后标题和内容对应。
- [ ] 导出备份生成文件；清空后导入能恢复。
- [ ] 清空操作必须二次确认。
- [ ] 1280px 宽度下无横向滚动、无文字重叠。

### P3 首页与今日计划

**目标**：完成整个应用的核心使用闭环。

**任务**

1. 实现今日计划页：日期条、固定日程、待办、已完成折叠区。
2. 实现新增、编辑、删除、拖拽排序、优先级、开始时间、完成勾选。
3. 实现未完成处理：顺延、保留、放弃，记录顺延来源日期。
4. 实现首页今日概览：待办数量、完成数量、完成进度。
5. 实现首页今日计划列表：带来源标签，可直接勾选，可跳回来源。
6. 实现快速备忘区：新增、最近记录、转换入口。
7. 实现备忘转换注册表：本阶段支持转今日任务，后续模块上线后自动启用对应类型。
8. 实现模块摘要区框架，先显示已有数据模块的摘要和未启用模块的空状态。
9. 编写 home-plan 和 persistence 端到端测试。

**验收门槛**

- [ ] 新增、排序、勾选、顺延后刷新页面，结果全部保留。
- [ ] 首页与今日计划的完成状态一致。
- [ ] 模块事项在首页和今日计划显示来源标签。
- [ ] 快速备忘可以转成今日任务。
- [ ] 关闭浏览器再打开，数据仍然存在。

### P4 自媒体

**目标**：完成内容从灵感到发布数据记录的闭环。

**任务**

1. 实现账号或栏目的新增、编辑、删除和筛选。
2. 实现四列看板：灵感、创作中、待发布、已发布。
3. 实现看板卡片拖拽换状态，顺序和状态持久化。
4. 实现内容详情抽屉：标题、选题说明、文稿要点、平台、计划发布时间。
5. 实现发布数据录入：阅读量、播放量、互动数据。
6. 实现"计划发布"加入今日计划，并注册状态同步处理器。
7. 编写自媒体端到端测试。

**验收门槛**

- [ ] 从记录灵感到拖到已发布，再到填写数据，全流程可用。
- [ ] 刷新后看板状态和发布数据不丢失。
- [ ] 加入今日的计划发布事项能同步完成状态。

### P5 开发工作

**目标**：完成项目开发过程管理。

**任务**

1. 实现项目列表：新增、编辑、归档、状态筛选。
2. 实现项目详情四个页签：待办、Bug、日志、里程碑。
3. 实现待办：新增、状态、优先级、截止日期、排序。
4. 实现 Bug：严重程度、状态、复现说明。
5. 实现开发日志和里程碑。
6. 实现待办加入今日计划，并注册状态同步处理器。
7. 编写开发工作端到端测试。

**验收门槛**

- [ ] 新建项目、添加待办和 Bug、加入今日、勾选完成，状态同步正常。
- [ ] 归档项目后不出现在默认列表，可通过筛选找回。
- [ ] 刷新后各页签数据不丢失。

### P6 咨询工作

**目标**：完成客户、咨询记录和跟进闭环。

**任务**

1. 实现客户列表：新增、编辑、搜索、下次跟进时间。
2. 实现客户详情：基本信息、咨询时间线、跟进待办、结算记录。
3. 实现咨询记录表单：日期、主题、要点、下一步。
4. 实现从咨询记录生成跟进待办，并支持加入今日计划。
5. 实现结算记录和结算状态更新。
6. 注册跟进事项的状态同步处理器。
7. 编写咨询工作端到端测试。

**验收门槛**

- [ ] 新建客户、记录咨询、生成跟进、加入今日、更新结算，全流程可用。
- [ ] 时间线按日期正确排序并可展开查看要点。
- [ ] 刷新后关联关系仍然有效。

### P7 健身计划

**目标**：完成训练计划、打卡和历史记录闭环。

**任务**

1. 实现本周七天安排条，区分计划日、完成日和休息日。
2. 实现训练计划：名称、适用星期、动作、组数、次数、目标重量。
3. 实现今日训练打卡：逐组打勾，填写实际重量和实际次数。
4. 完成训练后生成训练记录，并保留时长和备注。
5. 实现训练历史按日期回看。
6. 实现身体数据录入和简单趋势线。
7. 注册训练安排加入今日计划的状态同步处理器。
8. 编写健身计划端到端测试。

**验收门槛**

- [ ] 制定计划、查看本周安排、逐组打卡、生成历史，全流程可用。
- [ ] 身体数据保存后趋势线正确更新。
- [ ] 刷新和重启后训练记录不丢失。

### P8 饮食计划

**目标**：完成每日饮食安排和记录闭环。

**任务**

1. 实现按日期查看早餐、午餐、晚餐、加餐四个区块。
2. 实现食物项新增、删除、完成勾选和排序。
3. 实现常用食物或菜谱的收藏、编辑和一键加入某一餐。
4. 实现复制昨天和复制某一顿。
5. 实现饮水目标和饮水计数。
6. 实现历史日期回看。
7. 注册饮食安排加入今日计划的状态同步处理器。
8. 编写饮食计划端到端测试。

**验收门槛**

- [ ] 安排三餐和加餐、一键添加收藏、记录饮水、复制昨天，全流程可用。
- [ ] 勾选完成状态刷新后保留。
- [ ] 历史日期数据可以正常回看。

### P9 游戏娱乐

**目标**：完成游戏库和娱乐清单管理。

**任务**

1. 实现游戏库：新增、编辑、删除、状态筛选、排序。
2. 实现状态切换：想玩、在玩、已通关、弃坑。
3. 实现记录游玩时长并自动累计总时长。
4. 实现评分和短评。
5. 实现娱乐清单：名称、类型、状态、备注。
6. 编写游戏娱乐端到端测试。

**验收门槛**

- [ ] 添加游戏、切换状态、记录时长并累计、评分短评，全流程可用。
- [ ] 连续记录两次游玩时长后，总时长等于两次之和。
- [ ] 娱乐清单可以新增、筛选和修改状态。

### P10 设置完整版与全局功能

**目标**：补齐偏好、搜索、快速记录和回滚能力。

**任务**

1. 实现首页摘要的显示、隐藏和排序配置。
2. 实现默认打开页、饮水目标等全局偏好。
3. 实现数据概览：各模块数量、最近更新时间、最近备份时间。
4. 实现导入预览的详细信息、回滚点列表和恢复回滚点。
5. 实现全局搜索：备忘、计划、自媒体内容、开发项目与待办、客户、游戏。
6. 实现快速记录全部类型：备忘、今日任务、自媒体选题、开发待办、咨询跟进、训练记录、饮食记录、游戏记录。
7. 统一今日计划、健身计划和饮食计划的日期切换组件。
8. 编写搜索和快速记录端到端测试。

**验收门槛**

- [ ] 修改首页摘要配置后立即生效，刷新后保留。
- [ ] 全局搜索能找到七类内容并正确跳转。
- [ ] 所有快速记录类型都能保存到对应模块。
- [ ] 导入前回滚点可以恢复，数据与导入前一致。

### P11 全量验收与交付

**目标**：逐条完成 PRD 第 10 章验收，交付可长期使用的 v1.0。

**任务**

1. 按 PRD 第 10 章逐条执行 E2E 和手动验收，记录证据。
2. 手动验证：断网可用、关闭浏览器后数据仍在、重启电脑后数据仍在、导出文件可移动到其他目录后导入成功。
3. 视觉走查：1280、1440、1920 三种宽度；空状态、长文本、大量数据的表现。
4. 性能抽查：今日计划 1000 条、开发日志 500 条时页面仍然可操作。
5. 编写 README.md：日常启动、开发命令、备份恢复、常见问题。
6. 编写 ACCEPTANCE.md：PRD 每条验收标准对应结果和证据（截图、测试文件或操作记录）。
7. 最终构建并验证 `启动应用.bat`，生成 git 标签 v1.0。

**验收门槛**

- [ ] PRD 第 10 章全部验收项通过并记录证据。
- [ ] 从干净目录执行安装、构建、启动可以复现成功。
- [ ] README 和 ACCEPTANCE.md 完整。
- [ ] 已打 v1.0 标签。

## 6. 测试与验收策略

### 6.1 测试分层

| 层级 | 工具 | 覆盖范围 |
| --- | --- | --- |
| 单元测试 | Vitest + fake-indexeddb | 数据层、仓储、跨模块同步、日期工具、备份校验 |
| 组件测试 | Testing Library | 关键表单、看板卡片、日期切换、空状态 |
| 端到端测试 | Playwright | 每个模块主流程、持久化、备份恢复、搜索 |
| 手动验收 | 浏览器操作 | 断网、重启电脑、导出文件搬家、视觉走查 |

### 6.2 持久化测试方法

Playwright 使用持久化上下文（`launchPersistentContext`）和临时用户目录：

1. 新建一条计划数据，刷新页面，断言数据存在。
2. 关闭浏览器上下文，用同一用户目录重新打开，断言数据存在。
3. 完成数据增删改后，对比重新打开前后的数据一致。

重启电脑属于手动验收项，无法完全自动模拟，在 P11 中人工确认并记录。

### 6.3 PRD 验收追溯

| PRD 验收章节 | 实现阶段 | 验证方式 |
| --- | --- | --- |
| 10.1 运行和环境 | P2、P11 | shell-navigation.spec.ts、手动断网检查 |
| 10.2 数据持久化 | P1、P3 | persistence.spec.ts、单元测试、手动重启检查 |
| 10.3 备份和恢复 | P1、P2、P10 | settings-backup.spec.ts、backup 单元测试 |
| 10.4 导航和全局功能 | P2、P10 | shell-navigation.spec.ts、search-quickcapture.spec.ts |
| 10.5 首页和今日计划 | P3 | home-plan.spec.ts、planLink 单元测试 |
| 10.6 各模块可实际操作 | P4–P9、P10 | 各模块 spec 文件 |
| 10.7 交互底线 | P2、P11 | 组件测试、截图走查、手动验收 |

### 6.4 每个阶段的固定检查命令

```text
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

任一命令失败，不允许进入下一阶段。

## 7. 风险与应对

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| 浏览器数据被清理 | 本地数据丢失 | 强化备份入口、显示最近备份时间、清空前警告、保留导入前回滚点 |
| 端口或访问地址变化 | 旧数据看似消失 | 固定 5173 和 4173，`strictPort: true`，文档中写死访问地址 |
| 系统没有 npm | 无法开发和启动 | P0 准备便携 Node 到 `tools/node-lts/`，启动脚本固定使用它 |
| 模块范围大导致延期 | 交付不完整 | 严格按 P0–P11 推进，每阶段先过验收门槛 |
| 跨模块同步写乱 | 首页和今日计划状态不一致 | 同步逻辑只允许写在 planLink.ts，用单元测试锁住 |
| 数据库结构后续变化 | 旧数据无法打开 | Dexie 版本升级加迁移函数，备份文件带 schemaVersion |
| 拖拽在大量数据时卡顿 | 操作体验差 | 看板列和列表使用虚拟滚动或分页，P11 做性能抽查 |
| 日期跨天出错 | 顺延、记录日期错误 | 日期工具统一实现，覆盖 23:59 到 00:01 的单元测试 |
| 长文本撑破布局 | 页面错位 | 所有详情区支持换行和滚动，P11 用长文本数据走查 |

## 8. 交付物清单

- [ ] 可运行的源代码仓库，按阶段提交。
- [ ] `dist/` 构建产物。
- [ ] `tools/node-lts/` 便携运行环境（不进 git）。
- [ ] `tools/serve.mjs` 本地静态服务器。
- [ ] `启动应用.bat` 一键启动脚本。
- [ ] README.md 使用和开发说明。
- [ ] ACCEPTANCE.md 验收记录。
- [ ] 一份实际导出的示例备份文件（用于验证导入流程，不包含真实隐私数据）。
- [ ] git 标签 v1.0。

## 9. 执行节奏与提交规范

每个阶段的固定流程：

1. 读取 PRD.md 和本计划中对应阶段。
2. 检查 git 状态，创建阶段分支，例如 `phase-3-home-plan`。
3. 一次只实现一个完整小功能，写完立即本地验证。
4. 运行第 6.4 节的五条检查命令。
5. 把验收证据补充到 ACCEPTANCE.md。
6. 提交一次，提交信息格式：`feat(plan): 完成今日计划拖拽排序`。
7. 阶段验收通过后合并回主分支，再进入下一阶段。

## 10. 下一步

本计划确认后，从 P0 开始执行：准备便携 Node 环境、生成工程脚手架、配置开发和启动脚本，并完成首次提交。P0 验收通过后再进入 P1 数据层。
