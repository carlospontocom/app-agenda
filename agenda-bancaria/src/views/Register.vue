<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { buscarCep } from '../services/cep'
import { formatDate } from '../types'
import type { User } from '../types'
import { maskDoc, maskTelefone } from '../composables/useMasks'

const auth = useAuthStore()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const success = ref('')
const cepStatus = ref<'ok' | 'error' | null>(null)

const step = ref(1)
const jaCadastrado = ref('')

const form = reactive({
  docPessoal: '',
  email: '',
  nome: '',
  genero: '',
  data_nascimento: '',
  telefone: '',
  cep: '',
  logradouro: '',
  bairro: '',
  cidade: '',
  uf: '',
  numero: '',
  complemento: '',
  senha: '',
  confirmarSenha: ''
})

async function verificarCadastro() {
  error.value = ''
  jaCadastrado.value = ''
  if (!form.docPessoal || !form.email) {
    error.value = 'Preencha documento e email'
    return
  }
  step.value = 2
}

async function buscarEndereco() {
  cepStatus.value = null
  if (form.cep.replace(/\D/g, '').length !== 8) return
  try {
    const data = await buscarCep(form.cep)
    form.logradouro = data.logradouro
    form.bairro = data.bairro
    form.cidade = data.localidade
    form.uf = data.uf
    cepStatus.value = 'ok'
  } catch (e: any) {
    error.value = e.message
    cepStatus.value = 'error'
  }
}

function avancarParaEndereco() {
  error.value = ''
  if (!form.nome || !form.genero || !form.data_nascimento || !form.telefone) {
    error.value = 'Preencha todos os campos obrigatórios'
    return
  }
  step.value = 3
}

function avancarParaSenha() {
  error.value = ''
  if (!form.cep || !form.numero) {
    error.value = 'Preencha CEP e número'
    return
  }
  step.value = 4
}

