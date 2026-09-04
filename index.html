<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard de Multas SENATRAN - Firebase</title>
  
  <!-- Firebase -->
  <script type="module" src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"></script>
  <script type="module" src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"></script>
  
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  
  <!-- CSS -->
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="dashboard-container">
    
    <header class="header">
      <div class="header-top">
        <div class="logo-section">
          <div class="logo">📊</div>
          <div>
            <h1>Dashboard de Multas SENATRAN</h1>
            <p>Gestão centralizada de notificações de trânsito</p>
          </div>
        </div>
        <div class="header-right">
          <button class="btn-export" onclick="exportarRelatorio()">📥 Exportar Relatório</button>
        </div>
      </div>
    </header>

    <div class="tabs-container">
      <button class="tab-btn active" onclick="mudarAba('overview')">📊 Visão Geral</button>
      <button class="tab-btn" onclick="mudarAba('por-cidade')">🏙️ Por Centro de Custo</button>
      <button class="tab-btn" onclick="mudarAba('por-status')">📌 Por Status</button>
      <button class="tab-btn" onclick="mudarAba('detalhes')">📋 Detalhes</button>
    </div>

    <div id="aba-overview" class="tab-content active">
      
      <section class="filters-section">
        <div class="filter-group">
          <label>📅 Período</label>
          <select id="periodo" onchange="filtrarDados()">
            <option value="">Todos</option>
            <option value="mes">Este mês</option>
            <option value="trimestre">Trimestre</option>
            <option value="ano">Este ano</option>
          </select>
        </div>
        <div class="filter-group">
          <label>📌 Status</label>
          <select id="status" onchange="filtrarDados()">
            <option value="">Todos</option>
            <option value="Pendente">Pendente</option>
            <option value="Pago">Pago</option>
            <option value="Contestação">Contestação</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
        <div class="filter-group">
          <label>🚗 Placa</label>
          <input type="text" id="placa" placeholder="RIA5H47" onkeyup="filtrarDados()">
        </div>
        <div class="filter-group">
          <label>🏙️ Cidade</label>
          <select id="cidade" onchange="filtrarDados()">
            <option value="">Todas</option>
          </select>
        </div>
        <button class="btn-limpar" onclick="limparFiltros()">↻ Limpar</button>
      </section>

      <section class="kpi-cards" id="kpiCards">
        <div class="loading">⏳ Carregando dados...</div>
      </section>

      <section class="charts-row">
        <div class="chart-container">
          <h3>📊 Multas por Status</h3>
          <canvas id="graficoStatus"></canvas>
        </div>
        <div class="chart-container">
          <h3>💰 Valor por Tipo</h3>
          <canvas id="graficoValor"></canvas>
        </div>
        <div class="chart-container">
          <h3>🏙️ Multas por Cidade</h3>
          <canvas id="graficoCidade"></canvas>
        </div>
      </section>

      <section class="charts-row">
        <div class="chart-container full">
          <h3>📈 Tendência Mensal</h3>
          <canvas id="graficoTendencia"></canvas>
        </div>
        <div class="chart-container">
          <h3>⚠️ Por Tipo de Infração</h3>
          <canvas id="graficoTipo"></canvas>
        </div>
      </section>

      <section class="table-section">
        <div class="table-header">
          <h2>📋 Multas Registradas</h2>
          <span id="totalRegistros" class="total-registros">0 registros</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>AIT</th>
                <th>Data</th>
                <th>Placa</th>
                <th>Descrição</th>
                <th>Centro de Custo</th>
                <th>Código</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="tabelaCorpo">
              <tr><td colspan="8" style="text-align: center; padding: 30px;">⏳ Carregando...</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div id="aba-por-cidade" class="tab-content">
      <section class="city-section">
        <h2>📊 Análise por Centro de Custo</h2>
        <div class="city-cards" id="cityCardi">
          <div class="loading">⏳ Carregando...</div>
        </div>
      </section>
    </div>

    <div id="aba-por-status" class="tab-content">
      <section class="status-section">
        <h2>📌 Análise por Status</h2>
        <div class="status-cards" id="statusCards">
          <div class="loading">⏳ Carregando...</div>
        </div>
      </section>
    </div>

    <div id="aba-detalhes" class="tab-content">
      <section class="details-section">
        <h2>📋 Detalhes Completos</h2>
        <div class="details-filters">
          <input type="text" id="filterTabela" placeholder="🔍 Filtrar tabela..." onkeyup="filtrarTabela()">
        </div>
        <div class="table-wrapper">
          <table class="details-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Data</th>
                <th>Placa</th>
                <th>Motorista</th>
                <th>Descrição</th>
                <th>Local</th>
                <th>Cidade</th>
                <th>Centro de Custo</th>
                <th>Matrícula</th>
                <th>Valor</th>
                <th>Status</th>
                <th>AIT</th>
                <th>Desconto Colaborador</th>
                <th>Indicação</th>
              </tr>
            </thead>
            <tbody id="tabelaDetalhes">
              <tr><td colspan="14" style="text-align: center; padding: 30px;">⏳ Carregando...</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

  </div>

  <footer class="footer">
    <p>Dashboard de Multas SENATRAN | v3.0 Firebase (100% Grátis)</p>
    <p>Última atualização: <span id="footerTime">--:--:--</span></p>
  </footer>

  <script type="module" src="firebase-config.js"></script>
  <script type="module" src="app.js"></script>
</body>
</html>
