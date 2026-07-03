<script setup>
import api from '@/api'
import { onMounted, computed } from 'vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()



const playList = ref([])
const newSongs = ref([])
const singerRank = ref([])

//轮播图当前页数
const currentSingerSlide = ref(0)

//每一页的展示量
const SINGER_PAGE_SIXE = 5

//每次取5个歌手，存在一页中，用二维数组存储
const singerSLides = computed(() => {
  //每页的五条数据
  const list = singerRank.value || []

  //所有页数的轮播的页数的数据
  const slides = []
  //遍历所有数据，每五条数据为一页
  for (let i = 0; i < list.length; i += SINGER_PAGE_SIXE) {
    slides.push(list.slice(i, i + SINGER_PAGE_SIXE))
  }
  return slides
})

//左切换
const prevSingerSlide = () => {
  //页数不为0时，才能切换上一页
  if (!singerSLides.value.length) {
    return
  }
  //当前页数减1，小于0时，切换到最后一页
  currentSingerSlide.value--
  if (currentSingerSlide.value < 0) {
    currentSingerSlide.value = singerSLides.value.length - 1
  }
  console.log(currentSingerSlide.value)
}
//右切换
const nextSingerSlide = () => {
  //页数不为0时，才能切换下一页
  if (!singerSLides.value.length) {
    return
  }
  //当前页数加1，大于等于总页数时，切换到第一页
  currentSingerSlide.value++
  if (currentSingerSlide.value > singerSLides.value.length - 1) {
    currentSingerSlide.value = 0
  }
}



const fetchPlayList = async () => {
  try {
    const res = await api.get('/personalized', { limit: 5 })
    const detail = res.data.result 
    if (detail) {
    playList.value = (detail || []).map((item) => ({
      coverUrl: item.picUrl || '',
      name: item.name || '',
      id: item.id || '',
      desc: item.copywriter || ''
    }))
  }
    //console.log(playList.value)
  } catch (error) {
    console.log("获取推荐歌单失败", error)
  }
}

const fetchNewSongs = async () => {
  try {
    const res = await api.get('/personalized/newsong')
    const detail = res.data.result 
    if (detail) {
    newSongs.value = (detail || []).map((item) => ({
      id: item.id,
      title: item.name,
      cover: item.picUrl,
      artist: item.song?.artists?.map((a) => a.name).join('/') || ''
    }))
  }
    //console.log(newSongs.value)
  } catch (error) {
    console.log("获取推荐新音乐失败", error)
  }
}

const fetchSingerRank = async () => {
  try {
    const res = await api.get('/top/artists', { limit: 20 })
    const detail = res.data.artists 
    if (detail) {
    singerRank.value = (detail || []).map((item, index) => ({
      coverUrl: item.picUrl || '',
      name: item.name || '',
      id: item.id || '',
      rank: index + 1
    }))
  }
    //console.log(singerRank.value)
  } catch (error) {
    console.log("获取歌手排行榜失败", error)
  }
}

//点击歌单，跳转到歌单详情页
const handlePlayListClick = (id, name) => {
  if (!id) {
    return
  }
  router.push({
    name: 'musicList',
    query: {
      id,
      name
    }
  })
}

//点击歌曲，跳转到歌曲详情页
const handleSongClick = (id) => {
  if (!id) {
    return
  }
  router.push({
    name: 'player',
    query: {
      id
    }
  })
}
//点击歌手，跳转到歌手全部歌曲页
const handleSingerClick = (id, name) => {
  if (!id) {
    return
  }
  router.push({
    name: 'musicList',
    query: {
      id, 
      name,
      type: 'singer'
    },
    
  })
}



onMounted(() => {
  fetchPlayList()
  fetchNewSongs()
  fetchSingerRank()
})


</script>

