// ============================================
// APP.JS - Lógica do Dashboard de Multas SENATRAN
// ============================================
import { collection, onSnapshot, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Registra o plugin de data labels (mostra os valores acima/ao lado das barras)
if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
  Chart.register(ChartDataLabels);
}

let todasMultas = [];
let multasFiltradas = [];

// ============================================
// CONFIGURAÇÃO CLOUDINARY (upload de termos assinados)
// ============================================
// Config é lido de window.cloudinaryConfig (setado por firebase-config.js)
let CLOUDINARY_CLOUD_NAME = '';
let CLOUDINARY_UPLOAD_PRESET = '';

// ============================================
// CONFIGURAÇÃO EMAILJS
// ============================================
let EMAILJS_SERVICE_ID = '';
let EMAILJS_TEMPLATE_ID = '';
let EMAILJS_PUBLIC_KEY = '';

function inicializarEmailJS() {
  if (typeof emailjs !== 'undefined') {
    EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
    EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
    EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';

    if (EMAILJS_PUBLIC_KEY) {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      console.log('✅ EmailJS inicializado');
    } else {
      console.log('⚠️ EmailJS public key não configurada');
    }
  }
}

function aguardarCloudinaryConfig() {
  return new Promise((resolve) => {
    const checar = () => {
      if (window.cloudinaryConfig) {
        CLOUDINARY_CLOUD_NAME = window.cloudinaryConfig.cloudName;
        CLOUDINARY_UPLOAD_PRESET = window.cloudinaryConfig.uploadPreset;
        console.log('✅ Cloudinary config carregado');
        resolve();
      } else {
        console.log('⏳ Aguardando Cloudinary config...');
        setTimeout(checar, 200);
      }
    };
    checar();
  });
}

