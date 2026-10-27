// Copia as fontes variáveis (já instaladas pelo npm) para assets/fonts/
// e gera assets/css/fonts.css com as regras @font-face.
//
// Uso:  npm install && npm run fonts
//
// As fontes ficam no próprio repositório para que nenhum IP de visitante
// seja enviado a terceiros (Google Fonts) e a página carregue mais rápido.
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FONTES = [
  { pacote: 'bodoni-moda', familia: 'Bodoni Moda', pesos: '400 900', arquivo: 'bodoni-moda-latin.woff2' },
  { pacote: 'hanken-grotesk', familia: 'Hanken Grotesk', pesos: '100 900', arquivo: 'hanken-grotesk-latin.woff2' },
];

const FAIXA_LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, ' +
  'U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

mkdirSync('assets/fonts', { recursive: true });

let css = '/* Gerado por `npm run fonts`. Não edite à mão. */\n';

for (const fonte of FONTES) {
  const pasta = join('node_modules', '@fontsource-variable', fonte.pacote);
  const arquivos = join(pasta, 'files');
  if (!existsSync(arquivos)) {
    console.error(`Pacote não encontrado: ${pasta}. Rode "npm install" primeiro.`);
    process.exit(1);
  }
  const candidato = readdirSync(arquivos).find((nome) => nome.endsWith('latin-wght-normal.woff2'));
  if (!candidato) {
    console.error(`Arquivo latin-wght-normal.woff2 não encontrado em ${arquivos}. Arquivos disponíveis:`);
    console.error(readdirSync(arquivos).join('\n'));
    process.exit(1);
  }
  copyFileSync(join(arquivos, candidato), join('assets/fonts', fonte.arquivo));
  if (existsSync(join(pasta, 'LICENSE'))) {
    copyFileSync(join(pasta, 'LICENSE'), join('assets/fonts', `LICENSE-${fonte.pacote}.txt`));
  }
  css += `
@font-face {
  font-family: "${fonte.familia}";
  font-style: normal;
  font-display: swap;
  font-weight: ${fonte.pesos};
  src: url("../fonts/${fonte.arquivo}") format("woff2");
  unicode-range: ${FAIXA_LATIN};
}
`;
}

writeFileSync('assets/css/fonts.css', css);
console.log('Fontes copiadas para assets/fonts/ e assets/css/fonts.css atualizado.');
