<script setup>
import api from '@/api'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { usePlayStore } from '@/stores/play'
const playStore = usePlayStore()

const router = useRouter()

const route = useRoute()
const musicListId = computed(() => route.query.id)
const musicListName = computed(() => route.query.name)

//传过来的类型，判断是歌单还是歌手
const showType = computed(() => route.query.type)

const musicList = ref([])

const loading = ref(false)

const fetchMusicList = async (id) => {
    loading.value = true
    try {
        if (!id) { return }
        if (showType.value === 'singer') {

            const singerRes = await api.get(`/artist/top/song?id=${id}`)
            const singerDetail = singerRes.data.songs

            if (singerDetail) {
                musicList.value = (singerRes.data.songs || []).map((item) => ({
                    id: item.id,
                    name: item.name,
                    album: (item.al || item.album)?.name || '',
                    artist: (item.ar || item.artist || []).map(element => {
                        return element.name
                    }).join('/'),
                    duration: (item.dt || item.duration) || 0,
                }))

            }
        }
        else {
            const res = await api.get(`/playList/detail?id=${id}`)

            const detail = res.data.playlist

            if (detail) {
                musicList.value = (detail.tracks || []).map((item) => ({
                    id: item.id,
                    name: item.name,
                    album: (item.al || item.album)?.name || '',
                    artist: (item.ar || item.artist || []).map(element => {
                        return element.name
                    }).join('/'),
                    duration: (item.dt || item.duration) || 0,
                }))
            }
        }

    } catch (error) {
        console.log("获取详情数据失败", error)
    } finally {
        loading.value = false
    }

}

//转换时间格式x分y秒
const formatDuration = (sec) => {
  if(!sec)return '00:00'
  const totalSec = Math.floor(sec / 1000)
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

//点击歌曲，跳转到歌曲详情页
const handleTrackClick = (id) => {
    if (!id) {
        return
    }
    const index = musicList.value.findIndex(item => item.id === id)
    playStore.setPlayList(musicList.value, index)
    router.push({
        name: 'player',
    })
}



onMounted(() => {
    fetchMusicList(musicListId.value)
})


</script>

<template>
    <div class="musiclist-page">
        <div class="musiclist-inner">
            <h2 class="title">{{ musicListName }}</h2>
            <div v-if="loading" class="tip">
                加载中...
            </div>
            <div v-else-if="musicList.length === 0" class="tip">
                暂无歌曲
            </div>

            <ul v-else class="track-list">
                <li v-for="(item, index) in musicList" :key="item.id" class="track-item"
                    @click="handleTrackClick(item.id)">
                    <div class="track-index">{{ index + 1 }}</div>
                    <div class="track-main">
                        <span class="track-name">{{ item.name }}</span>
                        <span class="track-artist">{{ item.artist }}</span>
                    </div>
                    <div class="track-extra">
                        <span class="track-album">{{ item.album }}</span>
                        <span class="track-duration">{{ formatDuration(item.duration) }}</span>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>


<style scoped>
.musiclist-page {
    /* 去掉顶部导航90px的高度,全屏显示 */
    min-height: calc(100vh - 90px);
    padding: 24px 32px;
    box-sizing: border-box;
    padding-bottom: 64px;
}

.musiclist-inner {
    max-width: 1200px;
    margin: 0 auto;
}

.title {
    margin: 0 0 16px;
    font-size: 20px;
    font-weight: 600;
}

.tip {
    margin-top: 16px;
    font-size: 14px;
    color: #777;
}

.track-list {
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.track-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border-bottom: 1px solid #f2f2f2;
    cursor: pointer;
    font-size: 13px;
}

.track-item:last-of-type {
    border-bottom: none;
}

.track-item:hover {
    background: #fafafa;
}

.track-index {
    width: 32px;
    text-align: right;
    margin-right: 12px;
    color: #999;
    flex-shrink: 0;
}

.track-main {
    display: flex;
    flex-direction: column;
    max-width: 50%;
}

.track-name {
    font-size: 14px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.track-artist {
    margin-top: 2px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.track-extra {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-left: auto;
    max-width: 40%;
}

.track-album {
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.track-duration {
    color: #999;
    flex-shrink: 0;
}
</style>
