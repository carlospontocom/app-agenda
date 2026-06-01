import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import type { Appointment } from '../types'

export const useAppointmentsStore = defineStore('appointments', () => {
  const appointments = ref<Appointment[]>([])
  const loading = ref(false)

  const currentAppointment = computed(() =>
    appointments.value.find(a => a.status === 'pending' || a.status === 'confirmed') || null
  )

  const ultimosAgendamentos = computed(() =>
    [...appointments.value]
      .sort((a, b) => {
        const da = a.createdAt || ''
        const db = b.createdAt || ''
        return db.localeCompare(da)
      })
      .slice(0, 5)
  )

  async function fetchAll() {
    loading.value = true
    const { data } = await api.get<Appointment[]>('appointments')
    appointments.value = data
    loading.value = false
  }

  async function fetchByUser(userId: number) {
    loading.value = true
    const { data } = await api.get<Appointment[]>(`appointments/user/${userId}`)
    appointments.value = data
    loading.value = false
  }

  async function create(app: Omit<Appointment, 'id' | 'createdAt'>): Promise<void> {
    await api.post('appointments', app)
  }

  async function update(id: number, app: Partial<Omit<Appointment, 'id' | 'createdAt'>>): Promise<void> {
    await api.patch(`appointments/${id}`, app)
  }

  async function remove(id: number): Promise<void> {
    await api.delete(`appointments/${id}`)
    appointments.value = appointments.value.filter(a => a.id !== id)
  }

  async function updateStatus(id: number, status: Appointment['status']): Promise<void> {
    await api.patch(`appointments/${id}/status`, { status })
    const idx = appointments.value.findIndex(a => a.id === id)
    if (idx >= 0) appointments.value[idx].status = status
  }

  async function cancel(id: number): Promise<void> {
    await updateStatus(id, 'cancelled')
  }

  return {
    appointments,
    loading,
    currentAppointment,
    ultimosAgendamentos,
    fetchAll,
    fetchByUser,
    create,
    update,
    remove,
    updateStatus,
    cancel
  }
})
