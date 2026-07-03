import axios from 'axios';


const BASE_URL = 'http://localhost:3000'

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  withCredentials: true,

})

//请求拦截,统一添加token

instance.interceptors.request.use(
  config => {
    //此处添加token
    /* const token = localStorage.getItem('token')
    if(token) {
      config.headers.Authorization = `Bearer ${token}`

    } */
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

//响应拦截,统一处理响应数据 code/错误

instance.interceptors.response.use(
  response => {
    return response
  },
  error => {
    //此处处理全局错误： 网络错误，401错误，未登录等
    return Promise.reject(error)
  }
)

export function get(url, params={}, config={}) {
  return instance.get(url, {params, ...config})
}

export function post(url, data={}, config={}) {
  return instance.post(url, data, config)
}

const api={
  get,
  post
}

export default api






