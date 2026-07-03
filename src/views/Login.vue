<script setup>
import { ref } from 'vue'
import { onMounted, onUnmounted, watch } from 'vue'
import api from '@/api'
import { useUserStore } from '@/stores/user'

import { useRouter } from 'vue-router'
const router = useRouter()



//从pinia获取用户状态
const userStore = useUserStore()


//二维码图片
const qrImg = ref('')
//二维码key
const loginKey = ref('')

//轮询定时器
const qrCheckTimer = ref(null)

// 清除轮询定时器
const stopQrCheck = () => {
  if (qrCheckTimer.value) {
    clearInterval(qrCheckTimer.value)
    qrCheckTimer.value = null
  }
}

//获取二维码key
const getQrcodeKey = async () => {
  try {
    const res = await api.get('/login/qr/key')
    loginKey.value = res.data.data.unikey || ''
  } catch (error) {
    console.log('获取二维码key失败', error)
    loginKey.value = ''
  }

}

//通过key获取二维码图片
const getQrcodeImg = async (key) => {
  try {
    const res = await api.get("/login/qr/create", {
      key,
      timestamp: Date.now(),
      ua: 'pc',
      qrimg: true
    })
    qrImg.value = res.data.data.qrimg || ''

  } catch (error) {
    console.log('获取二维码图片失败', error)
    qrImg.value = ''
  }
}






onMounted(() => {
  getQrcodeKey()
})

// 组件卸载时清除定时器
onUnmounted(() => {
  stopQrCheck()
})

//监听loginKey变化，获取二维码图片
watch(loginKey, (newVal) => {
  if (newVal) {
    getQrcodeImg(newVal)
  }
})

watch(qrImg, (newVal) => {
  if (newVal && loginKey.value) {
    //轮询二维码状态 ，803表示登录成功
    startQrCheck(loginKey.value)
  }
})

const startQrCheck = (key) => {
  if (!key) {
    return
  }
  // 先清除旧的定时器
  stopQrCheck()

  //轮询二维码状态 ，803表示登录成功
  qrCheckTimer.value = setInterval(async () => {
    try {
      const res = await api.get("/login/qr/check", {
        key,
        timestamp: Date.now(),
        ua: 'pc',
      })
      console.log(res.data.code)
      // 803 = 授权登录成功
      if (res.data.code == 803) {
        stopQrCheck()
        
        await getLoginStatus()
        // 登录成功后跳转到首页
        router.push('/')
        return
      }
      // 800 = 二维码过期，重新获取
      if (res.data?.data?.code == 800) {
        stopQrCheck()
        qrImg.value = ''
        loginKey.value = ''
        getQrcodeKey()
      }
    } catch (error) {
      console.log('轮询二维码状态失败', error)
      stopQrCheck()
    }
  }, 3000)
}


// 获取登陆状态
const getLoginStatus = async () => {
  try {
    const statusRes = await api.get("/login/status",{
            timestamp: Date.now(),
            ua: 'pc',
          })
          console.log(statusRes)
          console.log(statusRes.data.data.profile)
          const profile = statusRes.data.data.profile
          if (profile) {
            userStore.setUser({
              id: profile.userId,
              nickname: profile.nickname,
              avatar: profile.avatarUrl,
            })
          }
        } catch (error) {
          console.log('获取登录状态失败', error)
        }
      }

//关闭登录弹窗
const closeLogin = (e) => {
  if (e.target === e.currentTarget) {
    stopQrCheck()
    router.back()
    //清除二维码图片
    qrImg.value = ''
    //清除二维码key
    loginKey.value = ''
  }
}







</script>

<template>
  <div class="login-overlay" @click="closeLogin">
    <div class="login-modal">
      <div class="login-header">
        <h2>扫码登录网易云音乐</h2>

      </div>
      <div class="login-body">
        <div class="qrcode-box">
          <div class="qrcode-placeholder">
            <template v-if="qrImg">
              <img :src="qrImg" alt="">
            </template>
            <template v-else>
              <p>二维码加载中...</p>
            </template>
          </div>
          <p class="qrcode-tip">打开网易云音乐APP，扫一扫登录</p>
        </div>
        <ul class="login-features">
          <li>同步收藏的歌单、歌曲和播放记录</li>
          <li>多端同步，随时随地畅听音乐</li>
        </ul>
      </div>
    </div>
  </div>
</template>


<style scoped>
.login-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.login-modal {
  width: 420px;
  padding: 24px 32px 32px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
}

.login-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.login-header p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #666;
}

.login-body {
  margin-top: 20px;
  display: flex;
  gap: 20px;
}

.qrcode-box {
  text-align: center;
}

.qrcode-placeholder {
  width: 140px;
  height: 140px;
  border-radius: 4px;
  background: #f5f5f5;
  border: 1px solid #e1e1e1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}

.qrcode-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.qrcode-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.login-features {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
  color: #555;
}

.login-features li+li {
  margin-top: 8px;
}
</style>
