// ============================================
// APP.JS - Lógica do Dashboard de Multas
// ============================================
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

let todasMultas = [];
let multasFiltradas = [];

// Espera o Firebase estar pronto (window.db é setado pelo firebase-config.js)
function aguardarFirebase() {
  return new Promise((resolve) => {
    const checar = () => {
      if (window.db) {
        resolve(window.db);
      } else {
        console.log('⏳ Aguardando Firebase...');
        setTimeout(checar, 200);
      }
    };
    checar();
  });
}

// ============================================
// CARREGAR DADOS DO FIRESTORE
// ============================================
async function carregarMultas() {
  const db = await aguardarFirebase();
  const multasRef = collection(db, "multas");

  // onSnapshot escuta mudanças em tempo real
  onSnapshot(multasRef, (snapshot) => {
    todasMultas = [];
    snapshot.forEach((doc) => {
      todasMultas.push({ id: doc.id, ...doc.data() });
    });
    console.log(`✅ ${todasMultas.length} multa(s) carregada(s)`);

    document.getElementById('syncStatus').textContent = '✅ Sincronizado';
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('pt-BR');
    document.getElementById('footerTime').textContent = new Date().toLocaleTimeString('pt-BR');

    popularFiltroCidade();
    filtrarDados();
  }, (error) => {
    console.error('❌ Erro ao buscar multas:', error);
    document.getElementById('syncStatus').textContent = '❌ Erro na sincronização';
  });
}

// ============================================
// FILTROS
// ============================================
function popularFiltroCidade() {
  const select = document.getElementById('cidade');
  const cidadesAtuais = new Set(Array.from(select.options).map(o => o.value));
  const cidades = new Set(todasMultas.map(m => m['Centro de custo']).filter(Boolean));

  cidades.forEach(cidade => {
    if (!cidadesAtuais.has(cidade)) {
      const opt = document.createElement('option');
      opt.value = cidade;
      opt.textContent = cidade;
      select.appendChild(opt);
    }
  });
}

function filtrarDados() {
  const periodo = document.getElementById('periodo').value;
  const status = document.getElementById('status').value;
  const placa = document.getElementById('placa').value.trim().toUpperCase();
  const cidade = document.getElementById('cidade').value;

  multasFiltradas = todasMultas.filter(m => {
    if (placa && !(m['Placa'] || '').toUpperCase().includes(placa)) return false;
    if (cidade && m['Centro de custo'] !== cidade) return false;
    if (status && m['Status'] !== status) return false;
    if (periodo) {
      const dataStr = m['Data infração'];
      if (!dataStr) return false;
      const [dia, mes, ano] = dataStr.split('/').map(Number);
      const dataMulta = new Date(ano, mes - 1, dia);
      const hoje = new Date();

      if (periodo === 'mes') {
        if (dataMulta.getMonth() !== hoje.getMonth() || dataMulta.getFullYear() !== hoje.getFullYear()) return false;
      } else if (periodo === 'trimestre') {
        const diffMeses = (hoje.getFullYear() - dataMulta.getFullYear()) * 12 + (hoje.getMonth() - dataMulta.getMonth());
        if (diffMeses < 0 || diffMeses > 3) return false;
      } else if (periodo === 'ano') {
        if (dataMulta.getFullYear() !== hoje.getFullYear()) return false;
      }
    }
    return true;
  });

  atualizarDashboard();
}

function limparFiltros() {
  document.getElementById('periodo').value = '';
  document.getElementById('status').value = '';
  document.getElementById('placa').value = '';
  document.getElementById('cidade').value = '';
  filtrarDados();
}

// ============================================
// ATUALIZAR TELA (KPIs, tabelas, gráficos)
// ============================================
function atualizarDashboard() {
  atualizarKPIs();
  atualizarTabelaOverview();
  atualizarTabelaDetalhes();
  atualizarGraficos();
}

function atualizarKPIs() {
  const total = multasFiltradas.length;
  const valorTotal = multasFiltradas.reduce((soma, m) => soma + (Number(m['Valor']) || 0), 0);
  const pendentes = multasFiltradas.filter(m => m['Status'] === 'Pendente').length;

  document.getElementById('kpiCards').innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Total de Multas</div>
      <div class="kpi-value">${total}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Valor Total</div>
      <div class="kpi-value">R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Pendentes</div>
      <div class="kpi-value">${pendentes}</div>
    </div>
  `;

  document.getElementById('totalRegistros').textContent = `${total} registro${total !== 1 ? 's' : ''}`;
}

function atualizarTabelaOverview() {
  const corpo = document.getElementById('tabelaCorpo');
  if (multasFiltradas.length === 0) {
    corpo.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px;">📭 Nenhuma multa registrada<br><small>Importe dados via Firebase para começar</small></td></tr>`;
    return;
  }

  corpo.innerHTML = multasFiltradas.map(m => `
    <tr>
      <td>${m['Ait'] || '-'}</td>
      <td>${m['Data infração'] || '-'}</td>
      <td>${m['Placa'] || '-'}</td>
      <td>${m['Descrição infração'] || '-'}</td>
      <td>${m['Centro de custo'] || '-'}</td>
      <td>${m['Codigo infração'] || '-'}</td>
      <td>R$ ${(Number(m['Valor']) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td>${m['Status'] || 'Pendente'}</td>
    </tr>
  `).join('');
}

