# split fiction

在线访问：[duofolio.github.io/split_fiction](https://duofolio.github.io/split_fiction/)

代码仓库：[duofolio/split_fiction](https://github.com/duofolio/split_fiction)

双人个人网站。首页使用斜线分割：左上角 yuan chao 进入 GitHub 项目页，右下角 KingBob34 进入游戏开发个人页，重点展示节点式互动叙事引擎 Loom。支持手机与桌面浏览。

首页向上滚动或上滑进入 yuan chao，向下滚动或下滑进入 KingBob34。斜切区域随手势渐进展开，反向滑动可收回；也可点击入口或使用方向键。进入后恢复个人页的正常滚动。尊重系统减少动态效果的设置。

## 绑定账号

分别编辑 `dist/profile.js`（yuan chao）和 `dist/king-bob-profile.js`（KingBob34）的 `username`。页面通过 GitHub 公开 API 加载资料，不需要令牌，不访问私有仓库。暂未绑定时会显示明确提示。

可通过 `bio`、`about` 固定个人简介，通过 `projects` 按仓库完整名称设置展示标题和说明；这些文案不会被 GitHub 刷新覆盖。项目搜索支持仓库名和自定义文案。

## 本地预览

运行 `node serve.cjs`，访问 http://127.0.0.1:4173 。

## GitHub Pages

仓库已配置 `.github/workflows/deploy-pages.yml`，直接发布 `personal-site/dist/`，不需要搬动文件或运行构建命令。

首次部署在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。GitHub Free 的 Pages 需要公开仓库；私有仓库需要支持 Pages 的付费方案。

启用后，向 `master` 推送网页修改会自动部署；也可以在 **Actions → Deploy GitHub Pages → Run workflow** 手动发布。等待部署成功后，在 **Settings → Pages** 查看公网地址。

所有静态资源使用相对地址，兼容个人主页和项目子路径。部署只包含 `dist/` 下的网页与素材。

组织改名后，已有本地克隆可运行 `git remote set-url origin https://github.com/duofolio/split_fiction.git` 更新远程地址。本地文件夹名称不影响网站地址。

当前使用项目站点，访问地址包含仓库路径 `/split_fiction/`。`https://duofolio.github.io/` 是组织主页地址，不是此仓库的入口；请分享上方完整网址。

## 个性化

- 分屏首页：`dist/index.html`、`dist/split.css` 与 `dist/split.js`
- yuan chao 内容：`dist/yuan-chao.html` 与 `dist/styles.css`
- KingBob34 页面与样式：`dist/king-bob.html`、`dist/king-bob.css`
- 账号与离线资料：`dist/profile.js`、`dist/king-bob-profile.js`
- GitHub 数据加载：`dist/app.js`

公开 API 可能受到网络或请求配额限制；可以在 `profile.js` 的 `snapshot` 中保存 `{ profile, repositories }` 作为回退数据。

Loom 截图 `dist/assets/loom-editor.png` 来自 [Loom 公开仓库](https://github.com/KingBob34/pgt_project/blob/develop/docs/images/editor-enable.png)。重点项目介绍直接保存在 HTML 中，GitHub API 不可用或 JavaScript 被禁用时仍可阅读。

`dist/` 是当前网站源文件；根目录中的 `split-fiction.zip` 和 `split-fiction-preview.png` 是初始版本的历史导出，不用于当前部署。
