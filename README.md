# 个人工作生活专属 App

这是一个只在本机浏览器中运行的私人工作生活管理应用。数据保存在当前电脑的浏览器本地数据库中，不登录、不联网、不上传。

## 日常使用

1. 双击项目根目录的 `启动应用.bat`。
2. 浏览器会自动打开 `http://127.0.0.1:4173`。
3. 关闭页面不会删除数据；关闭浏览器、重启电脑后，再次双击启动脚本即可继续使用。

如果提示“应用尚未构建”，先运行一次：

```powershell
npm install
npm run build
```

当前电脑的项目目录包含便携 Node 运行环境，因此可以直接双击启动脚本。该运行环境不提交到 GitHub。

从 GitHub 克隆项目后，请先安装 Node.js LTS，再在项目根目录执行 `npm install` 和 `npm run build`，然后双击启动脚本。启动脚本会优先使用 `tools\node-lts`，找不到时自动使用系统 `node`。

## 开发命令

```powershell
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

开发服务器固定使用 `http://127.0.0.1:5173`，日常使用固定使用 `http://127.0.0.1:4173`。不要随意修改端口，否则浏览器会把它当成新的数据来源。

## 数据备份

进入“数据与设置”：

- 点击“导出完整备份”，生成单个 JSON 文件。
- 点击“导入备份”，会先显示预览并自动保存导入前回滚点。
- “按模块清空”和“清空全部数据”都需要二次确认。
- 导入后如果发现误操作，可以使用“导入回滚点”恢复。

建议至少每周导出一次备份，并把文件保存到其他目录或移动硬盘。

## 功能范围

- 首页总览
- 今日计划
- 自媒体
- 开发工作
- 咨询工作
- 健身计划
- 饮食计划
- 游戏娱乐
- 数据与设置

所有模块均支持刷新、关闭浏览器和重启电脑后保留数据。详细范围见 PRD.md，执行计划见 DEVELOPMENT_PLAN.md，验收结果见 ACCEPTANCE.md。

## 目录结构

```text
src/
  app/           应用壳和路由
  components/    通用组件
  data/          IndexedDB 数据层、仓储和业务服务
  domain/        类型和常量
  features/      九个模块页面
  stores/        界面状态
  styles/        全局样式
tests/
  e2e/           Playwright 端到端测试
tools/
  node-lts/      便携 Node 运行环境
  serve.mjs      日常使用的本地静态服务器
```

## 测试

单元和组件测试使用 Vitest，端到端测试使用 Playwright 和本机 Edge。测试覆盖数据持久化、备份恢复、跨模块同步、九个模块主流程和桌面布局。
