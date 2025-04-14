import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

// 解决报错
const originalPush = VueRouter.prototype.push
const originalReplace = VueRouter.prototype.replace
// push
VueRouter.prototype.push = function push(location, onResolve, onReject) {
    if (onResolve || onReject) return originalPush.call(this, location, onResolve, onReject)
    return originalPush.call(this, location).catch(err => err)
}
// replace
VueRouter.prototype.replace = function push(location, onResolve, onReject) {
    if (onResolve || onReject) return originalReplace.call(this, location, onResolve, onReject)
    return originalReplace.call(this, location).catch(err => err)
}

const routes = [
    {
        path: '/',
        name: '/',
        component: () => import('@/views/home')
    },
    {
        path: '/home',
        name: 'home',
        component: () => import('@/views/home')
    },
    {
        path: '/license',
        name: 'license',
        component: () => import('@/views/license')
    },
    {
        path: '/about',
        name: 'about',
        component: () => import('@/views/about')
    }
]

const router = new VueRouter({
    mode: 'hash',
    routes
})

router.beforeEach((to, from, next) => {
    next()
})

export default router
