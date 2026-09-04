# Mudanças no index.html para Novos Campos

Este documento descreve todas as mudanças que devem ser feitas no `index.html` para suportar os novos campos: **Tipo de Veículo** e **Locadora**.

## 1. Adicionar Filtro "Tipo de Veículo" na Visão Geral

**Localização**: Seção de filtros da aba "Visão Geral" (próximo ao filtro de Centro de Custo)

**Encontrar**: 
```html
<select id="cidade" onchange="filtrarDados()">
  <option value="">Todos</option>
</select>
<button class="btn-filtro" onclick="limparFiltros()">🔄 Limpar</button>
```

**Substituir por**:
```html
<select id="cidade" onchange="filtrarDados()">
  <option value="">Todos</option>
</select>
<select id="tipoVeiculo" onchange="filtrarDados()">
  <option value="">Tipo de Veículo: Todos</option>
  <option value="Próprio">Próprio</option>
  <option value="Locado">Locado</option>
</select>
<button class="btn-filtro" onclick="limparFiltros()">🔄 Limpar</button>
```

---

## 2. Adicionar Novo Gráfico na Visão Geral

**Localização**: Depois do gráfico de "Por Tipo de Infração"

**Adicionar**:
```html
<div class="grafico-container">
  <h3>🚗 Veículos (Próprio vs Locado)</h3>
  <div style="position: relative; height: 300px;">
    <canvas id="graficoVeiculo"></canvas>
  </div>
</div>
```

---

## 3. Atualizar Tabela "Por Centro de Custo"

**Localização**: Na aba "Por Centro de Custo"

**Encontrar o `<thead>`**:
```html
<thead>
  <tr>
    <th>Placa</th>
    <th>Centro de Custo</th>
    <th>Condutor</th>
    <th>Valor</th>
    <th>Desconto Colaborador</th>
    <th>Indicação</th>
  </tr>
</thead>
```

**Substituir por**:
```html
<thead>
  <tr>
    <th>Placa</th>
    <th>Centro de Custo</th>
    <th>Condutor</th>
    <th>Valor</th>
    <th>Tipo de Veículo</th>
    <th>Locadora</th>
    <th>Desconto Colaborador</th>
    <th>Indicação</th>
  </tr>
</thead>
```

---

## 4. Atualizar Tabela "Detalhes"

**Localização**: Na aba "Detalhes"

**Encontrar o `<thead>`**:
```html
<thead>
  <tr>
    <th>Código</th>
    <th>Data</th>
    <th>Placa</th>
    <th>Condutor</th>
    <th>Descrição</th>
    <th>Local</th>
    <th>Cidade</th>
    <th>Centro</th>
    <th>Matrícula</th>
    <th>Valor</th>
    <th>Status</th>
    <th>AIT</th>
    <th>Desconto</th>
    <th>Indicação</th>
    <th>Termo</th>
  </tr>
</thead>
```

**Substituir por**:
```html
<thead>
  <tr>
    <th>Código</th>
    <th>Data</th>
    <th>Placa</th>
    <th>Condutor</th>
    <th>Descrição</th>
    <th>Local</th>
    <th>Cidade</th>
    <th>Centro</th>
    <th>Matrícula</th>
    <th>Tipo Veículo</th>
    <th>Locadora</th>
    <th>Valor</th>
    <th>Status</th>
    <th>AIT</th>
    <th>Desconto</th>
    <th>Indicação</th>
    <th>Termo</th>
  </tr>
</thead>
```

---

## 5. Adicionar Campos no Formulário de Cadastro

**Localização**: Na aba "Nova Multa", dentro de `.form-grid` com os outros inputs

**Encontrar**: A linha com os campos de "Status"
```html
<div class="form-group">
  <label>Status</label>
  <select id="f_status">
    <option value="Pendente">Pendente</option>
    <option value="Pago">Pago</option>
    <option value="Contestação">Contestação</option>
    <option value="Cancelado">Cancelado</option>
  </select>
</div>
```

**Adicionar DEPOIS dessa `</div>` (e do próximo `</div>` se houver):**
```html
<div class="form-group">
  <label>Tipo de Veículo *</label>
  <select id="f_tipoVeiculo" onchange="atualizarLocadora()">
    <option value="Próprio">Próprio</option>
    <option value="Locado">Locado</option>
  </select>
</div>

<div class="form-group full-width">
  <label>Locadora (se Locado)</label>
  <input type="text" id="f_locadora" placeholder="Nome da locadora">
  <small style="color: #666; margin-top: 4px;">Obrigatório apenas quando Tipo = Locado</small>
</div>
```

**Nota importante**: O campo `Tipo de Veículo` tem um `onchange` que chama `atualizarLocadora()` — essa função já existe no novo `app.js` e desabilita o campo Locadora quando tipo é "Próprio".

---

## 6. (Opcional) Atualizar CSS para Tabela Larga

Se os gráficos ficarem muito largos na Visão Geral (com 6 gráficos), adicione no `<style>` do HTML:

```css
.grafico-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin: 24px 0;
}
```

Isso fará os gráficos responsivos em grid.

---

## Resumo das Mudanças

| Local | Mudança | Linhas |
|-------|---------|--------|
| Filtros | Novo select `tipoVeiculo` | 1-5 |
| Visão Geral | Novo canvas `graficoVeiculo` | 3-6 |
| Tabela Centro | +2 colunas (Tipo, Locadora) | 2 |
| Tabela Detalhes | +2 colunas (Tipo, Locadora) | 2 |
| Formulário | +2 campos (Tipo, Locadora) | 10-12 |

---

## ✅ Checklist de Implementação

- [ ] Adicionar filtro "Tipo de Veículo"
- [ ] Adicionar gráfico "Veículos Comparativo"
- [ ] Atualizar thead da tabela "Por Centro de Custo"
- [ ] Atualizar thead da tabela "Detalhes"
- [ ] Adicionar campos no formulário
- [ ] Testar com navegador aberto (DevTools → Console)
- [ ] Verificar se filtro de Tipo funciona
- [ ] Verificar se desabilitação de Locadora funciona (selecione "Próprio")
- [ ] Testar upload de termo
- [ ] Testar salvar nova multa com Tipo=Locado

---

## 📝 Exemplo Prático

**HTML encontrado**:
```html
<div class="form-group">
  <label>Centro de Custo</label>
  <input type="text" id="f_centro">
</div>

<div class="form-group">
  <label>Status</label>
  <select id="f_status">
    <option value="Pendente">Pendente</option>
    <option value="Pago">Pago</option>
  </select>
</div>
```

**Fica assim**:
```html
<div class="form-group">
  <label>Centro de Custo</label>
  <input type="text" id="f_centro">
</div>

<div class="form-group">
  <label>Status</label>
  <select id="f_status">
    <option value="Pendente">Pendente</option>
    <option value="Pago">Pago</option>
  </select>
</div>

<div class="form-group">
  <label>Tipo de Veículo *</label>
  <select id="f_tipoVeiculo" onchange="atualizarLocadora()">
    <option value="Próprio">Próprio</option>
    <option value="Locado">Locado</option>
  </select>
</div>

<div class="form-group full-width">
  <label>Locadora (se Locado)</label>
  <input type="text" id="f_locadora" placeholder="Nome da locadora">
  <small style="color: #666; margin-top: 4px;">Obrigatório apenas quando Tipo = Locado</small>
</div>
```

---

**Próximo passo**: Após fazer essas mudanças, teste o app no navegador e verifique se tudo funciona (console deve estar limpo de erros).
