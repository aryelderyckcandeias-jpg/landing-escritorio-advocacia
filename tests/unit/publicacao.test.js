import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// O workflow de publicação copia as páginas por nome. Uma página nova esquecida ali
// não iria para o ar, e nenhum teste de navegador perceberia (eles usam a pasta do projeto).
const raiz = new URL('../../', import.meta.url);
const paginas = readdirSync(raiz).filter((nome) => nome.endsWith('.html'));

for (const workflow of ['pages.yml', 'lighthouse.yml']) {
  test(`${workflow} copia todas as páginas HTML da raiz para _site`, () => {
    const yml = readFileSync(new URL(`.github/workflows/${workflow}`, raiz), 'utf8');
    const copia = yml.split('\n').find((linha) => /cp .*\.html.* _site\//.test(linha)) || '';
    const faltando = paginas.filter((pagina) => !copia.includes(pagina));
    assert.deepEqual(faltando, [], `linha de cópia: "${copia.trim()}"`);
  });
}

test('ícone da tela inicial (apple-touch-icon) é um PNG de 180x180', () => {
  const png = readFileSync(new URL('assets/apple-touch-icon.png', raiz));
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 180, 'largura');
  assert.equal(png.readUInt32BE(20), 180, 'altura');
});

test('todas as páginas apontam para o ícone da tela inicial', () => {
  for (const pagina of paginas) {
    const html = readFileSync(new URL(pagina, raiz), 'utf8');
    assert.match(html, /<link rel="apple-touch-icon" href="assets\/apple-touch-icon\.png">/, pagina);
  }
});

// Prévia ao compartilhar o link (WhatsApp, LinkedIn): meta tags Open Graph.
// Aqui o endereço precisa ser completo (o robô do WhatsApp busca a imagem de fora do site).
const ENDERECO = 'https://aryelderyckcandeias-jpg.github.io/landing-escritorio-advocacia/';

function tamanhoDoJpeg(dados) {
  // Procura o marcador SOF (0xFFC0 a 0xFFC2), onde ficam altura e largura.
  for (let i = 2; i < dados.length; ) {
    const marcador = dados.readUInt16BE(i);
    if (marcador >= 0xffc0 && marcador <= 0xffc2) return { altura: dados.readUInt16BE(i + 5), largura: dados.readUInt16BE(i + 7) };
    i += 2 + dados.readUInt16BE(i + 2);
  }
  return null;
}

test('prévia de compartilhamento: meta tags Open Graph completas na página inicial', () => {
  const html = readFileSync(new URL('index.html', raiz), 'utf8');
  const meta = (propriedade) => (html.match(new RegExp(`<meta (?:property|name)="${propriedade}" content="([^"]+)">`)) || [])[1];
  for (const p of ['og:title', 'og:description', 'og:image:alt', 'og:locale', 'twitter:card']) assert.ok(meta(p), `falta ${p}`);
  assert.equal(meta('og:url'), ENDERECO);
  assert.ok(meta('og:image').startsWith(ENDERECO), `og:image fora do site: ${meta('og:image')}`);
  assert.equal(meta('og:image:width'), '1200');
  assert.equal(meta('og:image:height'), '630');
  assert.equal(meta('twitter:card'), 'summary_large_image');
});

test('prévia de compartilhamento: a imagem existe, mede 1200x630 e é leve', () => {
  const html = readFileSync(new URL('index.html', raiz), 'utf8');
  const imagem = html.match(/<meta property="og:image" content="([^"]+)">/)[1].slice(ENDERECO.length);
  const dados = readFileSync(new URL(imagem, raiz));
  assert.deepEqual(tamanhoDoJpeg(dados), { altura: 630, largura: 1200 });
  assert.ok(dados.length < 250 * 1024, `${Math.round(dados.length / 1024)} KB (o WhatsApp costuma ignorar imagens pesadas)`);
});

// Segurança: o mesmo Content-Security-Policy em todas as páginas, sem brechas que não usamos.
test('CSP: igual em todas as páginas, sem inline e sem data:', () => {
  const politicas = paginas.map((pagina) => {
    const html = readFileSync(new URL(pagina, raiz), 'utf8');
    const achou = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
    assert.ok(achou, `${pagina} sem CSP`);
    return achou[1];
  });
  assert.equal(new Set(politicas).size, 1, `CSPs diferentes: ${[...new Set(politicas)].join(' / ')}`);
  const csp = politicas[0];
  for (const regra of ["default-src 'self'", "form-action 'none'", "base-uri 'self'", "object-src 'none'"]) {
    assert.ok(csp.includes(regra), `falta ${regra}`);
  }
  for (const brecha of ["'unsafe-inline'", "'unsafe-eval'", 'data:', '*']) {
    assert.ok(!csp.includes(brecha), `CSP permite ${brecha}: ${csp}`);
  }
});
