# NCMusic

仿网易云音乐前端播放器，基于 Vue 3 + Pinia + Vue Router 构建。

## 功能

- 歌曲播放（队列跨页面存活，切页不打断）
- 播放队列（添加、删除、插入下一首，localStorage 持久化）
- 三种播放模式（列表循环、随机播放、单曲循环）
- 歌词同步（实时高亮、自动居中滚动、点击跳转、手动翻不受干扰）
- 进度条拖动（播放页和底部迷你条均支持点击和拖拽）
- 封面旋转动画（播放旋转、暂停停住）
- 关键词搜索
- 网易云账号登录，浏览个人歌单
- 刷新恢复播放队列和播放模式

## 快速开始

### 1. 启动后端 API

```bash
git clone https://github.com/Binaryify/NeteaseCloudMusicApi.git
cd NeteaseCloudMusicApi
npm install
node app.js
```

后端默认运行在 `http://localhost:3000`。

### 2. 启动前端

```bash
git clone https://github.com/ygw369/ncmusic.git
cd ncmusic
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`。打开浏览器访问即可。

## 项目结构

```
src/
├── stores/
│   ├── play.js       # 核心：Audio 实例、播放状态、队列、持久化
│   └── user.js       # 用户登录状态
├── views/
│   ├── Player.vue    # 播放页（歌词滚动、进度控制）
│   ├── MusicHall.vue # 首页（推荐歌单、新歌、歌手排行）
│   ├── MusicList.vue # 歌单/歌手歌曲列表（复用两种数据源）
│   ├── Search.vue    # 搜索结果页
│   ├── MyMusic.vue   # 我的歌单
│   └── Login.vue     # 登录页
├── router/index.js   # 路由配置
├── api/index.js      # Axios 封装
└── App.vue           # 全局底部播放栏 + 播放队列弹窗
```

## 架构说明

- Audio 实例存放在 Pinia store 外部，组件销毁后音乐不中断
- 所有播放状态通过 store ref 全局共享
- 歌词解析兼容 `[mm:ss.xx]` 和 `[mm:ss.xxx]` 格式
- 播放队列通过 localStorage 持久化，刷新后自动恢复
- 进度条拖动通过 `mousedown -> document mousemove -> mouseup` 实现，`onBeforeUnmount` 清理监听

## 技术栈

Vue 3 (Composition API) / Pinia / Vue Router / Vite / Axios

后端依赖 [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)

## License

MIT
