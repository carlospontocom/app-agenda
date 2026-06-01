<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const step = ref<'form' | 'confirm' | 'reset'>('form')
const doc = ref('')
const dataNasc = ref('')
const email = ref('')
const novaSenha = ref('')
const confirmarSenha = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)
const userId = ref<number | null>(null)

async function verificarDados() {
  error.value = ''
  if (!doc.value || !dataNasc.value || !email.value) {
    error.value = 'Preencha todos os campos'
    return
  }
  loading.value = true
  try {
    const user = await auth.recoverPassword(doc.value, dataNasc.value, email.value)
    userId.value = user.id!
    step.value = 'reset'
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function redefinirSenha() {
  error.value = ''
  if (novaSenha.value !== confirmarSenha.value) {
    error.value = 'Senhas não conferem'
    return
  }
  if (novaSenha.value.length < 6) {
    error.value = 'Senha deve ter no mínimo 6 caracteres'
    return
  }
  loading.value = true
  try {
    await auth.updatePassword(userId.value!, novaSenha.value)
    success.value = 'Senha redefinida com sucesso!'
    setTimeout(() => router.push('/entrar'), 2000)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="linha centralizada">
    <div class="coluna-4">
      <h2 class="titulo tamanho-3"><i class="fas fa-key"></i> Recuperar Senha</h2>

      <div v-if="error" class="notificacao perigo">{{ error }}</div>
      <div v-if="success" class="notificacao sucesso">{{ success }}</div>

      <div v-if="step === 'form' || step === 'confirm'" class="cartao">
        <p class="mb-3">Informe seus dados para verificação:</p>
        <div class="campo">
          <label class="rotulo">Documento (CPF/CNPJ)</label>
          <div class="controle">
            <input class="entrada" v-model="doc" placeholder="Apenas números" required />
          </div>
        </div>
        <div class="campo">
          <label class="rotulo">Data de Nascimento</label>
          <div class="controle">
            <input class="entrada" type="date" v-model="dataNasc" required />
          </div>
        </div>
        <div class="campo">
          <label class="rotulo">Email</label>
          <div class="controle">
            <input class="entrada" type="email" v-model="email" placeholder="email@exemplo.com" required />
          </div>
        </div>
        <div class="campo">
          <button class="botao aviso largura-total" :class="{ carregando: loading }" @click="verificarDados">
            <i class="fas fa-check mr-2"></i> Verificar
          </button>
        </div>
      </div>

      <div v-if="step === 'reset'" class="cartao">
        <p class="mb-3">Defina sua nova senha:</p>
        <div class="campo">
          <label class="rotulo">Nova Senha</label>
          <div class="controle">
            <input class="entrada" type="password" v-model="novaSenha" placeholder="Mínimo 6 caracteres" required />
          </div>
        </div>
        <div class="campo">
          <label class="rotulo">Confirmar Nova Senha</label>
          <div class="controle">
            <input class="entrada" type="password" v-model="confirmarSenha" placeholder="Repita a senha" required />
          </div>
        </div>
        <div class="campo">
          <button class="botao sucesso largura-total" :class="{ carregando: loading }" @click="redefinirSenha">
            <i class="fas fa-save mr-2"></i> Redefinir Senha
          </button>
        </div>
      </div>

      <p class="texto-centralizado mt-3">
        <router-link to="/entrar">Voltar ao login</router-link>
      </p>
    </div>
  </div>
</template>
