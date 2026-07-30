# Changelog

## 0.2.1 - 2026-07-30

### Added

- 设置面板新增独立 `本地体积` 入口，以面板形式展示设置、已读、稍后看、阅读进度、自动购买记录和资源库的 localStorage 占用、记录数量、上限比例和清理建议。

### Fixed

- 修复回复页快捷回复可能挂到隐藏设置面板输入框里，导致当前页面回复区看不到快捷回复按钮的问题。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`

## 0.2.0 - 2026-07-30

### Added

- 资源中心升级为资源工作台：支持资源勾选、多选批量复制、批量标记待下载 / 已处理 / 失效，以及选中资源备注和标签维护。
- 新增来源帖分组视图，可按帖子聚合资源，并支持选择分组、复制分组和复制 Markdown 清单。
- 资源记录新增备注和标签展示，搜索与筛选可覆盖备注 / 标签，下载清单和 Markdown 清单同步输出备注、标签和状态。

### Changed

- 资源工作台顶部统计会显示待下载、已选数量和来源分组状态，便于大批资源整理。

### Fixed

- 修复资源工作台筛选栏在控件较多时搜索框被挤成窄空白框的问题，控制项会自动换行并保留可读宽度。
- 修复资源工作台等中心面板搜索框中文输入法组词被重渲染打断的问题，组词结束后再触发筛选。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`

## 0.1.12 - 2026-07-29

### Changed

- 预览图面板改为首批渲染 36 张图片，滚动到底部或点击 `加载更多图片` 再追加下一批，减少多图帖子首次打开时的 DOM 和图片加载压力。
- 预览图缩略图启用浏览器原生懒加载，悬停放大图改为鼠标悬停或键盘聚焦时再加载，避免重复提前请求大图。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`

## 0.1.11 - 2026-07-29

### Added

- 数据健康面板新增本地存储体积统计：按设置、已读、稍后看、阅读进度、自动购买记录和资源库展示 JSON 文本估算大小、记录数量和上限提示。

### Changed

- 数据健康统计补齐资源库输入，清理建议会提示接近记录上限或单项占用较高的数据类别，方便先导出备份再清理。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`

## 0.1.10 - 2026-07-29

### Changed

- 设置面板移除重复的 `隐藏广告` 和 `首页模块全屏` 开关；对应功能仍保留在工具箱内，并继续按原设置生效。
- 自动购买开关和购买价格上限恢复为全局设置入口，不再只在阅读页显示，避免从列表页或首页打开设置时看不到 SP 限制。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`

## 0.1.9 - 2026-07-29

### Added

- 新增分组工具箱：右下角工具栏保留 `顶部`、`底部`、`工具`、`设置` 四个高频入口，其他功能在工具箱内按页面导航、阅读模式、我的中心和设置分组展示完整名称与说明。
- 扩展常用 Plus 镜像域名匹配，覆盖 South / North / Level / Soul / Snow / Spring / Summer / Blue / White Plus 的根域和子域访问方式。

### Changed

- 优化工具栏与工具箱视觉样式：按钮改为更清晰的两字入口，工具箱增加分组数量、卡片悬停态、激活态和移动端单列布局。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`

## 0.1.8 - 2026-07-28

### Changed

- 回复表单原生 `提交` 按钮接入无刷新提交：点击页面自带提交按钮后，会复用 AJAX 提交并局部刷新帖子内容，避免整页刷新。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`

## 0.1.7 - 2026-07-28

### Added

- 资源中心新增待下载队列处理：支持复制当前筛选范围内的待下载资源，并可将当前筛选资源导出为带类型、提取码、来源帖和状态的文本清单。

### Changed

- 增强资源识别：新增电驴 `ed2k`、压缩包 / 镜像文件、更多跳转包装参数和提取码 / 访问码 / 解压码文案识别，自动购买资源跳转与资源中心同步支持这些类型。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`

## 0.1.6 - 2026-07-27

### Changed

- 优化单文件结构：拆分样式规则生成和工具栏配置构建，降低后续维护导航、阅读布局、中心面板和工具栏入口时的改动范围。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`

## 0.1.5 - 2026-07-26

### Added

- 新增资源中心：工具栏 `源` 入口可统一查看已保存的磁力、种子、百度网盘、其他云盘和外链资源，支持搜索、按状态 / 类型筛选、复制筛选结果、标记待下载 / 已处理 / 失效、来源帖跳转和批量清理。

### Changed

- 资源面板新增 `保存当前`，自动购买成功识别到资源后也会自动存入资源库；本地备份、导入预览和数据健康检查同步纳入资源库记录。
- 资源库记录按资源类型 + 规范化 URL 去重合并，兼容旧 key 或外链包装解析后的地址，避免同一网盘 / 种子重复保存。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`

