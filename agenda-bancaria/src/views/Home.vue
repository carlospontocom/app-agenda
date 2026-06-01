<template>
  <div>
    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-conteudo">
        <div class="hero-texto">
          <h1 class="hero-titulo">Agendamento Bancário</h1>
          <p class="hero-subtitulo">Agende seus serviços bancários de forma rápida e prática, sem sair de casa.</p>
          <div class="hero-acoes">
            <router-link to="/entrar" class="botao-hero primario">
              <i class="fas fa-sign-in-alt mr-2"></i> Entrar
            </router-link>
            <router-link to="/cadastrar" class="botao-hero secundario">
              <i class="fas fa-user-plus mr-2"></i> Criar Conta
            </router-link>
          </div>
        </div>
        <div class="hero-imagem">
          <i class="fas fa-university"></i>
        </div>
      </div>
    </section>

    <!-- Serviços -->
    <section class="secao-servicos">
      <h2 class="secao-titulo">Nossos Serviços</h2>
      <p class="secao-subtitulo">Confira os serviços disponíveis para agendamento</p>
      <div class="grade-servicos">
        <div class="cartao-servico">
          <div class="icone-servico sucesso">
            <i class="fas fa-plus-circle"></i>
          </div>
          <h3>Abrir Conta</h3>
          <p>Solicite a abertura de uma nova conta corrente ou poupança.</p>
        </div>
        <div class="cartao-servico">
          <div class="icone-servico informativo">
            <i class="fas fa-handshake"></i>
          </div>
          <h3>Renegociar Dívidas</h3>
          <p>Negocie suas pendências financeiras com condições especiais.</p>
        </div>
        <div class="cartao-servico">
          <div class="icone-servico aviso">
            <i class="fas fa-money-bill-wave"></i>
          </div>
          <h3>Saque Volumoso</h3>
          <p>Agende saques de valores elevados com antecedência.</p>
        </div>
        <div class="cartao-servico">
          <div class="icone-servico primario">
            <i class="fas fa-mobile-alt"></i>
          </div>
          <h3>Configurar App</h3>
          <p>Receba ajuda para configurar o aplicativo no seu celular.</p>
        </div>
        <div class="cartao-servico">
          <div class="icone-servico secundario">
            <i class="fas fa-credit-card"></i>
          </div>
          <h3>Cartão de Crédito</h3>
          <p>Solicite seu cartão de crédito com limite especial e sem anuidade.</p>
        </div>
        <div class="cartao-servico">
          <div class="icone-servico">
            <i class="fas fa-exchange-alt"></i>
          </div>
          <h3>Transferência / Pix</h3>
          <p>Agende transferências bancárias e operações via Pix.</p>
        </div>
      </div>
      <div class="info-horario">
        <i class="fas fa-clock mr-2"></i>
        Horário de atendimento: 09:00 às 15:00 — agendamentos a cada 20min.
      </div>
    </section>

    <!-- Benefícios -->
    <section class="secao-beneficios">
      <h2 class="secao-titulo">Por que usar?</h2>
      <div class="grade-beneficios">
        <div class="item-beneficio">
          <i class="fas fa-clock"></i>
          <h3>Economia de Tempo</h3>
          <p>Evite filas e agende seu horário com poucos cliques.</p>
        </div>
        <div class="item-beneficio">
          <i class="fas fa-calendar-check"></i>
          <h3>Escolha o Horário</h3>
          <p>Selecione o dia e horário que funcionam melhor para você.</p>
        </div>
        <div class="item-beneficio">
          <i class="fas fa-shield-alt"></i>
          <h3>Segurança</h3>
          <p>Seus dados protegidos com total segurança e privacidade.</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="rodape">
      <p>
        <i class="fas fa-code mr-1"></i> Desenvolvido por <strong>Carlos</strong> —
        Pós-graduado em Front End com foco em Vue.js e ReactJS,
        conhecimento básico em Node.js e MySQL,
        atua no suporte de ferramentas de crédito.
      </p>
    </footer>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  padding: 4rem 1.5rem;
  text-align: center;
}
.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1a56db 0%, #1e40af 50%, #3730a3 100%);
  clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
  z-index: 0;
}
.hero-conteudo {
  position: relative;
  z-index: 1;
  max-width: 1000px;
  margin: 0 auto;
}
.hero-texto {
  color: #fff;
}
.hero-titulo {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 0.75rem;
  letter-spacing: -0.02em;
}
.hero-subtitulo {
  font-size: 1.15rem;
  opacity: 0.9;
  max-width: 480px;
  margin: 0 auto 2rem;
  line-height: 1.6;
}
.hero-acoes {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
.botao-hero {
  display: inline-flex;
  align-items: center;
  padding: 0.85rem 2rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}
.botao-hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}
.botao-hero.primario {
  background: #fff;
  color: #1a56db;
}
.botao-hero.secundario {
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: 2px solid rgba(255,255,255,0.4);
}
.botao-hero.secundario:hover {
  background: rgba(255,255,255,0.25);
  border-color: #fff;
}
.hero-imagem {
  display: none;
}

/* Serviços */
.secao-servicos {
  max-width: 900px;
  margin: 3rem auto;
  padding: 0 1.5rem;
}
.secao-titulo {
  text-align: center;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem;
}
.secao-subtitulo {
  text-align: center;
  color: #64748b;
  margin: 0 0 2rem;
}
.grade-servicos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
}
.cartao-servico {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  transition: box-shadow 0.25s, transform 0.25s;
}
.cartao-servico:hover {
  box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  transform: translateY(-3px);
}
.icone-servico {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.4rem;
  color: #fff;
}
.icone-servico.sucesso { background: #059669; }
.icone-servico.informativo { background: #0284c7; }
.icone-servico.aviso { background: #d97706; }
.icone-servico.primario { background: #4f46e5; }
.icone-servico.secundario { background: #0891b2; }
.icone-servico:nth-child(6) { background: #7c3aed; }
.cartao-servico h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.4rem;
  color: #1e293b;
}
.cartao-servico p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}
.info-horario {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: #475569;
  background: #f1f5f9;
  padding: 0.85rem 1rem;
  border-radius: 12px;
}

/* Benefícios */
.secao-beneficios {
  max-width: 900px;
  margin: 3rem auto;
  padding: 0 1.5rem;
}
.grade-beneficios {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.item-beneficio {
  text-align: center;
  padding: 1.5rem;
}
.item-beneficio i {
  font-size: 2rem;
  color: #4f46e5;
  background: #eef2ff;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}
.item-beneficio h3 {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 0.4rem;
  color: #1e293b;
}
.item-beneficio p {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* Rodapé */
.rodape {
  max-width: 600px;
  margin: 3rem auto 0;
  padding: 1.5rem;
  text-align: center;
  line-height: 1.6;
  font-size: 0.85rem;
  color: #64748b;
  border-top: 1px solid #e2e8f0;
}
</style>