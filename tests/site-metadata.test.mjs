import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const origin = 'https://sabor-sorriso.pages.dev';

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function metadata(key) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const matches = tags.filter(tag => attribute(tag, 'property') === key || attribute(tag, 'name') === key);
  assert.equal(matches.length, 1, `${key} deve aparecer exatamente uma vez`);
  return attribute(matches[0], 'content');
}

test('canonical e URL social apontam para o endereço de produção Pages', () => {
  const canonical = (html.match(/<link\b[^>]*>/gi) || [])
    .filter(tag => attribute(tag, 'rel') === 'canonical');
  assert.equal(canonical.length, 1);
  assert.equal(attribute(canonical[0], 'href'), `${origin}/`);
  assert.equal(metadata('og:url'), `${origin}/`);
});

test('todos os metadados de imagem compartilham o banner no host Pages', () => {
  for (const key of ['og:image', 'og:image:secure_url', 'twitter:image']) {
    assert.equal(metadata(key), `${origin}/img/og-cardapio-v3.png`);
  }
  assert.equal(metadata('og:image:type'), 'image/png');
  assert.equal(metadata('og:image:width'), '1200');
  assert.equal(metadata('og:image:height'), '630');
});

test('banner de compartilhamento mantém os bytes da versão aprovada', () => {
  const banner = readFileSync(new URL('../public/img/og-cardapio-v3.png', import.meta.url));
  assert.equal(createHash('sha256').update(banner).digest('hex'),
    '0e3950a34d0c50a8b3e075ecc56862b1b850bda0d77d6b864b036ae64b4f84cb');
});
