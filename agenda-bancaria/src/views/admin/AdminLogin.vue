<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const senha = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  if (!email.value || !senha.value) {
    error.value = 'Preencha email e senha'
    return
  }
  loading.value = true
  try {
    const ok = await auth.loginAdmin(email.value, senha.value)
    if (ok) {
      router.push('/admin/painel')
    } else {
      error.value = 'Credenciais administrativas inválidas'
    }
  } catch {
    error.value = 'Erro ao autenticar'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="linha centralizada">
    <div class="coluna-4">
      <h2 class="titulo tamanho-3"><i class="fas fa-shield-alt"></i> Admin</h2>

      <div v-if="error" class="notificacao perigo">{{ error }}</div>

      <form @submit.prevent="handleLogin" class="cartao">
        <div class="campo">
          <label class="rotulo">Email admin</label>
          <div class="controle com-icone-esquerda">
            <input class="entrada" type="email" v-model="email" placeholder="admin@gmail.com" required />
            <span class="icone esquerda"><i class="fas fa-envelope"></i></span>
          </div>
        </div>
        <div class="campo">
          <label class="rotulo">Senha</label>
          <div class="controle com-icone-esquerda">
            <input class="entrada" type="password" v-model="senha" placeholder="@123123" required />
            <span class="icone esquerda"><i class="fas fa-lock"></i></span>
          </div>
        </div>
        <div class="campo">
          <button class="botao escuro largura-total" :class="{ carregando: loading }" type="submit">
            <i class="fas fa-sign-in-alt mr-2"></i> Entrar como Admin
          </button>
        </div>
      </form>

      <p class="texto-centralizado">
        <router-link to="/">Voltar ao início</router-link>
      </p>
    </div>
  </div>
</template>
