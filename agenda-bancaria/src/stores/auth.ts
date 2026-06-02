import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import type { User } from '../types'

function extractError(e: any): string {
  return e.response?.data?.error || e.message || 'Erro desconhecido'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const adminLogado = ref(false)

  const isLoggedIn = computed(() => user.value !== null)

  function carregarSessao() {
    const saved = localStorage.getItem('agenda_user')
    if (saved) user.value = JSON.parse(saved)
    const admin = localStorage.getItem('agenda_admin')
    if (admin) adminLogado.value = JSON.parse(admin)
  }

  async function register(dados: User): Promise<void> {
    try {
      await api.post('auth/register', dados)
    } catch (e: any) {
      throw new Error(extractError(e))
    }
  }

  async function login(email: string, senha: string): Promise<User> {
    try {
      const { data } = await api.post<{ token: string; user: User }>('auth/login', { email, senha })
      localStorage.setItem('agenda_token', data.token)
      user.value = data.user
      localStorage.setItem('agenda_user', JSON.stringify(user.value))
      if ((data.user as any).isAdmin || email.endsWith('@banco.com')) {
        adminLogado.value = true
        localStorage.setItem('agenda_admin', 'true')
      }
      return user.value
    } catch (e: any) {
      throw new Error(extractError(e))
    }
  }

  function logout() {
    user.value = null
    localStorage.removeItem('agenda_user')
    localStorage.removeItem('agenda_token')
    adminLogado.value = false
    localStorage.removeItem('agenda_admin')
  }

  async function recoverPassword(doc: string, dataNasc: string, email: string): Promise<number> {
    try {
      const { data } = await api.post<{ userId: number; message: string }>('auth/recover', {
        docPessoal: doc, data_nascimento: dataNasc, email
      })
      return data.userId
    } catch (e: any) {
      throw new Error(extractError(e))
    }
  }

  async function updatePassword(novaSenha: string, userId?: number): Promise<void> {
    try {
      if (userId) {
        await api.post('auth/reset-password', { userId, senha: novaSenha })
      } else {
        await api.post('auth/update-password', { senha: novaSenha })
      }
    } catch (e: any) {
      throw new Error(extractError(e))
    }
  }

  async function updateUser(id: number, dados: Partial<User>): Promise<void> {
    try {
      const response = await api.patch<User>('profile', dados)
      if (user.value && user.value.id === id) {
        user.value = { ...user.value, ...response.data }
        localStorage.setItem('agenda_user', JSON.stringify(user.value))
      }
    } catch (e: any) {
      throw new Error(extractError(e))
    }
  }

  // Admin
  async function loginAdmin(email: string, senha: string): Promise<boolean> {
    try {
      const { data } = await api.post<{ token: string; user: User }>('admin/login', { email, senha })
      localStorage.setItem('agenda_token', data.token)
      adminLogado.value = true
      localStorage.setItem('agenda_admin', 'true')
      return true
    } catch {
      return false
    }
  }

  function logoutAdmin() {
    adminLogado.value = false
    localStorage.removeItem('agenda_admin')
    localStorage.removeItem('agenda_token')
  }

  carregarSessao()

  return {
    user,
    adminLogado,
    isLoggedIn,
    register,
    login,
    logout,
    recoverPassword,
    updatePassword,
    updateUser,
    loginAdmin,
    logoutAdmin
  }
})
