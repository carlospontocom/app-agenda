<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import type { User } from '../../types'
import { useToast } from '../../composables/useToast'
import { maskDoc, maskTelefone } from '../../composables/useMasks'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const clientes = ref<User[]>([])
const loading = ref(false)
const busca = ref('')
const pagina = ref(1)
const porPagina = 5
const editando = ref(false)
const editandoId = ref<number | null>(null)
const acoesAberto = ref<number | null>(null)

function onClickAcoes(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.acoes-dropdown')) {
    acoesAberto.value = null
  }
}

onMounted(() => document.addEventListener('click', onClickAcoes))
onUnmounted(() => document.removeEventListener('click', onClickAcoes))

const formEdicao = reactive({
  nome: '',
  genero: '',
  data_nascimento: '',
  telefone: '',
  docPessoal: '',
  email: '',
  cep: '',
  logradouro: '',
  bairro: '',
  cidade: '',
  uf: '',
  complemento: '',
  numero: ''
})

const filtrados = computed(() => {
  if (!busca.value) return clientes.value
  const q = busca.value.toLowerCase()
  return clientes.value.filter(c =>
    c.nome.toLowerCase().includes(q) ||
    c.docPessoal.toLowerCase().includes(q)
  )
})

const totalPaginas = computed(() => Math.max(1, Math.ceil(filtrados.value.length / porPagina)))

const paginados = computed(() => {
  const inicio = (pagina.value - 1) * porPagina
  return filtrados.value.slice(inicio, inicio + porPagina)
})

onMounted(async () => {
  await carregar()
})

async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get<User[]>('admin/usuarios')
    clientes.value = data
  } finally {
    loading.value = false
  }
}

function buscar() {
  pagina.value = 1
}

function irPara(p: number) {
  if (p >= 1 && p <= totalPaginas.value) pagina.value = p
}

function abrirEdicao(c: User) {
  editandoId.value = c.id ?? null
  formEdicao.nome = c.nome
  formEdicao.genero = c.genero
  formEdicao.data_nascimento = c.data_nascimento
  formEdicao.telefone = maskTelefone(c.telefone)
  formEdicao.docPessoal = maskDoc(c.docPessoal)
  formEdicao.email = c.email
  formEdicao.cep = c.cep
  formEdicao.logradouro = c.logradouro
  formEdicao.bairro = c.bairro
  formEdicao.cidade = c.cidade
  formEdicao.uf = c.uf
  formEdicao.complemento = c.complemento
  formEdicao.numero = c.numero
  editando.value = true
}

function fecharEdicao() {
  editando.value = false
  editandoId.value = null
}

async function salvarEdicao() {
  if (!editandoId.value) return
  try {
    await api.patch(`admin/usuarios/${editandoId.value}`, {
      nome: formEdicao.nome,
      genero: formEdicao.genero,
      data_nascimento: formEdicao.data_nascimento,
      telefone: formEdicao.telefone.replace(/\D/g, ''),
      docPessoal: formEdicao.docPessoal.replace(/\D/g, ''),
      email: formEdicao.email,
      cep: formEdicao.cep,
      logradouro: formEdicao.logradouro,
      bairro: formEdicao.bairro,
      cidade: formEdicao.cidade,
      uf: formEdicao.uf,
      complemento: formEdicao.complemento,
      numero: formEdicao.numero
    })
    fecharEdicao()
    await carregar()
  } catch (e: any) {
    toast.perigo('Erro ao salvar: ' + e.message)
  }
}

async function toggleAtivo(c: User) {
  const acao = c.ativo !== false ? 'desativar' : 'ativar'
  if (!confirm(`Tem certeza que deseja ${acao} este cliente?`)) return
  try {
    await api.patch(`admin/usuarios/${c.id}/alternar-status`)
    await carregar()
  } catch (e: any) {
    toast.perigo('Erro ao alterar status: ' + e.message)
  }
}