function avancarParaRevisao() {
  error.value = ''
  if (!form.senha || !form.confirmarSenha) {
    error.value = 'Preencha a senha'
    return
  }
  if (form.senha !== form.confirmarSenha) {
    error.value = 'Senhas não conferem'
    return
  }
  if (form.senha.length < 6) {
    error.value = 'Senha deve ter no mínimo 6 caracteres'
    return
  }
  step.value = 5
}

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    const dados: User = {
      nome: form.nome,
      genero: form.genero,
      data_nascimento: form.data_nascimento,
      telefone: form.telefone.replace(/\D/g, ''),
      docPessoal: form.docPessoal.replace(/\D/g, ''),
      email: form.email,
      senha: form.senha,
      cep: form.cep,
      logradouro: form.logradouro,
      bairro: form.bairro,
      cidade: form.cidade,
      uf: form.uf,
      complemento: form.complemento,
      numero: form.numero
    }
    await auth.register(dados)
    step.value = 6
  } catch (e: any) {
    error.value = e.response?.data?.error || e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="linha centralizada">
    <div class="coluna-6">
      <h2 class="titulo tamanho-3"><i class="fas fa-user-plus"></i> Cadastro</h2>

      <div class="cartao mb-4">
        <div class="etapas-registro">
          <div v-for="s in 5" :key="s" class="etapa-item">
            <span class="etiqueta" :class="step === s ? 'primaria' : step > s ? 'sucesso' : 'clara'" style="border-radius:50%;width:2rem;height:2rem;display:inline-flex;align-items:center;justify-content:center">
              {{ step > s ? '✓' : s }}
            </span>
            <p class="texto-cinza etapa-rotulo">
              {{ ['', 'Verificar', 'Dados', 'Endereço', 'Senha', 'Revisão'][s] }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="error" class="notificacao perigo">{{ error }}</div>
      <div v-if="success" class="notificacao sucesso">{{ success }}</div>

      <!-- Step 1: Verificação -->
      <div v-if="step === 1" class="cartao">
        <h3 class="titulo tamanho-5">Verificar Cadastro</h3>
        <p class="mb-3">Informe seu documento e email para verificar se já possui cadastro.</p>

        <div v-if="jaCadastrado" class="notificacao aviso mb-4">
          <p><strong>{{ jaCadastrado }} já cadastrado no sistema.</strong></p>
          <p class="mt-2">Se você já possui cadastro, clique no botão abaixo para recuperar sua senha. Caso contrário, altere os dados acima e verifique novamente.</p>
          <div class="grupo-botoes mt-3">
            <router-link to="/recuperar-senha" class="botao aviso">
              <i class="fas fa-key mr-1"></i> Recuperar Senha
            </router-link>
            <button class="botao" @click="jaCadastrado = ''">
              <i class="fas fa-arrow-left mr-1"></i> Tentar outro dado
            </button>
          </div>
        </div>

        <div class="campo">
          <label class="rotulo">Documento (CPF/CNPJ) *</label>
          <div class="controle">
            <input class="entrada" v-model="form.docPessoal" @input="form.docPessoal = maskDoc(form.docPessoal)" placeholder="CPF ou CNPJ" required />
          </div>
        </div>
        <div class="campo">
          <label class="rotulo">Email *</label>
          <div class="controle">
            <input class="entrada" type="email" v-model="form.email" placeholder="email@exemplo.com" required />
          </div>
        </div>
        <div class="campo" v-if="!jaCadastrado">
          <button class="botao primario largura-total" :class="{ carregando: loading }" @click="verificarCadastro">
            <i class="fas fa-check mr-2"></i> Verificar
          </button>
        </div>
      </div>

      <!-- Step 2: Dados Pessoais -->
      <div v-if="step === 2" class="cartao">
        <h3 class="titulo tamanho-5">Dados Pessoais</h3>
        <div class="campo">
          <label class="rotulo">Nome completo *</label>
          <div class="controle">
            <input class="entrada" v-model="form.nome" placeholder="Nome completo" required />
          </div>
        </div>
        <div class="linha multipla">
          <div class="coluna-4">
            <div class="campo">
              <label class="rotulo">Gênero *</label>
              <div class="controle">
                <div class="selecao largura-total" style="padding:0">
                  <select v-model="form.genero" class="entrada" required style="border:none;background:transparent;width:100%;height:100%;padding:calc(0.5em - 1px) calc(0.75em - 1px)">
                    <option value="">Selecione</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div class="coluna-4">
            <div class="campo">
              <label class="rotulo">Telefone *</label>
              <div class="controle">
                <input class="entrada" v-model="form.telefone" @input="form.telefone = maskTelefone(form.telefone)" placeholder="(11) 99999-9999" required />
              </div>
            </div>
          </div>
          <div class="coluna-4">
            <div class="campo">
              <label class="rotulo">Data de Nascimento *</label>
              <div class="controle">
                <input class="entrada" type="date" v-model="form.data_nascimento" required />
              </div>
            </div>
          </div>
        </div>
        <div class="campo">
          <button class="botao primario largura-total" @click="avancarParaEndereco">
            <i class="fas fa-arrow-right mr-2"></i> Próximo
          </button>
        </div>
      </div>

      <!-- Step 3: Endereço -->
      <div v-if="step === 3" class="cartao">
        <h3 class="titulo tamanho-5">Endereço</h3>
        <div class="linha multipla">
          <div class="coluna-4">
            <div class="campo">
              <label class="rotulo">CEP *</label>
              <div class="controle com-icone-direita">
                <input
                  class="entrada"
                  :class="cepStatus === 'ok' ? 'borda-sucesso' : cepStatus === 'error' ? 'borda-perigo' : ''"
                  v-model="form.cep"
                  placeholder="00000-000"
                  @blur="buscarEndereco"
                  @input="cepStatus = null; error = ''"
                  maxlength="9"
                  required
                />
                <span class="icone direita pequena" @click="buscarEndereco" style="cursor:pointer">
                  <i class="fas" :class="cepStatus === 'ok' ? 'fa-check-circle texto-sucesso' : cepStatus === 'error' ? 'fa-exclamation-circle texto-perigo' : 'fa-search'"></i>
                </span>
              </div>
            </div>
          </div>
          <div class="coluna-8">
            <div class="campo">
              <label class="rotulo">Logradouro</label>
              <div class="controle">
                <input class="entrada" v-model="form.logradouro" readonly />
              </div>
            </div>
          </div>
          <div class="coluna-3">
            <div class="campo">
              <label class="rotulo">Número *</label>
              <div class="controle">
                <input class="entrada" v-model="form.numero" placeholder="Número" required />
              </div>
            </div>
          </div>
          <div class="coluna-9">
            <div class="campo">
              <label class="rotulo">Complemento</label>
              <div class="controle">
                <input class="entrada" v-model="form.complemento" placeholder="Apto, Bloco, etc" />
              </div>
            </div>
          </div>
          <div class="coluna-5">
            <div class="campo">
              <label class="rotulo">Bairro</label>
              <div class="controle">
                <input class="entrada" v-model="form.bairro" readonly />
              </div>
            </div>
          </div>
          <div class="coluna-5">
            <div class="campo">
              <label class="rotulo">Cidade</label>
              <div class="controle">
                <input class="entrada" v-model="form.cidade" readonly />
              </div>
            </div>
          </div>
          <div class="coluna-2">
            <div class="campo">
              <label class="rotulo">UF</label>
              <div class="controle">
                <input class="entrada" v-model="form.uf" readonly />
              </div>
            </div>
          </div>
        </div>
        <div class="grupo-botoes">
          <button class="botao" @click="step = 2">
            <i class="fas fa-arrow-left mr-2"></i> Voltar
          </button>
          <button class="botao primario largura-total" @click="avancarParaSenha">
            <i class="fas fa-arrow-right mr-2"></i> Próximo
          </button>
        </div>
      </div>

      <!-- Step 4: Senha -->
      <div v-if="step === 4" class="cartao">
        <h3 class="titulo tamanho-5">Senha</h3>
        <div class="campo">
          <label class="rotulo">Senha *</label>
          <div class="controle">
            <input class="entrada" type="password" v-model="form.senha" placeholder="Mínimo 6 caracteres" required />
          </div>
        </div>
        <div class="campo">
          <label class="rotulo">Confirmar Senha *</label>
          <div class="controle">
            <input class="entrada" type="password" v-model="form.confirmarSenha" placeholder="Repita a senha" required />
          </div>
        </div>
        <div class="grupo-botoes">
          <button class="botao" @click="step = 3">
            <i class="fas fa-arrow-left mr-2"></i> Voltar
          </button>
          <button class="botao primario largura-total" @click="avancarParaRevisao">
            <i class="fas fa-arrow-right mr-2"></i> Próximo
          </button>
        </div>
      </div>

      <!-- Step 5: Revisão -->
      <div v-if="step === 5" class="cartao">
        <h3 class="titulo tamanho-5">Revisar Cadastro</h3>
        <table class="tabela largura-total">
          <tbody>
            <tr><td><strong>Documento</strong></td><td>{{ maskDoc(form.docPessoal) }}</td></tr>
            <tr><td><strong>Email</strong></td><td>{{ form.email }}</td></tr>
            <tr><td><strong>Nome</strong></td><td>{{ form.nome }}</td></tr>
            <tr><td><strong>Gênero</strong></td><td>{{ form.genero }}</td></tr>
            <tr><td><strong>Data Nasc.</strong></td><td>{{ formatDate(form.data_nascimento) }}</td></tr>
            <tr><td><strong>Telefone</strong></td><td>{{ maskTelefone(form.telefone) }}</td></tr>
            <tr><td><strong>Endereço</strong></td><td>{{ form.logradouro }}, {{ form.numero }} - {{ form.bairro }}, {{ form.cidade }}/{{ form.uf }}</td></tr>
            <tr><td><strong>Complemento</strong></td><td>{{ form.complemento || '---' }}</td></tr>
          </tbody>
        </table>
        <div class="grupo-botoes mt-4">
          <button class="botao" @click="step = 4">
            <i class="fas fa-arrow-left mr-2"></i> Voltar
          </button>
          <button class="botao sucesso largura-total" :class="{ carregando: loading }" @click="handleRegister">
            <i class="fas fa-check mr-2"></i> Confirmar Cadastro
          </button>
        </div>
      </div>

      <div v-if="step === 6" class="cartao texto-centralizado">
        <i class="fas fa-check-circle texto-sucesso" style="font-size:4rem"></i>
        <h3 class="titulo tamanho-4 mt-4 mb-3">Cadastro Realizado com Sucesso!</h3>
        <p class="texto-cinza mb-5">Seu cadastro foi concluído. Agora você pode acessar o sistema.</p>
        <router-link to="/entrar" class="botao sucesso">
          <i class="fas fa-sign-in-alt mr-2"></i> Fazer Login
        </router-link>
      </div>

      <p class="texto-centralizado mt-3">
        Já tem conta? <router-link to="/entrar">Faça login</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.etapas-registro {
  display: flex;
  justify-content: center;
  gap: 0;
}

.etapa-item {
  flex: 1;
  text-align: center;
  max-width: 6rem;
}

.etapa-rotulo {
  font-size: 0.65rem;
  margin-top: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .etapas-registro {
    overflow-x: auto;
    justify-content: flex-start;
    gap: 0.25rem;
    padding-bottom: 0.25rem;
  }

  .etapa-item {
    flex: 0 0 auto;
    min-width: 3.5rem;
  }
}
</style>