function atualizarTabelaDetalhes() {
  const corpo = document.getElementById('tabelaDetalhes');
  if (multasFiltradas.length === 0) {
    corpo.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px;">📭 Nenhuma multa registrada</td></tr>`;
    return;
  }

  corpo.innerHTML = multasFiltradas.map(m => `
    <tr>
      <td>${m['Codigo infração'] || '-'}</td>
      <td>${m['Data infração'] || '-'}</td>
      <td>${m['Placa'] || '-'}</td>
      <td>${m['Condutor'] || '-'}</td>
      <td>${m['Descrição infração'] || '-'}</td>
      <td>${m['Centro de custo'] || '-'}</td>
      <td>${m['Matrícula'] || '-'}</td>
      <td>R$ ${(Number(m['Valor']) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td>${m['Status'] || 'Pendente'}</td>
      <td>${m['Ait'] || '-'}</td>
    </tr>
  `).join('');
}

function filtrarTabela() {
  const termo = document.getElementById('filterTabela').value.trim().toLowerCase();
  const linhas = document.querySelectorAll('#tabelaDetalhes tr');
  linhas.forEach(linha => {
    const texto = linha.textContent.toLowerCase();
    linha.style.display = texto.includes(termo) ? '' : 'none';
  });
}

// ============================================
// GRÁFICOS (Chart.js)
// ============================================
function atualizarGraficos() {
  atualizarGraficoStatus();
  atualizarGraficoValor();
  atualizarGraficoCidade();
  atualizarGraficoTendencia();
  atualizarGraficoTipo();
}

function contarPor(campo) {
  const contagem = {};
  multasFiltradas.forEach(m => {
    const chave = m[campo] || 'Não informado';
    contagem[chave] = (contagem[chave] || 0) + 1;
  });
  return contagem;
}

function criarGraficoPizza(canvasId, dados, chartRefName) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  if (window[chartRefName]) window[chartRefName].destroy();

  window[chartRefName] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(dados),
      datasets: [{
        data: Object.values(dados),
        backgroundColor: ['#4F46E5', '#06B6D4', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899']
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
  return window[chartRefName];
}

function atualizarGraficoStatus() {
  criarGraficoPizza('graficoStatus', contarPor('Status'), 'graficoStatus');
}

function atualizarGraficoCidade() {
  criarGraficoPizza('graficoCidade', contarPor('Centro de custo'), 'graficoCidade');
}

function atualizarGraficoTipo() {
  criarGraficoPizza('graficoTipo', contarPor('Descrição infração'), 'graficoTipo');
}

function atualizarGraficoValor() {
  const porTipo = {};
  multasFiltradas.forEach(m => {
    const tipo = m['Descrição infração'] || 'Não informado';
    porTipo[tipo] = (porTipo[tipo] || 0) + (Number(m['Valor']) || 0);
  });

  const ctx = document.getElementById('graficoValor');
  if (!ctx) return;
  if (window.graficoValorChart) window.graficoValorChart.destroy();

  window.graficoValorChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(porTipo),
      datasets: [{ label: 'Valor (R$)', data: Object.values(porTipo), backgroundColor: '#4F46E5' }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

function atualizarGraficoTendencia() {
  const porMes = {};
  multasFiltradas.forEach(m => {
    const dataStr = m['Data infração'];
    if (!dataStr) return;
    const [, mes, ano] = dataStr.split('/');
    const chave = `${mes}/${ano}`;
    porMes[chave] = (porMes[chave] || 0) + 1;
  });

  const ctx = document.getElementById('graficoTendencia');
  if (!ctx) return;
  if (window.graficoTendenciaChart) window.graficoTendenciaChart.destroy();

  window.graficoTendenciaChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(porMes),
      datasets: [{ label: 'Multas por mês', data: Object.values(porMes), borderColor: '#4F46E5', tension: 0.3 }]
    },
    options: { responsive: true }
  });
}

// ============================================
// ABAS
// ============================================
function mudarAba(aba, evt) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  document.getElementById(`aba-${aba}`).classList.add('active');
  const botao = (evt && evt.currentTarget) || window.event?.currentTarget;
  if (botao) botao.classList.add('active');
}

// ============================================
// EXPORTAR RELATÓRIO
// ============================================
function exportarRelatorio() {
  if (multasFiltradas.length === 0) {
    alert('Nenhuma multa para exportar.');
    return;
  }

  const cabecalho = ['Ait', 'Placa', 'Centro de custo', 'Data infração', 'Codigo infração', 'Descrição infração', 'Valor', 'Condutor', 'Matrícula', 'Status'];
  const linhas = multasFiltradas.map(m => cabecalho.map(campo => `"${m[campo] || ''}"`).join(','));
  const csv = [cabecalho.join(','), ...linhas].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-multas-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}

// ============================================
// TORNAR FUNÇÕES GLOBAIS (necessário com type="module")
// ============================================
window.mudarAba = mudarAba;
window.filtrarDados = filtrarDados;
window.limparFiltros = limparFiltros;
window.filtrarTabela = filtrarTabela;
window.exportarRelatorio = exportarRelatorio;

// ============================================
// INICIAR
// ============================================
carregarMultas();