## 0.1.4 - 2026-07-26

### Added

- 新增购买后资源跳转提示：自动购买成功并刷新帖子内容后，会识别磁力、种子、百度网盘、其他云盘和外链，提供快捷打开、复制全部和资源面板入口。

### Changed

- 增强资源链接识别：支持还原论坛外链跳转包装、`.torrent` 种子地址、网盘提取码，以及夸克、阿里、UC、115、蓝奏、天翼、123 云盘、微云、PikPak、迅雷云盘等多类云盘域名。
- 调整顶部导航为低饱和深灰配色，统一左侧入口与主导航文字颜色，小幅放大导航字号，并强化当前选中项对比。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`

## 0.1.3 - 2026-07-23

### Added

- 新增本地数据健康检查：设置面板可查看设置、已读、稍后看、阅读进度和自动购买记录统计，并清理重复 / 过期 / 异常数据。
- 新增资源链接提取器：阅读页楼层工具提供 `资源` 入口，可提取磁力、网盘、图片和外链，支持按全部楼层、本楼、作者或类型筛选复制。

### Changed

- 备份导入改为先读取并展示备份数据预览，再确认是否覆盖当前本地数据。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`

## 0.1.2 - 2026-07-20

### Added

- 新增预览图批量复制：阅读页预览图面板可一键复制当前显示的全部原图链接。
- 新增预览图大图筛选：预览图面板支持 `只看大图`，灯箱切图和批量复制会跟随当前筛选结果。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`

## 0.1.1 - 2026-07-20

### Added

- 新增中心面板搜索和筛选：`存`、`历`、`买` 三个中心支持按标题、楼层、状态或记录内容快速过滤。
- 新增中心面板批量处理：稍后看和最近浏览支持移除当前筛选结果，自动购买记录支持删除当前筛选结果。
- 新增楼层级阅读进度：阅读进度记录会保存当前楼层和下一未读楼层，支持从中心或阅读页首楼工具跳转 `未读楼层` / `上次楼层`。
- 新增稍后看 / 最近浏览标签分组：可为记录编辑标签，并在中心面板按标签筛选。
- 新增本地备份导出 / 导入：设置面板可导出设置、已读、稍后看、阅读进度和自动购买记录，并支持 JSON 备份覆盖导入。

### Changed

- `继续阅读` 从单纯恢复滚动位置升级为优先跳到下一未读楼层，保留 `上次楼层` 入口用于回到最后读到的楼层。
- 阅读进度更新会保留已有标签，避免滚动记录刷新时丢失手动分组。

### Fixed

- 修复楼层级续读误取每层重复 `topic` 锚点的问题，现在优先使用唯一的 `td_*` / `read_*` 楼层锚点。
- 修复阅读页跳转按钮使用旧进度状态的问题，现在点击 `未读楼层` / `上次楼层` 前会读取最新阅读进度。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`

## 0.1.0 - 2026-07-15

### Added

- 新增稍后看中心：支持查看、继续阅读、打开、移除、清空已保存主题。
- 新增阅读进度记录：保存页码、滚动位置和阅读百分比，支持一键继续阅读。
- 新增最近浏览中心：按最近阅读时间展示历史记录，支持继续阅读、打开、移除、清空。
- 新增自动购买记录中心：展示检查、跳过、购买中、完成、失败记录，支持打开帖子、删除单条记录、清空全部记录。
- 新增列表页批量操作：`可见稍后` 可保存当前筛选可见主题，`预载下页` 可预取下一页列表。
- 新增预览图灯箱：支持键盘切图、缩放和复制原图地址。
- 新增自动购买执行记录，避免刷新后重复触发同一帖子 / 楼层的购买流程。

### Changed

- 阅读进度达到显示口径的 `100%` 后不会被后续较低进度覆盖。
- 稍后看中心打开时会实时刷新阅读进度，不需要重新打开面板。
- 内部结构重构：抽象稍后看 / 最近浏览 / 自动购买记录三套中心面板，工具栏入口改为配置化生成，自动购买流程拆分为独立辅助函数，便于后续继续扩展。
- README 增加安装、更新、发布前验证和本地数据说明。

### Verified

- `node --check southplus_enhancer.user.js`
- `node southplus_enhancer.test.js`
- `git diff --check`
- 在普通 Google Chrome 的 South Plus 页面中临时注入验证：列表页批量稍后看、预载下页、最近浏览中心、自动购买记录中心。

## 0.0.3 - 2026-07-10

### Added

- 基础页面布局优化、阅读排版优化、首页模块增强、悬浮工具栏。
- 已读记录、稍后看、本地标题/作者屏蔽、列表筛选和悬停预览。
- 快捷回复和无刷新提交。
- 广告与干扰项隐藏。
