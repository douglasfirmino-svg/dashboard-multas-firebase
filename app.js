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
const CLOUDINARY_CLOUD_NAME = 'uv7nwlbc';
const CLOUDINARY_UPLOAD_PRESET = 'xmo2bznb';
let urlTermoAtual = null; // guarda a URL do termo já anexado ao editar uma multa

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
  atualizarTabelaCentroCusto();
  atualizarStatusCards();
}

function atualizarTabelaCentroCusto() {
  const corpo = document.getElementById('tabelaCentroCusto');
  if (!corpo) return;

  if (multasFiltradas.length === 0) {
    corpo.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;">📭 Nenhuma multa registrada</td></tr>`;
    return;
  }

  corpo.innerHTML = multasFiltradas.map(m => `
    <tr>
      <td>${m['Placa'] || '-'}</td>
      <td>${m['Centro de custo'] || '-'}</td>
      <td>${m['Condutor'] || '-'}</td>
      <td>R$ ${(Number(m['Valor']) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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
    corpo.innerHTML = `<tr><td colspan="15" style="text-align:center; padding:30px;">📭 Nenhuma multa registrada</td></tr>`;
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

function criarGraficoBarra(canvasId, dados, chartRefName, horizontal = false) {
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
        data: Object.values(dados),
        backgroundColor: CORES_GRAFICO
      }]
    },
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: horizontal ? 'end' : 'end',
          align: horizontal ? 'end' : 'top',
          color: '#1e3a5f',
          font: { weight: 'bold' },
          formatter: (valor) => valor
        }
      },
      scales: horizontal
        ? { x: { beginAtZero: true, ticks: { precision: 0 } } }
        : { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
  return window[chartRefName];
}

function atualizarGraficoStatus() {
  criarGraficoBarra('graficoStatus', contarPor('Status'), 'graficoStatusChart');
}

function atualizarGraficoCidade() {
  criarGraficoBarra('graficoCidade', contarPor('Centro de custo'), 'graficoCidadeChart', true);
}

function atualizarGraficoTipo() {
  criarGraficoBarra('graficoTipo', contarPor('Descrição infração'), 'graficoTipoChart', true);
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
      datasets: [{ label: 'Valor (R$)', data: Object.values(porTipo), backgroundColor: '#1e3a5f' }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#1e3a5f',
          font: { weight: 'bold' },
          formatter: (valor) => `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        }
      },
      scales: {
        x: { beginAtZero: true }
      }
    }
  });
}

function atualizarGraficoTendencia() {
  // Agrupa por mês E por status, para montar barras empilhadas
  const meses = [];
  const statusUnicos = new Set();
  const porMesStatus = {};

  multasFiltradas.forEach(m => {
    const dataStr = m['Data infração'];
    if (!dataStr) return;
    const [, mes, ano] = dataStr.split('/');
    const chaveMes = `${mes}/${ano}`;
    const status = m['Status'] || 'Pendente';

    if (!meses.includes(chaveMes)) meses.push(chaveMes);
    statusUnicos.add(status);

    if (!porMesStatus[chaveMes]) porMesStatus[chaveMes] = {};
    porMesStatus[chaveMes][status] = (porMesStatus[chaveMes][status] || 0) + 1;
  });

  // Ordena os meses cronologicamente (MM/AAAA)
  meses.sort((a, b) => {
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
window.buscarMultaPorAit = buscarMultaPorAit;
window.limparFormulario = limparFormulario;
window.removerTermo = removerTermo;

// ============================================
// FORMULÁRIO - BUSCAR MULTA EXISTENTE (para editar)
// ============================================
let aitEmEdicao = null; // guarda se estamos editando uma multa existente

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
  document.getElementById('f_status').value = dados['Status'] || 'Pendente';
  document.getElementById('f_desconto').checked = !!dados['Desconto Colaborador'];
  document.getElementById('f_indicacao').checked = !!dados['Indicação'];

  // Converte data de DD/MM/AAAA para AAAA-MM-DD (formato do input date)
  const dataStr = dados['Data infração'];
  if (dataStr) {
    const [dia, mes, ano] = dataStr.split('/');
    document.getElementById('f_data').value = `${ano}-${mes}-${dia}`;
  }

  // Mostra o termo já anexado, se existir
  urlTermoAtual = dados['Termo URL'] || null;
  const termoAtualEl = document.getElementById('termoAtual');
  termoAtualEl.innerHTML = urlTermoAtual
    ? `📎 Termo já anexado: <a href="${urlTermoAtual}" target="_blank">ver arquivo atual</a> (envie um novo arquivo acima para substituir) &nbsp;
       <button type="button" class="btn-remover-termo" onclick="removerTermo()">🗑️ Remover Termo</button>`
    : '';

  // AIT não pode ser editado depois de encontrado (é a chave do documento)
  document.getElementById('f_ait').disabled = true;
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
  urlTermoAtual = null;
  aitEmEdicao = null;
}

async function uploadTermoCloudinary(arquivo) {
  const progressoEl = document.getElementById('uploadProgresso');
  progressoEl.textContent = '📤 Enviando termo...';

  const formData = new FormData();
  formData.append('file', arquivo);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  // Todos os arquivos (PDF ou imagem) usam resource_type "image":
  // o Cloudinary trata PDFs como imagem (renderiza a 1ª página).
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const resposta = await fetch(url, { method: 'POST', body: formData });
  if (!resposta.ok) {
    throw new Error('Falha no upload para o Cloudinary');
  }
  const dados = await resposta.json();
  progressoEl.textContent = '✅ Termo enviado!';

  // Se o arquivo original era PDF, a entrega do .pdf puro é bloqueada em contas
  // gratuitas do Cloudinary. Construímos a URL forçando o formato .jpg da 1ª página,
  // que contorna esse bloqueio (o Cloudinary converte automaticamente ao servir).
  if (arquivo.type === 'application/pdf') {
    const urlComoJpg = dados.secure_url.replace(/\.pdf$/i, '.jpg');
    return urlComoJpg;
  }

  return dados.secure_url;
}


function formatarDataBR(dataISO) {
  // Converte "2026-08-26" (input type=date) para "26/08/2026"
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

async function salvarNovaMulta(evento) {
  evento.preventDefault();

  const mensagemEl = document.getElementById('formMensagem');
  const botao = evento.target.querySelector('.btn-salvar');

  const ait = document.getElementById('f_ait').value.trim();
  const placa = document.getElementById('f_placa').value.trim().toUpperCase();
  const valor = parseFloat(document.getElementById('f_valor').value);

  if (!ait || !placa || isNaN(valor)) {
    mensagemEl.textContent = '❌ Preencha AIT, Placa e Valor corretamente.';
    mensagemEl.className = 'form-mensagem erro';
    return;
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
    'Status': document.getElementById('f_status').value,
    'Desconto Colaborador': document.getElementById('f_desconto').checked,
    'Indicação': document.getElementById('f_indicacao').checked
  };

  try {
    botao.disabled = true;
    botao.textContent = '💾 Salvando...';

    // Se um novo arquivo de termo foi selecionado, faz o upload primeiro
    const arquivoTermo = document.getElementById('f_termo').files[0];
    if (arquivoTermo) {
      dadosMulta['Termo URL'] = await uploadTermoCloudinary(arquivoTermo);
    } else if (urlTermoAtual) {
      // Mantém o termo já existente se nenhum novo arquivo foi selecionado
      dadosMulta['Termo URL'] = urlTermoAtual;
    }

    const db = await aguardarFirebase();
    await setDoc(doc(db, 'multas', ait), dadosMulta);

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
// INICIAR
// ============================================
carregarMultas();
