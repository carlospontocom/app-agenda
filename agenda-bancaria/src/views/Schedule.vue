<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAppointmentsStore } from '../stores/appointments'
import api from '../services/api'
import {
  SERVICOS,
  AGENCIAS,
  generateTimeSlots,
  getToday,
  getProximosDiasUteis,
  MAX_SERVICOS
} from '../types'

const auth = useAuthStore()
const appStore = useAppointmentsStore()
const router = useRouter()
const route = useRoute()

const error = ref('')
const success = ref('')
const loading = ref(false)
const editMode = ref(false)
const agendamentoAtivo = ref(false)
const timeSlots = generateTimeSlots()
const blockedSlots = ref<string[]>([])
const diasUteis = getProximosDiasUteis()

const form = reactive({
  servicos: [] as string[],
  agencia: '',
  data: '',
  hora: ''
})

const horariosDisponiveis = computed(() => {
  const hoje = getToday()
  const agora = new Date()
  return timeSlots.filter(slot => {
    if (blockedSlots.value.includes(slot)) return false
    if (form.data === hoje) {
      const horas = parseInt(slot.substring(0, 2))
      const minutos = parseInt(slot.substring(3, 5))
      const agoraMin = agora.getHours() * 60 + agora.getMinutes()
      const slotMin = horas * 60 + minutos
      if (slotMin - agoraMin < 120) return false
    }
    return true
  })
})

onMounted(async () => {
  await appStore.fetchByUser(auth.user!.id!)
  const editando = route.query.edit === 'true'
  if (appStore.currentAppointment) {
    const app = appStore.currentAppointment
    form.servicos = [...app.servicos]
    form.agencia = app.agencia
    form.data = app.data
    form.hora = app.hora
    if (editando) {
      editMode.value = true
    } else {
      agendamentoAtivo.value = true
    }
    if (app.data && app.agencia) {
      await checkBlocked()
    }
  }
})

function ativarEdicao() {
  agendamentoAtivo.value = false
  editMode.value = true
}

function toggleServico(servico: string) {
  const idx = form.servicos.indexOf(servico)
  if (idx >= 0) {
    form.servicos.splice(idx, 1)
  } else if (form.servicos.length < MAX_SERVICOS) {
    form.servicos.push(servico)
  }
}

function selecionarData(value: string) {
  form.data = value
  checkBlocked()
}

async function checkBlocked() {
  if (!form.data || !form.agencia) return
  try {
    const { data } = await api.get<string[]>('agendamentos/checar', {
      params: { agencia: form.agencia, data: form.data }
    })
    blockedSlots.value = data.filter(h => !editMode.value || h !== appStore.currentAppointment?.hora)
  } catch {
    blockedSlots.value = []
  }
}

