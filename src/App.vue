<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { ref, onMounted ,onBeforeUnmount } from 'vue';

import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

import { useUserStore } from '@/stores/user';
const userStore = useUserStore();

import { usePlayStore, calcRatio } from '@/stores/play';
const playStore = usePlayStore();



// 应用启动时从 localStorage 恢复登录状态
onMounted(() => {
  userStore.initFromLocalStorage();
});



const searchKeyword = ref('');
const handleSearch = () => {
  const trimmedKeyword = searchKeyword.value.trim();
  searchKeyword.value = ''
  if (!trimmedKeyword) {
    return
  }
  router.push({
    name: 'search',
    query: {
      keyword: trimmedKeyword
    }
  });
}


const handlePlaylistClick = () => {
  playStore.showPlayList = !playStore.showPlayList

}

const handleLogout = () => {
  userStore.clearUser()
  router.push('/')
}

//定义用户是否拖动进度进度条
const isDragging = ref(false)

//获取进度条元素
const progressBarRef = ref(null)

const handleProgressMouseDown = (e) => {
  isDragging.value = true
  seek(e)
  document.addEventListener('mousemove', handleProgressMouseMove)
  document.addEventListener('mouseup', handleProgressMouseUp)
}
const handleProgressMouseMove = (e) => {
  if (!isDragging.value) return
  seek(e)
}
const handleProgressMouseUp = (e) => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleProgressMouseMove)
  document.removeEventListener('mouseup', handleProgressMouseUp)
}


const seek = (e) => {
  //获取到添加了Ref的进度条元素
  const bar = progressBarRef.value
  if (!bar) return
  //获取点击的x坐标
  const mouseX = e.clientX
  //获取拖动进度条的进度比例
  const percent = calcRatio(bar, mouseX)
  //根据拖动进度条的进度比例，计算当前播放时间
  const time = percent * playStore.duration
  playStore.setProgress(time)
}

onBeforeUnmount(() => {
  // 清理进度条拖动的 document 监听
  document.removeEventListener('mousemove', handleProgressMouseMove)
  document.removeEventListener('mouseup', handleProgressMouseUp)
})


</script>

