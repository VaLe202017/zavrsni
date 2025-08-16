import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import axios from 'axios' // ← dodaj ovo

export default defineRouter(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // --- ADMIN GUARD ---
  Router.beforeEach(async (to, from, next) => {
    // Ako ruta ne traži admina, pusti
    const needsAdmin = to.matched.some((r) => r.meta && r.meta.requiresAdmin)
    if (!needsAdmin) return next()

    // Ne blokiraj /admin/login
    if (to.path.startsWith('/admin/login')) return next()

    try {
      const res = await axios.get('http://localhost:3000/api/admin/check', {
        withCredentials: true,
      })
      if (res.data && res.data.authenticated) {
        return next()
      }
      return next({ path: '/admin/login', query: { redirect: to.fullPath } })
    } catch {
      return next({ path: '/admin/login', query: { redirect: to.fullPath } })
    }
  })

  return Router
})
