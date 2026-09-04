# Painel de Multas - Dashboard Firebase

Dashboard web para gestão centralizada de multas de trânsito (SENATRAN) com análise de dados em tempo real.

## 🚀 Stack Utilizado

- **Frontend**: HTML5 + CSS + JavaScript (vanilla, sem frameworks)
- **Banco de Dados**: Firebase Firestore
- **Armazenamento**: Cloudinary (termos assinados)
- **Gráficos**: Chart.js + chartjs-plugin-datalabels
- **Hospedagem**: Vercel (deploy automático via GitHub)
- **URL**: https://dashboard-multas-firebase.vercel.app

## 🔧 Configuração Local

### Pré-requisitos
- Node.js (opcional, apenas se quiser usar um dev server)
- Git
- Conta Firebase ativa
- Conta Cloudinary ativa

### Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/douglasfirmino-svg/dashboard-multas-firebase.git
cd dashboard-multas-firebase
```

2. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

3. **Edite o arquivo `.env` com suas credenciais:**
```env
VITE_FIREBASE_API_KEY=seu_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_CLOUDINARY_CLOUD_NAME=seu_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=seu_preset
```

4. **Abra o arquivo `index.html` no navegador:**
```bash
# Opção 1: Abrir diretamente
open index.html

# Opção 2: Com Python (dev server simples)
python3 -m http.server 8000
# Então acesse http://localhost:8000
```

## 🔐 Segurança & Variáveis de Ambiente

### Desenvolvimento Local
- Use o arquivo `.env` (não commitado no Git)
- As credenciais são lidas pelo `firebase-config.js`

### Deploy no Vercel
1. Vá para o painel do Vercel do projeto
2. Acesse **Settings → Environment Variables**
3. Adicione cada variável do `.env.example`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - (... e todas as outras)
4. Faça um novo deploy (ou push para main)

## 📋 Estrutura de Dados (Firestore)

### Coleção: `multas`
Cada documento tem como ID o valor do campo `Ait` (único).

**Campos:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `Ait` | string | ✅ | Identificador único (ID do doc) |
| `Placa` | string | ✅ | Placa do veículo |
| `Centro de custo` | string | ✅ | Centro de custo / município |
| `Codigo infração` | string | ❌ | Código da infração |
| `Data infração` | string | ✅ | Formato DD/MM/AAAA |
| `Descrição infração` | string | ❌ | Descrição textual |
| `Valor` | number | ✅ | Valor numérico (não string!) |
| `Condutor` | string | ❌ | Nome do condutor |
| `Matrícula` | string | ❌ | Matrícula do colaborador |
| `Status` | string | ❌ | Pendente / Pago / Contestação / Cancelado |
| `Local` | string | ❌ | Endereço da infração |
| `Cidade` | string | ❌ | Município |
| `Tipo de Veículo` | string | ❌ | Próprio / Locado |
| `Locadora` | string | ❌ | Nome da locadora (vazio se Próprio) |
| `Desconto Colaborador` | boolean | ❌ | Se teve desconto |
| `Indicação` | boolean | ❌ | Se indicação foi feita no SENATRAN |
| `Termo URL` | string | ❌ | Link do termo assinado no Cloudinary |

## 📊 Abas do Dashboard

1. **Visão Geral**
   - KPIs: Total, Valor, Pendentes
   - Filtros: Período, Status, Placa, Centro de Custo, Tipo de Veículo
   - 6 gráficos: Status, Valor, Centro de Custo, Tendência, Tipo de Infração, Veículo Comparativo

2. **Por Centro de Custo**
   - Tabela com multas por localização
   - Colunas: Placa, Centro, Condutor, Valor, Tipo Veículo, Locadora, Desconto, Indicação

3. **Por Status**
   - Cards agrupados por status
   - Mostra total, valor, descontos e indicações

4. **Detalhes**
   - Tabela completa com TODOS os campos
   - Inclui links para termos (arquivos) anexados

5. **Nova Multa**
   - Busca por AIT para editar existente
   - Formulário com todos os campos
   - Upload de termo assinado
   - Validações: AIT, Placa, Valor obrigatórios; Locadora obrigatória se Tipo=Locado

## 📤 Upload de Termos (Cloudinary)

- Suporta PDF e imagens
- **Gotcha**: Cloudinary gratuito bloqueia PDF puro → convertemos para JPG (1ª página)
- Termos são versionados (novo upload substitui o anterior)
- Botão de remoção disponível em edição

## 🎨 Paleta de Cores

```css
/* Tons principais */
--primary: #1e3a5f;       /* Azul-marinho escuro */
--secondary: #2d6a4f;     /* Verde escuro */
--accent: #3a5a80;        /* Azul complementar */

/* Cores por status */
Pendente:    #3a5a80
Pago:        #2d6a4f
Contestação: #1e3a5f
Cancelado:   #0f2942

/* Veículos */
Próprio:     #2d6a4f
Locado:      #1e3a5f
```

## 📥 Exportação

- Botão "Exportar Relatório" gera CSV com multas filtradas
- Inclui: AIT, Placa, Centro, Data, Código, Descrição, Valor, Condutor, Matrícula, Tipo Veículo, Locadora, Status
- Nome: `relatorio-multas-AAAA-MM-DD.csv`

## 🐛 Troubleshooting

### "Firebase não carregado"
- Verifique se `window.db` existe (console)
- Confirme credenciais no `.env`
- Aguarde 5 segundos (bootstrap inicial)

### "Cloudinary upload falha"
- Verifique se `VITE_CLOUDINARY_CLOUD_NAME` está correto
- Upload Preset deve estar no modo "Unsigned"
- PDFs maiores que 100MB podem falhar

### Gráficos não aparecem
- Abra DevTools → Console
- Procure por "Chart.register"
- Confirme que Chart.js e datalabels carregaram

## 🔄 Próximos Passos (Roadmap)

- [ ] Importação de multas via CSV
- [ ] Envio automático de termos via EmailJS
- [ ] Dashboard de analytics avançado
- [ ] Integração com API SENATRAN (se disponível)
- [ ] Autenticação de usuário
- [ ] Logs de auditoria

## 📝 Anotações de Desenvolvimento

### Estrutura do app.js
- ~780 linhas divididas em seções lógicas
- Futura refatoração: separar em módulos (charts.js, filters.js, cloudinary.js)

### Mudanças Recentes (v2.0)
- Adicionado suporte a variáveis de ambiente (.env)
- Novos campos: `Tipo de Veículo` e `Locadora`
- Novo gráfico: Veículos Próprios vs Locados
- Lógica de validação: Locadora obrigatória quando Tipo=Locado

### Commit Message Pattern
```
<tipo>: descrição breve

Descrição detalhada se necessário.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

Tipos: fix, feat, refactor, docs, style, test

## 📞 Contato & Suporte

Qualquer dúvida, abra uma issue no GitHub ou contacte o owner do projeto.

---

**Última atualização**: 2026-09-04
**Versão**: 2.0.0