function logout() {
  auth.logout()
  router.push('/entrar')
}

function formatDate(d: string): string {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const yyyy = dt.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}
</script>

<template>
  <div>
    <div class="nivel mb-4">
      <div class="nivel-esquerda">
        <h2 class="titulo tamanho-3"><i class="fas fa-users"></i> Gerenciar Clientes</h2>
      </div>
      <div class="nivel-direita">
        <router-link to="/admin/painel" class="botao informativo mr-2">
          <i class="fas fa-arrow-left mr-1"></i> Voltar
        </router-link>
        <button class="botao escuro" @click="logout">
          <i class="fas fa-sign-out-alt mr-1"></i> Sair
        </button>
      </div>
    </div>

    <div class="cartao filtros">
      <div class="grade-filtros">
        <div class="campo" style="margin-bottom:0">
          <label class="rotulo">Buscar por nome ou documento</label>
          <div class="controle">
            <input class="entrada" v-model="busca" placeholder="Digite para filtrar..." @input="buscar" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="texto-centralizado">
      <i class="fas fa-spinner fa-pulse fa-2x"></i>
    </div>

    <div v-else-if="paginados.length === 0" class="cartao texto-centralizado">
      <p class="texto-cinza">Nenhum cliente encontrado.</p>
    </div>

    <div v-else class="tabela-container">
      <table class="tabela largura-total listrada suspensivel">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Documento</th>
            <th>Email</th>
            <th>Data Nasc.</th>
            <th>Cidade/UF</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in paginados" :key="c.id">
            <td>{{ c.nome }}</td>
            <td>{{ maskDoc(c.docPessoal) }}</td>
            <td>{{ c.email }}</td>
            <td>{{ formatDate(c.data_nascimento) }}</td>
            <td>{{ c.cidade }}/{{ c.uf }}</td>
            <td>
              <span class="etiqueta" :class="c.ativo !== false ? 'sucesso' : 'perigo'">
                {{ c.ativo !== false ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
            <td>
              <div class="acoes-dropdown">
                <button class="botao informativo pequeno" @click.stop="acoesAberto = acoesAberto === c.id ? null : (c.id ?? null)">
                  <i class="fas fa-ellipsis-v mr-1"></i> Ações
                </button>
                <div v-if="acoesAberto === c.id" class="menu-acoes">
                  <button class="item-acao" @click="abrirEdicao(c); acoesAberto = null">
                    <i class="fas fa-edit"></i> Editar
                  </button>
                  <button class="item-acao" :class="c.ativo !== false ? 'perigo' : 'sucesso'" @click="toggleAtivo(c); acoesAberto = null">
                    <i class="fas" :class="c.ativo !== false ? 'fa-ban' : 'fa-check'"></i>
                    {{ c.ativo !== false ? 'Desativar' : 'Ativar' }}
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="nivel mt-4">
        <div class="nivel-esquerda">
          <p class="texto-cinza texto-pequeno">
            Exibindo {{ (pagina - 1) * porPagina + 1 }}–{{ Math.min(pagina * porPagina, filtrados.length) }}
            de {{ filtrados.length }} cliente{{ filtrados.length !== 1 ? 's' : '' }}
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

    <!-- Modal de edição -->
    <div v-if="editando" class="sobreposicao" @click.self="fecharEdicao">
      <div class="cartao modal-edicao">
        <div class="nivel mb-4">
          <div class="nivel-esquerda">
            <h3 class="titulo tamanho-5">Editar Cliente</h3>
          </div>
          <div class="nivel-direita">
            <button class="botao" @click="fecharEdicao">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="linha multipla">
          <div class="coluna-6">
            <div class="campo">
              <label class="rotulo">Nome</label>
              <div class="controle">
                <input class="entrada" v-model="formEdicao.nome" />
              </div>
            </div>
          </div>
          <div class="coluna-6">
            <div class="campo">
              <label class="rotulo">Gênero</label>
              <div class="controle">
                <div class="selecao largura-total" style="padding:0">
                  <select v-model="formEdicao.genero" class="entrada" style="border:none;background:transparent;width:100%;height:100%;padding:calc(0.5em - 1px) calc(0.75em - 1px)">
                    <option value="">Selecione</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div class="coluna-6">
            <div class="campo">
              <label class="rotulo">Data Nascimento</label>
              <div class="controle">
                <input class="entrada" type="date" v-model="formEdicao.data_nascimento" />
              </div>
            </div>
          </div>
          <div class="coluna-6">
            <div class="campo">
              <label class="rotulo">Telefone</label>
              <div class="controle">
                <input class="entrada" v-model="formEdicao.telefone" @input="formEdicao.telefone = maskTelefone(formEdicao.telefone)" />
              </div>
            </div>
          </div>
          <div class="coluna-6">
            <div class="campo">
              <label class="rotulo">Documento</label>
              <div class="controle">
                <input class="entrada" v-model="formEdicao.docPessoal" @input="formEdicao.docPessoal = maskDoc(formEdicao.docPessoal)" />
              </div>
            </div>
          </div>
          <div class="coluna-6">
            <div class="campo">
              <label class="rotulo">Email</label>
              <div class="controle">
                <input class="entrada" type="email" v-model="formEdicao.email" />
              </div>
            </div>
          </div>
          <div class="coluna-3">
            <div class="campo">
              <label class="rotulo">CEP</label>
              <div class="controle">
                <input class="entrada" v-model="formEdicao.cep" />
              </div>
            </div>
          </div>
          <div class="coluna-9">
            <div class="campo">
              <label class="rotulo">Logradouro</label>
              <div class="controle">
                <input class="entrada" v-model="formEdicao.logradouro" />
              </div>
            </div>
          </div>
          <div class="coluna-3">
            <div class="campo">
              <label class="rotulo">Número</label>
              <div class="controle">
                <input class="entrada" v-model="formEdicao.numero" />
              </div>
            </div>
          </div>
          <div class="coluna-9">
            <div class="campo">
              <label class="rotulo">Complemento</label>
              <div class="controle">
                <input class="entrada" v-model="formEdicao.complemento" />
              </div>
            </div>
          </div>
          <div class="coluna-5">
            <div class="campo">
              <label class="rotulo">Bairro</label>
              <div class="controle">
                <input class="entrada" v-model="formEdicao.bairro" />
              </div>
            </div>
          </div>
          <div class="coluna-5">
            <div class="campo">
              <label class="rotulo">Cidade</label>
              <div class="controle">
                <input class="entrada" v-model="formEdicao.cidade" />
              </div>
            </div>
          </div>
          <div class="coluna-2">
            <div class="campo">
              <label class="rotulo">UF</label>
              <div class="controle">
                <input class="entrada" v-model="formEdicao.uf" />
              </div>
            </div>
          </div>
        </div>

        <div class="grupo-botoes mt-5">
          <button class="botao" @click="fecharEdicao">Cancelar</button>
          <button class="botao sucesso largura-total" @click="salvarEdicao">
            <i class="fas fa-save mr-2"></i> Salvar Alterações
          </button>
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
.modal-edicao {
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}
.acoes-dropdown {
  position: relative;
}
.menu-acoes {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.25rem;
  background: #fff;
  border: 1px solid #dbdbdb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  min-width: 150px;
  z-index: 10;
  overflow: hidden;
}
.item-acao {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  color: #363636;
}
.item-acao:hover {
  background: #f0f2f5;
}
.item-acao.perigo {
  color: #f14668;
}
.item-acao.perigo:hover {
  background: #fef0f0;
}
.item-acao.sucesso {
  color: #257942;
}
.item-acao.sucesso:hover {
  background: #effaf3;
}
</style>
