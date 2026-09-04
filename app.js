// ============================================
// DASHBOARD DE MULTAS v3 - FIREBASE (CORRIGIDO)
// ============================================

let dadosOriginais = [];
let dadosFiltrados = [];
let graficos = {};
let abaAtiva = 'overview';
let unsubscribe = null;

// Aguardar Firebase estar pronto
function inicializarDashboard() {
  if (typeof db === 'undefined') {
    console.log('⏳ Aguardando Firebase...');
    setTimeout(inicializarDashboard, 500);
    return;
  }
  
  console.log('✅ Firebase pronto! Iniciando dashboard...');
  carregarDadosFirebase();
}

// ============================================
// CARREGAR DADOS DO FIREBASE
// ============================================
function carregarDadosFirebase() {
  try {
    console.log('🔄 Carregando do Firebase...');
    atualizarStatusSync('🔄 Sincronizando...');
    
    if (unsubscribe) unsubscribe();
    
    unsubscribe = db.collection('multas').onSnapshot(
      (snapshot) => {
        dadosOriginais = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          dadosOriginais.push({
            id: doc.id,
            data: data.data || data['Data infração'] || '',
            placa: (data.placa || data.Placa || '').toUpperCase(),
            motorista: data.motorista || data.Condutor || 'PENDENTE',
            local: data.local || data['Centro de custo'] || '',
            cidade: data.cidade || extrairCidade(data.local || data['Centro de custo'] || ''),
            tipo: data.tipo || data['Descrição infração'] || '',
            valor: parseFloat(data.valor || data.Valor || 0) || 0,
            status: data.status || 'Pendente',
            ait: data.ait || data.Ait || ''
          });
        });
        
        console.log(`✅ ${dadosOriginais.length} multas carregadas`);
        
        preencherFiltrosDinamicos();
        dadosFiltrados = [...dadosOriginais];
        renderizarDashboard();
        
        if (dadosOriginais.length === 0) {
          atualizarStatusSync('✅ Sem dados para exibir');
        } else {
          atualizarStatusSync('✅ Sincronizado');
        }
        atualizarTimestamp();
      },
      (error) => {
        console.error('❌ Erro Firebase:', error);
        atualizarStatusSync('❌ Erro ao carregar');
        mostrarErro(error);
      }
    );
    
  } catch (error) {
    console.error('❌ Erro:', error);
    atualizarStatusSync('❌ Erro de conexão');
    mostrarErro(error);
  }
}

// ============================================
// FILTRAR DADOS
// ============================================
function filtrarDados() {
  const periodo = document.getElementById('periodo').value;
  const status = document.getElementById('status').value;
  const placa = document.getElementById('placa').value.toUpperCase().trim();
  const cidade = document.getElementById('cidade').value;
  
  dadosFiltrados = dadosOriginais.filter(m => {
    let passa = true;
    
    if (periodo && m.data) {
      const dataMulta = parsearData(m.data);
      const hoje = new Date();
      
      if (periodo === 'mes') {
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        passa = passa && dataMulta >= inicio;
      } else if (periodo === 'trimestre') {
        const mesTrimestre = Math.floor(hoje.getMonth() / 3) * 3;
        const inicio = new Date(hoje.getFullYear(), mesTrimestre, 1);
        passa = passa && dataMulta >= inicio;
      } else if (periodo === 'ano') {
        const inicio = new Date(hoje.getFullYear(), 0, 1);
        passa = passa && dataMulta >= inicio;
      }
    }
    
    if (status) passa = passa && m.status === status;
    if (placa) passa = passa && m.placa.includes(placa);
    if (cidade) passa = passa && m.cidade === cidade;
    
    return passa;
  });
  
  renderizarDashboard();
}

function limparFiltros() {
  document.getElementById('periodo').value = '';
  document.getElementById('status').value = '';
  document.getElementById('placa').value = '';
  document.getElementById('cidade').value = '';
  
  dadosFiltrados = [...dadosOriginais];
  renderizarDashboard();
}

function filtrarTabela() {
  const filtro = document.getElementById('filterTabela').value.toLowerCase();
  const linhas = document.querySelectorAll('#tabelaDetalhes tr');
  
  linhas.forEach(linha => {
    const texto = linha.textContent.toLowerCase();
    linha.style.display = texto.includes(filtro) ? '' : 'none';
  });
}

