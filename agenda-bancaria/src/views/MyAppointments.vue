<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAppointmentsStore } from '../stores/appointments'
import { STATUS_MAP, formatDate, formatarStatusAgendamento } from '../types'
import type { StatusAgendamento } from '../types'

const auth = useAuthStore()
const appStore = useAppointmentsStore()
const router = useRouter()

const modalCancelar = ref(false)
const modalExcluir = ref(false)

const historico = computed(() =>
  appStore.ultimosAgendamentos.filter(a =>
    a.status === 'completed' || a.status === 'cancelled'
  )
)

onMounted(async () => {
  if (auth.user) {
    await appStore.fetchByUser(auth.user.id!)
  }
})

function editar() {
  router.push('/agendar?edit=true')
}

function cancelar() {
  modalCancelar.value = true
}

async function executarCancelar() {
  if (!appStore.currentAppointment) return
  await appStore.cancel(appStore.currentAppointment.id!)
  modalCancelar.value = false
  await appStore.fetchByUser(auth.user!.id!)
}

function excluir() {
  modalExcluir.value = true
}

async function executarExcluir() {
  if (!appStore.currentAppointment) return
  await appStore.remove(appStore.currentAppointment.id!)
  modalExcluir.value = false
  await appStore.fetchByUser(auth.user!.id!)
}

function statusClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'aviso',
    confirmed: 'informativa',
    completed: 'sucesso',
    cancelled: 'perigo'
  }
  return map[status] || 'clara'
}
</script>

<template>
  <div class="linha centralizada">
    <div class="coluna-8">
      <h2 class="titulo tamanho-3"><i class="fas fa-list"></i> Meu Agendamento</h2>

      <div v-if="appStore.loading" class="texto-centralizado">
        <i class="fas fa-spinner fa-pulse fa-2x"></i>
      </div>

      <template v-else>
        <!-- Agendamento ativo -->
        <div v-if="appStore.currentAppointment" class="cartao">
          <h3 class="titulo tamanho-5">Agendamento Atual</h3>
          <div class="nivel">
            <div class="nivel-esquerda">
              <span class="etiqueta" :class="statusClass(appStore.currentAppointment.status)">
                {{ formatarStatusAgendamento(appStore.currentAppointment) }}
              </span>
            </div>
          </div>

          <table class="tabela largura-total">
            <tbody>
              <tr>
                <td><strong>Serviços</strong></td>
                <td>
                  <span v-for="(s, i) in appStore.currentAppointment.servicos" :key="i">
                    {{ s }}<span v-if="i < appStore.currentAppointment.servicos.length - 1">, </span>
                  </span>
                </td>
              </tr>
              <tr><td><strong>Agência</strong></td><td>{{ appStore.currentAppointment.agencia }}</td></tr>
              <tr><td><strong>Data</strong></td><td>{{ formatDate(appStore.currentAppointment.data) }}</td></tr>
              <tr><td><strong>Horário</strong></td><td>{{ appStore.currentAppointment.hora }}</td></tr>
              <tr><td><strong>Criado em</strong></td><td>{{ formatDate(appStore.currentAppointment.createdAt || '') }}</td></tr>
            </tbody>
          </table>

          <div class="grupo-botoes mt-4" v-if="appStore.currentAppointment.status !== 'cancelled' && appStore.currentAppointment.status !== 'completed'">
            <button class="botao informativo" @click="editar">
              <i class="fas fa-edit mr-1"></i> Editar
            </button>
            <button class="botao aviso" @click="cancelar">
              <i class="fas fa-ban mr-1"></i> Cancelar
            </button>
            <button class="botao perigo" @click="excluir">
              <i class="fas fa-trash mr-1"></i> Excluir
            </button>
          </div>
        </div>

        <div v-else class="cartao texto-centralizado mb-4">
          <p class="texto-cinza" style="font-size:1.25rem">Você não possui agendamento ativo.</p>
          <router-link to="/agendar" class="botao primario mt-3">
            <i class="fas fa-calendar-plus mr-2"></i> Criar Agendamento
          </router-link>
        </div>

        <!-- Histórico -->
        <div class="cartao" v-if="historico.length > 0">
          <h3 class="titulo tamanho-5">Últimos Atendimentos</h3>
          <div class="tabela-container">
            <table class="tabela largura-total listrada">
              <thead>
                <tr>
                  <th>Serviços</th>
                  <th>Agência</th>
                  <th>Data</th>
                  <th>Hora</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="app in historico" :key="app.id">
                  <td>
                    <span v-for="(s, i) in app.servicos" :key="i">
                      {{ s }}<span v-if="i < app.servicos.length - 1">, </span>
                    </span>
                  </td>
                  <td>{{ app.agencia }}</td>
                  <td>{{ formatDate(app.data) }}</td>
                  <td>{{ app.hora }}</td>
                  <td>
                    <span :class="'etiqueta ' + statusClass(app.status)">{{ formatarStatusAgendamento(app) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- Modal Cancelar -->
      <div v-if="modalCancelar" class="sobreposicao" @click.self="modalCancelar = false">
        <div class="cartao" style="max-width:500px;width:100%">
          <h3 class="titulo tamanho-5 mb-4">Cancelar Agendamento</h3>
          <div class="notificacao perigo mb-4">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            Ao cancelar este agendamento, você poderá agendar um novo horário.
            Esta ação não pode ser desfeita.
          </div>
          <p>Deseja realmente cancelar este agendamento?</p>
          <div class="grupo-botoes mt-5">
            <button class="botao" @click="modalCancelar = false">Voltar</button>
            <button class="botao perigo" @click="executarCancelar">
              <i class="fas fa-ban mr-2"></i> Sim, cancelar
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Excluir -->
      <div v-if="modalExcluir" class="sobreposicao" @click.self="modalExcluir = false">
        <div class="cartao" style="max-width:500px;width:100%">
          <h3 class="titulo tamanho-5 mb-4">Excluir Agendamento</h3>
          <div class="notificacao perigo mb-4">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            Esta ação removerá permanentemente este agendamento do sistema.
            Esta ação não pode ser desfeita.
          </div>
          <p>Deseja realmente excluir permanentemente este agendamento?</p>
          <div class="grupo-botoes mt-5">
            <button class="botao" @click="modalExcluir = false">Voltar</button>
            <button class="botao perigo" @click="executarExcluir">
              <i class="fas fa-trash mr-2"></i> Sim, excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sobreposicao {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
</style>
