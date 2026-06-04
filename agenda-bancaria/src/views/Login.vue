<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const email = ref('admin@banco.com')
const senha = ref('@123123')
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
    await auth.login(email.value, senha.value)
    if (auth.adminLogado) {
      router.push('/admin/painel')
    } else {
      router.push('/painel')
    }
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
      <h2 class="titulo tamanho-3"><i class="fas fa-sign-in-alt"></i> Login</h2>

      <div v-if="error" class="notificacao perigo">{{ error }}</div>

      <form @submit.prevent="handleLogin" class="cartao">
        <div class="campo">
          <label class="rotulo">Email</label>
          <div class="controle com-icone-esquerda">
            <input class="entrada" type="email" v-model="email" placeholder="seu@email.com" required />
            <span class="icone esquerda"><i class="fas fa-envelope"></i></span>
          </div>
        </div>

        <div class="campo">
          <label class="rotulo">Senha</label>
          <div class="controle com-icone-esquerda">
            <input class="entrada" type="password" v-model="senha" placeholder="Sua senha" required />
            <span class="icone esquerda"><i class="fas fa-lock"></i></span>
          </div>
        </div>

        <div class="campo">
          <button class="botao primario largura-total" :class="{ carregando: loading }" type="submit">
            <template v-if="!loading"><i class="fas fa-sign-in-alt mr-2"></i> Entrar</template>
            <template v-else><i class="fas fa-spinner fa-spin mr-2"></i> Processando...</template>
          </button>
        </div>
      </form>

      <p class="texto-centralizado">
        <router-link to="/cadastrar">Cadastre-se</router-link> |
        <router-link to="/recuperar-senha">Esqueceu a senha?</router-link>
      </p>
    </div>
  </div>
</template>
