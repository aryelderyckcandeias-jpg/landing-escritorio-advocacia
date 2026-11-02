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
