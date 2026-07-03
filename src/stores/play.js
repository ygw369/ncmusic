import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api'


//  歌词解析
const parseLyric = (raw = '') => {
    const lines = raw.split('\n')
        .map((item) => item.trim())
        .filter((item) => item)

    const timeReg = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g
    const result = []

    lines.forEach((line) => {
        const text = line.replace(timeReg, '').trim()
        if (!text) return

        const times = []
        let match
        timeReg.lastIndex = 0
        while ((match = timeReg.exec(line)) !== null) {
            const minutes = parseInt(match[1], 10)
            const seconds = parseInt(match[2], 10)
            const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0
            times.push(minutes * 60 + seconds + ms / 1000)
        }

        times.forEach((t) => {
            result.push({ time: t, text })
        })
    })

    result.sort((a, b) => a.time - b.time)
    return result
}





//  获取audio实例
let audio = null
function getAudio() {
    if (!audio) {
        audio = new Audio()
    }
    return audio
}

export const calcRatio = (bar, mouseX) => {
    //获取传进来的bar元素的矩形信息
    const rect = bar.getBoundingClientRect()
    //获取进度条的x坐标
    const progressX = rect.left
    //获取进度条的宽度
    const progressWidth = rect.width
    //获取点击的进度比例
    const progressPercent = (mouseX - progressX) / progressWidth
    //返回拖动进度条的进度比例
    return Math.max(0, Math.min(1, progressPercent))
}