let urlTermoAtual = null;

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

  onSnapshot(multasRef, (snapshot) => {
    todasMultas = [];
    snapshot.forEach((doc) => {
      todasMultas.push({ id: doc.id, ...doc.data() });
    });
    console.log(`✅ ${todasMultas.length} multa(s) carregada(s)`);

    document.getElementById('footerTime').textContent = new Date().toLocaleTimeString('pt-BR');

    popularFiltroCidade();
    filtrarDados();
  }, (error) => {
    console.error('❌ Erro ao buscar multas:', error);
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
  const tipoVeiculo = document.getElementById('tipoVeiculo')?.value;

  multasFiltradas = todasMultas.filter(m => {
    if (placa && !(m['Placa'] || '').toUpperCase().includes(placa)) return false;
    if (cidade && m['Centro de custo'] !== cidade) return false;
    if (status && m['Status'] !== status) return false;
    if (tipoVeiculo && m['Tipo de Veículo'] !== tipoVeiculo) return false;
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
  document.getElementById('tipoVeiculo').value = '';
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
  atualizarTabelaCentroCusto();
  atualizarStatusCards();
}

function atualizarTabelaCentroCusto() {
  const corpo = document.getElementById('tabelaCentroCusto');
  if (!corpo) return;

  if (multasFiltradas.length === 0) {
    corpo.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px;">📭 Nenhuma multa registrada</td></tr>`;
    return;
  }

  corpo.innerHTML = multasFiltradas.map(m => `
    <tr>
      <td>${m['Placa'] || '-'}</td>
      <td>${m['Centro de custo'] || '-'}</td>
      <td>${m['Condutor'] || '-'}</td>
      <td>R$ ${(Number(m['Valor']) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td>${m['Tipo de Veículo'] || '-'}</td>
      <td>${m['Locadora'] || '-'}</td>
      <td>${m['Desconto Colaborador'] ? '✅ Sim' : '❌ Não'}</td>
      <td>${m['Indicação'] ? '✅ Sim' : '❌ Não'}</td>
    </tr>
  `).join('');
}

function atualizarStatusCards() {
  const container = document.getElementById('statusCards');
  if (!container) return;

  if (multasFiltradas.length === 0) {
    container.innerHTML = `<div class="loading">📭 Nenhuma multa registrada</div>`;
    return;
  }

  const porStatus = {};
  multasFiltradas.forEach(m => {
    const status = m['Status'] || 'Pendente';
    if (!porStatus[status]) porStatus[status] = { total: 0, valor: 0, comDesconto: 0, comIndicacao: 0 };
    porStatus[status].total += 1;
    porStatus[status].valor += Number(m['Valor']) || 0;
    if (m['Desconto Colaborador']) porStatus[status].comDesconto += 1;
    if (m['Indicação']) porStatus[status].comIndicacao += 1;
  });

  container.innerHTML = Object.entries(porStatus).map(([status, dados]) => `
    <div class="status-card">
      <h3>${status}</h3>
      <p>${dados.total} multa${dados.total !== 1 ? 's' : ''}</p>
      <p>R$ ${dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      <p>💰 Desconto colaborador: ${dados.comDesconto}/${dados.total}</p>
      <p>📝 Indicação feita: ${dados.comIndicacao}/${dados.total}</p>
    </div>
  `).join('');
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
    corpo.innerHTML = `<tr><td colspan="17" style="text-align:center; padding:30px;">📭 Nenhuma multa registrada</td></tr>`;
    return;
  }

  corpo.innerHTML = multasFiltradas.map(m => `
    <tr>
      <td>${m['Codigo infração'] || '-'}</td>
      <td>${m['Data infração'] || '-'}</td>
      <td>${m['Placa'] || '-'}</td>
      <td>${m['Condutor'] || '-'}</td>
      <td>${m['Descrição infração'] || '-'}</td>
      <td>${m['Local'] || '-'}</td>
      <td>${m['Cidade'] || '-'}</td>
      <td>${m['Centro de custo'] || '-'}</td>
      <td>${m['Matrícula'] || '-'}</td>
      <td>${m['Tipo de Veículo'] || '-'}</td>
      <td>${m['Locadora'] || '-'}</td>
      <td>R$ ${(Number(m['Valor']) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td>${m['Status'] || 'Pendente'}</td>
      <td>${m['Ait'] || '-'}</td>
      <td>${m['Desconto Colaborador'] ? '✅ Sim' : '❌ Não'}</td>
      <td>${m['Indicação'] ? '✅ Sim' : '❌ Não'}</td>
      <td>${m['Termo URL'] ? `<a href="${m['Termo URL']}" target="_blank" class="btn-ver-termo">📎 Ver</a>` : '<span class="sem-termo">-</span>'}</td>
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
  atualizarGraficoVeiculoComparativo();
}

function contarPor(campo) {
  const contagem = {};
  multasFiltradas.forEach(m => {
    const chave = m[campo] || 'Não informado';
    contagem[chave] = (contagem[chave] || 0) + 1;
  });
  return contagem;
}

const CORES_GRAFICO = ['#1e3a5f', '#2d6a4f', '#3a5a80', '#4a8f6c', '#0f2942', '#1f4d38', '#5b7a9e', '#6ba58a'];

const CORES_STATUS = {
  'Pendente': '#3a5a80',
  'Pago': '#2d6a4f',
  'Contestação': '#1e3a5f',
  'Cancelado': '#0f2942'
};

const CORES_VEICULO = {
  'Próprio': '#2d6a4f',
  'Locado': '#1e3a5f'
};

function criarGraficoBarra(canvasId, dados, chartRefName, horizontal = false, alturaFixa = false) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  if (window[chartRefName] && typeof window[chartRefName].destroy === 'function') {
    window[chartRefName].destroy();
  }

  window[chartRefName] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(dados),
      datasets: [{
        label: 'Quantidade',
        data: Object.values(dados),
        backgroundColor: CORES_GRAFICO,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: alturaFixa ? false : true,
      indexAxis: horizontal ? 'y' : 'x',
      plugins: {
        legend: { display: false },
        datalabels: {
          color: '#ffffff',
          font: { weight: 'bold' },
          formatter: (valor) => valor
        }
      },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 } },
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
  return window[chartRefName];
}

function atualizarGraficoStatus() {
  const dados = {};
  multasFiltradas.forEach(m => {
    const status = m['Status'] || 'Pendente';
    dados[status] = (dados[status] || 0) + 1;
  });
  criarGraficoBarra('graficoStatus', dados, 'graficoStatusChart');
}

function atualizarGraficoValor() {
  const dados = {};
  multasFiltradas.forEach(m => {
    const tipo = m['Descrição infração'] || 'Sem tipo';
    dados[tipo] = (dados[tipo] || 0) + (Number(m['Valor']) || 0);
  });
  const top5 = Object.entries(dados)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
  criarGraficoBarra('graficoValor', top5, 'graficoValorChart', true, true);
  const canvas = document.getElementById('graficoValor');
  if (canvas) canvas.parentElement.style.height = '320px';
}

function atualizarGraficoCidade() {
  const dados = contarPor('Centro de custo');
  const top5 = Object.entries(dados)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
  criarGraficoBarra('graficoCidade', top5, 'graficoCidadeChart', true, true);
  const canvas = document.getElementById('graficoCidade');
  if (canvas) canvas.parentElement.style.height = '320px';
}

function atualizarGraficoTendencia() {
  const porMesStatus = {};
  const statusUnicos = new Set();

  multasFiltradas.forEach(m => {
    const dataStr = m['Data infração'];
    if (!dataStr) return;
    const [dia, mes, ano] = dataStr.split('/');
    const chave = `${mes}/${ano}`;
    const status = m['Status'] || 'Pendente';

    if (!porMesStatus[chave]) porMesStatus[chave] = {};
    porMesStatus[chave][status] = (porMesStatus[chave][status] || 0) + 1;
    statusUnicos.add(status);
  });

  const meses = Object.keys(porMesStatus).sort((a, b) => {
    const [ma, aa] = a.split('/').map(Number);
    const [mb, ab] = b.split('/').map(Number);
    return aa !== ab ? aa - ab : ma - mb;
  });

  const datasets = Array.from(statusUnicos).map(status => ({
    label: status,
    data: meses.map(mes => (porMesStatus[mes] && porMesStatus[mes][status]) || 0),
    backgroundColor: CORES_STATUS[status] || '#94A3B8'
  }));

  const ctx = document.getElementById('graficoTendencia');
  if (!ctx) return;
  if (window.graficoTendenciaChart) window.graficoTendenciaChart.destroy();

  window.graficoTendenciaChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: meses, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        datalabels: {
          color: '#ffffff',
          font: { weight: 'bold' },
          formatter: (valor) => valor > 0 ? valor : ''
        }
      },
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

function atualizarGraficoTipo() {
  const dados = contarPor('Descrição infração');
  const top5 = Object.entries(dados)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
  criarGraficoBarra('graficoTipo', top5, 'graficoTipoChart', true, true);
  const canvas = document.getElementById('graficoTipo');
  if (canvas) canvas.parentElement.style.height = '320px';
}

function atualizarGraficoVeiculoComparativo() {
  const dadosVeiculo = {};
  multasFiltradas.forEach(m => {
    const tipo = m['Tipo de Veículo'] || 'Não informado';
    if (!dadosVeiculo[tipo]) dadosVeiculo[tipo] = { total: 0, valor: 0 };
    dadosVeiculo[tipo].total += 1;
    dadosVeiculo[tipo].valor += Number(m['Valor']) || 0;
  });

  const ctx = document.getElementById('graficoVeiculo');
  if (!ctx) return;
  if (window.graficoVeiculoChart) window.graficoVeiculoChart.destroy();

  const tipos = Object.keys(dadosVeiculo);
  const cores = tipos.map(tipo => CORES_VEICULO[tipo] || '#94A3B8');

  window.graficoVeiculoChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: tipos.map(t => `${t} (${dadosVeiculo[t].total})`),
      datasets: [{
        data: tipos.map(t => dadosVeiculo[t].total),
        backgroundColor: cores,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        datalabels: {
          color: '#ffffff',
          font: { weight: 'bold' },
          formatter: (valor) => valor
        }
      }
    }
  });
  const canvas = document.getElementById('graficoVeiculo');
  if (canvas) canvas.parentElement.style.height = '300px';
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

  const cabecalho = ['Ait', 'Placa', 'Centro de custo', 'Data infração', 'Codigo infração', 'Descrição infração', 'Valor', 'Condutor', 'Matrícula', 'Tipo de Veículo', 'Locadora', 'Status'];
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
window.buscarMultaPorAit = buscarMultaPorAit;
window.limparFormulario = limparFormulario;
window.removerTermo = removerTermo;
window.atualizarLocadora = atualizarLocadora;

// ============================================
// FORMULÁRIO - BUSCAR MULTA EXISTENTE (para editar)
// ============================================
let aitEmEdicao = null;

function preencherFormulario(dados, ait) {
  document.getElementById('f_ait').value = ait;
  document.getElementById('f_placa').value = dados['Placa'] || '';
  document.getElementById('f_codigo').value = dados['Codigo infração'] || '';
  document.getElementById('f_valor').value = dados['Valor'] || '';
  document.getElementById('f_matricula').value = dados['Matrícula'] || '';
  document.getElementById('f_descricao').value = dados['Descrição infração'] || '';
  document.getElementById('f_condutor').value = dados['Condutor'] || '';
  document.getElementById('f_centro').value = dados['Centro de custo'] || '';
  document.getElementById('f_local').value = dados['Local'] || '';
  document.getElementById('f_cidade').value = dados['Cidade'] || '';
  document.getElementById('f_tipoVeiculo').value = dados['Tipo de Veículo'] || 'Próprio';
  document.getElementById('f_locadora').value = dados['Locadora'] || '';
  document.getElementById('f_status').value = dados['Status'] || 'Pendente';
  document.getElementById('f_desconto').checked = !!dados['Desconto Colaborador'];
  document.getElementById('f_indicacao').checked = !!dados['Indicação'];

  const dataStr = dados['Data infração'];
  if (dataStr) {
    const [dia, mes, ano] = dataStr.split('/');
    document.getElementById('f_data').value = `${ano}-${mes}-${dia}`;
  }

  urlTermoAtual = dados['Termo URL'] || null;
  const termoAtualEl = document.getElementById('termoAtual');
  termoAtualEl.innerHTML = urlTermoAtual
    ? `📎 Termo já anexado: <a href="${urlTermoAtual}" target="_blank">ver arquivo atual</a> (envie um novo arquivo acima para substituir) &nbsp;
       <button type="button" class="btn-remover-termo" onclick="removerTermo()">🗑️ Remover Termo</button>`
    : '';

  document.getElementById('f_ait').disabled = true;
  atualizarLocadora();
}

function atualizarLocadora() {
  const tipoVeiculo = document.getElementById('f_tipoVeiculo').value;
  const locadoraInput = document.getElementById('f_locadora');

  if (tipoVeiculo === 'Próprio') {
    locadoraInput.disabled = true;
    locadoraInput.value = '';
    locadoraInput.placeholder = '(desabilitado para veículo próprio)';
  } else {
    locadoraInput.disabled = false;
    locadoraInput.placeholder = 'Nome da locadora';
  }
}

async function removerTermo() {
  if (!aitEmEdicao) return;

  const confirmar = confirm('Tem certeza que deseja remover o termo anexado desta multa? Essa ação não pode ser desfeita.');
  if (!confirmar) return;

  try {
    const db = await aguardarFirebase();
    const docRef = doc(db, 'multas', aitEmEdicao);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const dadosAtuais = docSnap.data();
      delete dadosAtuais['Termo URL'];
      await setDoc(docRef, dadosAtuais);
    }

    urlTermoAtual = null;
    document.getElementById('termoAtual').innerHTML = '✅ Termo removido.';
    document.getElementById('f_termo').value = '';
  } catch (error) {
    console.error('❌ Erro ao remover termo:', error);
    alert('❌ Erro ao remover o termo. Veja o console para detalhes.');
  }
}

async function buscarMultaPorAit() {
  const ait = document.getElementById('buscarAit').value.trim();
  const mensagemEl = document.getElementById('buscaMensagem');

  if (!ait) {
    mensagemEl.textContent = '❌ Digite um AIT para buscar.';
    mensagemEl.className = 'form-mensagem erro';
    return;
  }

  try {
    const db = await aguardarFirebase();
    const docRef = doc(db, 'multas', ait);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      preencherFormulario(docSnap.data(), ait);
      aitEmEdicao = ait;
      mensagemEl.textContent = `✅ Multa ${ait} carregada. Edite os campos e clique em Salvar.`;
      mensagemEl.className = 'form-mensagem sucesso';
    } else {
      mensagemEl.textContent = `⚠️ Nenhuma multa encontrada com AIT ${ait}. Você pode cadastrar como nova.`;
      mensagemEl.className = 'form-mensagem erro';
    }
  } catch (error) {
    console.error('❌ Erro ao buscar multa:', error);
    mensagemEl.textContent = '❌ Erro ao buscar. Veja o console.';
    mensagemEl.className = 'form-mensagem erro';
  }
}

function limparFormulario() {
  document.getElementById('formNovaMulta').reset();
  document.getElementById('f_ait').disabled = false;
  document.getElementById('buscarAit').value = '';
  document.getElementById('buscaMensagem').textContent = '';
  document.getElementById('termoAtual').innerHTML = '';
  document.getElementById('uploadProgresso').textContent = '';
  document.getElementById('f_tipoVeiculo').value = 'Próprio';
  urlTermoAtual = null;
  aitEmEdicao = null;
  atualizarLocadora();
}

async function uploadTermoCloudinary(arquivo) {
  const progressoEl = document.getElementById('uploadProgresso');
  progressoEl.textContent = '📤 Enviando termo...';

  const formData = new FormData();
  formData.append('file', arquivo);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  try {
    const resposta = await fetch(url, { method: 'POST', body: formData });
    if (!resposta.ok) {
      throw new Error('Falha no upload para o Cloudinary');
    }
    const dados = await resposta.json();
    progressoEl.textContent = '✅ Termo enviado!';

    if (arquivo.type === 'application/pdf') {
      const urlComoJpg = dados.secure_url.replace(/\.pdf$/i, '.jpg');
      return urlComoJpg;
    }

    return dados.secure_url;
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    throw error;
  }
}

function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

// ============================================
// ENVIAR TERMO POR EMAIL (EmailJS)
// ============================================
async function enviarTermoPorEmail(dadosMulta, emailSupervisor) {
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
    console.log('⚠️ EmailJS não está configurado. Email não será enviado.');
    return;
  }

  if (!emailSupervisor || !emailSupervisor.includes('@')) {
    console.log('⚠️ Email do supervisor inválido. Email não será enviado.');
    return;
  }

  try {
    const params = {
      to_email: emailSupervisor,
      ait: dadosMulta['Ait'],
      placa: dadosMulta['Placa'],
      condutor: dadosMulta['Condutor'],
      valor: dadosMulta['Valor'],
      data_infracao: dadosMulta['Data infração'],
      descricao: dadosMulta['Descrição infração'],
      cidade: dadosMulta['Cidade'],
      tipo_veiculo: dadosMulta['Tipo de Veículo'],
      locadora: dadosMulta['Locadora'] || '(não informada)',
      termo_url: dadosMulta['Termo URL'] || '(não anexado)',
      status: dadosMulta['Status'],
      centro_custo: dadosMulta['Centro de custo']
    };

    const resposta = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
    console.log('✅ Email enviado ao supervisor:', resposta);
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
  }
}

async function salvarNovaMulta(evento) {
  evento.preventDefault();

  const mensagemEl = document.getElementById('formMensagem');
  const botao = evento.target.querySelector('.btn-salvar');

  const ait = document.getElementById('f_ait').value.trim();
  const placa = document.getElementById('f_placa').value.trim().toUpperCase();
  const valor = parseFloat(document.getElementById('f_valor').value);
  const emailSupervisor = document.getElementById('f_emailSupervisor').value.trim();

  if (!ait || !placa || isNaN(valor)) {
    mensagemEl.textContent = '❌ Preencha AIT, Placa e Valor corretamente.';
    mensagemEl.className = 'form-mensagem erro';
    return;
  }

  if (!emailSupervisor || !emailSupervisor.includes('@')) {
    mensagemEl.textContent = '❌ Informe um email válido do supervisor.';
    mensagemEl.className = 'form-mensagem erro';
    return;
  }

  const tipoVeiculo = document.getElementById('f_tipoVeiculo').value;
  let locadora = document.getElementById('f_locadora').value.trim();

  if (tipoVeiculo === 'Locado' && !locadora) {
    mensagemEl.textContent = '❌ Informe a locadora para veículos locados.';
    mensagemEl.className = 'form-mensagem erro';
    return;
  }

  if (tipoVeiculo === 'Próprio') {
    locadora = '';
  }

  const dadosMulta = {
    'Ait': ait,
    'Placa': placa,
    'Codigo infração': document.getElementById('f_codigo').value.trim(),
    'Data infração': formatarDataBR(document.getElementById('f_data').value),
    'Valor': valor,
    'Matrícula': document.getElementById('f_matricula').value.trim(),
    'Descrição infração': document.getElementById('f_descricao').value.trim(),
    'Condutor': document.getElementById('f_condutor').value.trim().toUpperCase(),
    'Centro de custo': document.getElementById('f_centro').value.trim(),
    'Local': document.getElementById('f_local').value.trim(),
    'Cidade': document.getElementById('f_cidade').value.trim(),
    'Tipo de Veículo': tipoVeiculo,
    'Locadora': locadora,
    'Status': document.getElementById('f_status').value,
    'Desconto Colaborador': document.getElementById('f_desconto').checked,
    'Indicação': document.getElementById('f_indicacao').checked
  };

  try {
    botao.disabled = true;
    botao.textContent = '💾 Salvando...';

    await aguardarCloudinaryConfig();

    const arquivoTermo = document.getElementById('f_termo').files[0];
    if (arquivoTermo) {
      dadosMulta['Termo URL'] = await uploadTermoCloudinary(arquivoTermo);
    } else if (urlTermoAtual) {
      dadosMulta['Termo URL'] = urlTermoAtual;
    }

    const db = await aguardarFirebase();
    await setDoc(doc(db, 'multas', ait), dadosMulta);

    // Enviar email ao supervisor
    await enviarTermoPorEmail(dadosMulta, emailSupervisor);

    const foiEdicao = aitEmEdicao === ait;
    mensagemEl.textContent = foiEdicao
      ? `✅ Multa ${ait} atualizada com sucesso!`
      : `✅ Multa ${ait} cadastrada com sucesso!`;
    mensagemEl.className = 'form-mensagem sucesso';
    limparFormulario();
  } catch (error) {
    console.error('❌ Erro ao salvar multa:', error);
    mensagemEl.textContent = '❌ Erro ao salvar. Veja o console para detalhes.';
    mensagemEl.className = 'form-mensagem erro';
  } finally {
    botao.disabled = false;
    botao.textContent = '💾 Salvar Multa';
  }
}

const formNovaMulta = document.getElementById('formNovaMulta');
if (formNovaMulta) {
  formNovaMulta.addEventListener('submit', salvarNovaMulta);
}

// ============================================
// EXPOR FUNÇÕES NO WINDOW (para onclick="" no HTML)
// ============================================
window.mudarAba = mudarAba;
window.filtrarDados = filtrarDados;
window.limparFiltros = limparFiltros;
window.atualizarLocadora = atualizarLocadora;
window.buscarMultaPorAit = buscarMultaPorAit;
window.exportarRelatorio = exportarRelatorio;
window.limparFormulario = limparFormulario;
window.removerTermo = removerTermo;

// ============================================
// INICIAR
// ============================================
inicializarEmailJS();
carregarMultas();
console.log('🚀 App iniciado!');
