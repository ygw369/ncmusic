# 项目经历：NCMusic — 仿网易云音乐播放器

## 项目概述

独立开发的一款在线音乐播放器，基于 Vue 3 生态全家桶构建，支持歌曲搜索、歌单浏览、播放队列管理、歌词同步、三种播放模式等核心功能。

**技术栈**：Vue 3（Composition API）+ Pinia + Vue Router + Vite + Axios

**项目地址**：https://github.com/ygw369/ncmusic

**开发周期**：约 2 周

---

## 职责描述

**1. 全局播放状态管理（Pinia Store）**

- 将 Audio 实例与组件生命周期剥离，存放在 Pinia Store 外部，实现跨页面无缝播放
- 所有播放状态（currentTime、duration、isPlaying 等）通过 store ref 响应式全局共享
- 设计 `playSong` / `togglePlay` / `playNext` / `playPrev` / `setProgress` 等播放控制方法
- 实现播放队列增删改查 + localStorage 持久化，刷新后自动恢复

**2. 歌词同步与滚动**

- 解析 LRC 格式歌词（兼容 `[mm:ss.xx]` 和 `[mm:ss.xxx]` 两种毫秒格式），按时间排序
- 使用 computed 实时计算当前高亮行索引
- 采用 `scrollIntoView` 实现歌词自动居中滚动
- 通过 `wheel` 事件 + 空闲检测（idle detection）解决用户手动滚动与自动滚动的冲突

**3. 播放模式切换**

- 实现列表循环 / 单曲循环 / 随机播放三种模式，状态持久化至 localStorage
- 随机播放使用 do-while 避免连续重复同一首歌

**4. 进度条拖动**

- 进度条支持点击跳转和拖拽 seek
- 将鼠标事件拆分到 `mousedown → document.mousemove → mouseup`，解决鼠标移出进度条区域后拖动中断的问题
- 抽取 `calcRatio` 工具函数，复用至播放页和底部迷你进度条
- 使用 `onBeforeUnmount` 清理 document 级事件监听，防止内存泄漏

**5. 全局底部播放栏 + 播放队列弹窗**

- App.vue 统一管理底部栏，通过 `route.name` 判断是否在播放页，避免重复展示
- 使用 Vue 内置 `<Teleport to="body">` 渲染弹窗，规避 z-index 层级问题
- 实现「添加到下一首」功能：先从原位置删除再插入当前歌后，处理索引偏移

**6. 接口并行请求与错误处理**

- 使用 `Promise.all` 并行请求歌曲详情、歌词、播放 URL，减少加载等待时间
- 对 API 返回的空数组/空对象做防御性判断（可选链 + 默认值），防止崩溃

---

## 技术亮点

| 亮点 | 实现细节 |
|------|---------|
| **Audio 全局化** | Audio 实例定义在 Pinia Store 外部，组件销毁后音乐不中断 |
| **状态持久化** | 播放队列 + 模式 + 当前索引存 localStorage，刷新可恢复 |
| **滚动不冲突** | wheel 事件 + 1s 空闲检测，用户手动翻歌词时自动滚动暂停 |
| **内存清理** | onBeforeUnmount 中移除 document 监听 + 清除定时器 |
| **组件复用** | MusicList 通过路由 query.type 区分歌单/歌手两种数据源 |
| **CSS 动画** | 播放封面 20s 线性旋转动画，暂停瞬间停住 |
| **防御性编程** | API 数据解析使用可选链 `?.` 和默认值，避免空引用崩溃 |

---

## 踩坑记录与解决

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| `currentSongIndex` 被减去两次 | `removeFromListByIndex` 和 `addSongToPlay` 都减了索引 | 只保留一处的索引调整 |
| 正则死循环导致内存爆炸 | 去掉 `/g` 后 `exec` 永远返回第一个匹配 | `lastIndex = 0` 重置，而非去掉 `/g` |
| ID 类型不匹配重复插入 | 路由 query 是字符串，API 返回数字，`===` 不成立 | `String(item.id) === String(id)` |
| 进度条拖动出界失效 | mousemove 挂在进度条上 | 改挂 document，onBeforeUnmount 清理 |
