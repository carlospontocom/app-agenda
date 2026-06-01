<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div v-if="auth.user" class="linha centralizada">
    <div class="coluna-6">
      <h2 class="titulo tamanho-3"><i class="fas fa-tachometer-alt"></i> Painel do Cliente</h2>

      <div class="cartao">
        <h3 class="titulo tamanho-5">Bem-vindo, {{ auth.user.nome }}!</h3>
        <p class="texto-cinza mb-5">Selecione uma opção abaixo para continuar.</p>

        <div class="grade-funcionalidades">
          <router-link to="/agendar" class="cartao funcionalidade">
            <i class="fas fa-calendar-plus icone-func"></i>
            <span class="titulo-func">Novo Agendamento</span>
            <span class="desc-func">Agende um horário em uma de nossas agências</span>
          </router-link>

          <router-link to="/meus-agendamentos" class="cartao funcionalidade">
            <i class="fas fa-list icone-func"></i>
            <span class="titulo-func">Meus Agendamentos</span>
            <span class="desc-func">Visualize e gerencie seus agendamentos</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grade-funcionalidades {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.funcionalidade {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
  transition: all 0.2s ease;
  border: 1px solid #dbdbdb;
  text-decoration: none;
  color: inherit;
}
.funcionalidade:hover {
  border-color: #485fc7;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72,95,199,0.15);
}
.icone-func {
  font-size: 2rem;
  color: #485fc7;
  margin-bottom: 0.75rem;
}
.titulo-func {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}
.desc-func {
  font-size: 0.85rem;
  color: #7a7a7a;
}
</style>