<template>
  <div class="app">
    <header class="top-nav">
      <div class="top-nav-inner">
        <div class="logo">

        </div>
        <nav class="nav-links">
          <RouterLink to="/" class="nav-link">音乐馆</RouterLink>
          <RouterLink to="/mymusic" class="nav-link">我的音乐</RouterLink>
        </nav>
        <div class="nav-actions">
          <div class="search-box">
            <input type="text" placeholder="搜索歌曲、歌手或专辑" class="search-input" v-model="searchKeyword"
              @keyup.enter="handleSearch">
          </div>
          <RouterLink to="/login" class="login-btn" v-if="!userStore.isLoggedIn">登录</RouterLink>
          <div v-else class="user-menu">
            <button class="user-avatar" type="button">
              <img :src="userStore.user.avatar" alt="用户头像" class="user-avatar-img">

            </button>
            <div class="user-dropdown">
              <div class="user-dropdown-header">
                <span class="user-name">{{ userStore.user.nickname || '我的账号' }}</span>
              </div>
              <button class="user-dropdown-item " type="button" @click="handleLogout">退出登录</button>
            </div>

          </div>
        </div>

      </div>

    </header>
    <RouterView />
    <div v-if="playStore.hasSong && route.name !== 'player'" class="play-bar">

      <!-- 底部进度条 -->
      <div class="play-bar-progress" ref="progressBarRef" @mousedown="handleProgressMouseDown">
        <div class="play-bar-progress-inner"
          :style="{ width: playStore.duration ? `${(playStore.currentTime / playStore.duration) * 100}%` : '0%' }">
        </div>
      </div>

      <!-- 左侧：封面 + 歌曲信息，点击跳到播放页 -->
      <div class="play-bar-left" @click="router.push({ name: 'player' })">
        <img :src="playStore.songCover" class="play-bar-cover" />
        <div class="play-bar-info">
          <span class="play-bar-title">{{ playStore.songTitle }}</span>
          <span class="play-bar-artist">{{ playStore.songArtist }}</span>
        </div>
      </div>

      <!-- 中间：播放/暂停 + 下一首 -->
      <div class="play-bar-center">
        <button @click.stop="playStore.playPrev()">⏮ </button>
        <button @click.stop="playStore.togglePlay()">
          {{ playStore.isPlaying ? '⏸' : '▶' }}
        </button>
        <button @click.stop="playStore.playNext()">⏭</button>
        <button class="play-bar-mode-btn" @click="playStore.togglePlayMode()">
          <img v-if="playStore.playMode === 'list'" src="./assets/imgs/顺序播放.svg" alt="" class="mode-icon">
          <img v-else-if="playStore.playMode === 'random'" src="./assets/imgs/随机播放.svg" alt="" class="mode-icon">
          <img v-else src="./assets/imgs/单曲循环.svg" alt="" class="mode-icon">
        </button>
      </div>

      <!-- 右侧：歌单列表 -->
      <div class="play-bar-right">
        <button @click="handlePlaylistClick"><img class="playlist-icon" src="./assets/imgs/list.svg" alt=""></button>
      </div>

    </div>

    <!-- 弹出层：当前播放队列 -->
    <Teleport to="body">
      <div v-if="playStore.showPlayList" class="playlist-popup" @click.self="playStore.showPlayList = false">
        <div class="playlist-popup-inner">
          <h3>播放列表</h3>
          <ul v-if="playStore.songList.length > 0">
            <li v-for="(item, index) in playStore.songList" :key="index"
              :class="{ active: index === playStore.currentSongIndex }"
              @click="playStore.setPlayList(playStore.songList, index); playStore.showPlayList = false">
              <span class="pl-index">{{ index + 1 }}</span>
              <div class="pl-main">
                <span class="pl-name">{{ item.name }}</span>
                <span class="pl-artist">{{ item.artist }}</span>
              </div>
              <button class="pl-next-btn" @click.stop="playStore.addSongToPlay(item)">
                <img src="./assets/imgs/add.svg" alt="" title="添加到下一首" class="add-icon">
              </button>
              <button class="pl-next-btn" @click.stop="playStore.deleteCurrentSong(index)">
                <img src="./assets/imgs/delete.svg" alt="" title="删除" class="delete-icon">
              </button>
            </li>
          </ul>
          <p v-else class="pl-empty">暂无歌曲</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, 'Noto Sans', sans-serif;

}

.top-nav {
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #242424;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.top-nav-inner {
  width: 100%;
  max-width: 1200px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.logo {
  background: url(./assets/imgs/topbar.png) no-repeat 0 9999px;
  float: left;
  width: 176px;
  height: 69px;
  background-position: 0 0;
}

.logo-text {
  float: left;
  width: 157px;
  height: 100%;
  padding-right: 20px;
  text-indent: -9999px;
  display: block;
}

.nav-links {
  display: flex;
  gap: 24px;
  margin-left: 24px;
}

.nav-link {
  color: #e5e5e5;
  text-decoration: none;
  font-size: 16px;
  padding: 8px 16px;
  border-radius: 18px;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #fff;
  background: #c20c0c;
}

.nav-link.router-link-active {
  color: #fff;
  background: #c20c0c;
}

.nav-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.user-menu {
  position: relative;
}

.search-box {
  margin-right: 16px;
}

.search-input {
  width: 180px;
  height: 32px;
  padding: 0 12px;
  border-radius: 16px;
  border: none;
  outline: none;
  background: #fff;
  font-size: 13px;
}

.search-input::placeholder {
  color: #999;
}

.login-btn {
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid #c20c0c;
  color: #c20c0c;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
}

.login-btn:hover {
  background: #c20c0c;
  color: #ffffff;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  cursor: pointer;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 50%;
}

.user-dropdown {
  position: absolute;
  top: 36px;
  right: 0;
  min-width: 140px;
  padding: 8px 0;
  border-radius: 8px;
  background: #2d2d2d;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  opacity: 0;
  pointer-events: none;
  transform: translateY(4px);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.user-dropdown-header {
  padding: 4px 14px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 4px;
}

.user-name {
  font-size: 12px;
  color: #f5f5f5;
}

.user-dropdown-item {
  width: 100%;
  padding: 6px 14px;
  border: none;
  background: transparent;
  color: #f5f5f5;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.user-dropdown-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.user-menu:hover .user-dropdown {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.main-view {
  flex: 1;
}

.app--has-bar .main-view {
  padding-bottom: 64px;
}

.audio-hidden {
  display: none;
}

/* ========== 底部播放栏 ========== */
.play-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background: #2b2b2b;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-sizing: border-box;
  z-index: 999;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
}

.play-bar-progress {
  position: absolute;
  top: -6px;
  left: 0;
  width: 100%;
  height: 14px;
  background: transparent;
  cursor: pointer;
}

.play-bar-progress-inner {
  position: absolute;
  top: 6px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #ff4b2b, #ff416c);
  transition: width 0.2s linear;
}

.play-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  min-width: 0;
  flex: 1;
}

