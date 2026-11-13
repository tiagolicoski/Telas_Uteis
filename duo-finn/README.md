# Duo Finn — Finanças em casal

Dashboard para organizar finanças a dois, inspirado em planilha mensal no estilo Google Sheets. **React 18 + TypeScript + Vite.** Cada pessoa entra com a própria conta e vê só a sua planilha, no computador ou no celular.

## Onde ficam os dados?

Com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (veja `.env.example`), a planilha fica no **Supabase**, uma linha por conta. O Tiago não vê a planilha da Marcele. O site publicado no GitHub Pages usa essas chaves. Sem internet, o aparelho mostra a última cópia que carregou e não atualiza o outro aparelho até voltar a conectar.

Na **primeira entrada do Tiago neste computador**, se a conta dele ainda estiver vazia, o app envia a planilha de `data/duo-finn.json`. A Marcele começa com um mês vazio.

Sem essas chaves, `npm run dev` continua no arquivo local: o Vite grava `data/duo-finn.json` em `/api/state`, e os navegadores deste PC compartilham a mesma planilha. Esse arquivo não vai para o git.

**Limpar a cópia local:** DevTools → Application → Local Storage → apague `duo-finn-v2` (e `duo-finn-v2:<id da conta>` se já entrou com login).

## Publicar de graça

O workflow [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) publica o site em `https://tiagolicoski.github.io/Telas_Uteis/` a cada push na `main`.