<template>
  <div class="hall-wrapper">
    <div class="hall-inner">
      <div class="section-title">推荐歌单</div>
      <ul class="playlist-list">
        <li v-for="item in playList" :key="item.id" class="playlist-item" @click="handlePlayListClick(item.id, item.name)">
          <div class="cover-wrapper">
            <img :src="item.coverUrl" alt="">
          </div>
          <div class="info">
            <p class="title">{{ item.name }}</p>
            <p class="desc">{{ item.desc }}</p>
          </div>
        </li>
      </ul>
      <div class="section-title">推荐新音乐</div>
      <ul class="song-list">
        <li v-for="item in newSongs" :key="item.id" class="song-item" @click="handleSongClick(item.id)">
          <div class="song-cover">
            <img :src="item.cover" alt="">
          </div>
          <div class="song-info">
            <p class="song-name">{{ item.title }}</p>
            <p class="song-artist">{{ item.artist }}</p>
          </div>
        </li>
      </ul>
      <h2 class="section-title section-title--singer section-title--sub">歌手排行榜</h2>
      <div class="singer-carousel" v-if="singerSLides.length > 0">

        <div class="singer-caousel-track">

          <!-- 索引与页码相同时展示 -->
          <div v-for="(slide, index) in singerSLides" :key="index" class="singer-slide"
            v-show="index == currentSingerSlide">
            <ul class="singer-list">
              <li v-for="singer in slide" :key="singer.id" class="singer-item" @click="handleSingerClick(singer.id, singer.name)"> 
                <div class="singer-avatar">
                  <img :src="singer.coverUrl" alt="">
                </div>
                <span class="singer-name">{{ singer.rank }} {{ singer.name }}</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="singer-carousel-controls" v-if="singerSLides.length > 1">
          <button class="singer-arrow" @click="prevSingerSlide"> < </button>
              <button class="singer-arrow" @click="nextSingerSlide"> > </button>
        </div>


      </div>

    </div>
  </div>
</template>


<style scoped>
.hall-wrapper {
  display: flex;
  justify-content: center;
  padding-bottom: 64px;
}

.hall-inner {
  width: 100%;
  max-width: 1200px;
}

.section-title {
  margin: 0 0 16px;
  margin-top: 40px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.section-title--sub {
  margin-top: 40px;
}

.section-title--singer {
  margin-top: 68px;
  font-size: 22px;
  text-align: center;
}

.playlist-list {
  display: flex;
  gap: 20px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.playlist-item {
  flex: 1;
  max-width: 220px;
  cursor: pointer;
}

.cover-wrapper {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 4px;
  overflow: hidden;
  background: #eee;
  cursor: pointer;
}

.cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.cover-wrapper:hover img {
  transform: scale(1.06);
}

.info {
  margin-top: 8px;
}

.title {
  font-size: 14px;
  color: #333;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.desc {
  font-size: 12px;
  color: #999;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 40px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.song-cover {
  width: 82px;
  height: 82px;
  border-radius: 4px;
  overflow: hidden;
  background: #eee;
  flex-shrink: 0;
  cursor: pointer;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.song-cover:hover img {
  transform: scale(1.2);
}

.song-info {
  flex: 1;
}

.song-name {
  font-size: 14px;
  color: #333;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.song-name:hover {
  color: #c20c0c;
}

.song-artist {
  font-size: 12px;
  color: #999;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.singer-list {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  justify-content: space-between;
}

.singer-item {
  width: 20%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.singer-avatar {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  overflow: hidden;
  background: #eee;
  flex-shrink: 0;
}

.singer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.singer-name {
  font-size: 16px;
  color: #333;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.singer-carousel {
  margin-top: 12px;
  position: relative;
}

.singer-carousel-track {
  position: relative;
  min-height: 200px;
}

.singer-slide {
  width: 100%;
}

.singer-carousel-controls {
  position: absolute;
  inset: 0;
  margin: 0;
  pointer-events: none;
}

.singer-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #f2f2f2;
  cursor: pointer;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.singer-arrow:first-of-type {
  left: -30px;
}

.singer-arrow:last-of-type {
  right: -30px;
}

.singer-arrow:hover {
  background: #e5e5e5;
}
</style>