//  播放器状态管理
export const usePlayStore = defineStore('player', () => {


    const songId = ref('')
    const songTitle = ref('')
    const songArtist = ref('')
    const songAlbum = ref('')
    const songCover = ref('')

    const songUrl = ref('')
    const isPlaying = ref(false)
    const currentTime = ref(0)
    const duration = ref(0)

    const lyrics = ref([])

    const hasSong = ref(false)
    const currentLyricIndex = ref(-1)

    //歌曲列表
    const songList = ref([])
    //当前播放的歌曲索引
    const currentSongIndex = ref(-1)

    //是否显示播放列表
    const showPlayList = ref(false)

    //播放模式
    const playMode = ref('list')



    //管理播放器的各种事件
    const bindEvents = () => {
        const aud = getAudio()

        aud.ontimeupdate = () => {
            currentTime.value = aud.currentTime || 0

        }
        aud.onended = () => {
            isPlaying.value = false
            playNext()
        }
        aud.onloadedmetadata = () => {
            duration.value = aud.duration || 0
        }
        aud.onplay = () => {
            isPlaying.value = true
        }
        aud.onpause = () => {
            isPlaying.value = false
        }
    }
    //切换下一首歌曲
    const playNext = () => {
        if (songList.value.length === 0) {
            return
        }

        if (playMode.value === 'single') {
            playSong(songList.value[currentSongIndex.value].id)
            return
        }

        let next

        if (playMode.value === 'random') {
            //随机播放
            if (songList.value.length === 1) {
                next = 0
            }
            else {
                do {
                    next = Math.floor(Math.random() * songList.value.length)
                } while (next === currentSongIndex.value)
            }
        }
        else {
            //顺序播放
            next = currentSongIndex.value + 1
            //判断是否播放到最后一首歌曲
            if (next >= songList.value.length) {
                next = 0

            }

        }
        currentSongIndex.value = next
        playSong(songList.value[next].id)
        saveToLocal()


        /*  let next = currentSongIndex.value + 1
         currentSongIndex.value = next
         //判断是否播放到最后一首歌曲
         if (next >= songList.value.length) {
             next = 0
             currentSongIndex.value = next
         }
         playSong(songList.value[next].id)
         saveToLocal() */
    }
    //切换上一首歌曲
    const playPrev = () => {
        if (songList.value.length === 0) {
            return
        }
        let prev = currentSongIndex.value - 1
        if (prev < 0) {
            prev = songList.value.length - 1
        }
        currentSongIndex.value = prev
        playSong(songList.value[prev].id)
        saveToLocal()
    }


    const setPlayList = (songs, index = 0) => {
        songList.value = songs
        currentSongIndex.value = index
        playSong(songList.value[index].id)
        saveToLocal()
    }


    //播放歌曲功能
    const playSong = async (id) => {

        //重置播放器信息
        songUrl.value = ''
        isPlaying.value = false
        hasSong.value = false
        lyrics.value = []
        currentTime.value = 0
        duration.value = 0

        songId.value = id

        //获取歌曲信息，Promise.all并行请求
        let urlRes, lyricRes, detailRes
        try {
            [urlRes, lyricRes, detailRes] = await Promise.all([
                api.get(`/song/url?id=${id}`),
                api.get(`/lyric?id=${id}`),
                api.get(`/song/detail?ids=${id}`)
            ])
        } catch (error) {
            console.log("获取歌曲信息失败 ", error)
            return
        }

        const songUrlStr = (((urlRes.data || {}).data || [])[0] || {}).url || ''

        //判断是否有歌曲信息，有就把播放状态设置为true
        if (songUrlStr) {
            songUrl.value = songUrlStr
            hasSong.value = true
            isPlaying.value = true
        }
        const detail = (detailRes.data.songs || [])[0]
        if (detail) {
            songTitle.value = detail.name || '未知歌曲'
            songArtist.value = ((detail.ar || [])[0] || {}).name || '未知歌手'
            songAlbum.value = detail.al.name || '未知专辑'
            songCover.value = detail.al.picUrl || ''
        }
        const lyricStr = lyricRes.data.lrc?.lyric || ''
        lyrics.value = lyricStr ? parseLyric(lyricStr) : []


        //判断是否已经在播放列表中，如果没有就添加到播放列表中，用于直接点击单曲播放
        const alreadyPlaying = songList.value.find((item) => String(item.id) === String(id))
        if (!alreadyPlaying) {
            const song = {
                id,
                name: songTitle.value,
                artist: songArtist.value,
                album: songAlbum.value,
                cover: songCover.value,
                duration: duration.value,
            }
            const insertAt = currentSongIndex.value + 1
            songList.value.splice(insertAt, 0, song)
            currentSongIndex.value = insertAt
            saveToLocal()
        }


        //获取实例对象，调用函数绑定上事件，传递歌曲url，开始播放
        const aud = getAudio()
        bindEvents()
        aud.src = songUrl.value
        aud.play().catch(() => {
            isPlaying.value = false
        })
    }

    //切换播放状态
    const togglePlay = () => {
        const aud = getAudio()
        if (isPlaying.value) {
            aud.pause()

        } else {
            aud.play()

        }
    }

    //设置进度条时间
    const setProgress = (time) => {
        const a = getAudio()
        a.currentTime = time
        currentTime.value = time
    }

    //保存播放列表到本地存储
    const saveToLocal = () => {
        localStorage.setItem('nc_play', JSON.stringify({
            songList: songList.value,
            currentSongIndex: currentSongIndex.value,
            playMode: playMode.value,
        }))
    }
    //从本地存储中加载播放列表
    const loadFromLocal = () => {
        const raw = localStorage.getItem('nc_play')
        if (!raw) {
            return
        }
        let parsed
        try {
            parsed = JSON.parse(raw)
        } catch (error) {
            console.log("解析播放信息失败 ", error)
            return null
        }
        if (parsed && parsed.songList && parsed.currentSongIndex >= 0 && parsed.playMode) {
            songList.value = parsed.songList
            currentSongIndex.value = parsed.currentSongIndex
            playMode.value = parsed.playMode
        }
        const song = songList.value[currentSongIndex.value]
        if (song) {
            playSong(song.id)
        }
    }

    //添加歌曲到下一首播放
    const addSongToPlay = (song) => {
        const oldIndex = songList.value.findIndex((item) => item.id === song.id)

        if (oldIndex === currentSongIndex.value) {
            return
        }

        if (oldIndex !== -1) {
            removeFromListByIndex(oldIndex)

        }
        songList.value.splice(currentSongIndex.value + 1, 0, song)
        saveToLocal()

    }

    //从播放列表中删除指定歌曲
    const removeFromListByIndex = (index) => {
        if (index < 0 || index >= songList.value.length || songList.value.length === 0) {
            return
        }
        songList.value.splice(index, 1)
        if (index < currentSongIndex.value) {
            currentSongIndex.value--
        }
    }

    //删除当前播放歌曲
    const deleteCurrentSong = (index) => {
        if (index === currentSongIndex.value) {
            removeFromListByIndex(index)  // 删当前歌
            if (songList.value.length > 0) {
                const next = Math.min(index, songList.value.length - 1)
                currentSongIndex.value = next
                playSong(songList.value[next].id)
            } else {
                currentSongIndex.value = -1
                getAudio().pause()
                hasSong.value = false
            }
            saveToLocal()
        } else {
            removeFromListByIndex(index)  // 删非当前歌，removeFromListByIndex 自己会处理索引
            saveToLocal()
        }
    }

    //切换播放模式
    const togglePlayMode = () => {
        if (playMode.value === 'list') {
            playMode.value = 'random'
        } else if (playMode.value === 'random') {
            playMode.value = 'single'
        } else {
            playMode.value = 'list'
        }
        saveToLocal()
    }



    loadFromLocal()

    return {
        songId,
        songTitle,
        songArtist,
        songAlbum,
        songCover,
        songUrl,
        isPlaying,
        currentTime,
        duration,
        lyrics,
        hasSong,
        currentLyricIndex,
        songList,
        currentSongIndex,
        showPlayList,
        playMode,
        playNext,
        playPrev,
        playSong,
        togglePlay,
        setProgress,
        setPlayList,
        saveToLocal,
        loadFromLocal,
        addSongToPlay,
        removeFromListByIndex,
        deleteCurrentSong,
        togglePlayMode,

    }
})