// ============================================
// RENDERIZAR DASHBOARD
// ============================================
function renderizarDashboard() {
  if (abaAtiva === 'overview') {
    renderizarCards();
    renderizarGraficos();
    renderizarTabelaPrincipal();
  } else if (abaAtiva === 'por-cidade') {
    renderizarPorCidade();
  } else if (abaAtiva === 'por-status') {
    renderizarPorStatus();
  } else if (abaAtiva === 'detalhes') {
    renderizarTabelas();
  }
}

// --- CARDS KPI ---
function renderizarCards() {
  if (dadosFiltrados.length === 0) {
    document.getElementById('kpiCards').innerHTML = `
      <div class="loading" style="grid-column: 1/-1; padding: 60px 20px; text-align: center; color: #999;">
        📭 Nenhuma multa registrada<br>
        <small>Importe dados via Firebase para começar</small>
      </div>
    `;
    return;
  }
  
  const total = dadosFiltrados.length;
  const pendentes = dadosFiltrados.filter(m => m.status === 'Pendente').length;
  const pagos = dadosFiltrados.filter(m => m.status === 'Pago').length;
  const vencidas = dadosFiltrados.filter(m => 
    m.status === 'Pendente' && estaVencida(m.data)
  ).length;
  
  const totalValor = dadosFiltrados.reduce((sum, m) => sum + m.valor, 0);
  const valorPendente = dadosFiltrados
    .filter(m => m.status === 'Pendente')
    .reduce((sum, m) => sum + m.valor, 0);
  
  const html = `
    <div class="kpi-card">
      <div class="kpi-label">📊 Total de Multas</div>
      <div class="kpi-value">${total}</div>
      <div class="kpi-subtitle">registradas no período</div>
    </div>
    
    <div class="kpi-card warning">
      <div class="kpi-label">⏳ Pendentes</div>
      <div class="kpi-value">${pendentes}</div>
      <div class="kpi-subtitle">R$ ${formatarMoeda(valorPendente)}</div>
    </div>
    
    <div class="kpi-card success">
      <div class="kpi-label">✅ Pagas</div>
      <div class="kpi-value">${pagos}</div>
      <div class="kpi-subtitle">processadas com sucesso</div>
    </div>
    
    <div class="kpi-card danger">
      <div class="kpi-label">⚠️ Vencidas</div>
      <div class="kpi-value">${vencidas}</div>
      <div class="kpi-subtitle">ação necessária</div>
    </div>
    
    <div class="kpi-card">
      <div class="kpi-label">💰 Valor Total</div>
      <div class="kpi-value">R$ ${formatarMoeda(totalValor)}</div>
      <div class="kpi-subtitle">em multas</div>
    </div>
  `;
  
  document.getElementById('kpiCards').innerHTML = html;
}

