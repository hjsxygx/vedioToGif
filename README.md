# 视频转 GIF（纯前端 H5）

一个无需后端、在浏览器本地把视频片段转换为 GIF 动图的小工具。支持上传视频、选择时间片段、调节 GIF 参数并下载结果。

## 功能特性

- 拖拽/点击上传本地视频文件（MP4 / WebM 等常见格式，取决于浏览器解码能力）
- 视频预览：显示总时长与当前播放时间
- 片段截取：通过 `HH:MM:SS` 输入开始/结束时间，支持一键预览选中片段
- GIF 参数：尺寸（320/480/720/原始）、帧率（5–30fps）、质量（1–20）、抽帧速度（1–8x）、是否循环
- 进度可视化：抽帧进度 + GIF 编码进度
- 生成结果预览与一键下载（自动命名）

## 在线/本地运行

这是一个纯静态页面项目，直接用浏览器打开即可使用；为了更稳妥的兼容性，推荐用本地 HTTP 服务启动。

### 方式一：直接打开

双击打开 `index.html`。

### 方式二：本地 HTTP 服务（推荐）

在项目根目录执行（PowerShell）：

```powershell
py -m http.server 5173
```

然后在浏览器打开：

```
http://localhost:5173/
```

如果你的环境没有 `py`，可以改用：

```powershell
python -m http.server 5173
```

## 使用说明

1. 打开页面后，在「1. 上传视频」区域拖拽视频文件，或点击「选择文件」。
2. 在「2. 视频预览」中确认视频是否可正常播放、总时长是否读取成功。
3. 在「3. 选择时间片段」里输入开始/结束时间（格式：`HH:MM:SS`），可点击「预览选中片段」快速确认范围。
4. 在「4. GIF 参数设置」里调整尺寸、帧率、质量、抽帧速度、循环等。
5. 点击「开始转换为 GIF」，等待进度完成后在「5. 结果预览与下载」里下载生成的 GIF。

## 参数建议

- 想要更小体积：降低尺寸（如 320/480）、降低帧率、提高 `质量` 数值（gif.js 的 `quality` 数值越大通常压缩越强、速度更快但细节更少）。
- 想要更清晰：提高尺寸、提高帧率、降低 `质量` 数值（但文件会更大、耗时更长）。
- 抽帧速度：用于加速播放抽帧（`1x–8x`），速度越快通常越省时；若遇到抽帧不稳定会自动回退到逐帧 `seek` 的提取方式。

## 技术说明

- 前端：`index.html` + `styles.css` + `app.js`
- GIF 生成：使用 `gif.js`（通过 CDN 引入）
- Worker：优先使用 CDN 的 `gif.worker.js`，若不可用则退化为单线程模式

相关代码位置：

- 页面结构：`index.html`
- 转换逻辑：`app.js`（核心入口 `convertToGif()`）

## 浏览器兼容性

- 建议使用较新的 Chromium 内核浏览器（Chrome / Edge）
- 其他浏览器能否支持主要取决于对视频格式的解码能力，以及对 `requestVideoFrameCallback` 的支持（项目已做兼容回退）

## 隐私与安全

- 视频文件只在本地浏览器中处理，不会上传到服务器
- 项目会从 CDN 加载 `gif.js` 与 `gif.worker.js` 脚本（如需完全离线，请将依赖改为本地文件并更新引用）

## 项目结构

```
.
├─ index.html      # 页面入口
├─ styles.css      # 样式
├─ app.js          # 业务逻辑：上传/预览/抽帧/生成 GIF
└─ log/            # 操作与记录（非运行必需）
```

## 上传到 GitHub

在项目根目录执行（PowerShell），把 `yourname` / `repo` 换成你的仓库信息：

```powershell
git init
git add .
git commit -m "init: video to gif"
git branch -M main
git remote add origin https://github.com/yourname/repo.git
git push -u origin main
```

如果你还没有创建远程仓库：先在 GitHub 新建一个空仓库（不要勾选自动生成 README），再执行上面的命令。

## 致谢

- [gif.js](https://github.com/jnordberg/gif.js)

