<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAppointmentsStore } from '../../stores/appointments'
import { AGENCIAS, SERVICOS, formatDate, formatarStatusAgendamento } from '../../types'
import type { StatusAgendamento, Appointment } from '../../types'

const auth = useAuthStore()
const appStore = useAppointmentsStore()
const router = useRouter()

const aba = ref<'agendamentos' | 'relatorios'>('agendamentos')

// ---- Agendamentos tab ----

const filters = reactive({
  cliente: '',
  agencia: '',
  data: '',
  status: ''
})

const filtered = ref<Appointment[]>([])
const pagina = ref(1)
const porPagina = 7

const modalConcluir = ref(false)
const modalCancelar = ref(false)
const cancelarApp = ref<Appointment | null>(null)
const concluirApp = ref<Appointment | null>(null)
const loadingId = ref<number | null>(null)

const totalPaginas = computed(() => Math.max(1, Math.ceil(filtered.value.length / porPagina)))

const paginados = computed(() => {
  const inicio = (pagina.value - 1) * porPagina
  return filtered.value.slice(inicio, inicio + porPagina)
})

const ultimosPorCliente = computed(() => {
  const grupos: Record<string, Appointment[]> = {}
  for (const app of appStore.appointments) {
    const key = app.userId?.toString() ?? app.userName
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(app)
  }
  const resultado: Appointment[] = []
  for (const key in grupos) {
    grupos[key].sort((a, b) => {
      const da = a.createdAt ?? ''
      const db = b.createdAt ?? ''
      return db.localeCompare(da)
    })
    resultado.push(...grupos[key].slice(0, 3))
  }
  return resultado
})

onMounted(async () => {
  await appStore.fetchAll()
  aplicarFiltros()
})

function aplicarFiltros() {
  let result = [...ultimosPorCliente.value]
  if (filters.cliente) {
    const q = filters.cliente.toLowerCase()
    result = result.filter(a =>
      a.userName.toLowerCase().includes(q) ||
      a.userDoc.toLowerCase().includes(q)
    )
  }
  if (filters.agencia) {
    result = result.filter(a => a.agencia === filters.agencia)
  }
  if (filters.data) {
    result = result.filter(a => a.data === filters.data)
  }
  if (filters.status) {
    result = result.filter(a => a.status === filters.status)
  }
  const ordem: Record<string, number> = { pending: 0, confirmed: 1, completed: 2, cancelled: 3 }
  result.sort((a, b) => (ordem[a.status] ?? 9) - (ordem[b.status] ?? 9))
  filtered.value = result
  pagina.value = 1
}

function irPara(p: number) {
  if (p >= 1 && p <= totalPaginas.value) pagina.value = p
}

function confirmarConcluir(app: Appointment) {
  concluirApp.value = app
  modalConcluir.value = true
}

function confirmarCancelar(app: Appointment) {
  cancelarApp.value = app
  modalCancelar.value = true
}

async function executarCancelar() {
  if (!cancelarApp.value?.id) return
  loadingId.value = cancelarApp.value.id!
  await appStore.updateStatus(cancelarApp.value.id, 'cancelled')
  modalCancelar.value = false
  cancelarApp.value = null
  loadingId.value = null
  await appStore.fetchAll()
  aplicarFiltros()
}

async function executarConcluir() {
  if (!concluirApp.value?.id) return
  loadingId.value = concluirApp.value.id!
  await appStore.updateStatus(concluirApp.value.id, 'completed')
  modalConcluir.value = false
  concluirApp.value = null
  loadingId.value = null
  await appStore.fetchAll()
  aplicarFiltros()
}

async function atualizarStatus(id: number, status: StatusAgendamento) {
  loadingId.value = id
  await appStore.updateStatus(id, status)
  loadingId.value = null
  await appStore.fetchAll()
  aplicarFiltros()
}

