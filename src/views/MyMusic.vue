<script setup>

import { computed  ,ref,onMounted} from 'vue'
import api from '@/api'
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
import { useRouter } from 'vue-router'

const router = useRouter()



const isLogin=computed(()=>userStore.isLoggedIn)


const uid=computed(()=>{
  if(isLogin.value){
   return userStore.user.id
  }
  return ''
})



const playList=ref([])

const fetchMyMusic = async (uid) => {
  const res = await api.get(`/user/playlist?uid=${uid}` )

  if (res.status === 200) {
    playList.value = res.data.playlist?.map(item=>({
      cover:item.coverImgUrl,
      name:item.name,
      id:item.id,
      trackCount:item.trackCount,
    }))
  }
  
}

const handleLogin=()=>{
  router.push('/login')
}

const handlePlay=(id)=>{
  if(!id){
    return
  }
  router.push({
    name: 'musicList',
    query: {
      id
    }
  })

  }


onMounted(()=>{
  fetchMyMusic(uid.value)
})


</script>

<template>
    <div class="mymusic-page" >
      <div class="mymusic-inner">
        <h2 class="title">我的音乐</h2>
        <div v-if="!isLogin" class="login-hint">
          <p class="hint-text">
            您还未登录，无法查看和管理您的音乐播放列表。
          </p>
          <button class="hint-btn" @click="handleLogin">去登录</button>
        </div>
        <div v-else>
          <p class="subtitle">我的歌单</p>
          <div class="tip" v-if="!playList.length">暂无歌单</div>
          <ul class="playlist-list" v-else>
            <li v-for="item in playList" :key="item.id" class="playlist-item" @click="handlePlay(item.id)">
              <div class="cover">
                <img :src="item.cover" alt="歌单封面" />
              </div>
              <div class="info">
                <p class="name">{{ item.name }}</p>
                <p class="count">{{ item.trackCount }}首</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
</template>


<style scoped>
.mymusic-page {
  min-height: calc(100vh - 90px);
  padding: 24px 32px;
  box-sizing: border-box;
}

.mymusic-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
}

.subtitle {
  margin: 0 0 12px;
  font-size: 16px;
  color: #333;
}

.login-hint {
  margin-top: 24px;
  padding: 24px 28px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.hint-text {
  margin: 0 0 12px;
  font-size: 14px;
  color: #555;
}

.hint-btn {
  padding: 6px 16px;
  border-radius: 16px;
  border: none;
  background: #c20c0c;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.hint-btn:hover {
  background: #a00a0a;
}

.tip {
  margin-top: 16px;
  font-size: 14px;
  color: #777;
}

.playlist-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
}

.playlist-item {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.cover {
  width: 100%;
  aspect-ratio: 1/1;
  overflow: hidden;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.info {
  padding: 8px 10px 10px;
}

.name {
  margin: 0 0 4px;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.count {
  margin: 0;
  font-size: 12px;
  color: #999;
}
</style>