.play-bar-cover {
  width: 42px;
  height: 42px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.play-bar-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.play-bar-title {
  color: #e5e5e5;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.play-bar-artist {
  color: #999;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.play-bar-center {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  margin: 0 16px;
}

.play-bar-center button {
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
}

.play-bar-center button:hover {
  color: #c20c0c;
}

.play-bar-mode-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.mode-icon {
  width: 18px;
  height: 18px;
  display: block;
  opacity: 0.6;
}

.play-bar-mode-btn:hover .mode-icon {
  opacity: 1;
}

.play-bar-right {
  flex-shrink: 0;
}

.play-bar-right button {
  background: none;
  border: none;
  color: #ccc;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

.playlist-icon {
  width: 20px;
  height: 20px;
  opacity: 0.7;
}

.play-bar-right button:hover .playlist-icon {
  opacity: 1;
}

/* 播放列表弹窗 */
.playlist-popup {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.playlist-popup-inner {
  width: 90%;
  max-width: 560px;
  max-height: 75vh;
  background: #1e1e1e;
  border-radius: 12px;
  padding: 24px;
  overflow-y: auto;
}

/* 弹窗滚动条 - 暗色细条 */
.playlist-popup-inner::-webkit-scrollbar {
  width: 4px;
}

.playlist-popup-inner::-webkit-scrollbar-track {
  background: transparent;
}

.playlist-popup-inner::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.playlist-popup-inner::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.playlist-popup-inner h3 {
  margin: 0 0 12px;
  color: #fff;
  font-size: 16px;
  text-align: center;
}

.playlist-popup-inner li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  color: #eee;
  font-size: 13px;
}

.playlist-popup-inner li:hover {
  background: rgba(255, 255, 255, 0.08);
}

.playlist-popup-inner li.active {
  color: #c20c0c;
}

.playlist-popup-inner li.active .pl-name,
.playlist-popup-inner li.active .pl-index,
.playlist-popup-inner li.active .pl-artist {
  color: #c20c0c;
}

.pl-index {
  width: 24px;
  text-align: center;
  color: #aaa;
  flex-shrink: 0;
}

.pl-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pl-name {
  font-size: 13px;
  color: #eee;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pl-artist {
  color: #aaa;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pl-next-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
  margin-left: 8px;
}

.add-icon {
  width: 20px;
  height: 20px;
  opacity: 0.5;
  display: block;
}

.pl-next-btn:hover .add-icon {
  opacity: 1;
}

.delete-icon {
  width: 16px;
  height: 16px;
  opacity: 0.4;
  display: block;
}

.pl-next-btn:hover .delete-icon {
  opacity: 1;
}

.pl-empty {
  color: #aaa;
  text-align: center;
  padding: 24px 0;
}
</style>
