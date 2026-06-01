import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import type { User } from '../types'

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
    const { data: existentes } = await api.get<User[]>('users', {
      params: { email: dados.email }
    })
    if (existentes.length > 0) throw new Error('Email já cadastrado')

    const { data: existentesDoc } = await api.get<User[]>('users', {
      params: { docPessoal: dados.docPessoal }
    })
    if (existentesDoc.length > 0) throw new Error('Documento já cadastrado')

    dados.createdAt = new Date().toISOString()
    dados.ativo = true
    const { data: novo } = await api.post<User>('users', dados)
    return
  }

  async function login(email: string, senha: string): Promise<User> {
    const { data: users } = await api.get<User[]>('users', {
      params: { email, senha }
    })
    if (users.length === 0) throw new Error('Email ou senha inválidos')
    if (users[0].ativo === false) throw new Error('Sua conta está inativa. Entre em contato com o administrador.')
    user.value = users[0]
    localStorage.setItem('agenda_user', JSON.stringify(user.value))
    if (email.endsWith('@banco.com')) {
      adminLogado.value = true
      localStorage.setItem('agenda_admin', 'true')
    }
    return user.value
  }

  function logout() {
    user.value = null
    localStorage.removeItem('agenda_user')
    adminLogado.value = false
    localStorage.removeItem('agenda_admin')
  }

  async function recoverPassword(doc: string, dataNasc: string, email: string): Promise<User> {
    const { data: users } = await api.get<User[]>('users', {
      params: { docPessoal: doc, data_nascimento: dataNasc, email }
    })
    if (users.length === 0) throw new Error('Dados não conferem')
    if (users[0].ativo === false) throw new Error('Sua conta está inativa. Entre em contato com o administrador.')
    return users[0]
  }

  async function updatePassword(userId: number, novaSenha: string): Promise<void> {
    await api.patch(`users/${userId}`, { senha: novaSenha })
  }

  async function updateUser(id: number, dados: Partial<User>): Promise<void> {
    const { data } = await api.patch<User>(`users/${id}`, dados)
    if (user.value && user.value.id === id) {
      user.value = { ...user.value, ...data }
      localStorage.setItem('agenda_user', JSON.stringify(user.value))
    }
  }

  // Admin
  async function loginAdmin(email: string, senha: string): Promise<boolean> {
    // superadmin fixo de fallback
    if (email === 'admin@gmail.com' && senha === '@123123') {
      adminLogado.value = true
      localStorage.setItem('agenda_admin', 'true')
      return true
    }
    // qualquer email @banco.com
    if (!email.endsWith('@banco.com')) return false
    try {
      const { data: users } = await api.get<User[]>('users', {
        params: { email, senha }
      })
      if (users.length > 0) {
        adminLogado.value = true
        localStorage.setItem('agenda_admin', 'true')
        return true
      }
    } catch {
      // fallback
    }
    return false
  }

  function logoutAdmin() {
    adminLogado.value = false
    localStorage.removeItem('agenda_admin')
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
