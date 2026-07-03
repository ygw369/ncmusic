<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import {usePlayStore} from '@/stores/play'

const playStore = usePlayStore()

const router = useRouter()
const route = useRoute()
const keyword = computed(() => (route.query.keyword || '').toString().trim())

const songList = ref([])

const loading = ref(false)

const fetchSearchResult = async (keyword) => {
  if (!keyword) {
    return
  }
  loading.value = true
  try {
    const res = await api.get(`search?keywords=${keyword}&limit=30`)
    const songs = res.data.result.songs || []
    songList.value = songs.map(item => ({
      id: item.id,
      name: item.name,
      artist: (item.artists || []).map(artist => artist.name).join('/'),
      album: item.album.name || '',
      duration: item.duration || '00:00'
    }))
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

const formatTime = (sec) => {
  if(!sec)return '00:00'
  const totalSec = Math.floor(sec / 1000)
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

//点击歌曲，跳转到歌曲详情页
const handleTrackClick = (song) => {
    if (!song||!song.id) {
        return
    }
    playStore.playSong(song.id)
    
}






onMounted(() => {
  fetchSearchResult(keyword.value)
})

watch(keyword, (newKeyword) => {
  fetchSearchResult(newKeyword)
})

</script>

<template>
  <div class="search-page">
    <div class="search-inner">
      <h2 class="title">搜索结果</h2>
      <p class="keyword" v-if="keyword">搜索关键词：{{ keyword }}</p>
      <p class="keyword" v-else>暂无搜索关键字，请在顶部搜索</p>

      <div v-if="loading" class="tip">正在搜索中...</div>
      <div v-else-if="keyword && songList.length === 0" class="tip">暂无搜索结果</div>

      <ul v-else class="song-list">
        <li v-for="song in songList" :key="song.id" class="song-item" @click="handleTrackClick(song)">
          <div class="song-main">
            <p class="song-name">{{ song.name }}</p>
            <p class="song-artist">{{ song.artist }}</p>
          </div>
          <div class="song-extra">
            <p class="song-album">{{ song.album }}</p>
            <p class="song-duration">{{ formatTime(song.duration) }}</p>
          </div>
        </li>
      </ul>

    </div>
  </div>
</template>

<style scoped>
.search-page {
  min-height: calc(100vh - 90px);
  padding: 24px 32px;
  box-sizing: border-box;
  padding-bottom: 64px;
}

.search-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
}

.keyword {
  margin: 0 0 16px;
  font-size: 14px;
  color: #666;
}

.tip {
  margin-top: 24px;
  font-size: 14px;
  color: #888;
}

.loading {
  margin-top: 24px;
  font-size: 14px;
  color: #999;
}

.empty {
  margin-top: 24px;
  font-size: 14px;
  color: #999;
}

.song-list {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.song-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #f2f2f2;
  cursor: pointer;
  font-size: 13px;
}

.song-item:last-of-type {
  border-bottom: none;
}

.song-item:hover {
  background: #fafafa;
}

.song-main {
  display: flex;
  flex-direction: column;
  max-width: 60%;
}

.song-name {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  margin-top: 2px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-extra {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 40%;
  justify-content: flex-end;
}

.song-album {
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-duration {
  color: #999;
  flex-shrink: 0;
}

.bottom-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.bottom-bar .tip {
  margin-top: 0;
  font-size: 13px;
  color: #aaa;
}

.load-more {
  padding: 10px 80px;
  border: none;
  border-radius: 20px;
  background: #ec4141;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.load-more:hover:not(:disabled) {
  background: #d33a3a;
}

.load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
