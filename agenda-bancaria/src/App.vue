<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from './composables/useToast'

const auth = useAuthStore()
const router = useRouter()
const { toasts } = useToast()

const dropdownUsuario = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function onClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    dropdownUsuario.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

function sair() {
  dropdownUsuario.value = false
  auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="container-toast">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="notificacao"
      :class="t.type"
    >
      {{ t.message }}
    </div>
  </div>

  <nav class="barra-navegacao">
    <router-link to="/" class="marca">
      <i class="fas fa-university mr-2"></i> Banco Agendamento
    </router-link>
    <div class="menu-navbar">
      <div class="fim-navbar">
        <router-link to="/" class="item-navbar">Início</router-link>

        <template v-if="!auth.isLoggedIn && !auth.adminLogado">
          <router-link to="/entrar" class="item-navbar">Login</router-link>
          <router-link to="/cadastrar" class="item-navbar">Cadastro</router-link>
        </template>

        <template v-if="auth.isLoggedIn && !auth.adminLogado">
          <router-link to="/painel" class="item-navbar">Painel</router-link>
          <router-link to="/agendar" class="item-navbar">Agendar</router-link>
          <router-link to="/meus-agendamentos" class="item-navbar">Meus Agendamentos</router-link>
        </template>

        <template v-if="auth.isLoggedIn && auth.adminLogado">
          <router-link to="/admin/painel" class="item-navbar">
            <i class="fas fa-shield-alt mr-1"></i> Dashboard
          </router-link>
          <router-link to="/admin/clientes" class="item-navbar">
            <i class="fas fa-users mr-1"></i> Clientes
          </router-link>
        </template>

        <template v-if="auth.isLoggedIn">
          <div ref="dropdownRef" class="dropdown-usuario">
            <button class="botao-icone-usuario" @click.stop="dropdownUsuario = !dropdownUsuario">
              <i class="fas fa-user-circle"></i>
            </button>
            <div v-if="dropdownUsuario" class="menu-dropdown">
              <div class="cabecalho-dropdown">
                <i class="fas fa-user-circle"></i>
                <div>
                  <div class="nome-dropdown">{{ auth.user?.nome }}</div>
                  <div class="email-dropdown">{{ auth.user?.email }}</div>
                </div>
              </div>
              <div class="divisao-dropdown"></div>
              <router-link to="/perfil" class="item-dropdown" @click="dropdownUsuario = false">
                <i class="fas fa-user-edit"></i> Meu Perfil
              </router-link>
              <router-link to="/meus-agendamentos" class="item-dropdown" @click="dropdownUsuario = false">
                <i class="fas fa-list"></i> Meus Agendamentos
              </router-link>
              <div class="divisao-dropdown"></div>
              <button class="item-dropdown sair" @click="sair">
                <i class="fas fa-sign-out-alt"></i> Sair
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </nav>

  <section class="secao">
    <div class="container">
      <router-view />
    </div>
  </section>
</template>

<style scoped>
.container-toast {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}
.container-toast .notificacao {
  margin-bottom: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  animation: slideIn 0.3s ease;
}
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.dropdown-usuario {
  position: relative;
}
.botao-icone-usuario {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.6rem;
  color: #485fc7;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.botao-icone-usuario:hover {
  color: #3a4eb5;
}
.menu-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.5rem;
  background: #fff;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  min-width: 220px;
  z-index: 999;
  overflow: hidden;
}
.cabecalho-dropdown {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f5f7fa;
}
.cabecalho-dropdown > i {
  font-size: 2rem;
  color: #485fc7;
}
.nome-dropdown {
  font-weight: 600;
  font-size: 0.95rem;
  color: #363636;
}
.email-dropdown {
  font-size: 0.8rem;
  color: #7a7a7a;
}
.divisao-dropdown {
  height: 1px;
  background: #dbdbdb;
}
.item-dropdown {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  color: #363636;
  text-decoration: none;
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
  transition: background 0.15s;
}
.item-dropdown:hover {
  background: #f0f2f5;
}
.item-dropdown.sair {
  color: #f14668;
}
.item-dropdown.sair:hover {
  background: #fef0f0;
}
</style>