1. Crie um projeto no plano Free do Supabase. Não contrate plano pago.
2. Cole [`supabase/planilhas.sql`](supabase/planilhas.sql) no SQL Editor.
3. Em Authentication → Providers → Email, desligue o cadastro público. Crie só as duas contas e, no metadata, `{"full_name":"Tiago"}` e `{"full_name":"Marcele"}`.
4. No GitHub, em Settings → Secrets and variables → Actions, crie `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (a chave anon, não a service role).
5. Em Settings → Pages, a origem fica **GitHub Actions**.

A chave anon vai no site de propósito. Quem impede uma pessoa de ler a planilha da outra é a regra do banco.

## Pré-requisito

- [Node.js](https://nodejs.org/) **18+** (recomendado LTS), com `npm` na PATH.

## Ligar o servidor e acessar

**1. Abra um terminal** (PowerShell, CMD ou o terminal do Cursor).

**2. Entre na pasta do projeto** (ajuste o caminho se a sua for diferente):

```bash
cd c:\Users\admin\Desktop\Estudos\Telas_Uteis\duo-finn
```

**3. Instale as dependências** (só na primeira vez, ou depois de clonar/atualizar):

```bash
npm install
```

**4. Suba o servidor de desenvolvimento:**

```bash
npm run dev
```

O Vite mostra algo como:

```text
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**5. Acesse no navegador:** abra **[http://localhost:5173/](http://localhost:5173/)** (porta padrão **5173**).

- Se a porta 5173 estiver ocupada, o Vite usa a próxima (5174, 5175…) — use o endereço que aparecer no terminal.
- **Parar o servidor:** no mesmo terminal, `Ctrl + C`.

**Outros comandos úteis:**

| Comando | Uso |
|---------|-----|
| `npm run build` | Gera a pasta `dist/` para publicar |
| `npm run preview` | Sobe um servidor local só para testar o build (`dist/`) — o terminal mostra o URL (também costuma ser `http://localhost:4173/`) |

Meses salvos com o modelo antigo (aluguel compartilhado em dois campos) são **migrados** ao carregar (`src/data/migrateSheet.ts`).

## Navegação

A troca de tela é estado interno, sem URL.

| Menu | Rota interna | O que é |
|------|----------------|---------|
| **Visão geral** | `overview` | Dashboard do mês ativo |
| **Planilha** | `cashflow` | Lançamentos do mês, blocos e totais |
| **Relatórios** | `reports` | Recorte por mês, por ano ou de todos os meses: o que entrou, onde foi o gasto, itens repetidos e investimento |

A seção **Mês** da barra lateral é um seletor, agrupado por ano. Escolher um mês troca os números da tela atual. Cartões, Nossa renda e Contas da casa saíram do menu; um estado antigo nessas rotas volta para **Visão geral**. O card de cartões continua na visão geral.

No topo, o botão com o nome do mês (ex.: Dezembro/2026) abre a mesma lista e também só troca o mês, sem ir para a planilha.

## Planilha (modelo mensal)

No topo de cada mês:

- **Salário líquido** e o **dia** em que ele entra
- **Entrada extra** — uma ou mais linhas, cada uma com descrição (ex.: freela, aluguel recebido), valor e o **dia** em que entra. **+ Entrada** inclui outra. A soma entra na sobra junto com o salário

Blocos padrão (linhas editáveis, valores começam zerados):

- ASSINATURAS, CASA, CARTÃO DE CRÉDITO, ITENS DO CARTÃO, GASTOS

Cada linha tem as colunas **ITEM**, **DIA** (1–31) e **VALOR**. O dia vazio fica de fora do caixa do mês. Em dados antigos, um “dia N” no nome da linha vira o dia na primeira carga; se você apagar o dia, ele permanece vazio.

Os blocos ficam em dois grupos:

- **No saldo** — entram no saldo previsto. O botão do bloco desce o grupo para fora do saldo
- **Fora do saldo** — aparecem em Detalhes da planilha e não reduzem a sobra. O botão sobe o bloco para o saldo

Recursos da planilha:

- Células de texto, dia e valor; commit ao **sair do campo** (blur), para não travar ao digitar
- **TOTAL** por bloco e **sobra do mês** no rodapé
- **+ Bloco** — colunas personalizadas; reordenar dentro do mesmo grupo; remover bloco; **Trazer de volta** para presets embutidos removidos
- No rodapé, setas e uma lista por ano para trocar o mês aberto, sem uma aba para cada mês
- **+ Mês anterior** cria o mês antes do mais antigo, copiando os dados do mês que está aberto
- **+ Mês** cria o mês seguinte ao mais recente, também com os dados do mês aberto
- **Remover mês** (confirmação) quando há mais de uma aba

Fórmula da sobra (mês ativo):

`salário líquido + entrada extra − soma dos blocos no saldo`

## Visão geral

Lê o mês ativo e monta:

- **Saldo previsto** — barra de orçamento (salário, entrada extra, despesas por bloco) e atalhos para subir ou descer blocos do saldo
- **Contas a pagar** — linhas com dia de vencimento; marcar pago ou desmarcar
- **Moradia** — itens do bloco CASA, quando houver valores
- **Cartões** — faturas do bloco de cartão, com a parte de cada uma no total e a lista (nome, dia e valor)
- **Detalhes da planilha** — blocos e linhas que ficaram fora do saldo
- **Caixa do mês** — ordem do dinheiro no mês. O caixa abre com a sobra acumulada dos meses anteriores (a mesma conta do saldo previsto de cada um). No mesmo dia, o que entra conta antes do que sai. Conta marcada como paga não entra no aviso de falta de dinheiro; com todas pagas, o aviso some. Conta do saldo sem dia fica de fora e o card avisa o valor. Se a sobra deste mês for menor que a do mês anterior, o card pede atenção

## O que mais existe

- **Tema** claro/escuro. Com login, o rodapé do menu mostra o nome da conta e **Sair**. Sem as chaves do Supabase, continua o botão Pessoa 1 / 2, que só troca o rótulo
- **Notificações** — o sino lista as contas do mês atual e dos meses anteriores que ainda não foram marcadas como pagas. Marcar como paga tira a conta da lista. Com todas pagas, o sino fica vazio. Meses futuros, a falta de caixa e a queda da sobra não entram nele; esses avisos ficam no card Caixa do mês

Valores começam em **R$ 0,00** até você preencher.

## Estrutura do código

| Pasta / arquivo | Função |
|-----------------|--------|
| `src/data/types.ts` | Tipos (`MonthSheet`, dias de entrada e vencimento, blocos, UI) |
| `src/data/initialState.ts` | Estado inicial |
| `src/data/storage.ts` | Cópia local, chave `duo-finn-v2` |
| `src/data/remoteState.ts` | Leitura e gravação da planilha compartilhada |
| `server/statePlugin.ts` | API `/api/state` e arquivo `data/duo-finn.json` |
| `src/data/sheetTemplate.ts` | Meses iniciais e presets de blocos |
| `src/data/migrateSheet.ts` | Migração de meses antigos e do dia lido no nome da linha |
| `src/context/` | `FinanceContext`, `financeReducer` |
| `src/utils/sheet.ts` | Totais, saldo do mês, blocos no saldo |
| `src/utils/sheetBlocks.ts` | Ordem dos blocos no saldo e fora dele |
| `src/utils/overviewFromSheet.ts` | Planilha → dashboard |
| `src/utils/cashTiming.ts` | Caixa do mês e queda da sobra |
| `src/utils/calculations.ts` | Contas e segmentos do orçamento |
| `src/utils/format.ts` | BRL e ids |
| `src/components/planilha/` | Planilha, inputs, tabelas de bloco |
| `src/components/CaixaDoMes.tsx` | Card do caixa do mês |
| `src/components/` | Cards da visão geral, header, sidebar |

## Stack

- **Vite** — dev e build
- **React** — UI e contexto
- **TypeScript** — tipagem
- **lucide-react** — ícones
- **Supabase** — login e a planilha de cada conta, no plano gratuito. Sem as chaves, o arquivo `data/duo-finn.json` continua valendo só neste computador