// --- GRÁFICOS ---
function renderizarGraficos() {
  if (dadosFiltrados.length === 0) {
    ['graficoStatus', 'graficoValor', 'graficoCidade', 'graficoTendencia', 'graficoTipo'].forEach(id => {
      const elem = document.getElementById(id);
      if (elem && elem.parentElement) {
        elem.parentElement.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">📭 Sem dados para gráfico</div>';
      }
    });
    return;
  }
  
  // Gráfico 1: Status
  const statusData = {
    'Pendente': dadosFiltrados.filter(m => m.status === 'Pendente').length,
    'Pago': dadosFiltrados.filter(m => m.status === 'Pago').length,
    'Contestação': dadosFiltrados.filter(m => m.status === 'Contestação').length,
    'Cancelado': dadosFiltrados.filter(m => m.status === 'Cancelado').length
  };
  
  const ctxStatus = document.getElementById('graficoStatus')?.getContext('2d');
  if (ctxStatus) {
    if (graficos.status) graficos.status.destroy();
    graficos.status = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusData).filter(k => statusData[k] > 0),
        datasets: [{
          data: Object.values(statusData).filter(v => v > 0),
          backgroundColor: ['#ff9800', '#4CAF50', '#2196F3', '#9C27B0'],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
  
  // Gráfico 2: Valor por Tipo
  const tipoData = {};
  dadosFiltrados.forEach(m => {
    const tipo = m.tipo || 'Outros';
    tipoData[tipo] = (tipoData[tipo] || 0) + m.valor;
  });
  
  const tipos = Object.keys(tipoData).sort((a, b) => tipoData[b] - tipoData[a]).slice(0, 5);
  
  const ctxValor = document.getElementById('graficoValor')?.getContext('2d');
  if (ctxValor) {
    if (graficos.valor) graficos.valor.destroy();
    graficos.valor = new Chart(ctxValor, {
      type: 'bar',
      data: {
        labels: tipos,
        datasets: [{
          label: 'Valor (R$)',
          data: tipos.map(t => tipoData[t]),
          backgroundColor: '#1F4E78',
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } }
      }
    });
  }
  
  // Gráfico 3: Cidades
  const cidadeData = {};
  dadosFiltrados.forEach(m => {
    cidadeData[m.cidade] = (cidadeData[m.cidade] || 0) + 1;
  });
  
  const cidades = Object.keys(cidadeData).sort((a, b) => cidadeData[b] - cidadeData[a]).slice(0, 8);
  
  const ctxCidade = document.getElementById('graficoCidade')?.getContext('2d');
  if (ctxCidade) {
    if (graficos.cidade) graficos.cidade.destroy();
    graficos.cidade = new Chart(ctxCidade, {
      type: 'bar',
      data: {
        labels: cidades,
        datasets: [{
          label: 'Multas',
          data: cidades.map(c => cidadeData[c]),
          backgroundColor: '#2E7D4E',
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }
  
  // Gráfico 4: Tendência
  const tendenciaData = {};
  dadosFiltrados.forEach(m => {
    if (m.data) {
      const mes = m.data.substring(3, 5) + '/' + m.data.substring(6, 10);
      tendenciaData[mes] = (tendenciaData[mes] || 0) + 1;
    }
  });
  
  const meses = Object.keys(tendenciaData).sort();
  
  const ctxTendencia = document.getElementById('graficoTendencia')?.getContext('2d');
  if (ctxTendencia) {
    if (graficos.tendencia) graficos.tendencia.destroy();
    graficos.tendencia = new Chart(ctxTendencia, {
      type: 'line',
      data: {
        labels: meses,
        datasets: [{
          label: 'Multas',
          data: meses.map(m => tendenciaData[m]),
          borderColor: '#1F4E78',
          backgroundColor: 'rgba(31, 78, 120, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#1F4E78'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } }
      }
    });
  }
  
  // Gráfico 5: Tipo
  const tiposGraf = Object.keys(tipoData).sort((a, b) => tipoData[b] - tipoData[a]).slice(0, 6);
  
  const ctxTipo = document.getElementById('graficoTipo')?.getContext('2d');
  if (ctxTipo) {
    if (graficos.tipo) graficos.tipo.destroy();
    graficos.tipo = new Chart(ctxTipo, {
      type: 'doughnut',
      data: {
        labels: tiposGraf,
        datasets: [{
          data: tiposGraf.map(t => tipoData[t]),
          backgroundColor: ['#1F4E78', '#2E7D4E', '#ff9800', '#f44336', '#2196F3', '#9C27B0'],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
}

// --- TABELAS ---
function renderizarTabelaPrincipal() {
  const tbody = document.getElementById('tabelaCorpo');
  document.getElementById('totalRegistros').textContent = `${dadosFiltrados.length} registro${dadosFiltrados.length !== 1 ? 's' : ''}`;
  
  if (dadosFiltrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">📭 Nenhuma multa encontrada</td></tr>';
    return;
  }
  
  tbody.innerHTML = dadosFiltrados.slice(0, 20).map(m => {
    const badgeClass = `badge-${m.status.toLowerCase().replace('ã', 'a')}`;
    return `
      <tr>
        <td><strong>${m.id}</strong></td>
        <td>${m.data}</td>
        <td><strong>${m.placa}</strong></td>
        <td>${m.local.substring(0, 40)}</td>
        <td>${m.cidade}</td>
        <td>${m.tipo.substring(0, 30)}</td>
        <td><strong>R$ ${formatarMoeda(m.valor)}</strong></td>
        <td><span class="badge ${badgeClass}">${m.status}</span></td>
      </tr>
    `;
  }).join('');
}

function renderizarTabelas() {
  const tbody = document.getElementById('tabelaDetalhes');
  
  if (dadosFiltrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">📭 Nenhuma multa encontrada</td></tr>';
    return;
  }
  
  tbody.innerHTML = dadosFiltrados.map(m => {
    const badgeClass = `badge-${m.status.toLowerCase().replace('ã', 'a')}`;
    return `
      <tr>
        <td>${m.id}</td>
        <td>${m.data}</td>
        <td><strong>${m.placa}</strong></td>
        <td>${m.motorista}</td>
        <td>${m.local}</td>
        <td>${m.cidade}</td>
        <td>${m.tipo}</td>
        <td>R$ ${formatarMoeda(m.valor)}</td>
        <td><span class="badge ${badgeClass}">${m.status}</span></td>
        <td><code>${m.ait}</code></td>
      </tr>
    `;
  }).join('');
}

function renderizarPorCidade() {
  if (dadosFiltrados.length === 0) {
    document.getElementById('cityCardi').innerHTML = '<div class="loading" style="grid-column: 1/-1;">📭 Sem dados para exibir</div>';
    return;
  }
  
  const cidadeData = {};
  dadosFiltrados.forEach(m => {
    if (!cidadeData[m.cidade]) {
      cidadeData[m.cidade] = { count: 0, valor: 0 };
    }
    cidadeData[m.cidade].count++;
    cidadeData[m.cidade].valor += m.valor;
  });
  
  const html = Object.entries(cidadeData)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([cidade, dados]) => `
      <div class="city-card">
        <h4>${cidade}</h4>
        <div class="number">${dados.count}</div>
        <div class="subtitle">R$ ${formatarMoeda(dados.valor)}</div>
      </div>
    `).join('');
  
  document.getElementById('cityCardi').innerHTML = html;
}

function renderizarPorStatus() {
  if (dadosFiltrados.length === 0) {
    document.getElementById('statusCards').innerHTML = '<div class="loading" style="grid-column: 1/-1;">📭 Sem dados para exibir</div>';
    return;
  }
  
  const statusData = {
    'Pendente': { count: 0, valor: 0 },
    'Pago': { count: 0, valor: 0 },
    'Contestação': { count: 0, valor: 0 },
    'Cancelado': { count: 0, valor: 0 }
  };
  
  dadosFiltrados.forEach(m => {
    if (statusData[m.status]) {
      statusData[m.status].count++;
      statusData[m.status].valor += m.valor;
    }
  });
  
  const html = Object.entries(statusData)
    .map(([status, dados]) => `
      <div class="status-card">
        <h4>${status}</h4>
        <div class="number">${dados.count}</div>
        <div class="subtitle">R$ ${formatarMoeda(dados.valor)}</div>
      </div>
    `).join('');
  
  document.getElementById('statusCards').innerHTML = html;
}

// ============================================
// ABAS
// ============================================
function mudarAba(aba) {
  abaAtiva = aba;
  
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(`aba-${aba}`).classList.add('active');
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  renderizarDashboard();
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
function preencherFiltrosDinamicos() {
  const cidades = [...new Set(dadosOriginais.map(m => m.cidade))].sort();
  document.getElementById('cidade').innerHTML = '<option value="">Todas</option>' + 
    cidades.map(c => `<option value="${c}">${c}</option>`).join('');
}

function extrairCidade(local) {
  const partes = local.split(' ');
  return partes[partes.length - 1] || 'N/A';
}

function parsearData(dataStr) {
  if (!dataStr) return new Date(0);
  const [dia, mes, ano] = dataStr.split('/');
  return new Date(ano, mes - 1, dia);
}

function estaVencida(data) {
  if (!data) return false;
  const dataMulta = parsearData(data);
  const dataVencimento = new Date(dataMulta);
  dataVencimento.setDate(dataVencimento.getDate() + 30);
  return new Date() > dataVencimento;
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function atualizarStatusSync(texto) {
  document.getElementById('syncStatus').textContent = texto;
}

function atualizarTimestamp() {
  const agora = new Date();
  const hora = agora.toLocaleTimeString('pt-BR');
  document.getElementById('lastUpdate').textContent = `Atualizado: ${hora}`;
  document.getElementById('footerTime').textContent = hora;
}

function mostrarErro(error) {
  document.getElementById('kpiCards').innerHTML = `
    <div class="loading" style="color: red; grid-column: 1/-1;">
      ❌ Erro ao carregar Firebase<br>
      <small>${error.message || 'Verifique a configuração'}</small>
    </div>
  `;
}

function exportarRelatorio() {
  if (dadosFiltrados.length === 0) {
    alert('📭 Nenhuma multa para exportar!');
    return;
  }
  
  let csv = 'ID,Data,Placa,Motorista,Local,Cidade,Tipo,Valor,Status,AIT\n';
  
  dadosFiltrados.forEach(m => {
    csv += `${m.id},"${m.data}","${m.placa}","${m.motorista}","${m.local}","${m.cidade}","${m.tipo}","${formatarMoeda(m.valor)}","${m.status}","${m.ait}"\n`;
  });
  
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
  element.setAttribute('download', `multas_${new Date().toISOString().split('T')[0]}.csv`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  
  console.log('📥 Relatório exportado');
}

// ============================================
// INICIAR DASHBOARD
// ============================================
inicializarDashboard();