async function handleSave() {
  error.value = ''
  success.value = ''

  if (form.servicos.length === 0) {
    error.value = 'Selecione pelo menos 1 serviço'
    return
  }
  if (!form.agencia || !form.data || !form.hora) {
    error.value = 'Preencha todos os campos'
    return
  }

  loading.value = true
  try {
    const payload = {
      userId: auth.user!.id!,
      userName: auth.user!.nome,
      userDoc: auth.user!.docPessoal,
      servicos: form.servicos,
      agencia: form.agencia,
      data: form.data,
      hora: form.hora,
      status: 'pending' as const
    }

    if (editMode.value) {
      await appStore.update(appStore.currentAppointment!.id!, payload)
    } else {
      await appStore.create(payload)
    }
    success.value = editMode.value ? 'atualizado' : 'realizado'
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="linha centralizada">
    <div class="coluna-8">
      <h2 class="titulo tamanho-3">
        <i class="fas" :class="editMode ? 'fa-edit' : 'fa-calendar-plus'"></i>
        {{ editMode ? 'Editar Agendamento' : 'Agendar Serviço' }}
      </h2>

      <div v-if="error" class="notificacao perigo">{{ error }}</div>

      <div v-if="success" class="cartao texto-centralizado">
        <i class="fas fa-check-circle texto-sucesso" style="font-size:4rem"></i>
        <h3 class="titulo tamanho-4 mt-4 mb-3">
          Agendamento {{ success }} com Sucesso!
        </h3>
        <p class="texto-cinza mb-5">Você pode visualizar os detalhes na página de agendamentos.</p>
        <router-link to="/meus-agendamentos" class="botao sucesso">
          <i class="fas fa-list mr-2"></i> Meus Agendamentos
        </router-link>
      </div>

      <div v-else-if="agendamentoAtivo" class="cartao texto-centralizado">
        <i class="fas fa-exclamation-triangle texto-aviso" style="font-size:3rem"></i>
        <h3 class="titulo tamanho-5 mt-5 mb-3">Você já possui um agendamento ativo</h3>
        <p class="texto-cinza mb-5">
          Não é possível criar um novo agendamento enquanto houver um em andamento.
          Cancele ou aguarde a conclusão do atual para criar outro.
        </p>
        <div class="grupo-botoes centralizado">
          <router-link to="/meus-agendamentos" class="botao informativo">
            <i class="fas fa-list mr-1"></i> Ver Meu Agendamento
          </router-link>
          <button class="botao primario" @click="ativarEdicao">
            <i class="fas fa-edit mr-1"></i> Editar Agendamento Atual
          </button>
        </div>
      </div>

      <form v-else @submit.prevent="handleSave" class="cartao">
        <div class="campo">
          <label class="rotulo">Serviços (máximo {{ MAX_SERVICOS }})</label>
          <div class="controle">
            <div class="linha multipla">
              <div v-for="s in SERVICOS" :key="s" class="coluna-6 mb-4">
                <div
                  class="cartao"
                  :style="{
                    cursor: 'pointer',
                    border: form.servicos.includes(s) ? '2px solid #485fc7' : '1px solid #dbdbdb',
                    background: form.servicos.includes(s) ? '#eef2fc' : ''
                  }"
                  @click="toggleServico(s)"
                >
                  <i
                    class="fas"
                    :class="form.servicos.includes(s) ? 'fa-check-circle texto-primario' : 'fa-plus-circle texto-cinza'"
                    style="margin-right:0.5rem"
                  ></i>
                  {{ s }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="campo">
          <label class="rotulo">Agência</label>
          <div class="controle">
            <div class="selecao largura-total" style="padding:0">
              <select v-model="form.agencia" @change="checkBlocked" class="entrada" required style="border:none;background:transparent;width:100%;height:100%;padding:calc(0.5em - 1px) calc(0.75em - 1px)">
                <option value="">Selecione a agência</option>
                <option v-for="a in AGENCIAS" :key="a" :value="a">{{ a }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="campo">
          <label class="rotulo">Data (segunda a sexta, próximos 5 dias)</label>
          <div class="controle">
            <div class="linha multipla">
              <div
                v-for="dia in diasUteis"
                :key="dia.value"
                class="coluna"
                style="flex:1;min-width:0"
              >
                <div
                  class="cartao texto-centralizado"
                  :style="{
                    cursor: 'pointer',
                    border: form.data === dia.value ? '2px solid #485fc7' : '1px solid #dbdbdb',
                    background: form.data === dia.value ? '#eef2fc' : '',
                    padding: '0.75rem 0.25rem'
                  }"
                  @click="selecionarData(dia.value)"
                >
                  <div style="font-weight:600;font-size:0.85rem">{{ dia.diaSemana }}</div>
                  <div style="font-size:0.75rem;color:#7a7a7a;margin-top:0.25rem">{{ dia.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="campo" v-if="form.data">
          <label class="rotulo">Horário (9h às 15h - a cada 20min)</label>
          <div class="controle">
            <div class="grade-horarios">
              <div
                v-for="slot in horariosDisponiveis"
                :key="slot"
                class="cartao slot-digital"
                :class="{ selecionado: form.hora === slot }"
                @click="form.hora = slot"
              >
                <span class="slot-tempo">{{ slot }}</span>
              </div>
            </div>
            <p v-if="horariosDisponiveis.length === 0" class="texto-aviso texto-pequeno mt-2">
              Nenhum horário disponível nesta data para esta agência.
            </p>
          </div>
        </div>

        <div class="grupo-botoes mt-5">
          <router-link to="/meus-agendamentos" class="botao">Cancelar</router-link>
          <button class="botao primario largura-total" :class="{ carregando: loading }" type="submit">
            <i class="fas fa-check mr-2"></i>
            {{ editMode ? 'Atualizar Agendamento' : 'Confirmar Agendamento' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.grade-horarios {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.slot-digital {
  cursor: pointer;
  padding: 0.5rem 1rem;
  border: 1px solid #dbdbdb;
  border-radius: 6px;
  background: #1a1a2e;
  transition: all 0.2s ease;
  min-width: 80px;
  text-align: center;
}
.slot-digital:hover {
  border-color: #485fc7;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.slot-digital.selecionado {
  border: 2px solid #00d1b2;
  background: #0a0a1a;
  box-shadow: 0 0 10px rgba(0,209,178,0.3);
}
.slot-tempo {
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: #00ff88;
  text-shadow: 0 0 5px rgba(0,255,136,0.5);
}
.slot-digital.selecionado .slot-tempo {
  color: #00d1b2;
  text-shadow: 0 0 8px rgba(0,209,178,0.6);
}
</style>
