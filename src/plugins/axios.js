import Vue from 'vue'
import axios from 'axios'
import qs from 'qs'
import md5 from 'md5'

const key = 'yVwlsbIrY3q22EnoYYM4nR5zqTmqed05'

axios.defaults.baseURL = process.env.NODE_ENV === 'production' ? `${window.platform.url}/` : '/api/'

axios.defaults.transformRequest = [
    function (data) {
        if (data instanceof FormData) {
            return data
        }
        return qs.stringify(data, { skipNulls: true, strictNullHandling: true })
    }
]

axios.interceptors.request.use(
    config => {
        config.headers['Authorization'] = window.localStorage.getItem('Authorization')
        var timestamp = Date.now()
        config.headers['Timestamp'] = timestamp
        var url = config.url.split('?')[0]
        var dic = {}
        if (config.method == 'get') {
            if (config.params) {
                dic = config.params || {}
                dic.time = Date.now()
            } else {
                dic.time = Date.now()
                if (config.url.indexOf('?') > -1) {
                    config.url = config.url + '&time=' + Date.now()
                    dic = qs.parse(config.url.split('?')[1], { skipNulls: true, strictNullHandling: true }) || {}
                } else {
                    config.url = config.url + '?time=' + Date.now()
                }
            }
        } else {
            dic = config.data || {}
        }
        dic.timestamp = timestamp
        var sdic = Object.keys(dic).sort()
        var query = url + '?'
        for (var ki in sdic) {
            if (dic[sdic[ki]]) {
                query = query + sdic[ki] + '=' + dic[sdic[ki]] + '&'
            } else {
                if (dic[sdic[ki]] === 0 || typeof dic[sdic[ki]] === 'boolean') {
                    query = query + sdic[ki] + '=' + dic[sdic[ki]] + '&'
                } else {
                    delete dic[sdic[ki]]
                }
            }
        }
        query = query + 'key=' + key
        config.headers['Sign'] = md5(query).toUpperCase()

        delete dic.timestamp

        if (config.url.indexOf('?') != -1) {
            var arr = Object.keys(dic)
            if (arr.length == 0) {
                config.url = config.url.split('?')[0]
            } else {
                config.url =
                    config.url.split('?')[0] + '?' + qs.stringify(dic, { skipNulls: true, strictNullHandling: true })
            }
        }
        return config
    },
    function (error) {
        return Promise.reject(error)
    }
)

axios.interceptors.response.use(
    function (res) {
        return res
    },
    function (error) {
        return Promise.reject(error)
    }
)

Vue.prototype.$axios = axios