function logout() {
  auth.logout()
  router.push('/entrar')
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

function agora() {
  const d = new Date()
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}h${m}`
}

// ---- Relatorios tab ----

const relFilter = reactive({
  inicio: '',
  fim: '',
  agencia: '',
  servico: ''
})

function mesCorrente() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function resetRelFilter() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  relFilter.inicio = `${y}-${m}-01`
  const ultimoDia = new Date(y, d.getMonth() + 1, 0).getDate()
  relFilter.fim = `${y}-${m}-${String(ultimoDia).padStart(2, '0')}`
  relFilter.agencia = ''
  relFilter.servico = ''
}

onMounted(() => {
  resetRelFilter()
})

function dadosRelatorio() {
  let base = appStore.appointments

  if (relFilter.inicio) {
    base = base.filter(a => a.data >= relFilter.inicio)
  }
  if (relFilter.fim) {
    base = base.filter(a => a.data <= relFilter.fim)
  }
  if (relFilter.agencia) {
    base = base.filter(a => a.agencia === relFilter.agencia)
  }
  if (relFilter.servico) {
    base = base.filter(a => a.servicos.includes(relFilter.servico))
  }

  const total = base.length

  const porAgencia: Record<string, number> = {}
  AGENCIAS.forEach(a => { porAgencia[a] = 0 })
  base.forEach(a => { porAgencia[a.agencia] = (porAgencia[a.agencia] || 0) + 1 })

  const porServico: Record<string, number> = {}
  SERVICOS.forEach(s => { porServico[s] = 0 })
  base.forEach(a => {
    a.servicos.forEach(s => { porServico[s] = (porServico[s] || 0) + 1 })
  })

  const porStatus = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  }
  base.forEach(a => { porStatus[a.status as keyof typeof porStatus]++ })

  const maxAgencia = Math.max(...Object.values(porAgencia), 1)
  const maxServico = Math.max(...Object.values(porServico), 1)
  const maxStatus = Math.max(...Object.values(porStatus), 1)

  return { total, porAgencia, porServico, porStatus, maxAgencia, maxServico, maxStatus }
}

function exportarCSV() {
  const { porAgencia, porServico, porStatus } = dadosRelatorio()

  let linhas = 'Relatório de Agendamentos\n'
  linhas += `Período: ${relFilter.inicio || '—'} a ${relFilter.fim || '—'}\n`
  if (relFilter.agencia) linhas += `Agência: ${relFilter.agencia}\n`
  if (relFilter.servico) linhas += `Serviço: ${relFilter.servico}\n`
  linhas += '\n'

  linhas += 'Agência;Quantidade\n'
  for (const [ag, qtd] of Object.entries(porAgencia)) {
    linhas += `${ag};${qtd}\n`
  }
  linhas += '\n'

  linhas += 'Serviço;Quantidade\n'
  for (const [sv, qtd] of Object.entries(porServico)) {
    linhas += `${sv};${qtd}\n`
  }
  linhas += '\n'

  linhas += 'Status;Quantidade\n'
  const STATUS_MAP: Record<string, string> = { pending: 'Pendente', confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado' }
  for (const [st, qtd] of Object.entries(porStatus)) {
    linhas += `${STATUS_MAP[st] || st};${qtd}\n`
  }
  linhas += '\n'

  linhas += 'Cliente;Documento;Serviços;Agência;Data;Hora;Status\n'
  let base = appStore.appointments
  if (relFilter.inicio) base = base.filter(a => a.data >= relFilter.inicio)
  if (relFilter.fim) base = base.filter(a => a.data <= relFilter.fim)
  if (relFilter.agencia) base = base.filter(a => a.agencia === relFilter.agencia)
  if (relFilter.servico) base = base.filter(a => a.servicos.includes(relFilter.servico))
  for (const a of base) {
    const servicos = a.servicos.join(', ')
    const status = STATUS_MAP[a.status] || a.status
    linhas += `${a.userName};${a.userDoc};${servicos};${a.agencia};${a.data};${a.hora};${status}\n`
  }

  const blob = new Blob([linhas], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const agora = new Date()
  const ts = `${agora.getFullYear()}${String(agora.getMonth()+1).padStart(2,'0')}${String(agora.getDate()).padStart(2,'0')}_${String(agora.getHours()).padStart(2,'0')}${String(agora.getMinutes()).padStart(2,'0')}`
  link.download = `relatorio_agendamentos_${ts}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function trackBar(val: number, max: number): string {
  return max > 0 ? `${(val / max) * 100}%` : '0%'
}

function corAgencia(i: number): string {
  const cores = ['#3e8ed0', '#48c774', '#ffd241', '#f14668', '#7a7a7a']
  return cores[i % cores.length]
}

function corServico(i: number): string {
  const cores = ['#485fc7', '#00d1b2', '#ff470f', '#947600']
  return cores[i % cores.length]
}
</script>

<template>
  <div>
    <div class="nivel mb-4">
      <div class="nivel-esquerda">
        <h2 class="titulo tamanho-3"><i class="fas fa-shield-alt"></i> Painel Administrativo</h2>
      </div>
      <div class="nivel-direita">
        <router-link to="/admin/clientes" class="botao primario mr-2">
          <i class="fas fa-users mr-1"></i> Gerenciar Clientes
        </router-link>
        <button class="botao escuro" @click="logout">
          <i class="fas fa-sign-out-alt mr-1"></i> Sair
        </button>
      </div>
    </div>

    <div class="grupo-botoes mb-4">
      <button class="botao" :class="aba === 'agendamentos' ? 'informativo' : 'claro'" @click="aba = 'agendamentos'">
        <i class="fas fa-list mr-2"></i> Agendamentos
      </button>
      <button class="botao" :class="aba === 'relatorios' ? 'informativo' : 'claro'" @click="aba = 'relatorios'">
        <i class="fas fa-chart-bar mr-2"></i> Relatórios
      </button>
    </div>

    <!-- ==================== ABA AGENDAMENTOS ==================== -->
    <template v-if="aba === 'agendamentos'">
      <div class="filtros">
        <div class="grade-filtros">
          <div class="campo">
            <label class="rotulo">Cliente (nome ou doc)</label>
            <div class="controle">
              <input class="entrada" v-model="filters.cliente" placeholder="Buscar cliente..." @input="aplicarFiltros" />
            </div>
          </div>
          <div class="campo">
            <label class="rotulo">Agência</label>
            <div class="controle">
              <div class="selecao largura-total" style="padding:0">
                <select v-model="filters.agencia" @change="aplicarFiltros" class="entrada" style="border:none;background:transparent;width:100%;height:100%;padding:calc(0.5em - 1px) calc(0.75em - 1px)">
                  <option value="">Todas</option>
                  <option v-for="a in AGENCIAS" :key="a" :value="a">{{ a }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="campo">
            <label class="rotulo">Data</label>
            <div class="controle">
              <input class="entrada" type="date" v-model="filters.data" @change="aplicarFiltros" />
            </div>
          </div>
          <div class="campo">
            <label class="rotulo">Status</label>
            <div class="controle">
              <div class="selecao largura-total" style="padding:0">
                <select v-model="filters.status" @change="aplicarFiltros" class="entrada" style="border:none;background:transparent;width:100%;height:100%;padding:calc(0.5em - 1px) calc(0.75em - 1px)">
                  <option value="">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="appStore.loading" class="texto-centralizado">
        <i class="fas fa-spinner fa-pulse fa-2x"></i>
      </div>

      <div v-else-if="filtered.length === 0" class="cartao texto-centralizado">
        <p class="texto-cinza">Nenhum agendamento encontrado com os filtros atuais.</p>
      </div>

      <div v-else class="tabela-container">
        <table class="tabela largura-total listrada suspensivel">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Documento</th>
              <th>Serviços</th>
              <th>Agência</th>
              <th>Data</th>
              <th>Hora</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in paginados" :key="app.id">
              <td>{{ app.userName }}</td>
              <td>{{ app.userDoc }}</td>
              <td>
                <span v-for="(s, i) in app.servicos" :key="i">
                  {{ s }}<br v-if="i < app.servicos.length - 1" />
                </span>
              </td>
              <td>{{ app.agencia }}</td>
              <td>{{ formatDate(app.data) }}</td>
              <td>{{ app.hora }}</td>
              <td>
                <span :class="'etiqueta ' + statusClass(app.status)">{{ formatarStatusAgendamento(app) }}</span>
              </td>
              <td>
                <div class="grupo-botoes pequenos">
                  <button
                    v-if="app.status === 'pending' || app.status === 'confirmed'"
                    class="botao sucesso"
                    :class="{ carregando: loadingId === app.id }"
                    @click="confirmarConcluir(app)"
                  >
                    Concluir
                  </button>
                  <button
                    v-if="app.status !== 'cancelled' && app.status !== 'completed'"
                    class="botao perigo"
                    :class="{ carregando: loadingId === app.id }"
                    @click="confirmarCancelar(app)"
                  >
                    Cancelar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="nivel mt-4">
          <div class="nivel-esquerda">
            <p class="texto-cinza texto-pequeno">
              Exibindo {{ (pagina - 1) * porPagina + 1 }}–{{ Math.min(pagina * porPagina, filtered.length) }}
              de {{ filtered.length }} agendamento{{ filtered.length !== 1 ? 's' : '' }}
            </p>
          </div>
          <div class="nivel-direita">
            <div class="grupo-botoes">
              <button class="botao" :disabled="pagina <= 1" @click="irPara(pagina - 1)">
                <i class="fas fa-chevron-left"></i>
              </button>
              <span
                v-for="p in totalPaginas"
                :key="p"
                class="etiqueta"
                :class="p === pagina ? 'primaria' : 'clara'"
                style="cursor:pointer;margin:0 0.15rem"
                @click="irPara(p)"
              >
                {{ p }}
              </span>
              <button class="botao" :disabled="pagina >= totalPaginas" @click="irPara(pagina + 1)">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="modalCancelar" class="sobreposicao" @click.self="modalCancelar = false">
        <div class="cartao" style="max-width:500px;width:100%">
          <h3 class="titulo tamanho-5 mb-4">Cancelar Atendimento</h3>
          <div class="notificacao perigo mb-4">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            Ao cancelar este atendimento, o cliente <strong>{{ cancelarApp?.userName }}</strong> será notificado
            e poderá realizar um novo agendamento. Esta ação não pode ser desfeita.
          </div>
          <p>Deseja realmente cancelar o atendimento?</p>
          <div class="grupo-botoes mt-5">
            <button class="botao" @click="modalCancelar = false">Voltar</button>
            <button class="botao perigo" @click="executarCancelar">
              <i class="fas fa-ban mr-2"></i> Sim, cancelar
            </button>
          </div>
        </div>
      </div>

      <div v-if="modalConcluir" class="sobreposicao" @click.self="modalConcluir = false">
        <div class="cartao" style="max-width:500px;width:100%">
          <h3 class="titulo tamanho-5 mb-4">Concluir Atendimento</h3>
          <div class="notificacao aviso mb-4">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            Ao concluir o atendimento, o cliente poderá realizar um novo agendamento.
            Esta ação não pode ser desfeita.
          </div>
          <p>Deseja concluir o atendimento do cliente <strong>{{ concluirApp?.userName }}</strong>?</p>
          <p>Atendimento concluído às <strong>{{ agora() }}</strong>.</p>
          <div class="grupo-botoes mt-5">
            <button class="botao" @click="modalConcluir = false">Cancelar</button>
            <button class="botao sucesso" @click="executarConcluir">
              <i class="fas fa-check mr-2"></i> Sim, concluir
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== ABA RELATÓRIOS ==================== -->
    <template v-if="aba === 'relatorios'">
      <div class="filtros">
        <div class="grade-filtros">
          <div class="campo">
            <label class="rotulo">Data início</label>
            <div class="controle">
              <input class="entrada" type="date" v-model="relFilter.inicio" />
            </div>
          </div>
          <div class="campo">
            <label class="rotulo">Data fim</label>
            <div class="controle">
              <input class="entrada" type="date" v-model="relFilter.fim" />
            </div>
          </div>
          <div class="campo">
            <label class="rotulo">Agência</label>
            <div class="controle">
              <div class="selecao largura-total" style="padding:0">
                <select v-model="relFilter.agencia" class="entrada" style="border:none;background:transparent;width:100%;height:100%;padding:calc(0.5em - 1px) calc(0.75em - 1px)">
                  <option value="">Todas</option>
                  <option v-for="a in AGENCIAS" :key="a" :value="a">{{ a }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="campo">
            <label class="rotulo">Serviço</label>
            <div class="controle">
              <div class="selecao largura-total" style="padding:0">
                <select v-model="relFilter.servico" class="entrada" style="border:none;background:transparent;width:100%;height:100%;padding:calc(0.5em - 1px) calc(0.75em - 1px)">
                  <option value="">Todos</option>
                  <option v-for="s in SERVICOS" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="linha multipla mb-4">
        <div class="coluna-3">
          <div class="cartao texto-centralizado">
            <p class="texto-cinza texto-pequeno mb-1">Total do período</p>
            <p class="titulo tamanho-2" style="margin:0">{{ dadosRelatorio().total }}</p>
          </div>
        </div>
      </div>

      <div class="linha multipla">
        <div class="coluna-4">
          <div class="cartao">
            <h4 class="titulo tamanho-6 mb-3"><i class="fas fa-building mr-2"></i> Por Agência</h4>
            <div v-for="ag in AGENCIAS" :key="ag" class="mb-3">
              <div class="nivel mb-1">
                <span class="texto-negrito texto-pequeno">{{ ag }}</span>
                <span class="texto-cinza texto-pequeno">{{ dadosRelatorio().porAgencia[ag] || 0 }}</span>
              </div>
              <div class="barra-fundo">
                <div
                  class="barra-preenchimento"
                  :style="{ width: trackBar(dadosRelatorio().porAgencia[ag] || 0, dadosRelatorio().maxAgencia), background: corAgencia(AGENCIAS.indexOf(ag)) }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="coluna-4">
          <div class="cartao">
            <h4 class="titulo tamanho-6 mb-3"><i class="fas fa-concierge-bell mr-2"></i> Por Serviço</h4>
            <div v-for="sv in SERVICOS" :key="sv" class="mb-3">
              <div class="nivel mb-1">
                <span class="texto-negrito texto-pequeno">{{ sv }}</span>
                <span class="texto-cinza texto-pequeno">{{ dadosRelatorio().porServico[sv] || 0 }}</span>
              </div>
              <div class="barra-fundo">
                <div
                  class="barra-preenchimento"
                  :style="{ width: trackBar(dadosRelatorio().porServico[sv] || 0, dadosRelatorio().maxServico), background: corServico(SERVICOS.indexOf(sv)) }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="coluna-4">
          <div class="cartao">
            <h4 class="titulo tamanho-6 mb-3"><i class="fas fa-tag mr-2"></i> Por Status</h4>
            <div
              v-for="(qtd, st) in dadosRelatorio().porStatus"
              :key="st"
              class="mb-3"
            >
              <div class="nivel mb-1">
                <span class="texto-negrito texto-pequeno">
                  <span
                    class="etiqueta texto-pequeno"
                    :class="statusClass(st)"
                  >
                    {{ st === 'pending' ? 'Pendente' : st === 'confirmed' ? 'Confirmado' : st === 'completed' ? 'Concluído' : 'Cancelado' }}
                  </span>
                </span>
                <span class="texto-cinza texto-pequeno">{{ qtd }}</span>
              </div>
              <div class="barra-fundo">
                <div
                  class="barra-preenchimento"
                  :style="{
                    width: trackBar(qtd, dadosRelatorio().maxStatus),
                    background: st === 'completed' ? '#48c774' : st === 'cancelled' ? '#f14668' : st === 'confirmed' ? '#3e8ed0' : '#ffd241'
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="texto-centralizado mt-4">
        <button class="botao sucesso grande" @click="exportarCSV">
          <i class="fas fa-file-csv mr-2"></i> Exportar CSV
        </button>
      </div>
    </template>
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
.barra-fundo {
  width: 100%;
  height: 1.25rem;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}
.barra-preenchimento {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
  min-width: 4px;
}
</style>
