import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
    //用户信息
    const user = ref(null)

    const isLoggedIn = computed(() => !!user.value)

    //本地存储的Key
    const STORAGE_KEY = 'nc_user'

    //状态管理的存储，还要同步存储在本地存储
    const setUser = (payload) => {
        if (!payload) {
            return
        }
        const normalized = {
            id: payload.id,
            nickname: payload.nickname,
            avatar: payload.avatar,
        }

        user.value = normalized
        //同步存储在本地存储
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))

    }

    const clearUser = () => {
        user.value = null
        //同步清除本地存储
        localStorage.removeItem(STORAGE_KEY)
    }


    //从本地存储中获取用户信息
    const initFromLocalStorage = () => {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) {
            return
        }
        const parsed = JSON.parse(raw)
        if (parsed && parsed.id) {
            setUser(parsed)
        }
        
    }

    return {
        user,
        isLoggedIn,
        setUser,
        clearUser,
        initFromLocalStorage,
    }

})
