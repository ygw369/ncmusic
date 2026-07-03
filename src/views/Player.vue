<script setup>
import { ref, computed, onMounted, watch, nextTick ,onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { usePlayStore, calcRatio } from '@/stores/play'
const playStore = usePlayStore()

const router = useRouter()
const route = useRoute()
const songId = computed(() => route.query.id)

//获取歌词容器
const lyricContainer = ref(null)

//定义用户是否在滚动歌词
const isScrolling = ref(false)

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



//格式化时间
const formatTime = (sec) => {
  if (!sec || !Number.isFinite(sec)) { return '00:00' }
  const minutes = Math.floor(sec / 60)
  const seconds = Math.floor(sec % 60)
  return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`
}







//歌词滚动 — 用 scrollIntoView 让当前高亮行居中
const scrollToCurrentLine = () => {
  if (isScrolling.value) return
  const container = lyricContainer.value
  if (!container) return

  const lineEl = container.querySelector('.lyrics-line--highlight')
  if (lineEl) {
    lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}


//定义滚动定时器
let scrollTimer = null

//监听鼠标滚轮事件，空闲检测2秒
const handleWheel = () => {
  isScrolling.value = true
  if (scrollTimer !== null) {
    clearTimeout(scrollTimer)
  }
  scrollTimer = setTimeout(() => {
    isScrolling.value = false
  }, 1000)
}



const lyricHighlightIndex = computed(() => {
  //从状态管理中获取当前播放时间
  const time = playStore.currentTime

  //从歌词中从后往前查找，找到第一个时间小于等于当前播放时间的歌词索引
  for (let i = playStore.lyrics.length - 1; i >= 0; i--) {
    if (playStore.lyrics[i].time <= time) {
      return i
    }
  }
  return 0
})

watch(lyricHighlightIndex, () => {
  nextTick(scrollToCurrentLine)
})




//组件挂载时，判断是否有歌曲id，有就播放歌曲，如果有且id与当前播放歌曲id相同，就返回
onMounted(() => {
  const id = songId.value
  if (!id) {
    return
  }
  if (playStore.songId == id && playStore.hasSong) {
    return
  }
  playStore.playSong(id)
})

onBeforeUnmount(() => {
  // 清理进度条拖动的 document 监听
  document.removeEventListener('mousemove', handleProgressMouseMove)
  document.removeEventListener('mouseup', handleProgressMouseUp)
  // 清理滚动防抖定时器
  clearTimeout(scrollTimer)
})

</script>

<template>
  <div class="player-page">
    <div class="player-top-bar">
      <button class="back-btn" @click="router.back()">
        <img src="@/assets/imgs/arrow-left.svg" alt="返回" class="back-arrow">
      </button>
    </div>
    <div class="player-inner">
      <div class="player-main">
        <!-- 左侧 -->
        <div class="player-left">
          <div class="cover-wrap">
            <div class="cover-disc" :class="{ spinning: playStore.isPlaying }">
              <img :src="playStore.songCover" alt="" class="cover-img">
            </div>
          </div>
          <div class="song-meta">
            <h2 class="song-name">{{ playStore.songTitle }}</h2>
            <p class="song-artist">{{ playStore.songArtist }}</p>
            <p class="song-album">{{ playStore.songAlbum }}</p>
          </div>
        </div>
        <!-- 右侧 -->
        <div class="player-right">
          <div class="lyrics-card">
            <h3 class="lyrics-title">歌词</h3>
            <div class="lyrics-content" ref="lyricContainer" @wheel="handleWheel">
              <template v-if="playStore.lyrics.length > 0"> <!--动态class -->
                <p v-for="(item, index) in playStore.lyrics" :key="index"
                  :class="{ 'lyrics-line--highlight': index === lyricHighlightIndex }" 
                  class="lyrics-line" 
                  @click="playStore.setProgress(item.time)">
                  {{ item.text }}
                </p>
              </template>
              <p v-else class="lyrics-line">暂无歌词</p>
            </div>
          </div>
        </div>
      </div>
      <!-- 播放按钮 -->
      <div class="player-controls">
        <div class="controls-main">
          <button @click="playStore.playPrev()" class="skip-btn">⏮</button>
          <button class="btn-circle btn-large" @click="playStore.togglePlay()">
            {{ playStore.isPlaying ? '⏸' : '▶' }}
          </button>
          <button @click="playStore.playNext()" class="skip-btn">⏭</button>
          <button class="mode-btn" @click="playStore.togglePlayMode()">
            <img v-if="playStore.playMode === 'list'" src="../assets/imgs/顺序播放.svg" alt="" class="mode-icon">
            <img v-else-if="playStore.playMode === 'random'" src="../assets/imgs/随机播放.svg" alt="" class="mode-icon">
            <img v-else src="../assets/imgs/单曲循环.svg" alt="" class="mode-icon">
          </button>
          <div class="btn-list" @click="playStore.showPlayList = !playStore.showPlayList">
            <img src="../assets/imgs/list.svg" alt="" class="playlist-icon">
          </div>
        </div>
        <div class="progress-wrap">
          <span class="time-label">{{ formatTime(playStore.currentTime) }}</span>
          <div class="progress-bar" @mousedown="handleProgressMouseDown" ref="progressBarRef">
            <div class="progress-inner"
              :style="{ width: playStore.duration ? `${(playStore.currentTime / playStore.duration) * 100}%` : '0%' }">
            </div>
          </div>
          <span class="time-label">{{ formatTime(playStore.duration) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-page {
  min-height: calc(100vh - 90px);
  background: radial-gradient(circle at top left, #2b2b2b, #000);
  color: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0 40px;
  box-sizing: border-box;
}

.player-top-bar {
  width: 100%;
  max-width: 1200px;
  padding: 16px 32px 0;
  box-sizing: border-box;
}

.back-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.15s;
}

.back-btn:hover {
  opacity: 1;
}

.back-arrow {
  width: 24px;
  height: 24px;
  display: block;
}

.player-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 16px;
}

.player-inner {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  padding: 0 32px;
  box-sizing: border-box;
}

.player-main {
  width: 100%;
  display: flex;
  gap: 32px;
}

.player-left {
  width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cover-wrap {
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, #444, #111);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
  cursor: pointer;
}

.cover-disc {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  overflow: hidden;
}

.cover-disc.spinning {
  animation: spin 20s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.song-meta {
  margin-top: 20px;
  text-align: center;
}

.song-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.vip-tag {
  display: inline-block;
  font-size: 12px;
  color: #c20c0c;
  border: 1px solid #c20c0c;
  border-radius: 3px;
  padding: 1px 6px;
  margin-left: 8px;
  vertical-align: middle;
  font-weight: 400;
}

.song-artist,
.song-album {
  margin: 6px 0 0;
  font-size: 13px;
  color: #cfcfcf;
}

.player-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.lyrics-card {
  width: 100%;
  max-height: 520px;
  padding: 18px 24px;
  border-radius: 16px;
  background: transparent;
  box-shadow: none;
  box-sizing: border-box;
}

.lyrics-title {
  margin: 0 0 16px;
  font-size: 18px;
  color: #fff;
  text-align: center;
  letter-spacing: 1px;
}

.lyrics-content {
  max-height: 460px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0;
}

.lyrics-line {
  margin: 6px 0;
  font-size: 16px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
  transition: color 0.2s ease, transform 0.2s ease;
  white-space: normal;
}

.lyrics-line--highlight {
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  transform: scale(1.02);
}

.lyrics-line--placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.lyrics-content::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.lyrics-content {
  scrollbar-width: none;
  scrollbar-color: transparent transparent;
}

.player-controls {
  width: 100%;
  padding: 16px 24px 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.controls-main {
  display: flex;
  align-items: center;
  gap: 24px;
}

.btn-list {
  margin-left: auto;
  cursor: pointer;
}

.btn-circle {
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: #fff;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
}

.btn-large {
  width: 56px;
  height: 56px;
  font-size: 22px;
}

.btn-circle:hover {
  transform: translateY(-1px);
}

.skip-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.skip-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}

.mode-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mode-icon {
  width: 18px;
  height: 18px;
  display: block;
  opacity: 0.8;
}



.progress-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-label {
  font-size: 12px;
  color: #c0c0c0;
}

.progress-bar {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff4b2b, #ff416c);
}

@media (max-width: 960px) {
  .player-inner {
    flex-direction: column;
  }

  .player-main {
    flex-direction: column;
    align-items: center;
  }

  .player-left {
    width: auto;
  }
}

.playlist-icon {
  width: 20px;
  height: 20px;
  opacity: 0.7;
}

.play-bar-right button:hover .playlist-icon {
  opacity: 1;
}
</style>
