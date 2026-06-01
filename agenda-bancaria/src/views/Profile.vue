<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { buscarCep } from '../services/cep'
import { formatDate } from '../types'
import { maskDoc, maskTelefone } from '../composables/useMasks'

const auth = useAuthStore()
const router = useRouter()

const alterarSenha = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')
const cepStatus = ref<'ok' | 'error' | null>(null)

const form = reactive({
  telefone: '',
  email: '',
  cep: '',
  logradouro: '',
  bairro: '',
  cidade: '',
  uf: '',
  complemento: '',
  numero: '',
  senha: '',
  confirmarSenha: ''
})

const u = auth.user!
form.telefone = maskTelefone(u.telefone)
form.email = u.email
form.cep = u.cep
form.logradouro = u.logradouro
form.bairro = u.bairro
form.cidade = u.cidade
form.uf = u.uf
form.complemento = u.complemento
form.numero = u.numero

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

async function salvar() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const dados: Record<string, any> = {
      telefone: form.telefone.replace(/\D/g, ''),
      email: form.email,
      cep: form.cep,
      logradouro: form.logradouro,
      bairro: form.bairro,
      cidade: form.cidade,
      uf: form.uf,
      complemento: form.complemento,
      numero: form.numero
    }
    if (alterarSenha.value) {
      if (!form.senha || form.senha.length < 6) {
        throw new Error('Senha deve ter no mínimo 6 caracteres')
      }
      if (form.senha !== form.confirmarSenha) {
        throw new Error('Senhas não conferem')
      }
      dados.senha = form.senha
    }
    await auth.updateUser(auth.user!.id!, dados)
    success.value = 'Dados atualizados com sucesso!'
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function voltar() {
  router.push('/painel')
}
</script>

<template>
  <div v-if="auth.user" class="linha centralizada">
    <div class="coluna-6">
      <h2 class="titulo tamanho-3"><i class="fas fa-user-edit"></i> Meu Perfil</h2>

      <div v-if="error" class="notificacao perigo">{{ error }}</div>
      <div v-if="success" class="notificacao sucesso">{{ success }}</div>

      <div class="cartao">
        <div class="nivel mb-4">
          <span class="texto-negrito">{{ auth.user.nome }}</span>
          <span class="etiqueta clara">{{ maskDoc(auth.user.docPessoal) }}</span>
        </div>

        <div class="campo">
          <label class="rotulo">Telefone</label>
          <div class="controle">
            <input class="entrada" v-model="form.telefone" @input="form.telefone = maskTelefone(form.telefone)" />
          </div>
        </div>
        <div class="campo">
          <label class="rotulo">Email</label>
          <div class="controle">
            <input class="entrada" type="email" v-model="form.email" />
          </div>
        </div>

        <h4 class="titulo tamanho-6 mb-3">Endereço</h4>
        <div class="linha multipla">
          <div class="coluna-4">
            <div class="campo">
              <label class="rotulo">CEP</label>
              <div class="controle com-icone-direita">
                <input
                  class="entrada"
                  :class="cepStatus === 'ok' ? 'borda-sucesso' : cepStatus === 'error' ? 'borda-perigo' : ''"
                  v-model="form.cep"
                  @blur="buscarEndereco"
                  @input="cepStatus = null; error = ''"
                  maxlength="9"
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
                <input class="entrada" v-model="form.logradouro" />
              </div>
            </div>
          </div>
          <div class="coluna-3">
            <div class="campo">
              <label class="rotulo">Número</label>
              <div class="controle">
                <input class="entrada" v-model="form.numero" />
              </div>
            </div>
          </div>
          <div class="coluna-9">
            <div class="campo">
              <label class="rotulo">Complemento</label>
              <div class="controle">
                <input class="entrada" v-model="form.complemento" />
              </div>
            </div>
          </div>
          <div class="coluna-5">
            <div class="campo">
              <label class="rotulo">Bairro</label>
              <div class="controle">
                <input class="entrada" v-model="form.bairro" />
              </div>
            </div>
          </div>
          <div class="coluna-5">
            <div class="campo">
              <label class="rotulo">Cidade</label>
              <div class="controle">
                <input class="entrada" v-model="form.cidade" />
              </div>
            </div>
          </div>
          <div class="coluna-2">
            <div class="campo">
              <label class="rotulo">UF</label>
              <div class="controle">
                <input class="entrada" v-model="form.uf" />
              </div>
            </div>
          </div>
        </div>

        <div class="campo mt-4">
          <label class="etiqueta informativa" style="cursor:pointer;padding:0.5em 1em;display:inline-flex;align-items:center;gap:0.5rem" @click="alterarSenha = !alterarSenha">
            <i class="fas" :class="alterarSenha ? 'fa-check-square' : 'fa-square'"></i>
            Alterar senha
          </label>
        </div>

        <template v-if="alterarSenha">
          <div class="campo">
            <label class="rotulo">Nova Senha</label>
            <div class="controle">
              <input class="entrada" type="password" v-model="form.senha" placeholder="Mínimo 6 caracteres" />
            </div>
          </div>
          <div class="campo">
            <label class="rotulo">Confirmar Nova Senha</label>
            <div class="controle">
              <input class="entrada" type="password" v-model="form.confirmarSenha" placeholder="Repita a senha" />
            </div>
          </div>
        </template>

        <div class="grupo-botoes mt-5">
          <button class="botao" @click="voltar">Voltar</button>
          <button class="botao sucesso largura-total" :class="{ carregando: loading }" @click="salvar">
            <i class="fas fa-save mr-2"></i> Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
