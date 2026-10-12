# split fiction

双人个人网站。首页使用斜线分割：左上角 yuan chao 进入现有 GitHub 项目页，右下角 King bob 进入内容留空的独立页面。支持手机与桌面浏览。

首页向上滚动或上滑进入 yuan chao，向下滚动或下滑进入 King bob。斜切区域随手势渐进展开，反向滑动可收回；也可点击入口或使用方向键。进入后恢复个人页的正常滚动。尊重系统减少动态效果的设置。

## 绑定账号

编辑 `dist/profile.js` 的 `username`。页面通过 GitHub 公开 API 加载资料，不需要令牌，不访问私有仓库。暂未绑定时会显示明确提示。

## 本地预览

运行 `node serve.cjs`，访问 http://127.0.0.1:4173 。

## GitHub Pages

将 `dist/` 中的文件放在 GitHub Pages 仓库根目录，再为对应分支启用 Pages。所有静态资源使用相对地址，兼容个人主页和项目子路径。

## 个性化

- 分屏首页：`dist/index.html`、`dist/split.css` 与 `dist/split.js`
- yuan chao 内容：`dist/yuan-chao.html` 与 `dist/styles.css`
- King bob 留空页面：`dist/king-bob.html`
- 账号与离线资料：`dist/profile.js`
- GitHub 数据加载：`dist/app.js`

公开 API 可能受到网络或请求配额限制；可以在 `profile.js` 的 `snapshot` 中保存 `{ profile, repositories }` 作为回退数据。
