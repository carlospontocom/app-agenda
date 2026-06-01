import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue'), meta: { guest: true } },
  { path: '/cadastrar', name: 'Register', component: () => import('../views/Register.vue'), meta: { guest: true } },
  { path: '/entrar', name: 'Login', component: () => import('../views/Login.vue'), meta: { guest: true } },
  { path: '/recuperar-senha', name: 'ForgotPassword', component: () => import('../views/ForgotPassword.vue'), meta: { guest: true } },
  { path: '/painel', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { requiresAuth: true } },
  { path: '/agendar', name: 'Schedule', component: () => import('../views/Schedule.vue'), meta: { requiresAuth: true } },
  { path: '/meus-agendamentos', name: 'MyAppointments', component: () => import('../views/MyAppointments.vue'), meta: { requiresAuth: true } },
  { path: '/perfil', name: 'Profile', component: () => import('../views/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/admin/painel', name: 'AdminDashboard', component: () => import('../views/admin/AdminDashboard.vue'), meta: { requiresAdmin: true } },
  { path: '/admin/clientes', name: 'GerenciarClientes', component: () => import('../views/admin/GerenciarClientes.vue'), meta: { requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const user = localStorage.getItem('agenda_user')
  const admin = localStorage.getItem('agenda_admin')

  if (admin === 'true') {
    if (to.meta.requiresAdmin) return next()
    if (to.meta.requiresAuth) return next('/admin/painel')
    if (to.meta.guest) return next('/admin/painel')
    return next()
  }

  if (user) {
    if (to.meta.requiresAdmin) return next('/painel')
    if (to.meta.guest) return next('/painel')
    return next()
  }

  if (to.meta.requiresAuth) return next('/entrar')
  if (to.meta.requiresAdmin) return next('/entrar')
  next()
})

export default router
