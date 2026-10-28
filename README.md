# Landing page: escritório de advocacia criminal (fictício)

Projeto de portfólio: landing page de um escritório boutique de defesa criminal, com
efeitos visuais, acessibilidade, segurança, LGPD e testes automatizados.

> **Tudo aqui é fictício.** O escritório "Vasconcelos Torres Advogados", os sócios e os textos
> foram inventados. O formulário de contato é uma demonstração e **não envia nada**.

## O conceito

A página é um processo em segredo de justiça aberto sob uma lâmpada de mesa.

- **Tarjas:** os títulos começam cobertos por tarjas, como num documento sigiloso, e se abrem
  uma única vez, quando entram na tela.
- **Holofote:** na primeira tela, uma luz quente segue o cursor. No celular, a luz percorre a
  tela sozinha.
- Só esses dois efeitos existem. O resto da página é sóbrio de propósito.

Os efeitos nunca escondem texto: sem JavaScript, com movimento reduzido ou se o script falhar,
tudo fica legível.

## Como rodar

Requisitos: Node.js 20 ou superior.

```bash
npm ci               # instala as dependências nas versões do package-lock.json
npm run serve        # abre em http://127.0.0.1:4173
```

As fontes já estão commitadas em `assets/fonts/`. `npm run fonts` só é necessário se o pacote
das fontes for atualizado (o CI confere se os arquivos batem com o pacote).

Testes:

```bash
npx playwright install chromium   # uma vez, para os testes E2E
npm run test:unit                 # validação do formulário, contraste das cores, tipografia e zoom
npm run test:e2e                  # tarjas, holofote, formulário, rede, responsividade, axe
npm run lint:html                 # validador de HTML
NAVEGADOR=firefox npm run test:e2e   # o mesmo no Firefox (ou NAVEGADOR=webkit, motor do Safari)
```

O CI roda os E2E no Chromium, no Firefox e no WebKit a cada push, em qualquer branch.

## Decisões

| Decisão | Motivo |
| --- | --- |
| Fontes hospedadas no repositório | Google Fonts envia o IP do visitante a terceiros (LGPD) e atrasa a página. |
| Nenhum recurso de terceiros, sem cookies | Não há o que consentir, então não há banner de cookies. |
| `Content-Security-Policy` por `<meta>` | O GitHub Pages não deixa configurar cabeçalhos HTTP. |
| Tarjas só existem com `html.js` | Melhoria progressiva: sem JavaScript, o texto aparece normalmente. |
| `marca-js.js` com prazo de 3 s | Se `main.js` falhar, a marca `js` é removida e nenhum título fica coberto. |
| `noindex` | O escritório é fictício e não deve ser indexado como se fosse real. |
| Testes unitários sem dependências (`node:test`) | Funções de validação são puras e rápidas de testar. |
| Título da primeira tela medido pela coluna (`cqi`) | Fica nas mesmas 3 linhas de 320 a 1920 px; em celular deitado também respeita a altura (`svh`). |
| Tipografia fluida com máximo ≤ 2,5 × mínimo | Condição para o zoom do navegador conseguir dobrar o texto (WCAG 1.4.4); há teste unitário. |
| Vão da tarja no topo de cada linha | A faixa cobre acentos e descendentes (ç, g, q); medido com capturas da tarja fechada. |
| Triângulo das perguntas desenhado pelo CSS | O marcador nativo do `<summary>` muda de navegador para navegador (Safari). |
| Hover só em `(hover: hover)` | No toque, o hover ficaria ativo depois do toque. |

## Segurança e LGPD

- Sem requisições a domínios externos (verificado por teste automatizado).
- CSP com `default-src 'self'` e `form-action 'none'`; o formulário não envia dados, e um teste
  confirma que não há requisição de rede nem tentativa barrada pelo CSP.
- Links externos com `rel="noopener noreferrer"`.
- Campo oculto (honeypot) contra envio automático.
- Política de privacidade em `privacidade.html`.

### Como seria a versão real do formulário

1. Backend próprio ou serviço de formulários, sempre por HTTPS.
2. Captcha ou limite de requisições, além do honeypot.
3. Base legal e finalidade informadas (consentimento ou procedimentos preliminares de contrato).
4. Retenção mínima, com prazo de exclusão definido.
5. Canal para o titular exercer seus direitos (LGPD, art. 18).
6. Aviso para não enviar detalhes do caso pelo formulário (já presente aqui).

## Limitações conhecidas

- **CSP por `<meta>`** não suporta `frame-ancestors` e outras diretivas; cabeçalhos HTTP reais
  exigiriam outra hospedagem.
- A página usa `1lh` (unidade de altura de linha) nas tarjas, presente em navegadores atuais
  (Chrome 109+, Safari 16.4+, Firefox 120+). Em navegadores mais antigos as faixas por linha
  não aparecem, mas o texto continua legível.
- O título usa `cqi` (Chrome 105+, Safari 16+, Firefox 110+). Sem suporte, vale o tamanho
  de reserva (`--texto-6`).
- Com zoom de exatamente 200%, os títulos de seção crescem de 1,55 a 1,9 vez, não 2 vezes
  (o tamanho fluido acompanha a janela, que encolhe com o zoom). Eles chegam ao dobro com um
  pouco mais de zoom; o texto corrido dobra normalmente.
- Os testes automáticos de celular usam navegador emulado e o WebKit do Playwright (o motor do
  Safari, mas não o Safari do iPhone). Em 28/10/2026 a página publicada também foi conferida à
  mão num Android e num iPhone.
- Auditoria de SEO do Lighthouse fica fora das metas por causa do `noindex`.

## Estrutura

```text
index.html, privacidade.html
assets/css/   fonts, tokens, base, layout, components, effects
assets/js/    marca-js, main, reveal, spotlight, form, form-validation
assets/fonts/ fontes woff2 (geradas por npm run fonts)
tests/unit/   form-validation, contraste, tipografia
tests/e2e/    tarjas, formulário, página, primeira-tela, cabeçalho, espaçamento, axe
scripts/      serve.cjs (servidor estático), copiar-fontes.mjs, resumo-falhas.sh (CI)
docs/superpowers/  especificação e plano de implementação
```

Documentos de projeto: [especificação](docs/superpowers/specs/2026-10-27-landing-escritorio-design.md)
e [plano](docs/superpowers/plans/2026-10-27-landing-escritorio-implementacao.md).

## Publicação

GitHub Pages por Actions (`pages.yml`), só depois de os testes passarem. Passo único e manual:
*Settings → Pages → Source: GitHub Actions*.
